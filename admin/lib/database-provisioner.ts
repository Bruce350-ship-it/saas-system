import { exec } from 'child_process';
import { promisify } from 'util';
import { PrismaClient } from '@prisma/client';
import { PrismaClient as TenantPrismaClient } from '@prisma/tenant-client';
import { hashPassword } from './auth';

const execAsync = promisify(exec);

interface TenantConfig {
  businessName: string;
  contactEmail: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  tenantId?: string;
}

interface ProvisionResult {
  success: boolean;
  tenantId?: string;
  dbUrl?: string;
  error?: string;
}

export class DatabaseProvisioner {
  private baseDbUrl: string;
  private dbHost: string;
  private dbPort: string;
  private dbUser: string;
  private dbPassword: string;

  constructor() {
    // Parse the base database URL to extract connection details
    const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/saas_master_db';
    const url = new URL(dbUrl);

    this.dbHost = url.hostname;
    this.dbPort = url.port || '5432';
    this.dbUser = url.username;
    this.dbPassword = url.password;
    this.baseDbUrl = `postgresql://${this.dbUser}:${this.dbPassword}@${this.dbHost}:${this.dbPort}`;
  }

  /**
   * Provision a complete tenant database with schema and admin user
   */
  async provisionTenant(config: TenantConfig): Promise<ProvisionResult> {
    const tenantId = config.tenantId || `tenant_${Date.now()}`;
    const dbName = `saas_tenant_${tenantId}`;
    const dbUrl = `${this.baseDbUrl}/${dbName}`;

    try {
      console.log(`🚀 Starting tenant provisioning for: ${config.businessName}`);

      // Step 1: Create the database
      await this.createDatabase(dbName);
      console.log(`✅ Database created: ${dbName}`);

      // Step 2: Run tenant schema migrations
      await this.runTenantMigrations(dbUrl);
      console.log(`✅ Schema migrations completed`);

      // Step 3: Create admin user
      await this.createAdminUser(dbUrl, { ...config, tenantId });
      console.log(`✅ Admin user created: ${config.adminEmail}`);

      /* Step 4: Seed with sample data (optional)
      await this.seedTenantData(dbUrl, { ...config, tenantId });
      console.log(`✅ Sample data seeded`);
      */

      return {
        success: true,
        tenantId,
        dbUrl,
      };

    } catch (error) {
      console.error(`❌ Tenant provisioning failed:`, error);

      // Attempt cleanup on failure
      try {
        await this.dropDatabase(dbName);
        console.log(`🧹 Cleanup: Dropped database ${dbName}`);
      } catch (cleanupError) {
        console.error(`⚠️ Cleanup failed:`, cleanupError);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a new PostgreSQL database
   */
  private async createDatabase(dbName: string): Promise<void> {
    // Set environment variable for the process
    const originalPgPassword = process.env.PGPASSWORD;
    process.env.PGPASSWORD = this.dbPassword;

    const createDbCommand = `createdb -h ${this.dbHost} -p ${this.dbPort} -U ${this.dbUser} ${dbName}`;

    try {
      await execAsync(createDbCommand);
    } catch (error: any) {
      // If database already exists, that's okay
      if (!error.message.includes('already exists')) {
        throw new Error(`Failed to create database: ${error.message}`);
      }
    } finally {
      // Restore original environment variable
      if (originalPgPassword !== undefined) {
        process.env.PGPASSWORD = originalPgPassword;
      } else {
        delete process.env.PGPASSWORD;
      }
    }
  }

  /**
   * Run tenant schema migrations on the new database
   */
  private async runTenantMigrations(dbUrl: string): Promise<void> {
    try {
      // Set the TENANT_DATABASE_URL for the tenant database
      const originalUrl = process.env.TENANT_DATABASE_URL;
      process.env.TENANT_DATABASE_URL = dbUrl;

      // Set PGPASSWORD to avoid password prompts
      const originalPgPassword = process.env.PGPASSWORD;
      process.env.PGPASSWORD = this.dbPassword;

      // Run Prisma db push to create tables
      const { stdout, stderr } = await execAsync('npx prisma db push --schema prisma/schema-tenant.prisma');

      console.log('Migration output:', stdout);
      if (stderr) {
        console.log('Migration stderr:', stderr);
      }

      // Restore original environment variables
      process.env.TENANT_DATABASE_URL = originalUrl;
      process.env.PGPASSWORD = originalPgPassword;
    } catch (error: any) {
      console.error('Migration error details:', error);
      throw new Error(`Failed to run migrations: ${error.message}`);
    }
  }

  /**
   * Create the admin user in the tenant database
   */
  private async createAdminUser(dbUrl: string, config: TenantConfig): Promise<void> {
    const tenantClient = new TenantPrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });

    try {
      const hashedPassword = await hashPassword(config.adminPassword);

      await tenantClient.user.create({
        data: {
          email: config.adminEmail,
          name: config.adminName,
          passwordHash: hashedPassword,
          role: 'ADMIN',
          tenantId: config.tenantId || 'default',
        },
      });
    } finally {
      await tenantClient.$disconnect();
    }
  }

  /**
   * Seed the tenant database with sample data
   */
  private async seedTenantData(dbUrl: string, config: TenantConfig): Promise<void> {
    const tenantClient = new TenantPrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });

    try {
      // Create a regular user
      const regularUser = await tenantClient.user.create({
        data: {
          email: 'user@example.com',
          name: 'Regular User',
          passwordHash: await hashPassword('password123'),
          role: 'USER',
          tenantId: config.tenantId || 'default',
        },
      });

      // Create sample products
      const products = [
        { name: 'Laptop Pro', price: 1299.99 },
        { name: 'Wireless Mouse', price: 29.99 },
        { name: 'Mechanical Keyboard', price: 149.99 },
        { name: 'Monitor 27"', price: 399.99 },
        { name: 'USB-C Cable', price: 19.99 },
      ];

      for (const product of products) {
        await tenantClient.product.create({
          data: product,
        });
      }

      // Create some sample sales
      const productsList = await tenantClient.product.findMany();
      const adminUser = await tenantClient.user.findFirst({ where: { role: 'ADMIN' } });

      if (productsList.length > 0 && adminUser) {
        await tenantClient.sale.create({
          data: {
            productId: productsList[0].id,
            userId: adminUser.id,
            quantity: 1,
            total: productsList[0].price,
          },
        });
      }

    } finally {
      await tenantClient.$disconnect();
    }
  }

  /**
   * Drop a database (for cleanup)
   */
  private async dropDatabase(dbName: string): Promise<void> {
    // Set environment variable for the process
    const originalPgPassword = process.env.PGPASSWORD;
    process.env.PGPASSWORD = this.dbPassword;

    // First, terminate all connections to the database
    try {
      const terminateCommand = `psql -h ${this.dbHost} -p ${this.dbPort} -U ${this.dbUser} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName}' AND pid <> pg_backend_pid();"`;
      await execAsync(terminateCommand);
      console.log(`🔌 Terminated connections to ${dbName}`);
    } catch (error) {
      console.warn(`⚠️ Could not terminate connections to ${dbName}:`, (error as any).message);
    }

    // Then drop the database with force option
    const dropDbCommand = `dropdb -h ${this.dbHost} -p ${this.dbPort} -U ${this.dbUser} --if-exists --force ${dbName}`;

    try {
      await execAsync(dropDbCommand);
    } catch (error: any) {
      // Ignore errors if database doesn't exist
      if (!error.message.includes('does not exist')) {
        throw error;
      }
    } finally {
      // Restore original environment variable
      if (originalPgPassword !== undefined) {
        process.env.PGPASSWORD = originalPgPassword;
      } else {
        delete process.env.PGPASSWORD;
      }
    }
  }

  /**
   * Check if a database exists
   */
  async databaseExists(dbName: string): Promise<boolean> {
    // Set environment variable for the process
    const originalPgPassword = process.env.PGPASSWORD;
    process.env.PGPASSWORD = this.dbPassword;

    const checkCommand = `psql -h ${this.dbHost} -p ${this.dbPort} -U ${this.dbUser} -d ${dbName} -c "SELECT 1;"`;

    try {
      await execAsync(checkCommand);
      return true;
    } catch {
      return false;
    } finally {
      // Restore original environment variable
      if (originalPgPassword !== undefined) {
        process.env.PGPASSWORD = originalPgPassword;
      } else {
        delete process.env.PGPASSWORD;
      }
    }
  }

  /**
   * Drop a tenant database (public method for tenant deletion)
   */
  async dropTenantDatabase(tenantId: string): Promise<{ success: boolean; error?: string }> {
    const dbName = `saas_tenant_${tenantId}`;

    try {
      console.log(`🗑️ Dropping tenant database: ${dbName}`);
      await this.dropDatabase(dbName);
      console.log(`✅ Tenant database dropped successfully: ${dbName}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Failed to drop tenant database ${dbName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get database connection info for debugging
   */
  getConnectionInfo() {
    return {
      host: this.dbHost,
      port: this.dbPort,
      user: this.dbUser,
      baseUrl: this.baseDbUrl,
    };
  }
}

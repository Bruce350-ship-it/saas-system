import { PrismaClient } from '@prisma/client';
import { getTenantClient } from './tenant';

export class TenantDiagnostics {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Check if a tenant exists in the master database
   */
  async checkTenantExists(tenantId: string) {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          businessName: true,
          contactEmail: true,
          dbUrl: true,
          createdAt: true,
        },
      });

      return {
        exists: !!tenant,
        tenant,
      };
    } catch (error) {
      return {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if a tenant database is accessible
   */
  async checkTenantDatabase(dbUrl: string) {
    try {
      const tenantClient = getTenantClient(dbUrl);

      // Test basic connection
      await tenantClient.$connect();

      // Check if tables exist
      const userCount = await tenantClient.user.count();
      const productCount = await tenantClient.product.count();
      const saleCount = await tenantClient.sale.count();

      await tenantClient.$disconnect();

      return {
        accessible: true,
        userCount,
        productCount,
        saleCount,
      };
    } catch (error) {
      return {
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if a specific user exists in tenant database
   */
  async checkUserExists(dbUrl: string, email: string) {
    try {
      const tenantClient = getTenantClient(dbUrl);

      const user = await tenantClient.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      await tenantClient.$disconnect();

      return {
        exists: !!user,
        user,
      };
    } catch (error) {
      return {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * List all tenants in master database
   */
  async listAllTenants() {
    try {
      const tenants = await this.prisma.tenant.findMany({
        select: {
          id: true,
          businessName: true,
          contactEmail: true,
          dbUrl: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        tenants,
        count: tenants.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test login process for a specific user
   */
  async testLoginProcess(email: string, password: string) {
    try {
      const tenants = await this.prisma.tenant.findMany();

      for (const tenant of tenants) {
        try {
          if (!tenant.dbUrl) continue;

          const tenantClient = getTenantClient(tenant.dbUrl);
          const user = await tenantClient.user.findUnique({
            where: { email },
          });

          if (user) {
            await tenantClient.$disconnect();
            return {
              found: true,
              tenant: {
                id: tenant.id,
                businessName: tenant.businessName,
                dbUrl: tenant.dbUrl,
              },
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
              },
            };
          }

          await tenantClient.$disconnect();
        } catch (e) {
          console.warn(`Tenant ${tenant.businessName} connection failed:`, e);
          continue;
        }
      }

      return {
        found: false,
        message: 'User not found in any tenant database',
      };
    } catch (error) {
      return {
        found: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Run comprehensive diagnostics
   */
  async runDiagnostics() {
    console.log('🔍 Running tenant diagnostics...\n');

    // List all tenants
    const tenantsResult = await this.listAllTenants();
    console.log('📋 All Tenants:');
    if (tenantsResult.success) {
      console.log(`Found ${tenantsResult.count} tenants:`);
      tenantsResult.tenants?.forEach((tenant, index) => {
        console.log(`  ${index + 1}. ${tenant.businessName} (${tenant.id})`);
        console.log(`     Email: ${tenant.contactEmail}`);
        console.log(`     DB URL: ${tenant.dbUrl}`);
        console.log(`     Created: ${tenant.createdAt}`);
        console.log('');
      });
    } else {
      console.log(`❌ Error listing tenants: ${tenantsResult.error}`);
    }

    // Test each tenant database
    if (tenantsResult.success && tenantsResult.tenants && tenantsResult.tenants.length > 0) {
      console.log('🔗 Testing tenant database connections:');

      for (const tenant of tenantsResult.tenants) {
        console.log(`\nTesting ${tenant.businessName}:`);

        const dbResult = await this.checkTenantDatabase(tenant.dbUrl!);
        if (dbResult.accessible) {
          console.log(`  ✅ Database accessible`);
          console.log(`  📊 Users: ${dbResult.userCount}, Products: ${dbResult.productCount}, Sales: ${dbResult.saleCount}`);
        } else {
          console.log(`  ❌ Database not accessible: ${dbResult.error}`);
        }
      }
    }

    await this.prisma.$disconnect();
  }
}

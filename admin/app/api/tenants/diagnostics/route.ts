import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { DatabaseProvisioner } from '@/lib/database-provisioner';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request);

    if (authResult instanceof NextResponse) {
      return authResult; // Error response
    }

    console.log('🔍 Running tenant diagnostics...');

    // Get all tenants from master database
    const masterTenants = await prisma.tenant.findMany({
      select: {
        id: true,
        businessName: true,
        contactEmail: true,
        dbUrl: true,
        createdAt: true,
      },
    });

    // Get all databases that start with 'saas_tenant_'
    const provisioner = new DatabaseProvisioner();
    const allDatabases = await getAllDatabases();
    const tenantDatabases = allDatabases.filter(db => db.startsWith('saas_tenant_'));

    console.log(`📊 Found ${masterTenants.length} master records and ${tenantDatabases.length} tenant databases`);

    // Create diagnostics for each tenant database
    const diagnostics = await Promise.all(tenantDatabases.map(async (dbName) => {
      const tenantId = dbName.replace('saas_tenant_', '');

      // Find corresponding master record
      const masterRecord = masterTenants.find(t => t.id === tenantId);

      // Check if database is accessible
      let dbAccessible = false;
      let userCount = 0;
      let productCount = 0;
      let salesCount = 0;
      let error = null;

      try {
        dbAccessible = await provisioner.databaseExists(dbName);
        if (dbAccessible) {
          // Get basic stats from the database
          const { exec } = require('child_process');
          const { promisify } = require('util');
          const execAsync = promisify(exec);

          try {
            const { stdout: userCountResult } = await execAsync(`$env:PGPASSWORD="postgres"; psql -h localhost -p 5432 -U postgres -d ${dbName} -c "SELECT COUNT(*) FROM users;"`);
            userCount = parseInt(userCountResult.match(/\d+/)?.[0] || '0');
          } catch (e) {
            console.warn(`Could not get user count for ${dbName}:`, (e as any).message);
          }

          try {
            const { stdout: productCountResult } = await execAsync(`$env:PGPASSWORD="postgres"; psql -h localhost -p 5432 -U postgres -d ${dbName} -c "SELECT COUNT(*) FROM products;"`);
            productCount = parseInt(productCountResult.match(/\d+/)?.[0] || '0');
          } catch (e) {
            console.warn(`Could not get product count for ${dbName}:`, (e as any).message);
          }

          try {
            const { stdout: salesCountResult } = await execAsync(`$env:PGPASSWORD="postgres"; psql -h localhost -p 5432 -U postgres -d ${dbName} -c "SELECT COUNT(*) FROM sales;"`);
            salesCount = parseInt(salesCountResult.match(/\d+/)?.[0] || '0');
          } catch (e) {
            console.warn(`Could not get sales count for ${dbName}:`, (e as any).message);
          }
        }
      } catch (e: any) {
        error = e.message;
      }

      return {
        tenantId,
        databaseName: dbName,
        hasMasterRecord: !!masterRecord,
        masterRecord: masterRecord ? {
          businessName: masterRecord.businessName,
          contactEmail: masterRecord.contactEmail,
          createdAt: masterRecord.createdAt,
        } : null,
        databaseAccessible: dbAccessible,
        userCount,
        productCount,
        salesCount,
        error,
        isOrphaned: !masterRecord,
      };
    }));

    return NextResponse.json({
      success: true,
      summary: {
        totalDatabases: tenantDatabases.length,
        withMasterRecords: diagnostics.filter(d => d.hasMasterRecord).length,
        orphanedDatabases: diagnostics.filter(d => d.isOrphaned).length,
        accessibleDatabases: diagnostics.filter(d => d.databaseAccessible).length,
      },
      diagnostics,
    });
  } catch (error) {
    console.error('Diagnostics error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getAllDatabases(): Promise<string[]> {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    const { stdout } = await execAsync(`$env:PGPASSWORD="postgres"; psql -h localhost -p 5432 -U postgres -l`);

    // Parse the output to extract database names
    const lines = stdout.split('\n');
    const databases: string[] = [];

    for (const line of lines) {
      const match = line.match(/^\s*(\w+)\s+\|/);
      if (match && match[1] && match[1].startsWith('saas_tenant_')) {
        databases.push(match[1]);
      }
    }

    return databases;
  } catch (error) {
    console.error('Error getting database list:', error);
    return [];
  }
}

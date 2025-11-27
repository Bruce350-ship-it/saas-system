import { PrismaClient as TenantPrismaClient } from '@prisma/tenant-client';

// Cache for tenant clients to avoid recreating connections
const tenantClients = new Map<string, TenantPrismaClient>();

export function getTenantClient(dbUrl: string): TenantPrismaClient {
  if (tenantClients.has(dbUrl)) {
    return tenantClients.get(dbUrl)!;
  }

  const client = new TenantPrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

  tenantClients.set(dbUrl, client);
  return client;
}

export async function disconnectTenantClients() {
  for (const client of tenantClients.values()) {
    await client.$disconnect();
  }
  tenantClients.clear();
}

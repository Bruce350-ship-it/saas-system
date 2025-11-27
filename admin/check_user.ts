
import { PrismaClient } from '@prisma/client';
import { PrismaClient as TenantPrismaClient } from '@prisma/tenant-client';

const prisma = new PrismaClient();

async function main() {
    const email = 'jane@oeccomputers.com';
    console.log(`Checking for user: ${email}`);

    const tenants = await prisma.tenant.findMany();
    console.log(`Found ${tenants.length} tenants`);

    for (const tenant of tenants) {
        if (!tenant.dbUrl) {
            console.log(`Skipping tenant ${tenant.businessName} (no DB URL)`);
            continue;
        }

        console.log(`Checking tenant: ${tenant.businessName} (${tenant.dbUrl})`);

        try {
            const tenantClient = new TenantPrismaClient({
                datasources: {
                    db: {
                        url: tenant.dbUrl,
                    },
                },
            });

            const allUsers = await tenantClient.user.findMany();
            console.log(`Found ${allUsers.length} users in tenant ${tenant.businessName}:`);
            allUsers.forEach(u => console.log(` - ${u.email} (${u.role})`));

            const user = await tenantClient.user.findUnique({
                where: { email },
            });

            if (user) {
                console.log(`✅ User FOUND in tenant: ${tenant.businessName}`);
                console.log('User details:', user);
            } else {
                console.log(`❌ User NOT found in tenant: ${tenant.businessName}`);
            }

            await tenantClient.$disconnect();
        } catch (error) {
            console.error(`Error checking tenant ${tenant.businessName}:`, error);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

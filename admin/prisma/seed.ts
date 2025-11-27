import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create super admin
  const hashedPassword = await bcrypt.hash('password', 10);
  const superAdmin = await prisma.superAdmin.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      name: 'Admin',
    },
  });

  console.log('✅ Super admin created:', superAdmin.email);
  console.log('📧 Email: admin@example.com');
  console.log('🔑 Password: password');

  console.log('🎉 Master database seed completed!');
  console.log('💡 All tenants will be created by the super admin through the dashboard.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


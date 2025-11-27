import { PrismaClient, UserRole } from '@prisma/tenant-client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting tenant database seed...');

  // Create tenant admin user
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test-tenant.com' },
    update: {},
    create: {
      name: 'Tenant Admin',
      email: 'admin@test-tenant.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN' as UserRole,
      tenantId: 'test-tenant',
    },
  });

  console.log('✅ Tenant admin created:', admin.email);

  // Create regular tenant user
  const userPasswordHash = await bcrypt.hash('User123!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@test-tenant.com' },
    update: {},
    create: {
      name: 'Test User',
      email: 'user@test-tenant.com',
      passwordHash: userPasswordHash,
      role: 'USER' as UserRole,
      tenantId: 'test-tenant',
    },
  });

  console.log('✅ Tenant user created:', user.email);

  // Create sample products
  const products = [
    { name: 'Laptop Pro', price: 1299.99 },
    { name: 'Wireless Mouse', price: 29.99 },
    { name: 'Mechanical Keyboard', price: 149.99 },
    { name: 'Monitor 27"', price: 399.99 },
    { name: 'USB-C Cable', price: 19.99 },
  ];

  const createdProducts = [];
  for (const product of products) {
    // Check if product already exists
    const existing = await prisma.product.findFirst({
      where: { name: product.name },
    });

    let created;
    if (existing) {
      created = existing;
      console.log(`✅ Product already exists: ${created.name} - $${created.price}`);
    } else {
      created = await prisma.product.create({
        data: {
          name: product.name,
          price: product.price,
        },
      });
      console.log(`✅ Product created: ${created.name} - $${created.price}`);
    }
    createdProducts.push(created);
  }

  // Create sample sales
  const sales = [
    { productId: createdProducts[0].id, userId: user.id, quantity: 2, total: 2599.98 },
    { productId: createdProducts[1].id, userId: user.id, quantity: 1, total: 29.99 },
    { productId: createdProducts[2].id, userId: user.id, quantity: 1, total: 149.99 },
    { productId: createdProducts[3].id, userId: admin.id, quantity: 1, total: 399.99 },
  ];

  for (const sale of sales) {
    await prisma.sale.create({
      data: {
        productId: sale.productId,
        userId: sale.userId,
        quantity: sale.quantity,
        total: sale.total,
        synced: true,
      },
    });
    console.log(`✅ Sale created: ${sale.quantity}x product for $${sale.total}`);
  }

  console.log('🎉 Tenant database seed completed!');
  console.log('\n📋 Login credentials:');
  console.log('Admin: admin@test-tenant.com / Admin123!');
  console.log('User: user@test-tenant.com / User123!');
}

main()
  .catch((e) => {
    console.error('❌ Tenant seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

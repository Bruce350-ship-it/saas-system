import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantClient } from '@/lib/tenant';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // First, try to find super admin
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email },
    });

    if (superAdmin) {
      const isValidPassword = await verifyPassword(password, superAdmin.passwordHash);

      if (isValidPassword) {
        const token = generateToken({
          sub: superAdmin.id,
          role: 'super_admin',
        });

        return NextResponse.json({
          token,
          user: {
            id: superAdmin.id,
            email: superAdmin.email,
            name: superAdmin.name,
            role: 'super_admin',
          },
        });
      }
    }

    // If not super admin, try to find tenant user
    const tenants = await prisma.tenant.findMany();



    for (const tenant of tenants) {
      try {
        if (!tenant.dbUrl) continue;
        // console.log(`Checking tenant: ${tenant.businessName} (${tenant.id})`);
        const tenantClient = getTenantClient(tenant.dbUrl);
        const user = await tenantClient.user.findUnique({
          where: { email },
        });

        if (user) {
          const isValidPassword = await verifyPassword(password, user.passwordHash);

          if (isValidPassword) {
            const token = generateToken({
              sub: user.id,
              role: user.role.toLowerCase() as 'admin' | 'user',
              tenantId: tenant.id,
            });

            return NextResponse.json({
              token,
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role.toLowerCase(),
                tenantId: tenant.id,
              },
            });
          }
        }
      } catch (e) {
        // Skip tenants that are not yet provisioned/migrated
        console.warn(`Tenant auth skipped due to error for ${tenant.businessName}:`, e);
        continue;
      }
    }

    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

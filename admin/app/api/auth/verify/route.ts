import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Error response
    }

    const { user, tenantClient } = authResult;

    // Get user details based on role
    if (user.role === 'super_admin') {
      const { prisma } = await import('@/lib/prisma');
      const superAdmin = await prisma.superAdmin.findUnique({
        where: { id: user.sub },
        select: { id: true, email: true, name: true },
      });

      if (!superAdmin) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({
        user: {
          ...superAdmin,
          role: 'super_admin',
        },
      });
    } else {
      // Tenant user
      if (!tenantClient) {
        return NextResponse.json({ error: 'Tenant client not available' }, { status: 500 });
      }

      const tenantUser = await tenantClient.user.findUnique({
        where: { id: user.sub },
        select: { id: true, email: true, name: true, role: true },
      });

      if (!tenantUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({
        user: {
          ...tenantUser,
          role: tenantUser.role.toLowerCase(),
          tenantId: user.tenantId,
        },
      });
    }
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



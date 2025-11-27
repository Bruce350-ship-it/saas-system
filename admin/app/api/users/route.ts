import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware';
import { hashPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Error response
    }

    const { user, tenantClient } = authResult;

    if (!tenantClient) {
      return NextResponse.json({ error: 'Tenant client not available' }, { status: 500 });
    }

    const users = await tenantClient.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Error response
    }

    const { user, tenantClient } = authResult;

    if (!tenantClient) {
      return NextResponse.json({ error: 'Tenant client not available' }, { status: 500 });
    }

    const { name, email, password, role } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!['ADMIN', 'USER'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be ADMIN or USER' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await tenantClient.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role as 'ADMIN' | 'USER',
        tenantId: user.tenantId!,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Error response
    }

    const { user, tenantClient } = authResult;

    if (!tenantClient) {
      return NextResponse.json({ error: 'Tenant client not available' }, { status: 500 });
    }

    const { id, name, email, role } = await request.json();

    if (!id || !name || !email || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!['ADMIN', 'USER'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be ADMIN or USER' },
        { status: 400 }
      );
    }

    const updatedUser = await tenantClient.user.update({
      where: { id },
      data: {
        name,
        email,
        role: role as 'ADMIN' | 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Error response
    }

    const { user, tenantClient } = authResult;

    if (!tenantClient) {
      return NextResponse.json({ error: 'Tenant client not available' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await tenantClient.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader, JWTPayload } from './auth';
import { prisma } from './prisma';
import { getTenantClient } from './tenant';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
  tenantClient?: any; // Prisma client for tenant database
}

export async function withAuth(
  request: NextRequest,
  allowedRoles: ('super_admin' | 'admin' | 'user')[] = []
) {
  const token = extractTokenFromHeader(request.headers.get('authorization'));
  
  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Check if user role is allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // For tenant users, get tenant database client
  let tenantClient = null;
  if (payload.role === 'admin' || payload.role === 'user') {
    if (!payload.tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: payload.tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    tenantClient = getTenantClient(tenant.dbUrl);
  }

  return { user: payload, tenantClient };
}

export function requireSuperAdmin(request: NextRequest) {
  return withAuth(request, ['super_admin']);
}

export function requireAdmin(request: NextRequest) {
  return withAuth(request, ['super_admin', 'admin']);
}

export function requireAnyAuth(request: NextRequest) {
  return withAuth(request, ['super_admin', 'admin', 'user']);
}



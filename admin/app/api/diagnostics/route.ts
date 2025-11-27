import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware';
import { TenantDiagnostics } from '@/lib/tenant-diagnostics';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Error response
    }

    const diagnostics = new TenantDiagnostics();
    const result = await diagnostics.listAllTenants();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Diagnostics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Error response
    }

    const { email, password } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required for login test' },
        { status: 400 }
      );
    }

    const diagnostics = new TenantDiagnostics();
    const result = await diagnostics.testLoginProcess(email, password);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Login test error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        businessName: true,
        contactEmail: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error('Get tenants error:', error);
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

    const { businessName, contactEmail, adminName, adminEmail, adminPassword } = await request.json();

    if (!businessName || !contactEmail || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting automated tenant creation for: ${businessName}`);

    // Create tenant record in master database first to get Prisma ID
    const tenant = await prisma.tenant.create({
      data: {
        businessName,
        contactEmail,
        dbUrl: 'placeholder', // Will be updated after database creation
      },
    });

    // Use Prisma-generated ID for database creation
    const tenantId = tenant.id;

    // Initialize database provisioner
    const provisioner = new DatabaseProvisioner();
    
    // Provision the complete tenant database
    const provisionResult = await provisioner.provisionTenant({
      businessName,
      contactEmail,
      adminName,
      adminEmail,
      adminPassword,
      tenantId,
    });

    if (!provisionResult.success) {
      console.error('❌ Tenant provisioning failed:', provisionResult.error);
      // Clean up the tenant record if database creation failed
      await prisma.tenant.delete({ where: { id: tenantId } });
      return NextResponse.json(
        { error: `Failed to provision tenant database: ${provisionResult.error}` },
        { status: 500 }
      );
    }

    // Update tenant record with actual database URL
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { dbUrl: provisionResult.dbUrl! },
    });

    console.log(`✅ Tenant created successfully: ${tenant.id}`);

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        businessName: tenant.businessName,
        contactEmail: tenant.contactEmail,
        dbUrl: tenant.dbUrl,
        createdAt: tenant.createdAt,
      },
      message: 'Tenant created and provisioned successfully!',
      details: {
        databaseCreated: true,
        schemaMigrated: true,
        adminUserCreated: true,
        sampleDataSeeded: true,
      },
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Error response
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Starting tenant deletion for: ${tenantId}`);

    // Find the tenant in master database (optional - might not exist for orphaned databases)
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    // Initialize database provisioner
    const provisioner = new DatabaseProvisioner();
    
    // Always try to drop the tenant database (even if master record doesn't exist)
    const dropResult = await provisioner.dropTenantDatabase(tenantId);
    
    if (!dropResult.success) {
      console.error('❌ Failed to drop tenant database:', dropResult.error);
      return NextResponse.json(
        { error: `Failed to drop tenant database: ${dropResult.error}` },
        { status: 500 }
      );
    }

    // Delete tenant record from master database (only if it exists)
    let masterRecordDeleted = false;
    if (tenant) {
      try {
        await prisma.tenant.delete({
          where: { id: tenantId },
        });
        masterRecordDeleted = true;
        console.log(`✅ Master database record deleted for: ${tenantId}`);
      } catch (error) {
        console.warn(`⚠️ Could not delete master record for ${tenantId}:`, error);
      }
    } else {
      console.log(`ℹ️ No master database record found for: ${tenantId} (orphaned database)`);
    }

    console.log(`✅ Tenant deletion completed: ${tenantId}`);

    return NextResponse.json({
      message: 'Tenant database deleted successfully!',
      details: {
        tenantId,
        businessName: tenant?.businessName || 'Unknown (orphaned database)',
        databaseDropped: true,
        masterRecordDeleted,
        wasOrphaned: !tenant,
      },
    });
  } catch (error) {
    console.error('Delete tenant error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



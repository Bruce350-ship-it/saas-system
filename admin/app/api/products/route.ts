import { NextRequest, NextResponse } from 'next/server';
import { requireAnyAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAnyAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult; // Error response
    }

    const { tenantClient } = authResult;

    if (!tenantClient) {
      return NextResponse.json({ error: 'Tenant client not available' }, { status: 500 });
    }

    const products = await tenantClient.product.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAnyAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult; // Error response
    }

    const { tenantClient } = authResult;

    if (!tenantClient) {
      return NextResponse.json({ error: 'Tenant client not available' }, { status: 500 });
    }

    const { name, price } = await request.json();

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      );
    }

    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        { status: 400 }
      );
    }

    const product = await tenantClient.product.create({
      data: {
        name,
        price,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAnyAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult; // Error response
    }

    const { tenantClient } = authResult;

    if (!tenantClient) {
      return NextResponse.json({ error: 'Tenant client not available' }, { status: 500 });
    }

    const { id, name, price } = await request.json();

    if (!id || !name || price === undefined) {
      return NextResponse.json(
        { error: 'ID, name, and price are required' },
        { status: 400 }
      );
    }

    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        { status: 400 }
      );
    }

    const product = await tenantClient.product.update({
      where: { id },
      data: {
        name,
        price,
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAnyAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult; // Error response
    }

    const { tenantClient } = authResult;

    if (!tenantClient) {
      return NextResponse.json({ error: 'Tenant client not available' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Check if product has any associated sales
    const salesCount = await tenantClient.sale.count({
      where: { productId },
    });

    if (salesCount > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete product',
          message: `This product has ${salesCount} associated sale(s). Please delete the sales first or keep the product.`
        },
        { status: 400 }
      );
    }

    await tenantClient.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);

    // Handle Prisma foreign key constraint error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return NextResponse.json(
        {
          error: 'Cannot delete product',
          message: 'This product has associated sales records. Please delete the sales first.'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



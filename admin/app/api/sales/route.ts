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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const productId = searchParams.get('productId');
    const userId = searchParams.get('userId');

    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (productId) {
      where.productId = productId;
    }

    if (userId) {
      where.userId = userId;
    }

    const sales = await tenantClient.sale.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ sales });
  } catch (error) {
    console.error('Get sales error:', error);
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

    const { user, tenantClient } = authResult;

    if (!tenantClient) {
      return NextResponse.json({ error: 'Tenant client not available' }, { status: 500 });
    }

    const { productId, quantity } = await request.json();

    if (!productId || !quantity) {
      return NextResponse.json(
        { error: 'Product ID and quantity are required' },
        { status: 400 }
      );
    }

    if (typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be a positive number' },
        { status: 400 }
      );
    }

    // Get product to calculate total
    const product = await tenantClient.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const total = Number(product.price) * quantity;

    const sale = await tenantClient.sale.create({
      data: {
        productId,
        userId: user.sub,
        quantity,
        total,
        synced: true, // API sales are immediately synced
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ sale }, { status: 201 });
  } catch (error) {
    console.error('Create sale error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET_SINGLE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireAnyAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult; // Error response
    }

    const { tenantClient } = authResult;

    if (!tenantClient) {
      return NextResponse.json({ error: 'Tenant client not available' }, { status: 500 });
    }

    const sale = await tenantClient.sale.findUnique({
      where: { id: params.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ sale });
  } catch (error) {
    console.error('Get sale error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



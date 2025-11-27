import { NextRequest, NextResponse } from 'next/server';
import { requireAnyAuth } from '@/lib/middleware';

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

    const { sales } = await request.json();

    if (!Array.isArray(sales)) {
      return NextResponse.json(
        { error: 'Sales must be an array' },
        { status: 400 }
      );
    }

    const syncedSales = [];
    const errors = [];

    // Process each sale
    for (const saleData of sales) {
      try {
        const { productId, quantity, total, localId } = saleData;

        if (!productId || !quantity || !total) {
          errors.push({
            localId,
            error: 'Missing required fields',
          });
          continue;
        }

        // Verify product exists
        const product = await tenantClient.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          errors.push({
            localId,
            error: 'Product not found',
          });
          continue;
        }

        // Create sale record
        const sale = await tenantClient.sale.create({
          data: {
            productId,
            userId: user.sub,
            quantity,
            total,
            synced: true,
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        });

        syncedSales.push({
          localId,
          serverId: sale.id,
          sale,
        });
      } catch (error) {
        errors.push({
          localId: saleData.localId,
          error: 'Failed to sync sale',
        });
      }
    }

    // Get updated products list
    const products = await tenantClient.product.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      syncedSales,
      errors,
      products,
      syncStatus: {
        timestamp: new Date().toISOString(),
        syncedCount: syncedSales.length,
        errorCount: errors.length,
      },
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



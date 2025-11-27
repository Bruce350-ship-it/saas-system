import { NextRequest, NextResponse } from 'next/server';
import { requireAnyAuth } from '@/lib/middleware';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireAnyAuth(request);

        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { tenantClient } = authResult;

        if (!tenantClient) {
            return NextResponse.json({ error: 'Tenant client not available' }, { status: 500 });
        }

        const { id } = await params;

        const sale = await tenantClient.sale.findUnique({
            where: { id },
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

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireAnyAuth(request);

        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { tenantClient } = authResult;

        if (!tenantClient) {
            return NextResponse.json({ error: 'Tenant client not available' }, { status: 500 });
        }

        const { id } = await params;
        const { quantity } = await request.json();

        if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
            return NextResponse.json(
                { error: 'Quantity must be a positive number' },
                { status: 400 }
            );
        }

        // Get the sale to find the product
        const existingSale = await tenantClient.sale.findUnique({
            where: { id },
            include: { product: true },
        });

        if (!existingSale) {
            return NextResponse.json(
                { error: 'Sale not found' },
                { status: 404 }
            );
        }

        // Calculate new total
        const total = Number(existingSale.product.price) * quantity;

        const sale = await tenantClient.sale.update({
            where: { id },
            data: {
                quantity,
                total,
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

        return NextResponse.json({ sale });
    } catch (error) {
        console.error('Update sale error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireAnyAuth(request);

        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { tenantClient } = authResult;

        if (!tenantClient) {
            return NextResponse.json({ error: 'Tenant client not available' }, { status: 500 });
        }

        const { id } = await params;

        // Check if sale exists
        const sale = await tenantClient.sale.findUnique({
            where: { id },
        });

        if (!sale) {
            return NextResponse.json(
                { error: 'Sale not found' },
                { status: 404 }
            );
        }

        await tenantClient.sale.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Sale deleted successfully' });
    } catch (error) {
        console.error('Delete sale error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

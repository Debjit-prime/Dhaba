import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { broadcastRealtimeEvent } from '@/lib/realtime';
import { OrderSource, OrderStatus, PaymentStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as OrderStatus | null;
    const source = searchParams.get('source') as OrderSource | null;
    const tableId = searchParams.get('tableId');
    const tableNumber = searchParams.get('tableNumber');

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }
    if (source) {
      whereClause.source = source;
    }
    if (tableId) {
      whereClause.tableId = tableId;
    }
    if (tableNumber) {
      whereClause.table = { number: tableNumber };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        table: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tableNumber,
      source = 'DINE_IN',
      items,
      customerName,
      customerPhone,
      notes,
      paymentMethod = 'UPI',
      paymentStatus = 'PENDING',
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    // Resolve table if tableNumber provided
    let tableId: string | null = null;
    if (tableNumber) {
      const table = await prisma.table.findUnique({
        where: { number: tableNumber },
      });
      if (table) {
        tableId = table.id;
      }
    }

    // Calculate total and fetch prices
    const itemIds = items.map((i: any) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: itemIds } },
    });
    const menuMap = new Map(menuItems.map((m) => [m.id, m]));

    let totalAmount = 0;
    const orderItemsToCreate = items.map((item: any) => {
      const menuItem = menuMap.get(item.menuItemId);
      const unitPrice = menuItem ? menuItem.price : item.unitPrice || 0;
      const quantity = Math.max(1, Number(item.quantity) || 1);
      totalAmount += unitPrice * quantity;

      return {
        menuItemId: item.menuItemId,
        quantity,
        unitPrice,
        customInstructions: item.customInstructions || null,
        isPrepared: false,
      };
    });

    // Generate unique order number
    let orderNumber = body.orderNumber;
    if (!orderNumber) {
      if (source === 'DINE_IN' && tableNumber) {
        orderNumber = tableNumber;
      } else if (source === 'SWIGGY') {
        orderNumber = `S-${Math.floor(100 + Math.random() * 900)}`;
      } else if (source === 'ZOMATO') {
        orderNumber = `Z-${Math.floor(100 + Math.random() * 900)}`;
      } else {
        orderNumber = `ORD-${Date.now().toString().slice(-4)}`;
      }
    }

    const existing = await prisma.order.findUnique({ where: { orderNumber } });
    if (existing && existing.status !== 'COMPLETED') {
      orderNumber = `${orderNumber}-${Math.floor(10 + Math.random() * 90)}`;
    }

    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        source,
        status: 'PENDING',
        tableId,
        totalAmount,
        paymentStatus,
        paymentMethod,
        customerName: customerName || (tableNumber ? `Guest - ${tableNumber}` : 'Online Customer'),
        customerPhone,
        notes,
        items: {
          create: orderItemsToCreate,
        },
      },
      include: {
        table: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    // Broadcast live event to KDS and Admin
    broadcastRealtimeEvent('order:created', newOrder);

    return NextResponse.json({ success: true, data: newOrder });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

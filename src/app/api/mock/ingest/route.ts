import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { broadcastRealtimeEvent } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const requestedSource =
      body.source === 'SWIGGY' || body.source === 'ZOMATO' ? body.source : null;
    const source: 'SWIGGY' | 'ZOMATO' =
      requestedSource ?? (Math.random() > 0.5 ? 'SWIGGY' : 'ZOMATO');

    // Fetch all available menu items
    const menuItems = await prisma.menuItem.findMany();
    if (menuItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No menu items found. Please run seed script.' },
        { status: 400 }
      );
    }

    // Pick 1-3 random items
    const randomCount = Math.floor(1 + Math.random() * 3);
    const shuffled = [...menuItems].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, randomCount);

    const orderNumber =
      source === 'SWIGGY'
        ? `S-${Math.floor(100 + Math.random() * 900)}`
        : `Z-${Math.floor(100 + Math.random() * 900)}`;

    const names = ['Kavita M.', 'Vikram Singh', 'Aman Verma', 'Simran Kaur', 'Rahul Nair', 'Neha Gupta'];
    const randomCustomer = names[Math.floor(Math.random() * names.length)];

    let totalAmount = 0;
    const itemsToCreate = selected.map((item) => {
      const quantity = Math.floor(1 + Math.random() * 2);
      totalAmount += item.price * quantity;
      return {
        menuItemId: item.id,
        quantity,
        unitPrice: item.price,
        customInstructions: Math.random() > 0.6 ? (item.isVeg ? 'Less spicy' : 'Extra spicy') : null,
        isPrepared: false,
      };
    });

    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        source,
        status: 'PENDING',
        totalAmount,
        paymentStatus: 'PAID',
        paymentMethod: source === 'SWIGGY' ? 'ONLINE_SWIGGY' : 'ONLINE_ZOMATO',
        customerName: randomCustomer,
        customerPhone: '+91 98' + Math.floor(10000000 + Math.random() * 90000000),
        notes: `Delivery order via ${source}`,
        items: {
          create: itemsToCreate,
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

    // Broadcast live event to KDS
    broadcastRealtimeEvent('order:created', newOrder);

    return NextResponse.json({
      success: true,
      message: `Simulated ${source} order #${orderNumber} ingested successfully!`,
      data: newOrder,
    });
  } catch (error) {
    console.error('Error simulating external order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to ingest mock order' },
      { status: 500 }
    );
  }
}

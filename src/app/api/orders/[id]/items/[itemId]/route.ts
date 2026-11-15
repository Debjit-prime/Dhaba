import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { broadcastRealtimeEvent } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const { id, itemId } = params;
    const body = await req.json();
    const { isPrepared } = body;

    const updatedItem = await prisma.orderItem.update({
      where: {
        id: itemId,
        orderId: id,
      },
      data: {
        isPrepared: typeof isPrepared === 'boolean' ? isPrepared : true,
      },
      include: {
        menuItem: true,
      },
    });

    // Broadcast item toggle
    broadcastRealtimeEvent('order:item_toggled', {
      orderId: id,
      itemId,
      isPrepared: updatedItem.isPrepared,
    });

    return NextResponse.json({ success: true, data: updatedItem });
  } catch (error) {
    console.error('Error updating order item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order item' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { broadcastRealtimeEvent } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

const validValetStatuses = ['PARKED', 'REQUESTED', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED'];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { status, estimatedMins } = body;

    if (!status || !validValetStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid valet status' },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (estimatedMins !== undefined) {
      updateData.estimatedMins = estimatedMins;
    }

    if (status === 'DELIVERED') {
      updateData.completedAt = new Date();
    }

    const updatedValet = await prisma.valetRequest.update({
      where: { id },
      data: updateData,
      include: {
        table: true,
        order: true,
      },
    });

    // Broadcast update to customer view and valet queue
    broadcastRealtimeEvent('valet:status_changed', updatedValet);

    return NextResponse.json({ success: true, data: updatedValet });
  } catch (error) {
    console.error('Error updating valet status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update valet status' },
      { status: 500 }
    );
  }
}

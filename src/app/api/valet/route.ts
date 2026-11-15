import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { broadcastRealtimeEvent } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const ticketNumber = searchParams.get('ticketNumber');

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }
    if (ticketNumber) {
      whereClause.ticketNumber = ticketNumber;
    }

    const requests = await prisma.valetRequest.findMany({
      where: whereClause,
      include: {
        table: true,
        order: true,
      },
      orderBy: [
        { requestedAt: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    console.error('Error fetching valet requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch valet requests' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      ticketNumber,
      vehicleModel,
      vehicleNumber,
      parkingSpot,
      guestName,
      tableNumber,
    } = body;

    let existing = null;
    if (ticketNumber) {
      existing = await prisma.valetRequest.findUnique({
        where: { ticketNumber },
      });
    }

    let tableId: string | null = null;
    if (tableNumber) {
      const table = await prisma.table.findUnique({
        where: { number: tableNumber },
      });
      if (table) tableId = table.id;
    }

    let valetRequest;
    if (existing) {
      valetRequest = await prisma.valetRequest.update({
        where: { id: existing.id },
        data: {
          status: 'REQUESTED',
          requestedAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          table: true,
          order: true,
        },
      });
    } else {
      const generatedTicket = ticketNumber || `#V-${Math.floor(1000 + Math.random() * 9000)}`;
      valetRequest = await prisma.valetRequest.create({
        data: {
          ticketNumber: generatedTicket,
          vehicleModel: vehicleModel || 'White Toyota Innova',
          vehicleNumber: vehicleNumber || 'MH-12-AB-1234',
          parkingSpot: parkingSpot || 'Zone B Parking',
          guestName: guestName || (tableNumber ? `Guest - ${tableNumber}` : 'Valet Guest'),
          tableId,
          status: 'REQUESTED',
          priority: 'MEDIUM',
          estimatedMins: 4,
          requestedAt: new Date(),
        },
        include: {
          table: true,
          order: true,
        },
      });
    }

    // Broadcast live event
    broadcastRealtimeEvent('valet:requested', valetRequest);

    return NextResponse.json({ success: true, data: valetRequest });
  } catch (error) {
    console.error('Error creating/requesting valet:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process valet request' },
      { status: 500 }
    );
  }
}

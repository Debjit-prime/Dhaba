import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { broadcastRealtimeEvent } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const ingredients = await prisma.ingredient.findMany({
      include: {
        batches: {
          orderBy: { expiresAt: 'asc' },
        },
      },
      orderBy: { currentStock: 'asc' },
    });

    const enriched = ingredients.map((item) => {
      const stockPercentage = Math.round((item.currentStock / Math.max(1, item.maxCapacity)) * 100);
      const isLowStock = item.currentStock <= item.reorderLevel;
      const isUrgent = stockPercentage <= 15;

      // Calculate depletion estimate based on urgency
      let depletionMinsEstimate = undefined;
      if (isUrgent) {
        depletionMinsEstimate = 45; // 45 mins at peak velocity
      } else if (isLowStock) {
        depletionMinsEstimate = 180; // 3 hours
      }

      return {
        ...item,
        stockPercentage,
        isLowStock,
        isUrgent,
        depletionMinsEstimate,
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ingredientId, quantityToAdd, supplier, batchNumber, expiresAtDays = 7 } = body;

    if (!ingredientId || !quantityToAdd) {
      return NextResponse.json(
        { success: false, error: 'Ingredient ID and quantity are required' },
        { status: 400 }
      );
    }

    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
    });

    if (!ingredient) {
      return NextResponse.json(
        { success: false, error: 'Ingredient not found' },
        { status: 404 }
      );
    }

    const updatedCurrentStock = Math.min(
      ingredient.maxCapacity,
      ingredient.currentStock + Number(quantityToAdd)
    );

    const updated = await prisma.ingredient.update({
      where: { id: ingredientId },
      data: {
        currentStock: updatedCurrentStock,
        batches: {
          create: {
            batchNumber: batchNumber || `BAT-IN-${Date.now().toString().slice(-4)}`,
            quantity: Number(quantityToAdd),
            supplier: supplier || 'Highway Local Supplier',
            expiresAt: new Date(Date.now() + expiresAtDays * 24 * 60 * 60 * 1000),
          },
        },
      },
      include: {
        batches: true,
      },
    });

    broadcastRealtimeEvent('inventory:updated', updated);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error restocking ingredient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to restock ingredient' },
      { status: 500 }
    );
  }
}

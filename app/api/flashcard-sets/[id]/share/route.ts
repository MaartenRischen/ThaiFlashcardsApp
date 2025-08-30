import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/app/lib/prisma';

// POST /api/flashcard-sets/[id]/share
// Generates (or returns existing) shareId for the owner of a set and saves it to DB
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const setId = params.id;

    // Fetch the set and ensure it belongs to the authenticated user
    const set = await prisma.flashcardSet.findUnique({
      where: { id: setId },
      select: {
        shareId: true,
        userId: true,
        source: true,
      },
    });

    if (!set) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 });
    }
    
    // Allow sharing of default sets by any user who has them, or sets owned by the user
    if (set.source !== 'default' && set.userId !== userId) {
      return NextResponse.json({ error: 'Set not found or not owned by user' }, { status: 404 });
    }

    // If it already has a shareId, just return it
    if (set.shareId) {
      return NextResponse.json({ shareId: set.shareId });
    }

    // Generate an unguessable ID (UUID v4)
    const newShareId = randomUUID();

    await prisma.flashcardSet.update({
      where: { id: setId },
      data: { shareId: newShareId },
    });

    return NextResponse.json({ shareId: newShareId });
  } catch (err) {
    console.error('[share-route] Error generating shareId', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { randomUUID } from 'crypto';
import { prisma } from '@/app/lib/prisma';

// POST /api/flashcard-sets/[id]/share
// Generates (or returns existing) shareId for the owner of a set and saves it to DB
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const setId = params.id;

    // Ensure the set belongs to the user
    const set = await prisma.flashcardSet.findUnique({
      where: { id: setId, userId: session.user.id }
    }) as any; // cast to allow shareId access until types regenerated

    if (!set) {
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
      data: { shareId: newShareId } as any
    });

    return NextResponse.json({ shareId: newShareId });
  } catch (err) {
    console.error('[share-route] Error generating shareId', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 
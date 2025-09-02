import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/app/lib/prisma';
import { getDefaultSetContent } from '@/app/lib/seed-default-sets';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[EASY-CARDS-EXAM] Fetching easy cards for user ${userId}`);

    // Get all user's flashcard sets
    const sets = await prisma.flashcardSet.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        source: true,
        imageUrl: true,
        folderId: true
      }
    });

    console.log(`[EASY-CARDS-EXAM] Found ${sets.length} sets`);

    // Get all user progress entries where mastery is "easy"
    const easyProgressEntries = await prisma.userProgress.findMany({
      where: {
        userId,
        mastery: 'easy'
      },
      select: {
        flashcardSetId: true,
        phraseIndex: true,
        updatedAt: true
      }
    });

    console.log(`[EASY-CARDS-EXAM] Found ${easyProgressEntries.length} easy cards`);

    // Group easy cards by set
    const easyCardsBySet = new Map<string, number[]>();
    easyProgressEntries.forEach(entry => {
      if (!easyCardsBySet.has(entry.flashcardSetId)) {
        easyCardsBySet.set(entry.flashcardSetId, []);
      }
      easyCardsBySet.get(entry.flashcardSetId)!.push(entry.phraseIndex);
    });

    // Collect all easy cards with their content
    const easyCards: Array<{
      setId: string;
      setName: string;
      setImageUrl?: string;
      phraseIndex: number;
      phrase: any;
      lastReviewed: Date;
    }> = [];

    for (const set of sets) {
      const easyIndices = easyCardsBySet.get(set.id);
      if (!easyIndices || easyIndices.length === 0) continue;

      let content: any[] = [];

      // For default sets, get content from seed data
      if (set.source === 'default') {
        content = getDefaultSetContent(set.id);
      } else {
        // For user sets, fetch from database
        const dbSet = await prisma.flashcardSet.findUnique({
          where: { id: set.id },
          select: { phrases: true }
        });
        
        if (dbSet?.phrases) {
          content = dbSet.phrases as any[];
        }
      }

      // Add easy cards from this set
      for (const phraseIndex of easyIndices) {
        if (phraseIndex < content.length) {
          const progressEntry = easyProgressEntries.find(
            e => e.flashcardSetId === set.id && e.phraseIndex === phraseIndex
          );
          
          easyCards.push({
            setId: set.id,
            setName: set.name,
            setImageUrl: set.imageUrl || undefined,
            phraseIndex,
            phrase: content[phraseIndex],
            lastReviewed: progressEntry?.updatedAt || new Date()
          });
        }
      }
    }

    // Sort by last reviewed date (oldest first for spaced repetition)
    easyCards.sort((a, b) => a.lastReviewed.getTime() - b.lastReviewed.getTime());

    console.log(`[EASY-CARDS-EXAM] Returning ${easyCards.length} easy cards`);

    return NextResponse.json({
      cards: easyCards,
      totalCount: easyCards.length,
      stats: {
        totalSets: sets.length,
        setsWithEasyCards: easyCardsBySet.size
      }
    });

  } catch (error) {
    console.error('[EASY-CARDS-EXAM] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch easy cards' },
      { status: 500 }
    );
  }
}

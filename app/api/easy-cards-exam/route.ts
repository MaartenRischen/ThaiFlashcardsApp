import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/app/lib/prisma';
import { getDefaultSetContent } from '@/app/lib/seed-default-sets';
import { Phrase } from '@/app/lib/generation/types';
import { PhraseProgressData } from '@/app/lib/storage/types';

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

    // Get all user progress entries and filter for "easy" cards
    const allProgressEntries = await prisma.userSetProgress.findMany({
      where: { userId },
      select: {
        setId: true,
        progressData: true,
        lastAccessedAt: true
      }
    });

    console.log(`[EASY-CARDS-EXAM] Found ${allProgressEntries.length} progress entries`);

    // Extract easy cards from progress data
    const easyCardsBySet = new Map<string, Array<{ phraseIndex: number; lastReviewed: Date }>>();
    
    allProgressEntries.forEach(entry => {
      const progressData = entry.progressData as Record<string, PhraseProgressData>;
      
      Object.entries(progressData).forEach(([phraseIndexStr, progress]) => {
        if (progress?.difficulty === 'easy') {
          const phraseIndex = parseInt(phraseIndexStr, 10);
          if (!easyCardsBySet.has(entry.setId)) {
            easyCardsBySet.set(entry.setId, []);
          }
          easyCardsBySet.get(entry.setId)!.push({
            phraseIndex,
            lastReviewed: new Date(progress.lastReviewedDate || entry.lastAccessedAt)
          });
        }
      });
    });

    const totalEasyCards = Array.from(easyCardsBySet.values()).reduce((sum, cards) => sum + cards.length, 0);
    console.log(`[EASY-CARDS-EXAM] Found ${totalEasyCards} easy cards across ${easyCardsBySet.size} sets`);

    // Collect all easy cards with their content
    const easyCards: Array<{
      setId: string;
      setName: string;
      setImageUrl?: string;
      phraseIndex: number;
      phrase: Phrase;
      lastReviewed: Date;
    }> = [];

    for (const set of sets) {
      const easyCardsData = easyCardsBySet.get(set.id);
      if (!easyCardsData || easyCardsData.length === 0) continue;

      let content: Phrase[] = [];

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
          content = dbSet.phrases as Phrase[];
        }
      }

      // Add easy cards from this set
      for (const cardData of easyCardsData) {
        if (cardData.phraseIndex < content.length) {
          easyCards.push({
            setId: set.id,
            setName: set.name,
            setImageUrl: set.imageUrl || undefined,
            phraseIndex: cardData.phraseIndex,
            phrase: content[cardData.phraseIndex],
            lastReviewed: cardData.lastReviewed
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

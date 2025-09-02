import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/app/lib/prisma';
import { getDefaultSetContent } from '@/app/lib/seed-default-sets';
import { ALL_DEFAULT_SETS } from '@/app/data/default-sets';
import { Phrase, ExampleSentence } from '@/app/lib/generation/types';
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
    
    const isRecordObject = (val: unknown): val is Record<string, unknown> => {
      return !!val && typeof val === 'object' && !Array.isArray(val);
    };

    const isPhraseProgressData = (val: unknown): val is PhraseProgressData => {
      if (!isRecordObject(val)) return false;
      const difficulty = val['difficulty'];
      const lastReviewedDate = val['lastReviewedDate'];
      return (
        (difficulty === 'easy' || difficulty === 'good' || difficulty === 'hard') &&
        typeof lastReviewedDate === 'string'
      );
    };

    allProgressEntries.forEach(entry => {
      const raw = entry.progressData as unknown;
      if (!isRecordObject(raw)) return;

      Object.entries(raw).forEach(([phraseIndexStr, progress]) => {
        if (isPhraseProgressData(progress) && progress.difficulty === 'easy') {
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

    // Iterate over every setId that has progress, not only sets existing in DB
    for (const entry of Array.from(easyCardsBySet.entries())) {
      const [setId, easyCardsData] = entry;
      if (!easyCardsData || easyCardsData.length === 0) continue;

      // Try to find DB metadata for name/image/source
      const dbMeta = sets.find((s) => s.id === setId);
      const isDefault = dbMeta?.source === 'default' || setId === 'default' || setId.startsWith('default-');

      let setName = dbMeta?.name ?? 'Unknown Set';
      const setImageUrl = dbMeta?.imageUrl ?? undefined;

      if (!dbMeta && (setId === 'default' || setId.startsWith('default-'))) {
        // Derive default set name from templates
        const baseId = setId.replace('default-', '');
        const template = ALL_DEFAULT_SETS.find((s) => s.id === baseId);
        if (template) {
          setName = template.name;
        }
      }

      // Load content for this setId
      let content: Phrase[] = [];
      if (isDefault) {
        content = getDefaultSetContent(setId) || [];
      } else {
        const dbSet = await prisma.flashcardSet.findUnique({
          where: { id: setId },
          select: { phrases: true }
        });
        if (dbSet?.phrases) {
          type DbPhrase = {
            english: string;
            thai: string;
            thaiMasculine: string;
            thaiFeminine: string;
            pronunciation: string;
            mnemonic: string | null;
            examplesJson: unknown;
          };
          const toExamples = (val: unknown): ExampleSentence[] => {
            if (!Array.isArray(val)) return [];
            return val
              .filter((e): e is Record<string, unknown> => !!e && typeof e === 'object' && !Array.isArray(e))
              .map((e) => ({
                thai: String(e['thai'] ?? ''),
                thaiMasculine: String(e['thaiMasculine'] ?? ''),
                thaiFeminine: String(e['thaiFeminine'] ?? ''),
                pronunciation: String(e['pronunciation'] ?? ''),
                translation: String(e['translation'] ?? ''),
              }));
          };
          content = (dbSet.phrases as DbPhrase[]).map((p): Phrase => ({
            english: p.english,
            thai: p.thai,
            thaiMasculine: p.thaiMasculine,
            thaiFeminine: p.thaiFeminine,
            pronunciation: p.pronunciation,
            mnemonic: p.mnemonic ?? undefined,
            examples: toExamples(p.examplesJson),
          }));
        }
      }

      for (const cardData of easyCardsData) {
        if (cardData.phraseIndex < content.length) {
          easyCards.push({
            setId,
            setName,
            setImageUrl,
            phraseIndex: cardData.phraseIndex,
            phrase: content[cardData.phraseIndex],
            lastReviewed: cardData.lastReviewed,
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

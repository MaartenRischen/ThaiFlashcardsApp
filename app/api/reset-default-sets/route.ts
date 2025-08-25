import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/app/lib/prisma';
import { ALL_DEFAULT_SETS } from '@/app/data/default-sets';
import { Prisma } from '@prisma/client';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Reset each default set
    const results = await Promise.all(
      ALL_DEFAULT_SETS.map(async (defaultSet) => {
        try {
          // Check if this default set exists in the user's database
          const existingSet = await prisma.flashcardSet.findFirst({
            where: {
              id: defaultSet.id,
              userId: userId,
            },
          });

          if (existingSet) {
            // Delete all existing phrases for this set
            await prisma.phrase.deleteMany({
              where: {
                setId: defaultSet.id,
              },
            });

            // Insert fresh phrases from default data
            const phrasesToInsert = defaultSet.phrases.map(phrase => ({
              setId: defaultSet.id,
              english: phrase.english,
              thai: phrase.thai,
              thaiMasculine: phrase.thaiMasculine || phrase.thai,
              thaiFeminine: phrase.thaiFeminine || phrase.thai,
              pronunciation: phrase.pronunciation,
              mnemonic: phrase.mnemonic || null,
              examplesJson: phrase.examples && phrase.examples.length > 0 
                ? (phrase.examples as unknown as Prisma.InputJsonValue)
                : Prisma.JsonNull
            }));

            await prisma.phrase.createMany({
              data: phrasesToInsert,
            });

            // Update the set's updatedAt timestamp
            await prisma.flashcardSet.update({
              where: {
                id: defaultSet.id,
              },
              data: {
                updatedAt: new Date().toISOString(),
              },
            });

            return { setId: defaultSet.id, status: 'reset' };
          } else {
            // Set doesn't exist yet, so nothing to reset
            return { setId: defaultSet.id, status: 'skipped' };
          }
        } catch (error) {
          console.error(`Error resetting default set ${defaultSet.id}:`, error);
          return { setId: defaultSet.id, status: 'error', error };
        }
      })
    );

    const resetCount = results.filter(r => r.status === 'reset').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return NextResponse.json({ 
      success: true, 
      message: `Reset ${resetCount} sets, skipped ${skippedCount} sets, ${errorCount} errors`,
      results 
    });
  } catch (error) {
    console.error('Error resetting default sets:', error);
    return NextResponse.json(
      { error: 'Failed to reset default sets' },
      { status: 500 }
    );
  }
} 
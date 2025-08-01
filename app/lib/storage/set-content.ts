import { prisma } from '@/app/lib/prisma';
import { Prisma, Phrase as PrismaPhrase } from '@prisma/client';
import { Phrase, ExampleSentence } from '../set-generator';
import { getErrorMessage } from './utils';

// --- Set Content Management ---

// Fetch all phrases for a specific set
export async function getSetContent(id: string): Promise<Phrase[]> {
  if (!id) {
    console.error("getSetContent called without id.");
    return [];
  }
  
  console.log(`Fetching Phrases from Prisma for setId: ${id}`);
  
  try {
    const phrasesData = await prisma.phrase.findMany({
      where: {
        setId: id,
      },
      orderBy: { id: 'asc' },
    });

    console.log(`Successfully fetched ${phrasesData?.length || 0} Phrases for setId: ${id}`);

    // Map Prisma record to Phrase interface
    return phrasesData.map((dbPhrase: PrismaPhrase): Phrase => {
      let parsedExamples: ExampleSentence[] = [];
      
      try {
        if (dbPhrase.examplesJson && typeof dbPhrase.examplesJson === 'string') {
          const parsed = JSON.parse(dbPhrase.examplesJson);
          if (Array.isArray(parsed)) {
            // Validate each example
            parsedExamples = parsed.filter((ex: unknown) => {
              if (!ex || typeof ex !== 'object') return false;
              const e = ex as Partial<ExampleSentence>;
              return (
                typeof e.thai === 'string' &&
                typeof e.thaiMasculine === 'string' &&
                typeof e.thaiFeminine === 'string' &&
                typeof e.pronunciation === 'string' &&
                typeof e.translation === 'string'
              );
            }) as ExampleSentence[];
          } else {
            console.warn(`Parsed examplesJson for phrase ${dbPhrase.id} is not an array:`, parsed);
          }
        } else if (dbPhrase.examplesJson && Array.isArray(dbPhrase.examplesJson)) {
          parsedExamples = (dbPhrase.examplesJson as unknown[]).filter((ex: unknown) => {
            if (!ex || typeof ex !== 'object') return false;
            const e = ex as Partial<ExampleSentence>;
            return (
              typeof e.thai === 'string' &&
              typeof e.thaiMasculine === 'string' &&
              typeof e.thaiFeminine === 'string' &&
              typeof e.pronunciation === 'string' &&
              typeof e.translation === 'string'
            );
          }) as ExampleSentence[];
        }
      } catch (e) {
        console.error(`Failed to parse examplesJson for phrase ${dbPhrase.id}:`, dbPhrase.examplesJson, e);
      }
      
      return {
        id: dbPhrase.id,
        english: dbPhrase.english,
        thai: dbPhrase.thai,
        thaiMasculine: dbPhrase.thaiMasculine,
        thaiFeminine: dbPhrase.thaiFeminine,
        pronunciation: dbPhrase.pronunciation,
        mnemonic: dbPhrase.mnemonic ?? undefined,
        examples: parsedExamples,
      };
    });

  } catch (error: unknown) {
    console.error(`Unexpected error in getSetContent for setId ${id}:`, getErrorMessage(error));
    return [];
  }
}

// Server-side function to save phrases directly using Prisma (for API routes)
export async function saveSetContentDirect(setId: string, phrases: Phrase[]): Promise<boolean> {
  if (!setId || !phrases || phrases.length === 0) {
    console.error("saveSetContentDirect called without setId or with empty phrases array.");
    return false;
  }

  console.log(`Saving ${phrases.length} Phrases to Supabase for setId: ${setId}`);

  // Prepare records for batch insert
  const recordsToInsert = phrases.map(phrase => ({
    setId: setId,
    english: phrase.english,
    thai: phrase.thai,
    thaiMasculine: phrase.thaiMasculine,
    thaiFeminine: phrase.thaiFeminine,
    pronunciation: phrase.pronunciation,
    mnemonic: phrase.mnemonic ?? undefined,
    examplesJson: (phrase.examples && phrase.examples.length > 0) 
      ? (phrase.examples as unknown as Prisma.InputJsonValue) 
      : Prisma.JsonNull
  }));

  try {
    // First, delete any existing phrases for this set
    await prisma.phrase.deleteMany({
      where: {
        setId: setId,
      },
    });

    // Then insert the new phrases
    await prisma.phrase.createMany({
      data: recordsToInsert,
    });

    // Update the set's updatedAt timestamp
    await prisma.flashcardSet.update({
      where: {
        id: setId,
      },
      data: {
        updatedAt: new Date().toISOString()
      },
    });

    console.log(`Successfully saved ${phrases.length} Phrases for setId: ${setId}`);
    return true;

  } catch (error) {
    console.error('Unexpected error in saveSetContentDirect:', error);
    return false;
  }
}

// Client-side function to save phrases via API call (for browser use)
export async function saveSetContent(setId: string, phrases: Phrase[]): Promise<boolean> {
  if (!setId || !phrases || phrases.length === 0) {
    console.error("saveSetContent called without setId or with empty phrases array.");
    return false;
  }

  try {
    const response = await fetch(`/api/flashcard-sets/${setId}/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phrases: phrases
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to save set content: ${response.status}`);
    }

    const result = await response.json();
    return result.success === true;

  } catch (error) {
    console.error('Unexpected error in saveSetContent:', error);
    return false;
  }
}

// Delete all phrases for a specific set
export async function deleteSetContent(setId: string): Promise<boolean> {
  if (!setId) {
    console.error("deleteSetContent called without setId.");
    return false;
  }
  
  console.log(`Deleting Phrases from Supabase for setId: ${setId}`);
  
  try {
    await prisma.phrase.deleteMany({
      where: {
        setId: setId,
      },
    });

    console.log(`Successfully deleted Phrases for setId: ${setId}`);
    return true;

  } catch (error) {
    console.error('Unexpected error in deleteSetContent:', error);
    return false;
  }
} 
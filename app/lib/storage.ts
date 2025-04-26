import { Phrase } from '../lib/set-generator';
import { v4 as uuidv4 } from 'uuid'; // Added back for potential use in other functions
import { prisma } from "@/app/lib/prisma"; // Import prisma client
import { Prisma, FlashcardSet, Phrase as PrismaPhrase } from '@prisma/client'; // Use specific type import
import { ExampleSentence } from './set-generator';
import { deleteImage } from './imageStorage';

// Helper function
function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') return error.message;
    return 'An unknown error occurred';
}

// Storage key prefixes (kept for reference, but not used in DB logic)
// const PREFIX = 'thaiFlashcards_';
// const setContentKey = (id: string) => `${PREFIX}content_${id}`;
// const setProgressKey = (id: string) => `${PREFIX}progress_${id}`;

// --- Type Definitions ---

export interface SetMetaData {
  id: string;
  name: string;
  cleverTitle?: string;
  createdAt: string;
  phraseCount: number;
  level?: 'complete beginner' | 'basic understanding' | 'intermediate' | 'advanced' | 'native/fluent' | 'god mode';
  goals?: string[];
  specificTopics?: string;
  source: 'default' | 'import' | 'generated';
  imageUrl?: string; // Add optional imageUrl here
  isFullyLearned?: boolean; // Keep the flag here (not in DB)
  seriousnessLevel?: number; // Add seriousnessLevel for tone/ridiculousness
  llmBrand?: string; // NEW: LLM brand
  llmModel?: string; // NEW: LLM model
}

export interface PhraseProgressData {
  srsLevel: number;
  nextReviewDate: string;
  lastReviewedDate: string;
  difficulty: 'easy' | 'good' | 'hard';
  repetitions: number;
  easeFactor: number;
}

export type SetProgress = { [cardIndex: number]: PhraseProgressData };

// --- Removed localStorage Helper Functions ---
// getFromStorage and setToStorage functions removed.

// --- Set MetaData Management ---

// Fetches from Supabase
export async function getAllSetMetaData(userId: string): Promise<SetMetaData[]> {
  if (!userId) {
    console.error("getAllSetMetaData called without userId.");
    return [];
  }
  console.log(`Fetching SetMetaData from Supabase for userId: ${userId}`);
  try {
    // Fetch sets directly using Prisma
    const prismaSets = await prisma.flashcardSet.findMany({
      where: {
        userId: userId,
      },
    });

    console.log('Successfully fetched SetMetaData:', prismaSets);
    const sets = prismaSets || [];

    // Map Supabase record to SetMetaData interface, including imageUrl and LLM info
    return sets.map((dbSet: FlashcardSet) => ({ 
      id: dbSet.id,
      name: dbSet.name,
      cleverTitle: dbSet.cleverTitle || undefined,
      createdAt: dbSet.createdAt.toISOString(),
      phraseCount: 0, // Set default 0
      level: dbSet.level as SetMetaData['level'] || undefined, 
      goals: dbSet.goals || [],
      specificTopics: dbSet.specificTopics || undefined,
      source: dbSet.source as SetMetaData['source'] || 'generated',
      imageUrl: dbSet.imageUrl || undefined, // Map imageUrl
      isFullyLearned: false,
      seriousnessLevel: dbSet.seriousnessLevel || undefined,
      llmBrand: dbSet.llmBrand || undefined, // NEW
      llmModel: dbSet.llmModel || undefined  // NEW
    }));

  } catch (error) {
    console.error('Unexpected error in getAllSetMetaData:', error);
    return []; 
  }
}

// REFACTOR: Insert into Supabase - Add imageUrl
// Adjust input type to include optional imageUrl
export async function addSetMetaData(userId: string, newSetData: Omit<SetMetaData, 'id' | 'createdAt' | 'phraseCount' | 'isFullyLearned'>): Promise<FlashcardSet | null> {
  if (!userId || !newSetData) {
      console.error("addSetMetaData called without userId or newSetData.");
      return null;
  }

  // Prepare data for Prisma, mapping SetMetaData to Prisma's FlashcardSetCreateInput
  // Note: Prisma handles id, createdAt, updatedAt automatically
  const dataToInsert: Omit<FlashcardSet, 'id' | 'createdAt' | 'updatedAt'> = {
    userId: userId,
    name: newSetData.name,
    cleverTitle: newSetData.cleverTitle || null,
    level: newSetData.level || null,
    goals: newSetData.goals || [], // Use empty array as default for Prisma String[]
    specificTopics: newSetData.specificTopics || null,
    source: newSetData.source,
    imageUrl: newSetData.imageUrl || null,
    seriousnessLevel: newSetData.seriousnessLevel || null,
    llmBrand: newSetData.llmBrand || null,
    llmModel: newSetData.llmModel || null,
    shareId: null, // Assuming shareId is optional or generated elsewhere/later
  };

  console.log(`Inserting SetMetaData into DB via Prisma for userId: ${userId}`, dataToInsert);

  try {
    // Use Prisma client to create the record
    const createdSet = await prisma.flashcardSet.create({
      data: dataToInsert,
    });

    console.log('Successfully inserted SetMetaData via Prisma:', createdSet);
    return createdSet; // Return the created Prisma record

  } catch (error) {
    console.error('Error inserting SetMetaData via Prisma:', error);
    // Consider more specific error handling if needed
    return null; 
  }
}

// REFACTOR: Update Supabase record - Add imageUrl
export async function updateSetMetaData(updatedSet: SetMetaData): Promise<boolean> {
  if (!updatedSet || !updatedSet.id) {
      console.error("updateSetMetaData called without valid updatedSet data or ID.");
      return false;
  }

  // Prepare record for Supabase update, including imageUrl and LLM info
  const recordToUpdate: Partial<Omit<FlashcardSet, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'phraseCount'> & { updatedAt: string }> = {
      name: updatedSet.name,
      cleverTitle: updatedSet.cleverTitle || null,
      level: updatedSet.level || null,
      goals: updatedSet.goals || [],
      specificTopics: updatedSet.specificTopics || null,
      source: updatedSet.source,
      imageUrl: updatedSet.imageUrl || null,
      seriousnessLevel: updatedSet.seriousnessLevel || null,
      llmBrand: updatedSet.llmBrand || null, // NEW
      llmModel: updatedSet.llmModel || null, // NEW
      updatedAt: new Date().toISOString()
  };
  
  console.log(`Updating SetMetaData in Supabase for id: ${updatedSet.id}`, recordToUpdate);
  try {
    await prisma.flashcardSet.update({
      where: {
        id: updatedSet.id,
      },
      data: recordToUpdate,
    });
    console.log(`Successfully updated SetMetaData for id: ${updatedSet.id}`);
    return true;
  } catch (error) {
    console.error('Unexpected error in updateSetMetaData:', error);
    return false;
  }
}

// REFACTOR: Delete from Supabase (including related data)
export async function deleteSetMetaData(setId: string): Promise<boolean> {
  if (!setId) {
    console.error("deleteSetMetaData called without setId.");
    return false;
  }

  console.log(`Attempting to delete SetMetaData and related data for id: ${setId}`);

  try {
    // 1. Delete the stored image if it exists
    await deleteImage(setId).catch(error => {
      console.warn(`Failed to delete stored image for set ${setId}:`, error);
    });

    // 2. Delete associated progress
    console.log(`Deleting UserSetProgress for setId: ${setId}`);
    await prisma.userSetProgress.deleteMany({
      where: {
        setId: setId,
      },
    });

    // 3. Delete associated phrases
    console.log(`Deleting Phrases for setId: ${setId}`);
    await prisma.phrase.deleteMany({
      where: {
        setId: setId,
      },
    });

    // 4. Delete the set metadata itself
    console.log(`Deleting FlashcardSet record for id: ${setId}`);
    await prisma.flashcardSet.delete({
      where: {
        id: setId,
      },
    });

    console.log(`Successfully deleted SetMetaData and related data for id: ${setId}`);
    return true;

  } catch (error) {
    console.error('Unexpected error in deleteSetMetaData:', error);
    return false;
  }
}

// --- Set Content Management ---

// REFACTOR: Fetch Phrases from Supabase, include ID
export async function getSetContent(id: string): Promise<Phrase[]> {
  if (!id) {
    console.error("getSetContent called without id.");
    return [];
  }
  console.log(`Fetching Phrases from Prisma for setId: ${id}`);
  try {
    const phrasesData = await prisma.phrase.findMany({
      where: {
        setId: id, // Use the actual foreign key field 'setId'
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
        } else if (Array.isArray(dbPhrase.examplesJson)) {
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
    console.error(`Unexpected error in getSetContent for setId ${id}:`, getErrorMessage(error)); // Use helper
    return [];
  }
}

// REFACTOR: Batch insert Phrases into Supabase, generate IDs
export async function saveSetContent(setId: string, phrases: Phrase[]): Promise<boolean> {
  if (!setId || !phrases || phrases.length === 0) {
    console.error("saveSetContent called without setId or with empty phrases array.");
    return false;
  }

  console.log(`Saving ${phrases.length} Phrases to Supabase for setId: ${setId}`);

  // Prepare records for Supabase batch insert, generating a unique ID for each phrase
  const recordsToInsert = phrases.map(phrase => ({
    // id: uuidv4(), // Let Prisma generate if needed
    setId: setId,
    english: phrase.english,
    thai: phrase.thai,
    thaiMasculine: phrase.thaiMasculine,
    thaiFeminine: phrase.thaiFeminine,
    pronunciation: phrase.pronunciation,
    mnemonic: phrase.mnemonic ?? undefined,
    examplesJson: (phrase.examples && phrase.examples.length > 0) ? (phrase.examples as unknown as Prisma.InputJsonValue) : Prisma.JsonNull
  }));

  try {
    await prisma.phrase.createMany({
      data: recordsToInsert,
    });

    console.log(`Successfully saved ${phrases.length} Phrases for setId: ${setId}`);
    return true;

  } catch (error) {
    console.error('Unexpected error in saveSetContent:', error);
    return false;
  }
}

// REFACTOR: Delete Phrases from Supabase
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

// --- Set Progress Management ---

// REFACTOR: Fetch progress from Supabase
export async function getSetProgress(userId: string, setId: string): Promise<SetProgress> {
  if (!userId || !setId) {
    console.error("getSetProgress called without userId or setId.");
    return {};
  }
  console.log(`Fetching UserSetProgress from Supabase for userId: ${userId}, setId: ${setId}`);
  try {
    const progressRecord = await prisma.userSetProgress.findUnique({
      where: {
        userId_setId: {
          userId: userId,
          setId: setId,
        },
      },
      select: {
        progressData: true,
      },
    });

    if (
      progressRecord &&
      progressRecord.progressData &&
      typeof progressRecord.progressData === 'object' &&
      !Array.isArray(progressRecord.progressData)
    ) {
      console.log(`Successfully fetched UserSetProgress`);
      // Cast the JSON object to SetProgress after validation
      return progressRecord.progressData as unknown as SetProgress;
    } else {
      console.log(`No valid UserSetProgress found for userId: ${userId}, setId: ${setId}. Returning empty object.`);
      return {};
    }

  } catch (error: unknown) { // Changed from any
    console.error('Unexpected error in getSetProgress:', getErrorMessage(error)); // Use helper
    return {}; // Return empty object on error
  }
}

// REFACTOR: Upsert progress into Supabase
export async function saveSetProgress(userId: string, setId: string, progress: SetProgress): Promise<boolean> {
  if (!userId || !setId) {
    console.error("saveSetProgress called without userId or setId.");
    return false;
  }
  if (progress === undefined || progress === null) { 
    console.error("saveSetProgress called with invalid progress data.");
    return false;
  }

  console.log(`Saving/Updating UserSetProgress to Supabase for userId: ${userId}, setId: ${setId}`);

  // Generate an ID, needed primarily for potential INSERT during upsert
  const progressRecordId = uuidv4(); 

  const recordToUpsert = {
    id: progressRecordId, // Add the generated ID
    userId: userId,
    setId: setId,
    progressData: progress as Prisma.InputJsonValue, 
    lastAccessedAt: new Date().toISOString()
  };

  try {
    // Upsert: Inserts if combo (userId, setId) doesn't exist, updates if it does
    await prisma.userSetProgress.upsert({
      where: {
        userId_setId: {
          userId: userId,
          setId: setId,
        },
      },
      update: {
        progressData: recordToUpsert.progressData,
        lastAccessedAt: recordToUpsert.lastAccessedAt,
      },
      create: {
        id: recordToUpsert.id,
        userId: recordToUpsert.userId,
        setId: recordToUpsert.setId,
        progressData: recordToUpsert.progressData,
        lastAccessedAt: recordToUpsert.lastAccessedAt,
      },
    });
      
    console.log(`Successfully saved UserSetProgress for userId: ${userId}, setId: ${setId}`);
    return true;

  } catch (error) {
    console.error('Unexpected error in saveSetProgress:', error);
    return false;
  }
}

// REFACTOR: Delete progress from Supabase
export async function deleteSetProgress(userId: string, setId: string): Promise<boolean> {
  if (!userId || !setId) {
    console.error("deleteSetProgress called without userId or setId.");
    return false;
  }
  console.log(`Deleting UserSetProgress from Supabase for userId: ${userId}, setId: ${setId}`);
  try {
    await prisma.userSetProgress.delete({
      where: {
        userId_setId: {
          userId: userId,
          setId: setId,
        },
      },
    });

    console.log(`Successfully deleted UserSetProgress for userId: ${userId}, setId: ${setId}`);
    return true;

  } catch (error) {
    console.error('Unexpected error in deleteSetProgress:', error);
    return false;
  }
}

// --- Utility ---

export function generateUUID(): string {
  return uuidv4();
}

// --- Cleanup ---
// Removed old localStorage helpers and related function declarations.

// --- Gallery (PublishedSet) Functions ---

// Publish a set to the gallery
export async function publishSetToGallery(publishedSet: {
  title: string;
  description?: string;
  imageUrl?: string;
  cardCount: number;
  author: string;
  llmBrand?: string;
  llmModel?: string;
  seriousnessLevel?: number;
  specificTopics?: string;
  phrases: Phrase[];
}) {
  const createdPublishedSet = await prisma.publishedSet.create({
    data: {
      title: publishedSet.title,
      description: publishedSet.description,
      imageUrl: publishedSet.imageUrl,
      cardCount: publishedSet.cardCount,
      author: publishedSet.author,
      llmBrand: publishedSet.llmBrand,
      llmModel: publishedSet.llmModel,
      seriousnessLevel: publishedSet.seriousnessLevel,
      specificTopics: publishedSet.specificTopics,
      phrases: publishedSet.phrases as unknown as Prisma.InputJsonValue,
      publishedAt: new Date().toISOString(),
    }
  });
  return createdPublishedSet;
}

// Fetch all published sets (metadata only)
export async function getAllPublishedSets() {
  const publishedSets = await prisma.publishedSet.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      cardCount: true,
      author: true,
      llmBrand: true,
      llmModel: true,
      seriousnessLevel: true,
      proficiencyLevel: true,
      ridiculousness: true,
      specificTopics: true,
      publishedAt: true,
    },
  });
  return publishedSets || [];
}

// Fetch a single published set by ID (full data)
export async function getPublishedSetById(id: string) {
  const publishedSet = await prisma.publishedSet.findUnique({
    where: {
      id: id,
    },
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      cardCount: true,
      author: true,
      llmBrand: true,
      llmModel: true,
      seriousnessLevel: true,
      specificTopics: true,
      publishedAt: true,
      phrases: true,
    },
  });
  return publishedSet;
}

// Delete a published set from the gallery
export async function deletePublishedSet(id: string): Promise<boolean> {
  if (!id) {
    console.error('deletePublishedSet called without id.');
    return false;
  }
  try {
    await prisma.publishedSet.delete({
      where: { id },
    });
    console.log(`Successfully deleted published set with id: ${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting published set:', error);
    return false;
  }
}
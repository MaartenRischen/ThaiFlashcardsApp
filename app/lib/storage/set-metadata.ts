import { prisma } from '@/app/lib/prisma';
import { FlashcardSet } from '@prisma/client';
import { SetMetaData } from './types';
import { mapDatabaseToStorage } from './utils';
import { deleteImage } from '../imageStorage';

// --- Set MetaData Management ---

// Fetches all sets metadata from database
export async function getAllSetMetaData(userId: string): Promise<SetMetaData[]> {
  if (!userId) {
    console.error("getAllSetMetaData called without userId.");
    return [];
  }
  
  console.log(`Fetching SetMetaData from Supabase for userId: ${userId}`);
  
  try {
    const prismaSets = await prisma.flashcardSet.findMany({
      where: {
        userId: userId,
      },
      include: {
        _count: {
          select: { phrases: true }
        },
        folder: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log('Successfully fetched SetMetaData:', prismaSets);
    const sets = prismaSets || [];

    return sets.map(dbSet => mapDatabaseToStorage(dbSet));

  } catch (error) {
    console.error('Unexpected error in getAllSetMetaData:', error);
    return []; 
  }
}

// Insert new set metadata into database
export async function addSetMetaData(
  userId: string, 
  newSetData: Omit<SetMetaData, 'id' | 'createdAt' | 'phraseCount' | 'isFullyLearned'>
): Promise<FlashcardSet | null> {
  if (!userId || !newSetData) {
    console.error("addSetMetaData called without userId or newSetData.");
    return null;
  }

  const dataToInsert = {
    userId: userId,
    name: newSetData.name,
    cleverTitle: newSetData.cleverTitle || null,
    level: newSetData.level || null,
    goals: newSetData.goals || [],
    specificTopics: newSetData.specificTopics || null,
    source: newSetData.source,
    imageUrl: newSetData.imageUrl || null,
    seriousnessLevel: newSetData.seriousnessLevel || null,
    toneLevel: null, // Not saved to DB
    llmBrand: newSetData.llmBrand || null,
    llmModel: newSetData.llmModel || null,
    shareId: null,
    folderId: newSetData.folderId || null,
  } as const;

  console.log(`Inserting SetMetaData into DB via Prisma for userId: ${userId}`, dataToInsert);

  try {
    const createdSet = await prisma.flashcardSet.create({
      data: dataToInsert,
    });

    console.log('Successfully inserted SetMetaData via Prisma:', createdSet);
    return createdSet;

  } catch (error) {
    console.error('Error inserting SetMetaData via Prisma:', error);
    return null; 
  }
}

// Update existing set metadata
export async function updateSetMetaData(updatedSet: SetMetaData): Promise<boolean> {
  if (!updatedSet || !updatedSet.id) {
    console.error("updateSetMetaData called without valid updatedSet data or ID.");
    return false;
  }

  const recordToUpdate: Partial<Omit<FlashcardSet, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'phraseCount'> & { updatedAt: string }> = {
    name: updatedSet.name,
    cleverTitle: updatedSet.cleverTitle || null,
    level: updatedSet.level || null,
    goals: updatedSet.goals || [],
    specificTopics: updatedSet.specificTopics || null,
    source: updatedSet.source,
    imageUrl: updatedSet.imageUrl || null,
    seriousnessLevel: updatedSet.seriousnessLevel || null,
    toneLevel: null, // Not saved to DB
    llmBrand: updatedSet.llmBrand || null,
    llmModel: updatedSet.llmModel || null,
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

// Delete set metadata and all related data
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
import { prisma } from '@/app/lib/prisma';
import { Prisma } from '@prisma/client';
import { SetProgress } from './types';
import { generateUUID, getErrorMessage } from './utils';

// --- Set Progress Management ---

// Fetch progress for a specific user and set
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

  } catch (error: unknown) {
    console.error('Unexpected error in getSetProgress:', getErrorMessage(error));
    return {};
  }
}

// Save or update progress for a specific user and set
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

  // Generate an ID for potential INSERT during upsert
  const progressRecordId = generateUUID(); 

  const recordToUpsert = {
    id: progressRecordId,
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

// Delete progress for a specific user and set
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
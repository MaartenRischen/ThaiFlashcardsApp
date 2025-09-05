import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server'; // Use Clerk server auth
import * as storage from '@/app/lib/storage';
import { SetMetaData } from '@/app/lib/storage'; // Keep if needed by SetMetaData type def
import { Phrase } from '@/app/lib/set-generator';
import { prisma } from "@/app/lib/prisma";
import { getToneLabel } from '@/app/lib/utils'; // Import getToneLabel
import { getTargetFolderForNewSet } from '@/app/lib/storage/folders';

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return 'Unknown error';
}

// Interface definition for the request body
interface AddSetRequestBody {
  setData: Omit<SetMetaData, 'id' | 'createdAt' | 'phraseCount' | 'isFullyLearned'>;
  phrases: Phrase[];
}

// GET handler for fetching all set metadata for the logged-in user
export async function GET(request: Request) {
  console.log("API Route: /api/flashcard-sets GET request received");
  const { userId } = await auth();

  if (!userId) {
    console.error("API Route /api/flashcard-sets GET: Unauthorized - No Clerk user ID.");
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log(`API Route /api/flashcard-sets GET: Fetching sets for user: ${userId}`);
    
    // Check if this is a preload request (skip slow operations)
    const url = new URL(request.url);
    const skipEnsureDefaults = url.searchParams.get('skipEnsureDefaults') === 'true';
    
    if (!skipEnsureDefaults) {
      // Only ensure default sets for regular requests, not preload
      const { ensureUserHasAllDefaultSets } = await import('@/app/lib/ensure-default-sets');
      await ensureUserHasAllDefaultSets(userId);
    }
    
    const sets = await storage.getAllSetMetaData(userId);
    console.log(`API Route /api/flashcard-sets GET: Found ${sets.length} sets.`);
    return NextResponse.json({ sets: sets || [] }, { status: 200 });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error("API Route /api/flashcard-sets GET: Error fetching sets:", error);
    return NextResponse.json({ error: 'Failed to fetch sets', details: message }, { status: 500 });
  }
}

// POST handler for creating new sets
export async function POST(_request: Request) {
  console.log("API Route: /api/flashcard-sets POST request received");
  const { userId } = await auth(); // Use Clerk auth

  if (!userId) {
    console.error("API Route /api/flashcard-sets POST: Unauthorized - No Clerk user ID.");
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ensure user exists in your DB
  try {
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId },
    });
    console.log(`API Route /api/flashcard-sets POST: Ensured user exists: ${userId}`);
  } catch (userError) {
    console.error(`API Route /api/flashcard-sets POST: Failed to ensure user ${userId} exists:`, userError);
    return NextResponse.json({ error: 'Failed to process user data' }, { status: 500 });
  }

  let requestBody: AddSetRequestBody;
  try {
    requestBody = await _request.json();
    console.log("API Route /api/flashcard-sets POST: Actual parsed body content:", JSON.stringify(requestBody, null, 2));
  } catch (e) {
    console.error("API Route /api/flashcard-sets POST: Invalid request body:", e);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { setData, phrases } = requestBody;

  if (!setData || !phrases) {
    console.error("API Route /api/flashcard-sets POST: Missing setData or phrases after destructuring.");
    return NextResponse.json({ error: 'Missing setData or phrases' }, { status: 400 });
  }

  let newMetaId: string | null = null;
  try {
    // Prepare metadata (handle default image if needed)
    let finalImageUrl: string | null = setData.imageUrl || null;
     if (!finalImageUrl && setData.source === 'default') {
        finalImageUrl = '/images/defaultnew.png'; // Define your default image path
     }
     
     // Determine the target folder based on source
     let folderId: string | null = null;
     if (setData.source === 'import' || setData.source === 'gallery_import') {
       folderId = await getTargetFolderForNewSet(userId, 'import');
     } else if (setData.source === 'manual') {
       folderId = await getTargetFolderForNewSet(userId, 'manual');
     } else if (setData.source === 'generated' || setData.source === 'auto') {
       folderId = await getTargetFolderForNewSet(userId, 'auto');
     }
     
     const metaDataForStorage = {
       ...setData,
       imageUrl: finalImageUrl || undefined,
       folderId: folderId || undefined
     };

    // 1. Add metadata
    const insertedRecord = await storage.addSetMetaData(userId, metaDataForStorage);
    if (!insertedRecord) throw new Error("Failed to save metadata.");
    newMetaId = insertedRecord.id;
    console.log(`API Route /api/flashcard-sets POST: Metadata saved with ID: ${newMetaId}`);

    // 2. Save content
    const contentSaved = await storage.saveSetContentDirect(newMetaId, phrases);
    if (!contentSaved) throw new Error("Failed to save content.");
    console.log(`API Route /api/flashcard-sets POST: Content saved for set ID: ${newMetaId}`);

    // 3. Save progress
    const progressSaved = await storage.saveSetProgress(userId, newMetaId, {});
    if (!progressSaved) throw new Error("Failed to save progress.");
    console.log(`API Route /api/flashcard-sets POST: Initial progress saved for set ID: ${newMetaId}`);

    // Construct the complete metadata object to return
    const completeNewMetaData: SetMetaData = {
       id: insertedRecord.id,
       name: insertedRecord.name,
       cleverTitle: insertedRecord.cleverTitle || undefined,
       createdAt: insertedRecord.createdAt.toISOString(),
       level: insertedRecord.level as SetMetaData['level'] || undefined,
       goals: insertedRecord.goals || [],
       specificTopics: insertedRecord.specificTopics || undefined,
       source: insertedRecord.source as SetMetaData['source'] || 'generated',
       imageUrl: insertedRecord.imageUrl || undefined,
       phraseCount: phrases.length,
       isFullyLearned: false, // Default for new sets
       llmBrand: insertedRecord.llmBrand || undefined,
       llmModel: insertedRecord.llmModel || undefined,
       seriousnessLevel: insertedRecord.seriousnessLevel, // Add seriousnessLevel
       toneLevel: insertedRecord.seriousnessLevel !== null ? getToneLabel(insertedRecord.seriousnessLevel) : null // Add derived toneLevel
    };

    console.log(`API Route /api/flashcard-sets POST: Successfully created set ${newMetaId}.`);
    // Return the complete metadata so the frontend context can use it directly
    return NextResponse.json({ newSetMetaData: completeNewMetaData }, { status: 201 });

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error("API Route /api/flashcard-sets POST: Error creating set:", error);
    // Attempt cleanup if partially created
    if (newMetaId) {
      console.error(`API Route /api/flashcard-sets POST: Attempting cleanup for failed set creation ${newMetaId}`);
      // Simplified cleanup
      await storage.deleteSetMetaData(newMetaId).catch(cleanupError => {
          console.error(`API Route /api/flashcard-sets POST: Cleanup failed for ${newMetaId}:`, cleanupError);
      });
    }
    return NextResponse.json({ error: `Set creation failed: ${message}` }, { status: 500 });
  }
}

// Placeholder for GET handler (implement if needed)
// export async function GET(request: Request) {
//   // ... logic to get sets ...
// }

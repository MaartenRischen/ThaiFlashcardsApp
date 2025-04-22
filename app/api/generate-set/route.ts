import { NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth'; // Corrected import path
import { 
  generateCustomSet, 
  Phrase, 
  GeneratePromptOptions,
  GenerationResult
} from '@/app/lib/set-generator'; 
import { generateImage } from '@/app/lib/ideogram-service'; 
import * as storage from '@/app/lib/storage';
import { SetMetaData } from '@/app/lib/storage';
import { INITIAL_PHRASES } from '@/app/data/phrases'; // For fallback

// Define expected request body structure
interface GenerateSetRequestBody {
  preferences: Omit<GeneratePromptOptions, 'count' | 'existingPhrases'>;
  totalCount: number;
}

export async function POST(request: Request) {
  console.log("API Route: /api/generate-set received POST request");
  
  const session = await auth(); // Get session server-side
  const userId = session?.user?.id;

  if (!userId) {
    console.error("API Route: Unauthorized access - No user ID found.");
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let requestBody: GenerateSetRequestBody;
  try {
    requestBody = await request.json();
    console.log("API Route: Parsed request body:", requestBody);
  } catch (e) {
    console.error("API Route: Invalid request body:", e);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { preferences, totalCount } = requestBody;

  if (!preferences || typeof totalCount !== 'number' || totalCount <= 0) {
     console.error("API Route: Missing or invalid preferences/totalCount in request body.");
     return NextResponse.json({ error: 'Missing preferences or invalid totalCount' }, { status: 400 });
  }

  console.log(`API Route: Starting generation for userId: ${userId}`);
  let generationResult: GenerationResult | null = null;
  try {
    // --- 1. Generate Phrases ---
    generationResult = await generateCustomSet(preferences, totalCount);
    console.log("API Route: generateCustomSet result:", generationResult);

    let phrasesToSave: Phrase[] = generationResult.phrases;
    let setImageUrl: string | null = null;
    let isFallback = false;

    // --- 2. Handle Fallback ---
    if (generationResult.errorSummary || !generationResult.phrases.length) {
      console.warn('API Route: Generation failed or returned no phrases. Using fallback.');
      phrasesToSave = INITIAL_PHRASES.slice(0, totalCount).map(p => ({
        english: p.english,
        thai: p.thai,
        thaiMasculine: p.thaiMasculine || '',
        thaiFeminine: p.thaiFeminine || '',
        pronunciation: p.pronunciation,
        mnemonic: p.mnemonic,
        examples: p.examples?.map(ex => ({
          thai: ex.thai,
          thaiMasculine: ex.thaiMasculine || '',
          thaiFeminine: ex.thaiFeminine || '',
          pronunciation: ex.pronunciation,
          translation: ex.translation,
        })) || undefined,
      }));
      isFallback = true;
    }

    // --- 3. Generate Set Image (if not fallback) ---
    // TODO: Move SKIP_IMAGE_GEN check here if needed, maybe via env var? For now, assume generation if not fallback.
    if (!isFallback) { 
      try {
        const imagePrompt = generationResult.cleverTitle || 'A creative cover for a Thai language flashcard set';
        console.log(`API Route: Generating set cover image with prompt:`, imagePrompt);
        setImageUrl = await generateImage(imagePrompt);
        console.log(`API Route: Set cover image URL:`, setImageUrl);
      } catch (imgErr) {
        console.error('API Route: Error during set image generation:', imgErr);
        // Don't fail the whole request, just proceed without an image
        setImageUrl = null; 
      }
    } else {
       console.log(`API Route: SKIPPING image generation (Fallback mode)`);
       setImageUrl = null;
    }

    // --- 4. Prepare Metadata for Storage ---
    const metaDataForStorage: Omit<SetMetaData, 'id' | 'createdAt' | 'phraseCount' | 'isFullyLearned'> = {
      name: generationResult.cleverTitle || (isFallback ? 'Placeholder Set' : 'Custom Set'),
      cleverTitle: generationResult.cleverTitle,
      level: preferences.level,
      specificTopics: preferences.specificTopics,
      source: isFallback ? 'generated' : 'generated',
      imageUrl: setImageUrl || undefined,
      // Note: llmBrand/llmModel might need to be passed from generationResult if available
    };
    console.log("API Route: Prepared metaDataForStorage:", metaDataForStorage);


    // --- 5. Save to Database ---
    let newMetaId: string | null = null;
    const insertedRecord = await storage.addSetMetaData(userId, metaDataForStorage);
    if (!insertedRecord) {
      throw new Error("Failed to save set metadata to database.");
    }
    newMetaId = insertedRecord.id;
    console.log(`API Route: Metadata saved with ID: ${newMetaId}`);

    const contentSaved = await storage.saveSetContent(newMetaId, phrasesToSave);
    if (!contentSaved) {
      await storage.deleteSetMetaData(newMetaId); // Attempt cleanup
      throw new Error("Failed to save set content to database.");
    }
    console.log(`API Route: Content saved for set ID: ${newMetaId}`);

    const progressSaved = await storage.saveSetProgress(userId, newMetaId, {});
    if (!progressSaved) {
      await storage.deleteSetContent(newMetaId); // Attempt cleanup
      await storage.deleteSetMetaData(newMetaId); // Attempt cleanup
      throw new Error("Failed to save initial set progress.");
    }
    console.log(`API Route: Initial progress saved for set ID: ${newMetaId}`);

    // --- 6. Return Success Response ---
    console.log(`API Route: Successfully created set ${newMetaId}. Returning ID.`);
    return NextResponse.json({ newSetId: newMetaId }, { status: 201 });

  } catch (error: any) {
    console.error("API Route: Error during set creation process:", error);
    // Attempt cleanup if metadata ID was assigned before error
    if (generationResult && (generationResult as any).newMetaIdOnError) { // Hypothetical check
        await storage.deleteSetMetaData((generationResult as any).newMetaIdOnError);
    }
    return NextResponse.json({ error: `Set generation failed: ${error.message}` }, { status: 500 });
  }
} 
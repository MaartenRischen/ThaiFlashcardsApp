import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server'; // Use Clerk authentication correctly
import { 
  generateCustomSet, 
  GeneratePromptOptions,
  GenerationResult,
  Phrase as GeneratorPhrase // Import the correct Phrase type
} from '@/app/lib/set-generator'; 
import * as storage from '@/app/lib/storage';
import { SetMetaData } from '@/app/lib/storage'; // Import SetMetaData
import { generateImage } from '@/app/lib/ideogram-service';
import { INITIAL_PHRASES } from '@/app/data/phrases'; // Import INITIAL_PHRASES only
import { prisma } from "@/app/lib/prisma"; // Import prisma client

// Debug environment variables - this will help diagnose Railway issues
console.log('API Route Environment Variables:');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'Defined' : 'Undefined');
console.log('- OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 'Defined' : 'Undefined');
console.log('- IDEOGRAM_API_KEY:', process.env.IDEOGRAM_API_KEY ? 'Defined' : 'Undefined');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);

console.log('DEBUG: DATABASE_URL in generate-set route:', process.env.DATABASE_URL);

// Define expected request body structure (can be shared or redefined here)
interface GenerateSetRequestBody {
  preferences: Omit<GeneratePromptOptions, 'count' | 'existingPhrases'>;
  totalCount: number;
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return 'Set generation failed.';
}

export async function POST(request: Request) {
  console.log("API Route: /api/generate-set received POST request");
  
  let newMetaId: string | null = null; 
  
  try {
    // Add detailed auth debugging
    console.log("API Route: Attempting to get auth session...");
    const authResult = await auth();
    console.log("API Route: Auth result:", JSON.stringify(authResult, null, 2));
    
    const { userId } = authResult;

    if (!userId) {
      console.error("API Route: Unauthorized access - No user ID found in auth result.");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`API Route: Successfully authenticated user with ID: ${userId}`);

    // --- Check/Create User in DB ---
    try {
      await prisma.user.upsert({
        where: { id: userId },
        update: {}, // No fields to update if user exists
        create: { 
          id: userId, 
          // Add other default fields for your User model if necessary
        },
      });
      console.log(`Ensured user exists in DB: ${userId}`);
    } catch (userError) {
      console.error(`API Route: Failed to ensure user ${userId} exists in DB:`, userError);
      return NextResponse.json({ error: 'Failed to process user data' }, { status: 500 });
    }
    // --- End User Check/Create ---

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

      // Explicitly type phrasesToSave as the stricter GeneratorPhrase[]
      let phrasesToSave: GeneratorPhrase[] = generationResult.phrases; 
      let setImageUrl: string | null = null;
      let isFallback = false;

      // --- 2. Handle Fallback ---
      if (generationResult.errorSummary || !generationResult.phrases.length) {
        console.warn('API Route: Generation failed or returned no phrases. Using fallback.');
        // Map INITIAL_PHRASES to GeneratorPhrase structure
        phrasesToSave = INITIAL_PHRASES.slice(0, totalCount).map(p => ({
          english: p.english,
          thai: p.thai,
          thaiMasculine: p.thaiMasculine || '', // Ensure string
          thaiFeminine: p.thaiFeminine || '',   // Ensure string
          pronunciation: p.pronunciation,
          mnemonic: p.mnemonic,
          examples: p.examples?.map(ex => ({
            thai: ex.thai,
            thaiMasculine: ex.thaiMasculine || '', // Ensure string
            thaiFeminine: ex.thaiFeminine || '',   // Ensure string
            pronunciation: ex.pronunciation,
            translation: ex.translation,
          })) || undefined,
        })); // No need to cast here as we mapped directly to the target structure
        isFallback = true;
      }

      // --- 3. Generate Set Image (if not fallback) ---
      if (!isFallback) { 
        try {
          const topicDescription = generationResult.cleverTitle || 'language learning'; // Use cleverTitle or a fallback
          const imagePrompt = `Cartoon style illustration featuring a friendly donkey and a bridge, related to the topic: ${topicDescription}. 
            Use vibrant colors that are friendly and engaging.`;
          
          console.log(`API Route: Generating set cover image with prompt:`, imagePrompt);
          setImageUrl = await generateImage(imagePrompt);
          console.log(`API Route: Set cover image URL:`, setImageUrl);
        } catch (imgErr) {
          console.error('API Route: Error during set image generation:', imgErr);
          // Try once more with a simpler prompt if the first attempt failed
          try {
            const fallbackPrompt = `Simple cartoon illustration of a donkey and a bridge`;
            console.log(`API Route: Trying fallback image generation with prompt:`, fallbackPrompt);
            setImageUrl = await generateImage(fallbackPrompt);
          } catch (retryErr) {
            console.error('API Route: Fallback image generation also failed:', retryErr);
            setImageUrl = null;
          }
        }
      } else {
         console.log(`API Route: SKIPPING image generation (Fallback: ${isFallback})`);
         setImageUrl = null;
      }

      // --- 4. Prepare Metadata for Storage ---
      const metaDataForStorage: Omit<SetMetaData, 'id' | 'createdAt' | 'phraseCount' | 'isFullyLearned'> = {
        name: generationResult.cleverTitle || (isFallback ? 'Placeholder Set' : 'Custom Set'),
        cleverTitle: generationResult.cleverTitle,
        level: preferences.level,
        specificTopics: preferences.specificTopics,
        source: isFallback ? 'generated' : 'generated', // Keep source as generated even for fallback
        imageUrl: setImageUrl || undefined,
        llmBrand: generationResult.llmBrand || undefined, 
        llmModel: generationResult.llmModel || undefined, 
      };
      console.log("API Route: Prepared metaDataForStorage:", metaDataForStorage);

      // --- 5. Save to Database ---
      const insertedRecord = await storage.addSetMetaData(userId, metaDataForStorage);
      if (!insertedRecord) {
        throw new Error("Failed to save set metadata to database.");
      }
      newMetaId = insertedRecord.id; // Assign to pre-declared variable
      console.log(`API Route: Metadata saved with ID: ${newMetaId}`);

      const contentSaved = await storage.saveSetContent(newMetaId, phrasesToSave); 
      if (!contentSaved) {
        await storage.deleteSetMetaData(newMetaId);
        throw new Error("Failed to save set content to database.");
      }
      console.log(`API Route: Content saved for set ID: ${newMetaId}`);

      const progressSaved = await storage.saveSetProgress(userId, newMetaId, {});
      if (!progressSaved) {
        await storage.deleteSetContent(newMetaId);
        await storage.deleteSetMetaData(newMetaId);
        throw new Error("Failed to save initial set progress.");
      }
      console.log(`API Route: Initial progress saved for set ID: ${newMetaId}`);

      // --- 6. Return Success Response ---
      const completeNewMetaData: SetMetaData = {
        id: insertedRecord.id,
        name: insertedRecord.name,
        cleverTitle: insertedRecord.cleverTitle || undefined,
        createdAt: insertedRecord.createdAt.toISOString(),
        phraseCount: phrasesToSave.length,
        level: insertedRecord.level as SetMetaData['level'] || undefined,
        goals: insertedRecord.goals || [],
        specificTopics: insertedRecord.specificTopics || undefined,
        source: insertedRecord.source as SetMetaData['source'] || 'generated',
        imageUrl: insertedRecord.imageUrl || undefined,
        isFullyLearned: false,
        seriousnessLevel: insertedRecord.seriousnessLevel || undefined,
        llmBrand: insertedRecord.llmBrand || undefined,
        llmModel: insertedRecord.llmModel || undefined
      };
      console.log(`API Route: Successfully created set ${newMetaId}. Returning metadata.`);
      return NextResponse.json({ newSetMetaData: completeNewMetaData }, { status: 201 });

    } catch (error: unknown) {
      console.error("API Route: Error during set creation process:", error);
      if (typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
        if ((error as { message: string }).message.includes("save set content") || (error as { message: string }).message.includes("save initial set progress")) {
          if(newMetaId) {
              console.log(`API Route: Cleaning up metadata ${newMetaId} due to content/progress save error.`);
              await storage.deleteSetMetaData(newMetaId); 
          }
        } else if ((error as { message: string }).message.includes("save set metadata")) {
            console.log("API Route: Metadata save failed, no cleanup needed.");
        }
      }
      return NextResponse.json({ error: `Set generation failed: ${getErrorMessage(error)}` }, { status: 500 });
    }
  } catch (authError) {
    console.error("API Route: Authentication error:", authError);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
} 
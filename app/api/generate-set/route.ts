import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { 
  generateCustomSet, 
  GeneratePromptOptions,
  GenerationResult,
  Phrase as GeneratorPhrase,
  TEXT_MODELS
} from '@/app/lib/set-generator'; 
import * as storage from '@/app/lib/storage';
import { SetMetaData } from '@/app/lib/storage';
import { INITIAL_PHRASES } from '@/app/data/phrases';
// import { generateImage } from '@/app/lib/ideogram-service'; // Removed unused import
// import { prisma } from "@/app/lib/prisma"; // Removed unused import
// import { uploadImageFromUrl } from '../../lib/imageStorage'; // Removed unused import
import { Prisma } from '@prisma/client'; // Import Prisma client types

// Debug environment variables - this will help diagnose Railway issues
console.log('API Route Environment Variables:');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'Defined' : 'Undefined');
console.log('- OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 'Defined' : 'Undefined');
console.log('- IDEOGRAM_API_KEY:', process.env.IDEOGRAM_API_KEY ? 'Defined' : 'Undefined');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);

console.log('DEBUG: DATABASE_URL in generate-set route:', process.env.DATABASE_URL);
// Add more detailed debug logging for Ideogram key
console.log('DEBUG: IDEOGRAM_API_KEY first 10 chars:', process.env.IDEOGRAM_API_KEY ? process.env.IDEOGRAM_API_KEY.substring(0, 10) + '...' : 'undefined');

// Define only the types we actually use
interface RequestBody {
  preferences: Omit<GeneratePromptOptions, 'count' | 'existingPhrases'>;
  totalCount: number;
  isTestRequest?: boolean;
  forcedModel?: string;
}

// Placeholder Thailand images (use existing project images)
const PLACEHOLDER_IMAGES = [
  '/images/defaults-backup/default-thailand-01.png',
  '/images/defaults-backup/default-thailand-02.png',
  '/images/defaults-backup/default-thailand-03.png',
  '/images/defaults-backup/default-thailand-04.png',
  '/images/defaults-backup/default-thailand-05.png',
  '/images/defaults-backup/default-thailand-06.png',
  '/images/defaults-backup/default-thailand-07.png',
  '/images/defaults-backup/default-thailand-08.png',
  '/images/defaults-backup/default-thailand-09.png',
  '/images/defaults-backup/default-thailand-10.png',
  '/images/defaults-backup/default-thailand-11.png',
  '/images/defaults-backup/default-thailand-12.png',
];

function getRandomPlaceholderImage(): string {
  return PLACEHOLDER_IMAGES[Math.floor(Math.random() * PLACEHOLDER_IMAGES.length)];
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return 'Set generation failed.';
}

export async function POST(request: Request) {
  console.log("API Route: /api/generate-set received POST request");
  
  let newMetaId = ''; // Track the ID for potential cleanup
  let userId: string | null = null; // Track userId

  try {
    console.log("API Route: Checking authentication...");
    const authResult = await auth();
    if (!authResult || !authResult.userId) {
      console.error("API Route: Authentication failed or userId missing.");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    userId = authResult.userId;
    console.log(`API Route: Authentication successful for userId: ${userId}`);

    const body = await request.json();
    const { preferences, totalCount, isTestRequest, forcedModel } = body;

    if (!preferences || !totalCount) {
      console.error("API Route: Missing required parameters (preferences or totalCount).");
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    console.log(`API Route: Starting generation process for userId: ${userId}, count: ${totalCount}, isTest: ${isTestRequest}`);
    let generationResult: GenerationResult | null = null;
    const startTime = Date.now();
    try {
      // If forcedModel is provided, temporarily override TEXT_MODELS
      const originalModels = [...TEXT_MODELS];
      if (forcedModel && typeof forcedModel === 'string') {
        TEXT_MODELS.splice(0, TEXT_MODELS.length, forcedModel);
      }

      generationResult = await generateCustomSet(
        preferences,
        totalCount,
        isTestRequest ? undefined : (progress) => {
          // Optional progress tracking for non-test requests
          console.log(`Generation progress: ${progress.completed}/${progress.total}`);
        }
      );

      // Restore original models if we modified them
      if (forcedModel) {
        TEXT_MODELS.splice(0, TEXT_MODELS.length, ...originalModels);
      }

      const endTime = Date.now();
      const generationTime = endTime - startTime;

      console.log("API Route: generateCustomSet result:", generationResult);
      
      if (!generationResult.phrases || generationResult.phrases.length === 0) {
        throw new Error("No phrases generated");
      }

      // Explicitly type phrasesToSave as the stricter GeneratorPhrase[]
      let phrasesToSave: GeneratorPhrase[] = generationResult.phrases; 
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

      // --- 4. Prepare Metadata for Storage ---
      let toneLevel: number | undefined;
      try {
        toneLevel = preferences.toneLevel;
      } catch {
        toneLevel = 5;
      }
      
      let levelToStore: SetMetaData['level'] | undefined = undefined;
      if (preferences.level) {
        const levelLower = preferences.level.toLowerCase();
        if (levelLower.includes('beginner') && levelLower.includes('complete')) {
          levelToStore = 'complete beginner';
        } else if (levelLower.includes('basic') || levelLower.includes('understanding')) {
          levelToStore = 'basic understanding';
        } else if (levelLower.includes('intermediate')) {
          levelToStore = 'intermediate';
        } else if (levelLower.includes('advanced')) {
          levelToStore = 'advanced';
        } else if (levelLower.includes('native') || levelLower.includes('fluent')) {
          levelToStore = 'native/fluent';
        } else if (levelLower.includes('god')) {
          levelToStore = 'god mode';
        }
      }

      const metaDataForStorage: Omit<SetMetaData, 'id' | 'createdAt' | 'phraseCount' | 'isFullyLearned'> = {
        name: generationResult.cleverTitle || (isFallback ? 'Placeholder Set' : 'Custom Set'),
        cleverTitle: generationResult.cleverTitle,
        level: levelToStore,
        specificTopics: preferences.specificTopics,
        source: 'generated',
        imageUrl: undefined,
        seriousnessLevel: toneLevel,
        toneLevel: toneLevel,
        llmBrand: generationResult.llmBrand || undefined,
        llmModel: generationResult.llmModel || undefined,
      };

      // --- 5. Save to Database ---
      console.log(`API Route: Attempting to save metadata for userId: ${userId}`);
      const insertedRecord = await storage.addSetMetaData(userId, metaDataForStorage);
      if (!insertedRecord) {
        console.error(`API Route: Failed to save metadata for userId: ${userId}. Metadata:`, metaDataForStorage);
        throw new Error("Failed to save set metadata to database.");
      }
      newMetaId = insertedRecord.id;
      console.log(`API Route: Successfully saved metadata for userId: ${userId}, newMetaId: ${newMetaId}`);

      // --- 6. Handle Image Storage ---
      let setImageUrl: string | null = null;
      
      // Skip image generation for test requests
      if (!isTestRequest) {
        setImageUrl = generationResult.imageUrl || null;
        if (!setImageUrl) {
          try {
            const placeholderImageUrl = getRandomPlaceholderImage();
            setImageUrl = placeholderImageUrl;
            
            await storage.updateSetMetaData({
              ...metaDataForStorage,
              id: newMetaId,
              createdAt: insertedRecord.createdAt.toISOString(),
              phraseCount: phrasesToSave.length,
              imageUrl: placeholderImageUrl
            });
          } catch (err) {
            console.error('Failed to update metadata with placeholder URL:', err);
          }
        }
      }

      // --- 7. Save Content and Progress ---
      console.log(`API Route: Attempting to save content for newMetaId: ${newMetaId}`);
      const contentSaved = await storage.saveSetContent(newMetaId, phrasesToSave);
      if (!contentSaved) {
        console.error(`API Route: Failed to save content for newMetaId: ${newMetaId}. Rolling back metadata.`);
        await storage.deleteSetMetaData(newMetaId); // Attempt cleanup
        throw new Error("Failed to save set content to database.");
      }
      console.log(`API Route: Successfully saved content for newMetaId: ${newMetaId}`);

      console.log(`API Route: Attempting to save progress for userId: ${userId}, newMetaId: ${newMetaId}`);
      const progressSaved = await storage.saveSetProgress(userId, newMetaId, {});
      if (!progressSaved) {
        console.error(`API Route: Failed to save progress for userId: ${userId}, newMetaId: ${newMetaId}. Rolling back content and metadata.`);
        await storage.deleteSetContent(newMetaId); // Attempt cleanup
        await storage.deleteSetMetaData(newMetaId); // Attempt cleanup
        throw new Error("Failed to save initial set progress.");
      }
      console.log(`API Route: Successfully saved progress for userId: ${userId}, newMetaId: ${newMetaId}`);

      // --- 8. Return Success Response ---
      const completeNewMetaData: SetMetaData = {
        id: newMetaId,
        name: metaDataForStorage.name,
        cleverTitle: metaDataForStorage.cleverTitle,
        createdAt: insertedRecord.createdAt.toISOString(),
        phraseCount: phrasesToSave.length,
        level: levelToStore,
        goals: [],
        specificTopics: metaDataForStorage.specificTopics,
        source: 'generated',
        imageUrl: setImageUrl || undefined,
        isFullyLearned: false,
        seriousnessLevel: toneLevel,
        toneLevel: toneLevel,
        llmBrand: metaDataForStorage.llmBrand,
        llmModel: metaDataForStorage.llmModel,
      };

      // Return the metadata AND the phrases separately, plus generation time, model, and temperature
      return NextResponse.json({ 
        newSetMetaData: completeNewMetaData,
        phrases: phrasesToSave,
        llmModel: generationResult.llmModel,
        temperature: generationResult.temperature,
        generationTime
      }, { status: 201 });

    } catch (error: unknown) {
      console.error("API Route: Error during set creation process:", error);
      if (typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
        if ((error as { message: string }).message.includes("save set content") || (error as { message: string }).message.includes("save initial set progress")) {
          if(newMetaId) {
              console.log(`API Route: Attempting cleanup for failed content/progress save - deleting metadata ${newMetaId}.`);
              try {
                  await storage.deleteSetMetaData(newMetaId); 
                  console.log(`API Route: Successfully cleaned up metadata ${newMetaId}.`);
              } catch (cleanupError) {
                  console.error(`API Route: Error during metadata cleanup for ${newMetaId}:`, cleanupError);
              }
          }
        } else if ((error as { message: string }).message.includes("save set metadata")) {
            console.log("API Route: Metadata save failed, no specific cleanup needed for this ID.");
        }
      }
      return NextResponse.json({ error: `Set generation failed: ${getErrorMessage(error)}` }, { status: 500 });
    }
  } catch (authError) {
    console.error("API Route: Outer catch - Authentication error:", authError);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
} 
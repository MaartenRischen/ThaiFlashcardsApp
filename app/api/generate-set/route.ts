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
import { uploadImageFromUrl } from '../../lib/imageStorage'; // Use relative path

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

// Define the expected lowercase level type (matches SetMetaData)
type ProficiencyLevelLowercase = 'complete beginner' | 'basic understanding' | 'intermediate' | 'advanced' | 'native/fluent' | 'god mode';

// Define expected request body structure (can be shared or redefined here)
interface GenerateSetRequestBody {
  preferences: Omit<GeneratePromptOptions, 'count' | 'existingPhrases'>;
  totalCount: number;
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

      // --- 4. Prepare Metadata for Storage ---
      // Map tone preference to seriousnessLevel (adjust mapping if needed)
      let seriousnessLevelValue: number | undefined;
      switch (preferences.tone) {
        case 'serious': seriousnessLevelValue = 1; break;
        case 'balanced': seriousnessLevelValue = 5; break;
        case 'absolutely ridiculous': seriousnessLevelValue = 10; break;
        default: seriousnessLevelValue = undefined; // Or a default like 5?
      }

      const metaDataForStorage: Omit<SetMetaData, 'id' | 'createdAt' | 'phraseCount' | 'isFullyLearned'> = {
        name: generationResult.cleverTitle || (isFallback ? 'Placeholder Set' : 'Custom Set'),
        cleverTitle: generationResult.cleverTitle,
        // Convert to lowercase and assert the specific type
        level: preferences.level.toLowerCase() as ProficiencyLevelLowercase,
        specificTopics: preferences.specificTopics,
        // Use 'generated' for source, even for fallbacks, as they originate from a generation attempt
        source: 'generated',
        imageUrl: undefined,
        seriousnessLevel: seriousnessLevelValue,
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

      // --- 6. Handle Image Storage ---
      let setImageUrl: string | null = generationResult.imageUrl || null;
      console.log('Image processing: Starting with imageUrl:', !!setImageUrl, 'Ideogram API Key:', !!process.env.IDEOGRAM_API_KEY);
      
      if (typeof setImageUrl === 'string') {
        // Upload the image to Supabase Storage
        console.log('Image processing: Using generationResult.imageUrl');
        try {
          const storedImageUrl = await uploadImageFromUrl(setImageUrl, newMetaId);
          console.log('Image processing: uploadImageFromUrl result:', !!storedImageUrl);
          
          if (storedImageUrl) {
            setImageUrl = storedImageUrl;
            console.log('API Route: Successfully stored image in Supabase:', storedImageUrl);
            
            // Update the metadata with the new image URL
            await storage.updateSetMetaData({
              ...metaDataForStorage,
              id: newMetaId,
              createdAt: insertedRecord.createdAt.toISOString(),
              phraseCount: phrasesToSave.length,
              imageUrl: storedImageUrl
            });
            console.log('Image processing: Metadata updated with image URL');
          }
        } catch (uploadError) {
          console.error('Error uploading existing image to Supabase:', uploadError);
          setImageUrl = null; // Reset so we try generating our own image
        }
      } 
      
      // If no image URL yet, generate one (for both regular and fallback paths)
      if (!setImageUrl) {
        try {
          console.log('Image processing: Generating our own image');
          const topicDescription = generationResult.cleverTitle || 'language learning';
          const imagePrompt = `Cartoon style illustration featuring a friendly donkey and a bridge, related to the topic: ${topicDescription}. Use vibrant colors that are friendly and engaging. IMPORTANT: Absolutely NO text, words, or letters should appear anywhere in the image.`;
          
          console.log(`API Route: Generating set cover image with prompt:`, imagePrompt);
          console.log('Image processing: About to call generateImage');
          
          const tempImageUrl = await generateImage(imagePrompt);
          console.log('Image generation result:', !!tempImageUrl, tempImageUrl ? tempImageUrl.substring(0, 30) + '...' : 'null');
          
          if (typeof tempImageUrl === 'string') {
            try {
              console.log('Image processing: Got image URL, uploading to Supabase');
              const storedImageUrl = await uploadImageFromUrl(tempImageUrl, newMetaId);
              console.log('Image processing: Upload result:', !!storedImageUrl);
              
              if (storedImageUrl) {
                setImageUrl = storedImageUrl;
                console.log('API Route: Successfully generated and stored image:', storedImageUrl);
                
                // Update the metadata with the new image URL
                const updateResult = await storage.updateSetMetaData({
                  ...metaDataForStorage,
                  id: newMetaId,
                  createdAt: insertedRecord.createdAt.toISOString(),
                  phraseCount: phrasesToSave.length,
                  imageUrl: storedImageUrl
                });
                console.log('Image processing: Metadata update result:', !!updateResult);
              } else {
                console.warn('API Route: Failed to upload generated image to storage');
                setImageUrl = tempImageUrl; // Fallback to temporary URL
                
                // Still try to update metadata with temporary URL
                await storage.updateSetMetaData({
                  ...metaDataForStorage,
                  id: newMetaId,
                  createdAt: insertedRecord.createdAt.toISOString(),
                  phraseCount: phrasesToSave.length,
                  imageUrl: tempImageUrl
                });
                console.log('Image processing: Updated metadata with temporary URL');
              }
            } catch (uploadError) {
              console.error('Error uploading generated image to Supabase:', uploadError);
              setImageUrl = tempImageUrl; // Fallback to temporary URL
              
              // Still try to update metadata with temporary URL
              try {
                await storage.updateSetMetaData({
                  ...metaDataForStorage,
                  id: newMetaId,
                  createdAt: insertedRecord.createdAt.toISOString(),
                  phraseCount: phrasesToSave.length,
                  imageUrl: tempImageUrl
                });
                console.log('Image processing: Updated metadata with temporary URL after upload error');
              } catch (err) {
                console.error('Failed to update metadata with temporary URL:', err);
              }
            }
          } else {
            console.warn('API Route: Generated image URL is null or invalid, using placeholder image');
            // Use placeholder image
            const placeholderImageUrl = getRandomPlaceholderImage();
            setImageUrl = placeholderImageUrl;
            
            try {
              await storage.updateSetMetaData({
                ...metaDataForStorage,
                id: newMetaId,
                createdAt: insertedRecord.createdAt.toISOString(),
                phraseCount: phrasesToSave.length,
                imageUrl: placeholderImageUrl
              });
              console.log('Image processing: Updated metadata with placeholder image URL');
            } catch (err) {
              console.error('Failed to update metadata with placeholder URL:', err);
            }
          }
        } catch (imgErr) {
          console.error('API Route: Error during set image generation:', imgErr);
          // Use placeholder image
          const placeholderImageUrl = getRandomPlaceholderImage();
          setImageUrl = placeholderImageUrl;
          
          try {
            await storage.updateSetMetaData({
              ...metaDataForStorage,
              id: newMetaId,
              createdAt: insertedRecord.createdAt.toISOString(),
              phraseCount: phrasesToSave.length,
              imageUrl: placeholderImageUrl
            });
            console.log('Image processing: Updated metadata with placeholder image URL after error');
          } catch (err) {
            console.error('Failed to update metadata with placeholder URL after error:', err);
          }
        }
      }

      // --- 7. Save Content and Progress ---
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

      // --- 8. Return Success Response ---
      // Get the latest metadata through a query
      let updatedMetadata = null;
      try {
        // Try to get the latest metadata
        const sets = await storage.getAllSetMetaData(userId);
        updatedMetadata = sets.find(set => set.id === newMetaId);
        console.log('Found updated metadata via getAllSetMetaData:', !!updatedMetadata);
      } catch (err) {
        console.error('Error fetching updated metadata:', err);
      }
      
      const completeNewMetaData: SetMetaData = {
        id: updatedMetadata?.id || insertedRecord.id,
        name: updatedMetadata?.name || insertedRecord.name,
        cleverTitle: updatedMetadata?.cleverTitle || insertedRecord.cleverTitle || undefined,
        createdAt: updatedMetadata?.createdAt || insertedRecord.createdAt.toISOString(),
        phraseCount: phrasesToSave.length,
        level: updatedMetadata?.level || insertedRecord.level as SetMetaData['level'] || undefined,
        goals: updatedMetadata?.goals || insertedRecord.goals || [],
        specificTopics: updatedMetadata?.specificTopics || insertedRecord.specificTopics || undefined,
        source: updatedMetadata?.source || insertedRecord.source as SetMetaData['source'] || 'generated',
        imageUrl: updatedMetadata?.imageUrl || setImageUrl || undefined,
        isFullyLearned: false,
        seriousnessLevel: updatedMetadata?.seriousnessLevel || insertedRecord.seriousnessLevel || undefined,
        llmBrand: updatedMetadata?.llmBrand || insertedRecord.llmBrand || undefined,
        llmModel: updatedMetadata?.llmModel || insertedRecord.llmModel || undefined
      };
      console.log(`API Route: Successfully created set ${newMetaId}. Returning metadata with imageUrl:`, completeNewMetaData.imageUrl ? 'set' : 'not set');
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
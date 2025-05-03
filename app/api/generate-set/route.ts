import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { 
  generateCustomSet, 
  GenerationResult,
} from '@/app/lib/set-generator'; 
import * as storage from '@/app/lib/storage';
import { SetMetaData } from '@/app/lib/storage';
import { generateImage } from '@/app/lib/ideogram-service';
import { uploadImageFromUrl } from '../../lib/imageStorage';
// import { prisma } from "@/app/lib/prisma"; // Removed unused import
// import { uploadImageFromUrl } from '../../lib/imageStorage'; // Removed unused import

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
  let isTestRequest = false; // Track if this is a test request

  try {
    console.log("API Route: Checking authentication...");
    const authResult = await auth();
    if (!authResult || !authResult.userId) {
      console.error("API Route: Authentication failed or userId missing.");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    userId = authResult.userId;
    console.log(`API Route: Authentication successful for userId: ${userId}`);

    const requestBody = await request.json();
    const { preferences, totalCount } = requestBody;
    isTestRequest = !!requestBody.isTestRequest; // Convert to boolean

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
      generationResult = await generateCustomSet(
        preferences,
        totalCount,
        isTestRequest ? undefined : (progress) => {
          // Optional progress tracking for non-test requests
          console.log(`Generation progress: ${progress.completed}/${progress.total}`);
        }
      );
      console.log("API Route: Generation completed successfully");
    } catch (genError) {
      console.error("API Route: Error during set generation:", genError);
      throw genError;
    }

    if (!generationResult || !generationResult.phrases || generationResult.phrases.length === 0) {
      console.error("API Route: No phrases generated.");
      throw new Error("No phrases were generated");
    }

    // For test requests, skip database operations and return the generated phrases directly
    if (isTestRequest) {
      console.log("API Route: Test request - skipping database operations");
      return NextResponse.json({
        ...generationResult,
        generationTime: Date.now() - startTime
      });
    }

    // Only proceed with database operations for non-test requests
    const setData: Omit<SetMetaData, 'id' | 'createdAt' | 'phraseCount' | 'isFullyLearned'> = {
      name: generationResult.cleverTitle || 'Custom Set',
      cleverTitle: generationResult.cleverTitle,
      level: preferences.level,
      goals: [],
      specificTopics: preferences.specificTopics,
      source: 'generated',
      imageUrl: undefined,
      seriousnessLevel: preferences.toneLevel,
      toneLevel: preferences.toneLevel,
      llmBrand: generationResult.llmBrand,
      llmModel: generationResult.llmModel
    };

    // Generate image for the set - REVISED PROMPT LOGIC AGAIN
    let imageUrl: string | null = null;
    try {
      const topicDescription = generationResult.cleverTitle || preferences.specificTopics || 'a friendly donkey and bridge';

      // Check if the topic itself contains numbers
      const topicHasNumbers = /\d/.test(topicDescription);

      // Define the negative constraints conditionally
      let negativeConstraint = "CRITICAL RULE: Absolutely NO text and NO letters are allowed anywhere in the image.";
      if (!topicHasNumbers) {
        negativeConstraint += " NO numbers are allowed either.";
      } else {
        // Allow numbers only if they are part of the topic visualization
        negativeConstraint += " Numbers ARE allowed ONLY IF they are visually part of representing the main topic.";
      }

      // Construct the main prompt with corrected requirements
      const imagePrompt = 
        `Cute cartoon style illustration. ` +
        `The absolute main focus MUST be: "${topicDescription}". ` +
        `Visually represent the core action or concept of this topic accurately. ` +
        // Make donkey/bridge mandatory and integrated with the topic
        `A friendly donkey AND a bridge MUST be clearly visible and integrated into the scene, visually representing or interacting directly with the main topic: "${topicDescription}". ` +
        `Use vibrant, friendly, and engaging colors. ` +
        negativeConstraint; // Add the refined negative constraint

      console.log(`API Route: Generating image with FINAL prompt:`, imagePrompt);
      const generatedImageUrl = await generateImage(imagePrompt);
      
      if (generatedImageUrl !== null) {
        const imagePathId = userId + '-' + Date.now(); 
        imageUrl = await uploadImageFromUrl(generatedImageUrl, `set-images/${imagePathId}`);
        if (imageUrl) {
          setData.imageUrl = imageUrl;
          console.log(`API Route: Image generated and uploaded successfully: ${imageUrl}`);
        } else {
           console.warn("API Route: Image generated but upload failed. Attempting fallback.");
           // Fallback logic - Enforce NO numbers here as topic is irrelevant
           try {
             const fallbackNegativeConstraint = "CRITICAL RULE: Absolutely NO text, NO letters, NO numbers are allowed anywhere in the image.";
             const fallbackPrompt = 
                `Simple, cute cartoon illustration of a friendly donkey and a bridge. ` +
                fallbackNegativeConstraint;
                
             console.log(`API Route: Trying fallback image generation with prompt:`, fallbackPrompt);
             const fallbackImageUrl = await generateImage(fallbackPrompt);
             if (fallbackImageUrl) {
               const fallbackImagePathId = userId + '-' + Date.now() + '-fallback';
               imageUrl = await uploadImageFromUrl(fallbackImageUrl, `set-images/${fallbackImagePathId}`);
               if (imageUrl) {
                 setData.imageUrl = imageUrl;
                 console.log(`API Route: Fallback image uploaded successfully: ${imageUrl}`);
               } else {
                 console.warn("API Route: Fallback image upload failed. Using placeholder.");
                 setData.imageUrl = getRandomPlaceholderImage();
               }
             } else {
               console.warn("API Route: Fallback image generation failed. Using placeholder.");
               setData.imageUrl = getRandomPlaceholderImage();
             }
           } catch (retryErr) {
             console.error('API Route: Fallback image generation/upload failed:', retryErr);
             setData.imageUrl = getRandomPlaceholderImage();
           }
        }
      } else {
        console.warn("API Route: Initial image generation failed. Using placeholder.");
        setData.imageUrl = getRandomPlaceholderImage();
      }
    } catch (imageError) {
      console.error('API Route: Error during image generation/upload process:', imageError);
      setData.imageUrl = getRandomPlaceholderImage();
    }

    // Add metadata to database
    const insertedRecord = await storage.addSetMetaData(userId, setData);
    if (!insertedRecord) throw new Error("Failed to save metadata");
    newMetaId = insertedRecord.id;
    console.log(`API Route: Metadata saved with ID: ${newMetaId}`);

    // Save content
    const contentSaved = await storage.saveSetContent(newMetaId, generationResult.phrases);
    if (!contentSaved) throw new Error("Failed to save content");
    console.log(`API Route: Content saved for set ID: ${newMetaId}`);

    // Save progress
    const progressSaved = await storage.saveSetProgress(userId, newMetaId, {});
    if (!progressSaved) throw new Error("Failed to save progress");
    console.log(`API Route: Initial progress saved for set ID: ${newMetaId}`);

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
      phraseCount: generationResult.phrases.length,
      isFullyLearned: false,
      llmBrand: insertedRecord.llmBrand || undefined,
      llmModel: insertedRecord.llmModel || undefined,
      seriousnessLevel: insertedRecord.seriousnessLevel || undefined,
      toneLevel: insertedRecord.toneLevel || undefined
    };

    console.log(`API Route: Successfully created set ${newMetaId}.`);
    return NextResponse.json({ 
      newSetMetaData: completeNewMetaData,
      ...generationResult,
      generationTime: Date.now() - startTime
    }, { status: 201 });

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error("API Route: Error creating set:", error);
    // Attempt cleanup if partially created and not a test request
    if (newMetaId && !isTestRequest) {
      console.error(`API Route: Attempting cleanup for failed set creation ${newMetaId}`);
      await storage.deleteSetMetaData(newMetaId).catch(cleanupError => {
        console.error(`API Route: Cleanup failed for ${newMetaId}:`, cleanupError);
      });
    }
    return NextResponse.json({ error: `Set creation failed: ${message}` }, { status: 500 });
  }
} 
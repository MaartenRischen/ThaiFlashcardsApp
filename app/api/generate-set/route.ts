import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { 
  generateCustomSet, 
  GenerationResult,
  generateOpenRouterBatch
} from '@/app/lib/set-generator'; 
import * as storage from '@/app/lib/storage';
import { SetMetaData } from '@/app/lib/storage';
import { generateImage } from '@/app/lib/ideogram-service';
import { uploadImageFromUrl } from '../../lib/imageStorage';
import { getToneLabel, formatSetTitle } from '@/app/lib/utils';
import dotenv from 'dotenv';
import { prisma } from "@/app/lib/prisma"; // Ensure prisma is imported
// import { uploadImageFromUrl } from '../../lib/imageStorage'; // Removed unused import

// Initialize environment variables in development
if (process.env.NODE_ENV === 'development') {
  dotenv.config();
  console.log('API Route: Loaded .env file in development mode');
}

// Debug environment variables - this will help diagnose Railway issues
console.log('API Route Environment Variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- IDEOGRAM_API_KEY:', process.env.IDEOGRAM_API_KEY ? 'Defined' : 'Undefined');
console.log('- OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 'Defined' : 'Undefined');
console.log('- SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Defined' : 'Undefined');

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

const _getRandomPlaceholderImage = () => {
  return PLACEHOLDER_IMAGES[Math.floor(Math.random() * PLACEHOLDER_IMAGES.length)];
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  if (error instanceof Error) {
     return error.message;
  }
  return 'Set generation failed.';
}

async function handleManualMode(userId: string, englishPhrases: string[], preferences: {
  level: string;
  specificTopics: string;
  toneLevel: number;
  topicsToDiscuss: string;
  additionalContext: string;
}) {
  console.log("API Route: Processing manual input phrases");
  
  try {
    // Clean up and spell-check the English phrases
    const cleanedPhrases = englishPhrases.map(phrase => phrase.trim()).filter(p => p.length > 0);
    
    // Generate a smart title based on the phrases
    const title = await generateSmartTitle(cleanedPhrases);
    
    // Create a custom prompt for translating the manual phrases
    const manualPrompt = `You are creating Thai language flashcards. The user has provided these English phrases that they want to learn in Thai:

${cleanedPhrases.map((p, i) => `${i + 1}. ${p}`).join('\n')}

For each phrase:
1. Provide an accurate Thai translation
2. Include both masculine and feminine versions where applicable
3. Create a clear pronunciation guide
4. Generate a memorable mnemonic
5. Add 2-3 contextual example sentences

Please maintain the exact order and create flashcards for ALL provided phrases.`;

    // Use the batch generation with the manual prompt
    const { phrases, error } = await generateOpenRouterBatch(
      manualPrompt,
      ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o'],
      0,
      preferences.toneLevel
    );

    if (error || !phrases || phrases.length === 0) {
      throw new Error(error?.message || "Failed to generate flashcards from manual input");
    }

    const generationResult: GenerationResult = {
      phrases,
      cleverTitle: title,
      llmBrand: 'OpenRouter',
      llmModel: 'claude-3.5-sonnet'
    };

    // Generate image for the set
    let imageUrl: string | undefined;
    try {
      const imagePrompt = `Thai language learning flashcards for: ${title}`;
      const generatedImageUrl = await generateImage(imagePrompt);
      
      if (generatedImageUrl) {
        const uploadedImageUrl = await uploadImageFromUrl(generatedImageUrl, userId);
        if (uploadedImageUrl) {
          imageUrl = uploadedImageUrl;
        }
      }
    } catch (imageError) {
      console.error("Failed to generate image for manual set:", imageError);
    }

    // Save the set
    const newSetMetaData: SetMetaData = {
      id: '', // Will be set after creation
      name: formatSetTitle(title),
      createdAt: new Date().toISOString(),
      phraseCount: generationResult.phrases.length,
      source: 'manual',
      isFullyLearned: false,
      level: 'intermediate',
      specificTopics: title,
      seriousnessLevel: preferences.toneLevel,
      toneLevel: getToneLabel(preferences.toneLevel),
      imageUrl: imageUrl || null,
      llmBrand: generationResult.llmBrand,
      llmModel: generationResult.llmModel
    };

    // Add the set metadata
    const createdSet = await storage.addSetMetaData(userId, newSetMetaData);
    if (!createdSet) {
      throw new Error('Failed to create set metadata');
    }
    
    newSetMetaData.id = createdSet.id;
    
    // Save the phrases
    const contentSaved = await storage.saveSetContent(createdSet.id, generationResult.phrases);
    if (!contentSaved) {
      // Cleanup on failure
      await storage.deleteSetMetaData(createdSet.id);
      throw new Error('Failed to save set content');
    }

    console.log(`API Route: Manual set created successfully with ID: ${createdSet.id}`);
    
    return NextResponse.json({
      success: true,
      newSetMetaData,
      phrases: generationResult.phrases
    });
  } catch (error) {
    console.error("API Route: Error in handleManualMode:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

async function generateSmartTitle(phrases: string[]): Promise<string> {
  // Simple title generation based on common themes
  const words = phrases.join(' ').toLowerCase().split(/\s+/);
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
  
  // Count word frequencies
  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    if (!commonWords.has(word) && word.length > 2) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
  });
  
  // Get most common words
  const sortedWords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);
  
  if (sortedWords.length > 0) {
    return sortedWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' & ');
  }
  
  return 'Custom Vocabulary Set';
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

    // Ensure user exists in your DB before proceeding
    try {
      await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: { id: userId }, // Only use id, as other user details are not directly on authResult here
      });
      console.log(`API Route /api/generate-set: Ensured user exists: ${userId}`);
    } catch (userError) {
      console.error(`API Route /api/generate-set: Failed to ensure user ${userId} exists:`, userError);
      return NextResponse.json({ error: 'Failed to process user data for set generation' }, { status: 500 });
    }

    const requestBody = await request.json();
    const { preferences, totalCount, mode, englishPhrases } = requestBody;
    isTestRequest = !!requestBody.isTestRequest; // Convert to boolean

    // Handle manual mode
    if (mode === 'manual' && englishPhrases) {
      console.log(`API Route: Processing manual mode with ${englishPhrases.length} phrases`);
      
      // Create preferences for manual mode
      const manualPreferences = {
        level: 'Intermediate',
        specificTopics: 'Custom Vocabulary',
        toneLevel: 5,
        topicsToDiscuss: 'User-provided vocabulary',
        additionalContext: `Translate and create flashcards for these English phrases: ${englishPhrases.join(', ')}`
      };

      return handleManualMode(userId, englishPhrases, manualPreferences);
    }

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
      name: formatSetTitle(preferences.specificTopics),
      cleverTitle: undefined,
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

      // Define the negative constraints conditionally
      const _universalNegativeConstraint = [
        "CRITICAL RULE: Absolutely NO text, NO words, NO letters, NO numbers, NO writing, NO signage, NO captions, NO subtitles, NO labels, NO logos, NO watermarks, NO symbols, NO characters, NO alphabets, NO numerals, NO digits, NO writing of any kind, NO visible language, NO English, NO Thai, NO hidden text, NO hidden letters, NO hidden numbers, NO text in the background, NO text on objects, NO text anywhere in the image.",
        "If the topic itself is a word or phrase, do NOT render it as text—only as a visual concept.",
        "If numbers are part of the topic, they may only appear as objects, not as digits or text.",
        "NO text or writing on signs, banners, clothing, objects, or in the background."
      ].join(' ');
      
      // Construct the main prompt with corrected requirements
      const imagePrompt = 
        `Create a cute cartoon style illustration with these STRICT REQUIREMENTS:\n` +
        `1. MAIN FOCUS: Create a purely visual representation of "${topicDescription}" without ANY text or writing.\n` +
        `2. MANDATORY ELEMENTS: Include a friendly donkey AND a bridge that naturally interact with the main topic.\n` +
        `3. STYLE: Use vibrant, friendly colors and a clean cartoon style.\n` +
        `4. CRITICAL TEXT PROHIBITION: The image MUST NOT contain ANY:\n` +
        `   - Text, letters, numbers, or writing of any kind\n` +
        `   - Signs, labels, logos, or watermarks\n` +
        `   - Hidden or subtle text elements\n` +
        `   - Text-like patterns or shapes\n` +
        `5. COMPOSITION: Create a balanced 16:9 landscape composition.\n` +
        `6. QUALITY: Focus on high detail and clean lines.`;

      console.log(`API Route: Generating image with FINAL prompt:`, imagePrompt);
      console.log(`API Route: Starting Ideogram API call...`);
      
      // Check if we have the Ideogram API key
      console.log(`API Route: IDEOGRAM_API_KEY available: ${Boolean(process.env.IDEOGRAM_API_KEY)}`);
      if (!process.env.IDEOGRAM_API_KEY) {
        console.error(`API Route: CRITICAL ERROR - IDEOGRAM_API_KEY is missing!`);
      }
      
      const generatedImageUrl = await generateImage(imagePrompt);
      console.log(`API Route: Ideogram API call complete, result URL: ${generatedImageUrl ? 'received' : 'null'}`);
      
      if (generatedImageUrl !== null) {
        console.log(`API Route: Ideogram returned valid URL, beginning upload...`);
        // Use a unique folder path that's simpler
        const timestamp = Date.now();
        const imagePathId = `user_${userId.substring(0, 8)}_${timestamp}`; 
        
        // IMPORTANT: Store the original URL if upload fails
        try {
          imageUrl = await uploadImageFromUrl(generatedImageUrl, `set-images/${imagePathId}`);
          if (imageUrl) {
            setData.imageUrl = imageUrl;
            console.log(`API Route: Image generated and uploaded successfully: ${imageUrl}`);
          } else {
            // If upload fails, store the original URL directly
            console.warn("API Route: Image upload failed, storing original Ideogram URL as fallback");
            setData.imageUrl = generatedImageUrl;
          }
        } catch (uploadError) {
          // If upload throws an error, store the original URL
          console.error("API Route: Image upload error, storing original Ideogram URL:", uploadError);
          setData.imageUrl = generatedImageUrl;
        }
      } else {
        // Fallback logic removed - we'll use a default image in the frontend instead
        console.warn("API Route: Initial image generation failed (Ideogram API returned null). Setting imageUrl to null.");
        setData.imageUrl = null;
      }
    } catch (imageError) {
      console.error('API Route: Error during image generation/upload process:', imageError);
      setData.imageUrl = null;
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
      seriousnessLevel: insertedRecord.seriousnessLevel ?? null,
      toneLevel: insertedRecord.seriousnessLevel !== null ? getToneLabel(insertedRecord.seriousnessLevel) : null
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
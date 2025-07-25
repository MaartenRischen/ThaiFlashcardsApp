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

async function createImageGenerationPrompt(topicDescription: string, phrases?: string[]): Promise<string> {
  let contextualElements = '';
  
  // If we have phrases, use AI to analyze them and suggest visual elements
  if (phrases && phrases.length > 0) {
    try {
      const phraseSample = phrases.slice(0, 5).join(', ');
      
      const analysisPrompt = `Analyze these phrases and suggest 3-5 specific visual elements that would represent this topic in an illustration. The illustration will feature cartoon donkeys and a bridge.

Topic: "${topicDescription}"
Sample phrases: "${phraseSample}"

Requirements:
- Suggest concrete, visual objects or actions (not abstract concepts)
- Elements should be things that can be drawn/illustrated
- Consider how donkeys could interact with these elements
- Elements can be floating, held by donkeys, or part of the environment
- Be creative - objects can appear in unusual ways (e.g., floating, oversized, etc.)

Return ONLY a comma-separated list of visual elements, nothing else.
Example format: "floating bitcoin symbols, chart patterns in sky, golden coins scattered on ground"`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://donkeybridge.world',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      });

      if (response.ok) {
        const data = await response.json();
        const visualElements = data.choices?.[0]?.message?.content?.trim();
        
        if (visualElements) {
          contextualElements = `\n8. CONTEXTUAL ELEMENTS: Include these specific visual elements that represent the topic: ${visualElements}.`;
          console.log(`AI-generated visual elements for "${topicDescription}": ${visualElements}`);
        }
      }
    } catch (error) {
      console.error('Error generating contextual elements:', error);
      // Continue without contextual elements if AI analysis fails
    }
  }
  
  return `Create a cute cartoon style illustration with these STRICT REQUIREMENTS:
1. MAIN FOCUS: Create a purely visual representation of "${topicDescription}" without ANY text or writing.
2. MANDATORY ELEMENTS: Include at least one friendly donkey AND a bridge (bridge can be in background if needed).
3. STYLE: Use vibrant, friendly colors and a clean cartoon style.
4. CRITICAL TEXT PROHIBITION: The image MUST NOT contain ANY:
   - Text, letters, numbers, or writing of any kind
   - Signs, labels, logos, or watermarks
   - Hidden or subtle text elements
   - Text-like patterns or shapes
5. NO OTHER CREATURES: The image MUST NOT contain:
   - Any animals other than donkeys
   - No humans, people, or human figures
   - No other living creatures (birds, insects, etc.)
   - Only donkeys are allowed as living beings
6. COMPOSITION: Create a balanced 16:9 landscape composition where the topic-specific elements are prominent.
7. QUALITY: Focus on high detail and clean lines.${contextualElements}
Remember: The bridge can be small or in the background if it helps better showcase the topic-specific elements.`;
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
    const manualPrompt = `Generate EXACTLY ${cleanedPhrases.length} Thai vocabulary items for the following English phrases:

${cleanedPhrases.map((p, i) => `${i + 1}. ${p}`).join('\n')}

For each phrase, provide:
1. Accurate Thai translation with Thai script
2. Both masculine (ครับ) and feminine (ค่ะ/คะ) versions
3. Clear romanized pronunciation guide
4. Creative mnemonic linking sound/meaning
5. Two example sentences showing usage

### REQUIRED OUTPUT FORMAT:
Return a JSON object with this EXACT structure:
{
  "phrases": [
    {
      "english": "English phrase/word",
      "thai": "Thai translation in Thai script",
      "thaiMasculine": "Thai with masculine forms/particles",
      "thaiFeminine": "Thai with feminine forms/particles", 
      "pronunciation": "Phonetic pronunciation (romanized)",
      "mnemonic": "Creative memory aid linking sound/meaning",
      "examples": [
        {
          "thai": "Complete Thai sentence using the phrase",
          "thaiMasculine": "Same sentence with masculine forms",
          "thaiFeminine": "Same sentence with feminine forms",
          "pronunciation": "Full sentence pronunciation", 
          "translation": "English translation of the example"
        },
        {
          "thai": "Another Thai sentence using the phrase",
          "thaiMasculine": "Same sentence with masculine forms",
          "thaiFeminine": "Same sentence with feminine forms",
          "pronunciation": "Full sentence pronunciation", 
          "translation": "English translation of the example"
        }
      ]
    }
    // ... remaining phrases
  ],
  "cleverTitle": "${title}"
}

CRITICAL: You MUST generate EXACTLY ${cleanedPhrases.length} phrases in the same order as provided. The response must be valid JSON with no additional text.`;

    // Use the batch generation with the manual prompt
    console.log("API Route: Calling generateOpenRouterBatch for manual mode...");
    const result = await generateOpenRouterBatch(
      manualPrompt,
      ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o'],
      0,
      preferences.toneLevel
    );
    
    console.log("API Route: OpenRouter batch result:", {
      phrasesCount: result.phrases?.length || 0,
      hasError: !!result.error,
      errorMessage: result.error?.message
    });

    if (result.error || !result.phrases || result.phrases.length === 0) {
      throw new Error(result.error?.message || "Failed to generate flashcards from manual input");
    }
    
    const { phrases } = result;

    const generationResult: GenerationResult = {
      phrases,
      cleverTitle: title,
      llmBrand: 'OpenRouter',
      llmModel: 'claude-3.5-sonnet'
    };

    // Generate image for the set
    let imageUrl: string | undefined;
    try {
      const imagePrompt = await createImageGenerationPrompt(title, englishPhrases);
      console.log(`API Route: Generating image for manual set with prompt:`, imagePrompt);
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
  try {
    const prompt = `Analyze these English phrases and create a short, descriptive title (2-4 words) that captures their main theme:

Phrases:
${phrases.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Requirements:
- Create a title that accurately reflects the content
- Use 2-4 words maximum
- Make it specific and descriptive
- Use title case (capitalize main words)
- Do NOT include generic words like "Set", "Manual", "Custom", "Vocabulary"
- Focus on the actual topic/theme of the phrases

Examples of good titles:
- "Dog Care Essentials" (for phrases about dogs)
- "Gym Membership Guide" (for phrases about joining a gym)
- "Thai Street Food" (for phrases about local food)
- "Family Conversations" (for phrases about family)

Return ONLY the title, nothing else.`;

    // Call OpenRouter API directly for simple text generation
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://donkeybridge.world',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 50
      })
    });

    if (!response.ok) {
      console.error('OpenRouter API error:', response.status);
      return 'Custom Vocabulary';
    }

    const data = await response.json();
    const title = data.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, '').trim();

    if (!title || title.length > 50 || title.split(' ').length > 6) {
      console.warn('Generated title invalid, using fallback');
      return 'Custom Vocabulary';
    }

    console.log(`Generated smart title: "${title}" for phrases:`, phrases.slice(0, 3));
    return title;
  } catch (error) {
    console.error('Error generating smart title:', error);
    return 'Custom Vocabulary';
  }
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
    
    // Ensure minimum card count for auto mode
    const adjustedTotalCount = mode === 'auto' ? Math.max(5, totalCount) : totalCount;
    if (adjustedTotalCount !== totalCount) {
      console.log(`API Route: Adjusted card count from ${totalCount} to ${adjustedTotalCount} to meet minimum requirement`);
    }

    try {
      generationResult = await generateCustomSet(
        preferences,
        adjustedTotalCount,
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
    
    // Ensure we have at least 5 phrases for auto mode
    if (mode === 'auto' && generationResult.phrases.length < 5) {
      console.error(`API Route: Only ${generationResult.phrases.length} phrases generated, minimum 5 required for auto mode`);
      throw new Error(`Not enough phrases generated. Got ${generationResult.phrases.length}, minimum 5 required.`);
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
      
      // Extract English phrases for context
      const englishPhrases = generationResult.phrases.map(p => p.english);
      
      // Construct the main prompt with corrected requirements
      const imagePrompt = await createImageGenerationPrompt(topicDescription, englishPhrases);

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
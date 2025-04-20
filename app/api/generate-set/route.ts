import { NextResponse } from 'next/server';
import { generateCustomSet, Phrase, GeneratePromptOptions } from '@/app/lib/set-generator'; // Assuming path alias works
// Import the OpenRouter batch generator
import { generateOpenRouterBatch } from '@/app/lib/set-generator';

// Import or define LLM provider functions (pseudo-code, to be implemented)
// import { callGemini, callOpenAI, callAnthropic, callOpenRouter, callHuggingFace } from '@/app/lib/llm-providers';

// Define the expected request body structure (matching client-side call)
interface GenerateRequestBody {
    level: 'beginner' | 'intermediate' | 'advanced';
    situations?: string;
    specificTopics?: string;
    friendNames?: string[];
    userName?: string;
    seriousnessLevel?: number;
    count: number;
    llmBrand?: string;
    llmModel?: string;
    llmApiKey?: string;
}

const FREE_FALLBACKS: { brand: string; model: string }[] = [
  { brand: 'google', model: 'gemini-2.0-flash-lite' },
  { brand: 'google', model: 'gemini-pro' },
  { brand: 'openrouter', model: 'mixtral-8x7b' },
  { brand: 'openrouter', model: 'mythomax' },
  { brand: 'huggingface', model: 'llama-2' },
  { brand: 'huggingface', model: 'mistral' },
];

export async function POST(request: Request) {
  console.log("API Route: /api/generate-set called");
  try {
    const body = await request.json();
    console.log("API Route: Request body parsed:", body);

    // Basic validation
    if (!body.level || !body.count) {
      return NextResponse.json({ error: 'Missing required fields: level and count' }, { status: 400 });
    }

    // Prepare options for the generator function
    const generationOptions = {
      level: body.level,
      specificTopics: body.specificTopics || undefined,
      topicsToDiscuss: body.situations || undefined,
      topicsToAvoid: undefined,
      seriousnessLevel: body.seriousnessLevel !== undefined ? body.seriousnessLevel : 50,
      count: body.count
    };

    // Premium model priority list (OpenRouter slugs, April 2025)
    const premiumModels = [
      'openai/gpt-4o',
      'openai/gpt-4-turbo',
      'openai/gpt-4',
      'anthropic/claude-3.7-sonnet',
      'google/gemini-2.5-pro-preview-03-25',
      'meta-llama/llama-4-scout',
      'mistralai/mixtral-8x7b', // last-resort fallback
    ];

    const { buildGenerationPrompt } = await import('@/app/lib/set-generator');
    const prompt = buildGenerationPrompt(generationOptions);
    let lastError = null;
    for (const model of premiumModels) {
      try {
        const batchResult = await generateOpenRouterBatch(prompt, model, 0);
        if (!batchResult.error && batchResult.phrases && batchResult.phrases.length > 0) {
          return NextResponse.json({
            phrases: batchResult.phrases,
            cleverTitle: batchResult.cleverTitle,
            aggregatedErrors: [],
            errorSummary: undefined,
            usedModel: model
          });
        } else {
          lastError = batchResult.error;
        }
      } catch (err) {
        lastError = err;
      }
    }
    // If all models failed
    let errorMessage = 'All premium models failed.';
    if (lastError) {
      if (typeof lastError === 'object' && lastError !== null && 'message' in lastError) {
        errorMessage = (lastError as any).message;
      } else if (typeof lastError === 'string') {
        errorMessage = lastError;
      }
    }
    return NextResponse.json({
      phraseCount: 0,
      cleverTitle: "AI is overloaded or unavailable. Please try again later.",
      phrases: [],
      errors: 1,
      errorSummary: {
        errorTypes: [typeof lastError === 'object' && lastError !== null && 'type' in lastError ? (lastError as any).type : 'API'],
        totalErrors: 1,
        userMessage: errorMessage
      },
      fallback: true
    }, { status: 503 });
  } catch (error) {
    console.error("API Route Error: Error in /api/generate-set:", error);
    let details = 'Unknown error';
    if (typeof error === 'object' && error !== null && 'message' in error) {
      details = (error as any).message;
    }
    return NextResponse.json({ error: 'Internal Server Error', details }, { status: 500 });
  }
} 
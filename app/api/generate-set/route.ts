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

    // Always use OpenRouter with mixtral-8x7b
    const model = 'mixtral-8x7b';
    const prompt = (await import('@/app/lib/set-generator')).buildGenerationPrompt(generationOptions);
    const batchResult = await generateOpenRouterBatch(prompt, model, 0);
    if (batchResult.error) {
      return NextResponse.json({
        phraseCount: 0,
        cleverTitle: batchResult.cleverTitle || "AI is overloaded or unavailable. Please try again later.",
        phrases: [],
        errors: 1,
        errorSummary: {
          errorTypes: [batchResult.error.type],
          totalErrors: 1,
          userMessage: batchResult.error.message
        },
        fallback: false
      }, { status: 503 });
    }
    return NextResponse.json({
      phrases: batchResult.phrases,
      cleverTitle: batchResult.cleverTitle,
      aggregatedErrors: [],
      errorSummary: undefined
    });
  } catch (error) {
    console.error("API Route Error: Error in /api/generate-set:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
} 
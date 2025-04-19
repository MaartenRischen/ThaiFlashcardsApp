import { NextResponse } from 'next/server';
import { generateCustomSet, Phrase, GeneratePromptOptions } from '@/app/lib/set-generator'; // Assuming path alias works

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
    const body: GenerateRequestBody = await request.json();
    console.log("API Route: Request body parsed:", body);

    // Basic validation
    if (!body.level || !body.count) {
      return NextResponse.json({ error: 'Missing required fields: level and count' }, { status: 400 });
    }

    // Extract LLM settings
    const llmBrand = body.llmBrand || 'google';
    const llmModel = body.llmModel || 'gemini-2.0-flash-lite';
    const llmApiKey = body.llmApiKey || undefined;

    // Prepare options for the generator function
    const generationOptions: Omit<GeneratePromptOptions, 'existingPhrases'> = {
      level: body.level,
      specificTopics: body.specificTopics || undefined,
      topicsToDiscuss: body.situations || undefined,
      topicsToAvoid: undefined,
      seriousnessLevel: body.seriousnessLevel !== undefined ? body.seriousnessLevel : 50,
      count: body.count
    };

    // --- Multi-LLM Routing and Fallback Logic ---
    let result = null;
    let tried: { brand: string; model: string }[] = [];
    let errorMessages: string[] = [];
    const tryLLM = async (brand: string, model: string, apiKey?: string) => {
      // TODO: Implement actual LLM provider routing here
      // For now, just call generateCustomSet (Gemini only)
      // Replace this with switch/if for each provider
      if (brand === 'google') {
        // TODO: Pass model/apiKey to Gemini provider
        return await generateCustomSet(generationOptions, body.count, (progress) => {
          console.log(`API Route Progress (not sent to client): ${progress.completed}/${progress.total}`);
        });
      }
      // TODO: Add OpenAI, Anthropic, OpenRouter, HuggingFace, etc.
      throw new Error(`LLM provider for ${brand}/${model} not implemented.`);
    };

    // Try user-selected model first
    try {
      result = await tryLLM(llmBrand, llmModel, llmApiKey);
      tried.push({ brand: llmBrand, model: llmModel });
      if (result && result.phrases && result.phrases.length > 0) {
        return NextResponse.json(result);
      }
      errorMessages.push(`No phrases returned from ${llmBrand}/${llmModel}`);
    } catch (err: any) {
      errorMessages.push(`Error from ${llmBrand}/${llmModel}: ${err.message}`);
    }

    // Fallback to free models (skip already tried)
    for (const fallback of FREE_FALLBACKS) {
      if (tried.some(t => t.brand === fallback.brand && t.model === fallback.model)) continue;
      try {
        result = await tryLLM(fallback.brand, fallback.model);
        tried.push(fallback);
        if (result && result.phrases && result.phrases.length > 0) {
          return NextResponse.json({ ...result, fallbackUsed: true, fallbackBrand: fallback.brand, fallbackModel: fallback.model });
        }
        errorMessages.push(`No phrases returned from fallback ${fallback.brand}/${fallback.model}`);
      } catch (err: any) {
        errorMessages.push(`Error from fallback ${fallback.brand}/${fallback.model}: ${err.message}`);
      }
    }

    // All attempts failed
    return NextResponse.json({
      phraseCount: 0,
      cleverTitle: "AI is overloaded or unavailable. Please try again later or select a different model.",
      phrases: [],
      errors: errorMessages.length,
      errorSummary: {
        errorTypes: ["API"],
        totalErrors: errorMessages.length,
        userMessage: errorMessages.join("; ")
      },
      fallback: true
    }, { status: 503 });

  } catch (error: any) {
    console.error("API Route Error: Error in /api/generate-set:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
} 
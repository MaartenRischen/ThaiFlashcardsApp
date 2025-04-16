import { NextResponse } from 'next/server';
import { generateCustomSet, Phrase, GeneratePromptOptions } from '@/app/lib/set-generator'; // Assuming path alias works

// Define the expected request body structure (matching client-side call)
interface GenerateRequestBody {
    level: 'beginner' | 'intermediate' | 'advanced';
    situations?: string;
    specificTopics?: string;
    friendNames?: string[];
    userName?: string;
    seriousnessLevel?: number;
    count: number;
}

export async function POST(request: Request) {
  console.log("API Route: /api/generate-set called");
  try {
    const body: GenerateRequestBody = await request.json();
    console.log("API Route: Request body parsed:", body);

    // Basic validation
    if (!body.level || !body.count) {
      return NextResponse.json({ error: 'Missing required fields: level and count' }, { status: 400 });
    }

    // Prepare options for the generator function
    const generationOptions: Omit<GeneratePromptOptions, 'existingPhrases'> = {
        level: body.level,
        specificTopics: body.specificTopics || undefined,
        topicsToDiscuss: body.situations || undefined,
        topicsToAvoid: undefined,
        seriousnessLevel: body.seriousnessLevel !== undefined ? body.seriousnessLevel : 50, // Default if missing
        count: body.count // Use count from body for the internal prompt building
    };

    // --- Call the actual generation logic --- 
    console.log("API Route: Calling generateCustomSet with options:", generationOptions);
    
    // generateCustomSet is server-side, can access server-only env vars via gemini.ts
    const result = await generateCustomSet(generationOptions, body.count, (progress) => {
        // Progress updates can't easily be streamed back via simple POST/response.
        // For now, just log progress server-side.
        // Consider WebSockets or Server-Sent Events for real-time client updates.
        console.log(`API Route Progress (not sent to client): ${progress.completed}/${progress.total}`);
    });
    
    console.log("API Route: Generation result received:", {
        phraseCount: result.phrases.length,
        cleverTitle: result.cleverTitle,
        errors: result.aggregatedErrors.length,
        errorSummary: result.errorSummary
    });

    // Return the full result (including phrases, errors, etc.) to the client
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("API Route Error: Error in /api/generate-set:", error);
    // Handle JSON parsing errors specifically
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
} 
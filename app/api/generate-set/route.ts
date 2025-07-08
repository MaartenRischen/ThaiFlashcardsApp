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

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  if (error instanceof Error) {
     return error.message;
  }
  return 'Set generation failed.';
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { preferences, totalCount } = await request.json();
    if (!preferences || !totalCount) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const sendEvent = (event: string, data: object) => {
          controller.enqueue(encoder.encode(`event: ${event}\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          const generationResult = await generateCustomSet(
            preferences,
            totalCount,
            (progress) => {
              sendEvent('progress', progress);
            }
          );

          if (!generationResult || !generationResult.phrases || generationResult.phrases.length === 0) {
            throw new Error("No phrases were generated");
          }

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

          // Image generation logic can be simplified or removed for streaming example
          // For now, we'll skip it to focus on progress streaming

          const insertedRecord = await storage.addSetMetaData(userId, setData);
          if (!insertedRecord) throw new Error("Failed to save metadata");

          await storage.saveSetContent(insertedRecord.id, generationResult.phrases);
          await storage.saveSetProgress(userId, insertedRecord.id, {});

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

          sendEvent('complete', { newSetMetaData: completeNewMetaData, ...generationResult });
          controller.close();
        } catch (error) {
          console.error("API Route Stream Error:", error);
          const message = getErrorMessage(error);
          sendEvent('error', { error: message });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    const message = getErrorMessage(error);
    console.error("API Route Top-Level Error:", error);
    return NextResponse.json({ error: `Request failed: ${message}` }, { status: 500 });
  }
} 
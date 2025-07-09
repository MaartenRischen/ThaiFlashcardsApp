import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { 
  generateCustomSet, 
  GenerationResult,
} from '@/app/lib/set-generator'; 
import * as storage from '@/app/lib/storage';
import { SetMetaData } from '@/app/lib/storage';
import { getToneLabel, formatSetTitle } from '@/app/lib/utils';

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const preferencesStr = url.searchParams.get('preferences');
    const totalCountStr = url.searchParams.get('totalCount');

    if (!preferencesStr || !totalCountStr) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const preferences = JSON.parse(preferencesStr);
    const totalCount = parseInt(totalCountStr, 10);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const sendEvent = (event: string, data: object) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
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
          const message = error instanceof Error ? error.message : 'Unknown error';
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
    console.error("API Route Top-Level Error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Request failed: ${message}` }, { status: 500 });
  }
} 
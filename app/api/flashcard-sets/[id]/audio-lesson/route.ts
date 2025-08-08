import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/app/lib/prisma';
import { AudioLessonGenerator } from '@/app/lib/audio-lesson-generator';
import { SimpleAudioLessonGenerator } from '@/app/lib/audio-lesson-generator-simple';
import { getDefaultSetContent } from '@/app/lib/seed-default-sets';
import { DEFAULT_SETS } from '@/app/data/default-sets';
import { Prisma } from '@prisma/client';
import { putTimings } from '@/app/lib/audioTimingsStore';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure this route can use Node APIs (required by Azure Speech SDK)
    // and fail fast when missing credentials
    if (!process.env.AZURE_SPEECH_KEY) {
      console.error('AZURE_SPEECH_KEY is not set');
      return NextResponse.json(
        { error: 'Audio generation is not configured (missing Azure credentials).' },
        { status: 500 }
      );
    }

    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { mode, config } = await request.json();
    let phrases: Array<{
      thai: string;
      english: string;
      thaiMasculine?: string;
      thaiFeminine?: string;
      mnemonic?: string;
    }> = [];
    let setName = '';
    
    // Check if this is a default set
    const isDefaultSet = params.id === 'default' || params.id.startsWith('default-');
    
    // Load the set from the database
    let flashcardSet = await prisma.flashcardSet.findFirst({
      where: { 
        id: params.id,
        userId: userId
      },
      include: {
        phrases: true
      }
    });

    // If it's a default set and not found, create it first
    if (isDefaultSet && !flashcardSet) {
      console.log('Default set not found in database, creating it...');
      console.log('params.id:', params.id);
      
      // Get the default set content
      let defaultContent;
      let defaultSetName;
      let defaultSetLevel = null;
      let defaultSetDescription = null;
      
      if (params.id === 'default') {
        defaultContent = getDefaultSetContent('default');
        defaultSetName = 'Default Set';
      } else {
        const setId = params.id.replace('default-', '');
        console.log('Looking for setId:', setId);
        console.log('Available DEFAULT_SETS ids:', DEFAULT_SETS.map(s => s.id));
        const defaultSet = DEFAULT_SETS.find(set => set.id === setId);
        console.log('Found defaultSet:', defaultSet ? defaultSet.name : 'NOT FOUND');
        if (!defaultSet) {
          return NextResponse.json({ 
            error: `Default set template not found for id: ${setId}. Available sets: ${DEFAULT_SETS.map(s => s.id).join(', ')}` 
          }, { status: 404 });
        }
        defaultContent = defaultSet.phrases;
        defaultSetName = defaultSet.name;
        defaultSetLevel = defaultSet.level;
        defaultSetDescription = defaultSet.description;
      }

      if (!defaultContent) {
        return NextResponse.json({ error: 'Default set content not found' }, { status: 404 });
      }

      // Create the default set in the database
      const createData: Prisma.FlashcardSetCreateInput = {
        id: params.id,
        user: {
          connect: {
            id: userId
          }
        },
        name: defaultSetName,
        source: 'default',
        level: defaultSetLevel,
        specificTopics: defaultSetDescription,
        phrases: {
          create: defaultContent.map(phrase => ({
            thai: phrase.thai,
            english: phrase.english,
            thaiMasculine: phrase.thaiMasculine || phrase.thai,
            thaiFeminine: phrase.thaiFeminine || phrase.thai,
            pronunciation: phrase.pronunciation,
            mnemonic: phrase.mnemonic || null,
            examplesJson: phrase.examples ? (phrase.examples as unknown as Prisma.InputJsonValue) : Prisma.JsonNull
          }))
        }
      };

      flashcardSet = await prisma.flashcardSet.create({
        data: createData,
        include: {
          phrases: true
        }
      });
      
      console.log(`Created default set "${defaultSetName}" with ${flashcardSet.phrases.length} phrases`);
    }

    if (!flashcardSet) {
      return NextResponse.json({ error: 'Flashcard set not found' }, { status: 404 });
    }

    phrases = flashcardSet.phrases.map(phrase => ({
      thai: phrase.thai,
      english: phrase.english,
      thaiMasculine: phrase.thaiMasculine || undefined,
      thaiFeminine: phrase.thaiFeminine || undefined,
      mnemonic: phrase.mnemonic || undefined
    }));
    
    setName = flashcardSet.name;
    console.log(`Audio generation: Loaded ${phrases.length} phrases for set: ${setName}`);
    
    // Generate the audio lesson based on mode
    const fileNameSafe = `${setName.replace(/[^a-z0-9]/gi, '_')}_${mode === 'simple' ? 'simple' : mode === 'shuffle' ? 'shuffle' : 'pimsleur'}.wav`;
    if (mode === 'simple' || mode === 'shuffle') {
      // If shuffle mode, randomize order deterministically per request
      if (mode === 'shuffle') {
        // Seeded shuffle using timestamp for variety
        const seed = Date.now();
        let rand = seed % 2147483647;
        const nextRand = () => (rand = (rand * 48271) % 2147483647);
        phrases = [...phrases]
          .map((p) => ({ p, r: nextRand() }))
          .sort((a, b) => a.r - b.r)
          .map(({ p }) => p);
      }

      const result = await new SimpleAudioLessonGenerator(config).generateSimpleLesson(phrases, setName);
      // Put timings in ephemeral store keyed by a request-scoped id
      const requestId = `${params.id}:${Date.now()}`;
      putTimings(requestId, result.timings);
      return new Response(result.audioBuffer, {
        headers: {
          'Content-Type': 'audio/wav',
          'Content-Disposition': `inline; filename="${fileNameSafe}"`,
          'Cache-Control': 'no-store, max-age=0',
          // return id that frontend can use to fetch timings
          'X-Audio-Timings-Id': requestId,
        },
      });
    }

    const buffer = await new AudioLessonGenerator(config).generateLesson(phrases, setName);

    return new Response(buffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Disposition': `inline; filename="${fileNameSafe}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error in audio lesson generation:', message);
    return NextResponse.json(
      { error: 'Failed to generate audio lesson', details: message },
      { status: 500 }
    );
  }
} 
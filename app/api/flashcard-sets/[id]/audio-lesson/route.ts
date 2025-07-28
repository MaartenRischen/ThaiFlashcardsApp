import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/app/lib/prisma';
import { AudioLessonGenerator } from '@/app/lib/audio-lesson-generator';
import { SimpleAudioLessonGenerator } from '@/app/lib/audio-lesson-generator-simple';
import { getDefaultSetContent } from '@/app/lib/seed-default-sets';
import { DEFAULT_SETS } from '@/app/data/default-sets';
import { Prisma } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
        const defaultSet = DEFAULT_SETS.find(set => set.id === setId);
        if (!defaultSet) {
          return NextResponse.json({ error: 'Default set template not found' }, { status: 404 });
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
    if (mode === 'simple') {
      const generator = new SimpleAudioLessonGenerator(config);
      const audioBuffer = await generator.generateSimpleLesson(phrases, setName);
      return new Response(audioBuffer);
    } else {
      const generator = new AudioLessonGenerator(config);
      const audioBuffer = await generator.generateLesson(phrases, setName);
      return new Response(audioBuffer);
    }
  } catch (error) {
    console.error('Error in audio lesson generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate audio lesson' },
      { status: 500 }
    );
  }
} 
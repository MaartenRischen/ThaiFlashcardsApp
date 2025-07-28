import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/app/lib/prisma';
import { AudioLessonGenerator } from '@/app/lib/audio-lesson-generator';
import { SimpleAudioLessonGenerator } from '@/app/lib/audio-lesson-generator-simple';

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
    
    // Load the set from the database, whether it's a default set or user set
    const flashcardSet = await prisma.flashcardSet.findFirst({
      where: { 
        id: params.id,
        userId: userId
      },
      include: {
        phrases: true
      }
    });

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
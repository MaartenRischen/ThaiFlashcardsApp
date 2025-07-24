import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { AudioLessonGenerator } from '@/app/lib/audio-lesson-generator';
import { SimpleAudioLessonGenerator } from '@/app/lib/audio-lesson-generator-simple';
import { auth } from '@clerk/nextjs/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get flashcard set
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

    // Get configuration from request body
    const { mode, config } = await request.json();
    
    // Generate audio lesson based on mode
    let audioBuffer: ArrayBuffer;
    const phrases = flashcardSet.phrases.map(phrase => ({
      thai: phrase.thai,
      english: phrase.english,
      thaiMasculine: phrase.thaiMasculine || undefined,
      thaiFeminine: phrase.thaiFeminine || undefined,
      mnemonic: phrase.mnemonic || undefined  // Add mnemonic data
    }));
    
    if (mode === 'simple') {
      const generator = new SimpleAudioLessonGenerator(config);
      audioBuffer = await generator.generateSimpleLesson(phrases, flashcardSet.name);
    } else {
      const generator = new AudioLessonGenerator(config);
      audioBuffer = await generator.generateLesson(phrases, flashcardSet.name);
    }

    // Return audio file
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Disposition': `attachment; filename="${flashcardSet.name.replace(/[^a-z0-9]/gi, '_')}_lesson.wav"`,
        'Content-Length': audioBuffer.byteLength.toString()
      }
    });

  } catch (error) {
    console.error('Error generating audio lesson:', error);
    return NextResponse.json(
      { error: 'Failed to generate audio lesson' },
      { status: 500 }
    );
  }
} 
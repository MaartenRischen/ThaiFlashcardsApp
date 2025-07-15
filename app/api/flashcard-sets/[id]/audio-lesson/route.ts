import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { AudioLessonGenerator } from '@/app/lib/audio-lesson-generator';
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
    const config = await request.json();
    
    // Generate audio lesson
    const generator = new AudioLessonGenerator(config);
    const audioBuffer = await generator.generateLesson(
      flashcardSet.phrases.map(phrase => ({
        thai: phrase.thai,
        english: phrase.english,
        thaiMasculine: phrase.thaiMasculine || undefined,
        thaiFeminine: phrase.thaiFeminine || undefined
      })),
      flashcardSet.name
    );

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
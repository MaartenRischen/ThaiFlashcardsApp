import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { AudioLessonGenerator } from '@/app/lib/audio-lesson-generator';
import { SimpleAudioLessonGenerator } from '@/app/lib/audio-lesson-generator-simple';
import { auth } from '@clerk/nextjs/server';
import { getDefaultSetContent } from '@/app/lib/seed-default-sets';
import { INITIAL_PHRASES } from '@/app/data/phrases';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    // Get configuration from request body
    const { mode, config } = await request.json();
    
    // Debug logging
    console.log('Audio generation request:', { setId: params.id, mode, config });
    console.log('Config details:', {
      voiceGender: config?.voiceGender,
      includePolitenessParticles: config?.includePolitenessParticles,
      includeMnemonics: config?.includeMnemonics,
      speed: config?.speed,
      fullConfig: JSON.stringify(config, null, 2)
    });
    
    let phrases;
    let setName;
    
    // Check if this is a default set
    if (params.id === 'default' || params.id.startsWith('default-')) {
      console.log('Audio generation: Loading default set content');
      
      // Load default set content
      const defaultContent = getDefaultSetContent(params.id);
      if (!defaultContent) {
        console.error('Audio generation: Default set not found:', params.id);
        return NextResponse.json({ error: 'Default set not found' }, { status: 404 });
      }
      
      phrases = defaultContent.map(phrase => ({
        thai: phrase.thai,
        english: phrase.english,
        thaiMasculine: phrase.thaiMasculine || undefined,
        thaiFeminine: phrase.thaiFeminine || undefined,
        mnemonic: phrase.mnemonic || undefined
      }));
      
      // Get set name for default sets
      if (params.id === 'default') {
        setName = 'Default Set';
      } else {
        // Extract the set name from our default sets data
        const setId = params.id.replace('default-', '');
        const { DEFAULT_SETS } = await import('@/app/data/default-sets');
        const defaultSet = DEFAULT_SETS.find(set => set.id === setId);
        setName = defaultSet?.name || 'Default Set';
      }
      
      console.log(`Audio generation: Loaded ${phrases.length} phrases for default set: ${setName}`);
    } else {
      // Regular user set - require authentication
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get flashcard set from database
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
      console.log(`Audio generation: Loaded ${phrases.length} phrases for user set: ${setName}`);
      
      // DEBUG: Show exactly what Thai text we have
      console.log('🔍 CRITICAL DEBUG - Thai text from database:');
      phrases.forEach((phrase, index) => {
        console.log(`🔍 Phrase ${index + 1}:`);
        console.log(`🔍   English: ${phrase.english}`);
        console.log(`🔍   Thai: "${phrase.thai}"`);
        console.log(`🔍   Thai Masculine: "${phrase.thaiMasculine}"`);
        console.log(`🔍   Thai Feminine: "${phrase.thaiFeminine}"`);
        console.log(`🔍   Has 'krub': ${phrase.thai?.includes('ครับ') || phrase.thai?.includes('krub')}`);
        console.log(`🔍   Has 'ka': ${phrase.thai?.includes('ค่ะ') || phrase.thai?.includes('ka')}`);
      });
    }
    
    // Generate audio lesson based on mode - NO PROGRESS TRACKING
    let audioBuffer: ArrayBuffer;
    
    if (mode === 'simple') {
      console.log('Creating SimpleAudioLessonGenerator...');
      const generator = new SimpleAudioLessonGenerator(config);
      audioBuffer = await generator.generateSimpleLesson(phrases, setName);
    } else {
      console.log('Creating AudioLessonGenerator...');
      const generator = new AudioLessonGenerator(config);
      audioBuffer = await generator.generateLesson(phrases, setName);
    }

    // Return audio file with cache-busting headers
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Disposition': `attachment; filename="${setName.replace(/[^a-z0-9]/gi, '_')}_lesson.wav"`,
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
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
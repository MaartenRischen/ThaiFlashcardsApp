import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/app/lib/prisma';
import { publishSetToGallery } from '@/app/lib/storage/gallery';
import { getSetContent } from '@/app/lib/storage/set-content';
import { PublishedSetData } from '@/app/lib/storage/types';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { setId, title, description, author } = await req.json();

    if (!setId || !title) {
      return NextResponse.json({ error: 'Missing required fields: setId and title' }, { status: 400 });
    }

    // Get the set metadata
    const set = await prisma.flashcardSet.findFirst({
      where: {
        id: setId,
        userId: userId
      }
    });

    if (!set) {
      return NextResponse.json({ error: 'Set not found or access denied' }, { status: 404 });
    }

    // Don't allow publishing default sets
    if (set.source === 'default') {
      return NextResponse.json({ error: 'Default sets cannot be published' }, { status: 400 });
    }

    // Get the set content (phrases)
    const phrases = await getSetContent(setId);
    
    if (!phrases || phrases.length === 0) {
      return NextResponse.json({ error: 'Set has no content to publish' }, { status: 400 });
    }

    // Check if a similar set is already published by this user
    // We'll check by title and author to prevent obvious duplicates
    const existingPublishedSet = await prisma.publishedSet.findFirst({
      where: {
        title: title.trim(),
        author: author.trim()
      }
    });

    if (existingPublishedSet) {
      return NextResponse.json({ 
        error: 'A set with this title and author already exists in the gallery' 
      }, { status: 409 });
    }

    // Prepare the data for publishing
    const publishData: PublishedSetData = {
      title: title.trim(),
      description: description?.trim(),
      imageUrl: set.imageUrl || undefined,
      cardCount: phrases.length,
      author: author.trim() || 'Anonymous',
      llmBrand: set.llmBrand,
      llmModel: set.llmModel,
      seriousnessLevel: set.seriousnessLevel,
      specificTopics: set.specificTopics,
      phrases: phrases
    };

    // Publish to gallery
    const publishedSet = await publishSetToGallery(publishData);

    return NextResponse.json({ 
      success: true, 
      publishedSetId: publishedSet.id,
      message: 'Set published successfully to the public gallery'
    });

  } catch (error) {
    console.error('Error publishing set:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to publish set' 
    }, { status: 500 });
  }
}

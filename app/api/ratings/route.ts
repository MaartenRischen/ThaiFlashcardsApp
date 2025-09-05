import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/app/lib/prisma';

// GET: Fetch user's rating for a specific set
export async function GET(request: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const publishedSetId = url.searchParams.get('publishedSetId');
  const flashcardSetId = url.searchParams.get('flashcardSetId');
  
  if (!publishedSetId && !flashcardSetId) {
    return NextResponse.json({ error: 'Either publishedSetId or flashcardSetId is required' }, { status: 400 });
  }

  try {
    let rating;
    
    if (publishedSetId) {
      rating = await prisma.setRating.findUnique({
        where: {
          userId_publishedSetId: {
            userId,
            publishedSetId
          }
        }
      });
    } else if (flashcardSetId) {
      // Check if this is a default set (should not be rateable)
      const flashcardSet = await prisma.flashcardSet.findUnique({
        where: { id: flashcardSetId },
        include: { folder: true }
      });
      
      if (flashcardSet?.folder?.name === 'Default Sets' || flashcardSet?.source === 'default') {
        return NextResponse.json({ error: 'Default sets cannot be rated' }, { status: 403 });
      }
      
      rating = await prisma.setRating.findUnique({
        where: {
          userId_flashcardSetId: {
            userId,
            flashcardSetId
          }
        }
      });
    }

    return NextResponse.json({ rating: rating?.rating || null });
  } catch (error) {
    console.error('Error fetching rating:', error);
    return NextResponse.json({ error: 'Failed to fetch rating' }, { status: 500 });
  }
}

// POST: Create or update a rating
export async function POST(request: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { publishedSetId, flashcardSetId, rating } = await request.json();
    
    if ((!publishedSetId && !flashcardSetId) || rating === undefined) {
      return NextResponse.json({ error: 'Either publishedSetId or flashcardSetId and rating are required' }, { status: 400 });
    }
    
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    let newRating;
    
    if (publishedSetId) {
      // Upsert rating for published set
      newRating = await prisma.setRating.upsert({
        where: {
          userId_publishedSetId: {
            userId,
            publishedSetId
          }
        },
        update: {
          rating,
          updatedAt: new Date()
        },
        create: {
          userId,
          publishedSetId,
          rating
        }
      });
    } else if (flashcardSetId) {
      // Check if this is a default set (should not be rateable)
      const flashcardSet = await prisma.flashcardSet.findUnique({
        where: { id: flashcardSetId },
        include: { folder: true }
      });
      
      if (flashcardSet?.folder?.name === 'Default Sets' || flashcardSet?.source === 'default') {
        return NextResponse.json({ error: 'Default sets cannot be rated' }, { status: 403 });
      }
      
      // Upsert rating for flashcard set
      newRating = await prisma.setRating.upsert({
        where: {
          userId_flashcardSetId: {
            userId,
            flashcardSetId
          }
        },
        update: {
          rating,
          updatedAt: new Date()
        },
        create: {
          userId,
          flashcardSetId,
          rating
        }
      });
    }

    return NextResponse.json({ rating: newRating });
  } catch (error) {
    console.error('Error saving rating:', error);
    return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 });
  }
}

// DELETE: Remove a rating
export async function DELETE(request: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const publishedSetId = url.searchParams.get('publishedSetId');
  const flashcardSetId = url.searchParams.get('flashcardSetId');
  
  if (!publishedSetId && !flashcardSetId) {
    return NextResponse.json({ error: 'Either publishedSetId or flashcardSetId is required' }, { status: 400 });
  }

  try {
    if (publishedSetId) {
      await prisma.setRating.delete({
        where: {
          userId_publishedSetId: {
            userId,
            publishedSetId
          }
        }
      });
    } else if (flashcardSetId) {
      await prisma.setRating.delete({
        where: {
          userId_flashcardSetId: {
            userId,
            flashcardSetId
          }
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting rating:', error);
    return NextResponse.json({ error: 'Failed to delete rating' }, { status: 500 });
  }
}
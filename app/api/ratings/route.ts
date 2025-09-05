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
  
  if (!publishedSetId) {
    return NextResponse.json({ error: 'publishedSetId is required' }, { status: 400 });
  }

  try {
    const rating = await prisma.setRating.findUnique({
      where: {
        userId_publishedSetId: {
          userId,
          publishedSetId
        }
      }
    });

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
    const { publishedSetId, rating } = await request.json();
    
    if (!publishedSetId || rating === undefined) {
      return NextResponse.json({ error: 'publishedSetId and rating are required' }, { status: 400 });
    }
    
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Upsert the rating
    const newRating = await prisma.setRating.upsert({
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
  
  if (!publishedSetId) {
    return NextResponse.json({ error: 'publishedSetId is required' }, { status: 400 });
  }

  try {
    await prisma.setRating.delete({
      where: {
        userId_publishedSetId: {
          userId,
          publishedSetId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting rating:', error);
    return NextResponse.json({ error: 'Failed to delete rating' }, { status: 500 });
  }
}

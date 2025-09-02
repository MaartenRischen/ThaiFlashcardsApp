import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/app/lib/prisma';
import { ALL_DEFAULT_SETS } from '@/app/data/default-sets';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all default sets for this user
    const userSets = await prisma.flashcardSet.findMany({
      where: {
        userId,
        source: 'default'
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        folderId: true,
        folder: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Get folder info
    const folders = await prisma.folder.findMany({
      where: {
        userId,
        isDefault: true
      },
      select: {
        id: true,
        name: true
      }
    });

    // Check for duplicates
    const setNames = userSets.map(s => s.name);
    const duplicateNames = setNames.filter((name, index) => setNames.indexOf(name) !== index);

    // Check for missing images
    const setsWithPlaceholderImages = userSets.filter(set => 
      !set.imageUrl || 
      set.imageUrl.includes('default-set-logo.png') || 
      set.imageUrl.includes('defaultnew.png')
    );

    // Check for unfiled sets
    const unfiledSets = userSets.filter(set => !set.folderId);

    return NextResponse.json({
      totalSets: userSets.length,
      expectedSets: ALL_DEFAULT_SETS.length + 1, // +1 for the original default set
      folders,
      duplicateNames: Array.from(new Set(duplicateNames)),
      setsWithPlaceholderImages,
      unfiledSets,
      allSets: userSets
    });

  } catch (error) {
    console.error('Debug default sets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

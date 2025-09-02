import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/app/lib/prisma';
import { ALL_DEFAULT_SETS } from '@/app/data/default-sets';

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      duplicatesRemoved: 0,
      imagesFixed: 0,
      foldersAssigned: 0
    };

    // Get all default sets for this user
    const userSets = await prisma.flashcardSet.findMany({
      where: {
        userId,
        source: 'default'
      },
      orderBy: {
        createdAt: 'asc' // Keep the oldest ones
      }
    });

    // Remove duplicates by name (keep the first occurrence)
    const seenNames = new Set<string>();
    const duplicatesToDelete = [];
    
    for (const set of userSets) {
      if (seenNames.has(set.name)) {
        duplicatesToDelete.push(set.id);
      } else {
        seenNames.add(set.name);
      }
    }

    if (duplicatesToDelete.length > 0) {
      await prisma.flashcardSet.deleteMany({
        where: {
          id: { in: duplicatesToDelete }
        }
      });
      results.duplicatesRemoved = duplicatesToDelete.length;
    }

    // Get remaining sets after duplicate removal
    const remainingSets = await prisma.flashcardSet.findMany({
      where: {
        userId,
        source: 'default'
      }
    });

    // Fix image URLs for sets with placeholder images
    const setsToUpdateImages = [];
    for (const set of remainingSets) {
      if (!set.imageUrl || 
          set.imageUrl.includes('default-set-logo.png') || 
          set.imageUrl.includes('defaultnew.png') ||
          set.imageUrl.includes('placeholder')) {
        
        let newImageUrl: string;
        
        // Extract the original set ID (remove user namespace if present)
        const originalSetId = set.id.includes('__') ? set.id.split('__')[0] : set.id;
        
        if (originalSetId.startsWith('common-words-')) {
          const setNumber = originalSetId.replace('common-words-', '');
          newImageUrl = `/images/defaults/default-common-words-${setNumber.padStart(2, '0')}.png`;
        } else if (originalSetId.startsWith('common-sentences-')) {
          const setNumber = originalSetId.replace('common-sentences-', '');
          newImageUrl = `/images/defaults/default-common-sentences-${setNumber}.png`;
        } else if (originalSetId === 'default') {
          newImageUrl = '/images/defaultnew.png';
        } else {
          // Find the index in ALL_DEFAULT_SETS
          const cleanId = originalSetId.replace('default-', '');
          const index = ALL_DEFAULT_SETS.findIndex(s => s.id === cleanId);
          if (index >= 0 && index < 12) {
            newImageUrl = `/images/defaults/default-thailand-${(index + 1).toString().padStart(2, '0')}.png`;
          } else {
            newImageUrl = '/images/defaultnew.png';
          }
        }
        
        setsToUpdateImages.push({
          id: set.id,
          imageUrl: newImageUrl
        });
      }
    }

    if (setsToUpdateImages.length > 0) {
      for (const update of setsToUpdateImages) {
        await prisma.flashcardSet.update({
          where: { id: update.id },
          data: { imageUrl: update.imageUrl }
        });
      }
      results.imagesFixed = setsToUpdateImages.length;
    }

    // Get folders for assignment
    const folders = await prisma.folder.findMany({
      where: {
        userId,
        isDefault: true
      }
    });

    const folderMap = new Map(folders.map(f => [f.name, f.id]));
    const defaultSetsFolderId = folderMap.get('Default Sets');
    const commonWordsFolderId = folderMap.get('100 Most Used Thai Words');
    const commonSentencesFolderId = folderMap.get('100 Most Used Thai Sentences');

    // Assign unfiled sets to proper folders
    const unfiledSets = remainingSets.filter(set => !set.folderId);
    const folderAssignments = [];

    for (const set of unfiledSets) {
      const originalSetId = set.id.includes('__') ? set.id.split('__')[0] : set.id;
      
      let folderId: string | undefined;
      if (originalSetId.startsWith('common-words-') && commonWordsFolderId) {
        folderId = commonWordsFolderId;
      } else if (originalSetId.startsWith('common-sentences-') && commonSentencesFolderId) {
        folderId = commonSentencesFolderId;
      } else if (defaultSetsFolderId) {
        folderId = defaultSetsFolderId;
      }

      if (folderId) {
        folderAssignments.push({
          id: set.id,
          folderId
        });
      }
    }

    if (folderAssignments.length > 0) {
      for (const assignment of folderAssignments) {
        await prisma.flashcardSet.update({
          where: { id: assignment.id },
          data: { folderId: assignment.folderId }
        });
      }
      results.foldersAssigned = folderAssignments.length;
    }

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Cleanup default sets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

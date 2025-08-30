import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/app/lib/prisma';
import { DEFAULT_FOLDERS } from '@/app/lib/storage/folders';

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(`[FIX-FOLDER-ASSIGNMENTS] Starting for user ${userId}`);
    
    // Get user's folders
    const folders = await prisma.folder.findMany({
      where: {
        userId,
        isDefault: true
      }
    });
    
    const folderMap = new Map(folders.map(f => [f.name, f.id]));
    const commonWordsFolderId = folderMap.get(DEFAULT_FOLDERS.COMMON_WORDS);
    const commonSentencesFolderId = folderMap.get(DEFAULT_FOLDERS.COMMON_SENTENCES);
    const defaultSetsFolderId = folderMap.get(DEFAULT_FOLDERS.DEFAULT_SETS);
    
    if (!commonWordsFolderId || !commonSentencesFolderId || !defaultSetsFolderId) {
      return NextResponse.json({ error: 'Missing required folders' }, { status: 400 });
    }
    
    // Get all default sets for the user
    const defaultSets = await prisma.flashcardSet.findMany({
      where: {
        userId,
        source: 'default'
      }
    });
    
    console.log(`[FIX-FOLDER-ASSIGNMENTS] Found ${defaultSets.length} default sets`);
    
    // Categorize sets and update them
    const updates = [];
    let commonWordsCount = 0;
    let commonSentencesCount = 0;
    let defaultCount = 0;
    
    for (const set of defaultSets) {
      let targetFolderId: string;
      
      if (set.id.startsWith('common-words-')) {
        targetFolderId = commonWordsFolderId;
        commonWordsCount++;
      } else if (set.id.startsWith('common-sentences-')) {
        targetFolderId = commonSentencesFolderId;
        commonSentencesCount++;
      } else {
        targetFolderId = defaultSetsFolderId;
        defaultCount++;
      }
      
      // Only update if the folder is different
      if (set.folderId !== targetFolderId) {
        updates.push(
          prisma.flashcardSet.update({
            where: { id: set.id },
            data: { folderId: targetFolderId }
          })
        );
      }
    }
    
    // Execute all updates
    if (updates.length > 0) {
      await prisma.$transaction(updates);
      console.log(`[FIX-FOLDER-ASSIGNMENTS] Updated ${updates.length} sets`);
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Fixed folder assignments for ${defaultSets.length} sets`,
      stats: {
        total: defaultSets.length,
        updated: updates.length,
        commonWords: commonWordsCount,
        commonSentences: commonSentencesCount,
        defaultSets: defaultCount
      }
    });
    
  } catch (error) {
    console.error('[FIX-FOLDER-ASSIGNMENTS] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fix folder assignments',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

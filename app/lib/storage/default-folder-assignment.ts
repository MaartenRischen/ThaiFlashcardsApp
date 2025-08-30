import { prisma } from '../prisma';
import { DEFAULT_FOLDERS } from './folders';

/**
 * Assigns default sets to their appropriate folders for a user
 */
export async function assignDefaultSetsToFolders(userId: string) {
  try {
    // Get or create default folders
    const folders = await prisma.folder.findMany({
      where: {
        userId,
        isDefault: true
      }
    });

    if (folders.length === 0) {
      console.log('No default folders found for user, skipping assignment');
      return;
    }

    // Create a map of folder names to IDs
    const folderMap = new Map(folders.map(f => [f.name, f.id]));

    // Get all sets for the user
    const sets = await prisma.flashcardSet.findMany({
      where: {
        userId,
        source: 'default',
        folderId: null // Only assign sets that aren't already in a folder
      }
    });

    if (sets.length === 0) {
      console.log('No unassigned default sets found');
      return;
    }

    // Batch update sets to their appropriate folders
    const updates = [];

    for (const set of sets) {
      let folderId: string | undefined;

      // Determine which folder based on set ID
      if (set.id.startsWith('default-common-words-')) {
        folderId = folderMap.get(DEFAULT_FOLDERS.COMMON_WORDS);
      } else if (set.id.startsWith('default-common-sentences-')) {
        folderId = folderMap.get(DEFAULT_FOLDERS.COMMON_SENTENCES);
      } else if (set.id.startsWith('default-') && !set.id.includes('common')) {
        // Original default sets
        folderId = folderMap.get(DEFAULT_FOLDERS.DEFAULT_SETS);
      }

      if (folderId) {
        updates.push(
          prisma.flashcardSet.update({
            where: { id: set.id },
            data: { folderId }
          })
        );
      }
    }

    // Execute all updates
    if (updates.length > 0) {
      await prisma.$transaction(updates);
      console.log(`Assigned ${updates.length} sets to folders for user ${userId}`);
    }
  } catch (error) {
    console.error('Error assigning default sets to folders:', error);
  }
}

/**
 * Ensures default folders exist and default sets are assigned for unauthenticated users
 * Returns folder information for default sets
 */
export function getDefaultSetFolderMapping(): Record<string, string> {
  return {
    'default': DEFAULT_FOLDERS.DEFAULT_SETS,
    'default-proverbs': DEFAULT_FOLDERS.DEFAULT_SETS,
    'default-animals': DEFAULT_FOLDERS.DEFAULT_SETS,
    'default-colors': DEFAULT_FOLDERS.DEFAULT_SETS,
    'default-numbers': DEFAULT_FOLDERS.DEFAULT_SETS,
    'default-family': DEFAULT_FOLDERS.DEFAULT_SETS,
    'default-months': DEFAULT_FOLDERS.DEFAULT_SETS,
    'default-body-parts': DEFAULT_FOLDERS.DEFAULT_SETS,
    'default-clothing': DEFAULT_FOLDERS.DEFAULT_SETS,
    'default-transportation': DEFAULT_FOLDERS.DEFAULT_SETS,
    'default-food': DEFAULT_FOLDERS.DEFAULT_SETS,
    'default-common-words-1': DEFAULT_FOLDERS.COMMON_WORDS,
    'default-common-words-2': DEFAULT_FOLDERS.COMMON_WORDS,
    'default-common-words-3': DEFAULT_FOLDERS.COMMON_WORDS,
    'default-common-words-4': DEFAULT_FOLDERS.COMMON_WORDS,
    'default-common-words-5': DEFAULT_FOLDERS.COMMON_WORDS,
    'default-common-words-6': DEFAULT_FOLDERS.COMMON_WORDS,
    'default-common-words-7': DEFAULT_FOLDERS.COMMON_WORDS,
    'default-common-words-8': DEFAULT_FOLDERS.COMMON_WORDS,
    'default-common-words-9': DEFAULT_FOLDERS.COMMON_WORDS,
    'default-common-words-10': DEFAULT_FOLDERS.COMMON_WORDS,
    'default-common-sentences-1': DEFAULT_FOLDERS.COMMON_SENTENCES,
    'default-common-sentences-2': DEFAULT_FOLDERS.COMMON_SENTENCES,
    'default-common-sentences-3': DEFAULT_FOLDERS.COMMON_SENTENCES,
    'default-common-sentences-4': DEFAULT_FOLDERS.COMMON_SENTENCES,
    'default-common-sentences-5': DEFAULT_FOLDERS.COMMON_SENTENCES,
    'default-common-sentences-6': DEFAULT_FOLDERS.COMMON_SENTENCES,
    'default-common-sentences-7': DEFAULT_FOLDERS.COMMON_SENTENCES,
    'default-common-sentences-8': DEFAULT_FOLDERS.COMMON_SENTENCES,
    'default-common-sentences-9': DEFAULT_FOLDERS.COMMON_SENTENCES,
    'default-common-sentences-10': DEFAULT_FOLDERS.COMMON_SENTENCES,
  };
}

/**
 * Assigns user-generated sets to their appropriate folders
 * This is for older users who created sets before the folder system
 */
export async function assignUserSetsToFolders(userId: string) {
  try {
    // Get user's folders
    const folders = await prisma.folder.findMany({
      where: {
        userId,
        isDefault: true
      }
    });

    if (folders.length === 0) {
      console.log('No folders found for user, skipping user set assignment');
      return;
    }

    // Create a map of folder names to IDs
    const folderMap = new Map(folders.map(f => [f.name, f.id]));

    // Get manual sets folder ID
    const manualFolderId = folderMap.get(DEFAULT_FOLDERS.MY_MANUAL_SETS);
    // Get automatic sets folder ID
    const autoFolderId = folderMap.get(DEFAULT_FOLDERS.MY_AUTOMATIC_SETS);

    if (!manualFolderId || !autoFolderId) {
      console.log('Missing manual or automatic sets folders');
      return;
    }

    // Get all user-generated sets without folder assignments
    const unassignedSets = await prisma.flashcardSet.findMany({
      where: {
        userId,
        source: {
          in: ['manual', 'generated', 'auto']
        },
        folderId: null
      }
    });

    if (unassignedSets.length === 0) {
      console.log('No unassigned user sets found');
      return;
    }

    console.log(`Found ${unassignedSets.length} unassigned user sets`);

    // Batch update sets to their appropriate folders
    const updates = [];

    for (const set of unassignedSets) {
      const folderId = set.source === 'manual' ? manualFolderId : autoFolderId;
      
      updates.push(
        prisma.flashcardSet.update({
          where: { id: set.id },
          data: { folderId }
        })
      );
    }

    // Execute all updates
    if (updates.length > 0) {
      await prisma.$transaction(updates);
      console.log(`Assigned ${updates.length} user sets to folders for user ${userId}`);
    }
  } catch (error) {
    console.error('Error assigning user sets to folders:', error);
  }
}

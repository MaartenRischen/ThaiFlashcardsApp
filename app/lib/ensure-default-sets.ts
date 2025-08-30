import { prisma } from './prisma';
import { ALL_DEFAULT_SETS } from '@/app/data/default-sets';
import { INITIAL_PHRASES } from '@/app/data/phrases';
import { DEFAULT_FOLDERS, createDefaultFolders } from './storage/folders';
import { assignUserSetsToFolders, assignDefaultSetsToFolders } from './storage/default-folder-assignment';

/**
 * Ensures a user has all default sets in their account
 * This is important for older users who might be missing newer default sets
 */
export async function ensureUserHasAllDefaultSets(userId: string) {
  try {
    console.log(`[ENSURE-DEFAULT-SETS] Checking default sets for user ${userId}`);
    
    // First ensure user exists
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId },
    });
    
    // Ensure default folders exist
    await createDefaultFolders(userId);
    console.log(`[ENSURE-DEFAULT-SETS] Ensured default folders exist for user ${userId}`);
    
    // Get user's existing default sets
    const existingSets = await prisma.flashcardSet.findMany({
      where: {
        userId,
        source: 'default'
      },
      select: {
        id: true
      }
    });
    
    const existingSetIds = new Set(existingSets.map(s => s.id));
    console.log(`[ENSURE-DEFAULT-SETS] User has ${existingSetIds.size} existing default sets`);
    
    // Get user's folders
    const folders = await prisma.folder.findMany({
      where: {
        userId,
        isDefault: true
      }
    });
    
    const folderMap = new Map(folders.map(f => [f.name, f.id]));
    
    // Verify we have all expected folders
    if (!folderMap.has(DEFAULT_FOLDERS.DEFAULT_SETS) || 
        !folderMap.has(DEFAULT_FOLDERS.COMMON_WORDS) || 
        !folderMap.has(DEFAULT_FOLDERS.COMMON_SENTENCES)) {
      console.log(`[ENSURE-DEFAULT-SETS] Missing some folders, recreating...`);
      await createDefaultFolders(userId);
      
      // Re-fetch folders after creation
      const updatedFolders = await prisma.folder.findMany({
        where: {
          userId,
          isDefault: true
        }
      });
      folderMap.clear();
      updatedFolders.forEach(f => folderMap.set(f.name, f.id));
    }
    
    // Check for the original default set
    if (!existingSetIds.has('default')) {
      console.log(`[ENSURE-DEFAULT-SETS] Creating original default set for user`);
      const folderId = folderMap.get(DEFAULT_FOLDERS.DEFAULT_SETS);
      
      await prisma.flashcardSet.create({
        data: {
          id: 'default',
          userId,
          name: 'Default Set',
          source: 'default',
          imageUrl: '/images/defaultnew.png',
          folderId,
          phrases: {
            create: INITIAL_PHRASES.map(phrase => ({
              english: phrase.english,
              thai: phrase.thai,
              thaiMasculine: phrase.thaiMasculine,
              thaiFeminine: phrase.thaiFeminine,
              pronunciation: phrase.pronunciation,
              mnemonic: phrase.mnemonic || '',
              examplesJson: phrase.examples ? JSON.stringify(phrase.examples) : '[]'
            }))
          }
        }
      });
    }
    
    // Check for all other default sets
    const setsToCreate = [];
    for (const defaultSet of ALL_DEFAULT_SETS) {
      if (!existingSetIds.has(defaultSet.id)) {
        console.log(`[ENSURE-DEFAULT-SETS] User missing set: ${defaultSet.id}`);
        
        // Determine folder based on the original set ID (without 'default-' prefix)
        let folderId: string | undefined;
        if (defaultSet.id.startsWith('common-words-')) {
          folderId = folderMap.get(DEFAULT_FOLDERS.COMMON_WORDS);
        } else if (defaultSet.id.startsWith('common-sentences-')) {
          folderId = folderMap.get(DEFAULT_FOLDERS.COMMON_SENTENCES);
        } else {
          folderId = folderMap.get(DEFAULT_FOLDERS.DEFAULT_SETS);
        }
        
        // Determine which image to use based on set ID
        let imageUrl: string;
        if (defaultSet.id.startsWith('common-words-')) {
          const setNumber = defaultSet.id.replace('common-words-', '');
          imageUrl = `/images/defaults/default-common-words-${setNumber.padStart(2, '0')}.png`;
        } else if (defaultSet.id.startsWith('common-sentences-')) {
          const setNumber = defaultSet.id.replace('common-sentences-', '');
          imageUrl = `/images/defaults/default-common-sentences-${setNumber}.png`;
        } else {
          // Use original thailand images for other sets
          const index = ALL_DEFAULT_SETS.findIndex(s => s.id === defaultSet.id);
          imageUrl = `/images/defaults/default-thailand-${(index + 1).toString().padStart(2, '0')}.png`;
        }
        
        setsToCreate.push({
          id: defaultSet.id,
          userId,
          name: defaultSet.name,
          source: 'default' as const,
          imageUrl,
          level: defaultSet.level as 'complete beginner' | 'basic understanding' | 'intermediate' | 'advanced' | 'native/fluent' | 'god mode',
          goals: [],
          specificTopics: defaultSet.description,
          seriousnessLevel: null,
          folderId
        });
      }
    }
    
    if (setsToCreate.length > 0) {
      console.log(`[ENSURE-DEFAULT-SETS] Creating ${setsToCreate.length} missing default sets`);
      
      // Create all missing sets
      await prisma.flashcardSet.createMany({
        data: setsToCreate
      });
      
      // Now create phrases for each set
      for (const setData of setsToCreate) {
        const defaultSet = ALL_DEFAULT_SETS.find(s => s.id === setData.id);
        if (defaultSet && defaultSet.phrases) {
          await prisma.phrase.createMany({
            data: defaultSet.phrases.map(phrase => ({
              setId: setData.id,
              english: phrase.english,
              thai: phrase.thai,
              thaiMasculine: phrase.thaiMasculine,
              thaiFeminine: phrase.thaiFeminine,
              pronunciation: phrase.pronunciation,
              mnemonic: phrase.mnemonic || '',
              examplesJson: phrase.examples ? JSON.stringify(phrase.examples) : '[]'
            }))
          });
        }
      }
    }
    
    // Assign any unassigned default sets to their appropriate folders
    console.log(`[ENSURE-DEFAULT-SETS] Assigning default sets to folders for ${userId}`);
    await assignDefaultSetsToFolders(userId);
    
    // Assign any unassigned user-generated sets to their appropriate folders
    console.log(`[ENSURE-DEFAULT-SETS] Assigning user sets to folders for ${userId}`);
    await assignUserSetsToFolders(userId);
    
    console.log(`[ENSURE-DEFAULT-SETS] Completed for user ${userId}`);
  } catch (error) {
    console.error('[ENSURE-DEFAULT-SETS] Error:', error);
    throw error;
  }
}

import { ALL_DEFAULT_SETS } from '@/app/data/default-sets';
import { INITIAL_PHRASES, Phrase } from '@/app/data/phrases';
import { SetMetaData } from './storage/types';
import { DEFAULT_FOLDERS } from './storage/folders';
import { getDefaultSetFolderMapping } from './storage/default-folder-assignment';

/**
 * Makes default sets available for non-authenticated users
 */
export function getDefaultSetsForUnauthenticatedUsers(): SetMetaData[] {
  console.log('[SEED-DEFAULT-SETS] Getting default sets for unauthenticated users');
  console.log('[SEED-DEFAULT-SETS] ALL_DEFAULT_SETS length:', ALL_DEFAULT_SETS.length);
  
  const folderMapping = getDefaultSetFolderMapping();
  
  const defaultSets: SetMetaData[] = [
    {
      id: 'default',
      name: 'Default Set',
      createdAt: new Date().toISOString(),
      phraseCount: INITIAL_PHRASES.length,
      source: 'default',
      isFullyLearned: false,
      seriousnessLevel: null,
      toneLevel: null,
      folderName: folderMapping['default']
    }
  ];
  
  // Add all the new default sets
  ALL_DEFAULT_SETS.forEach((set, index) => {
    // Determine which image to use based on set ID
    let imageUrl: string;
    if (set.id.startsWith('common-words-')) {
      const setNumber = set.id.replace('common-words-', '');
      imageUrl = `/images/defaults/default-common-words-${setNumber.padStart(2, '0')}.png`;
    } else if (set.id.startsWith('common-sentences-')) {
      const setNumber = set.id.replace('common-sentences-', '');
      imageUrl = `/images/defaults/default-common-sentences-${setNumber}.png`;
    } else {
      // Use original thailand images for the first 6 sets
      imageUrl = `/images/defaults/default-thailand-${(index + 1).toString().padStart(2, '0')}.png`;
    }
    
    const setId = `default-${set.id}`;
    defaultSets.push({
      id: setId,
      name: set.name,
      createdAt: new Date().toISOString(),
      phraseCount: set.phrases.length,
      source: 'default',
      level: set.level as 'complete beginner' | 'basic understanding' | 'intermediate' | 'advanced' | 'native/fluent' | 'god mode',
      specificTopics: set.description,
      imageUrl,
      isFullyLearned: false,
      seriousnessLevel: null,
      toneLevel: null,
      folderName: folderMapping[setId]
    });
  });
  
  console.log('[SEED-DEFAULT-SETS] Total default sets:', defaultSets.length);
  console.log('[SEED-DEFAULT-SETS] Default set IDs:', defaultSets.map(s => s.id));
  
  return defaultSets;
}

/**
 * Gets content for a default set by ID
 */
export function getDefaultSetContent(setId: string): Phrase[] | null {
  if (setId === 'default') {
    return INITIAL_PHRASES;
  }
  
  // Check if it's one of the new default sets
  const defaultSetId = setId.replace('default-', '');
  const defaultSet = ALL_DEFAULT_SETS.find(set => set.id === defaultSetId);
  
  if (defaultSet) {
    return defaultSet.phrases;
  }
  
  return null;
} 
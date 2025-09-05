import { ALL_DEFAULT_SETS } from '@/app/data/default-sets';
import { INITIAL_PHRASES, Phrase } from '@/app/data/phrases';
import { SetMetaData } from './storage/types';
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
      imageUrl: '/images/thumbnails/defaultnew.png',
      isFullyLearned: false,
      seriousnessLevel: null,
      toneLevel: null,
      folderName: folderMapping['default']
    }
  ];
  
  // Load ALL default sets - we need metadata for the folders to work
  ALL_DEFAULT_SETS.forEach((set, index) => {
    // Determine which image to use based on set ID - use thumbnails for faster loading
    let imageUrl: string;
    if (set.id.startsWith('common-words-')) {
      const setNumber = set.id.replace('common-words-', '');
      imageUrl = `/images/thumbnails/defaults/default-common-words-${setNumber.padStart(2, '0')}.png`;
    } else if (set.id.startsWith('common-sentences-')) {
      const setNumber = set.id.replace('common-sentences-', '');
      imageUrl = `/images/thumbnails/defaults/default-common-sentences-${setNumber}.png`;
    } else {
      // Map specific sets to their correct images
      const imageMapping: Record<string, string> = {
        'numbers-1-10': 'default-thailand-01.png',
        'basic-colors': 'default-thailand-02.png',
        'days-of-week': 'default-thailand-03.png',
        'family-members': 'default-thailand-04.png',
        'months-of-year': 'default-thailand-05.png',
        'body-parts': 'default-thailand-06.png'
      };
      imageUrl = `/images/thumbnails/defaults/${imageMapping[set.id] || `default-thailand-${(index + 1).toString().padStart(2, '0')}.png`}`;
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
  console.log(`[getDefaultSetContent] Looking for content for set: ${setId}`);
  
  if (setId === 'default') {
    console.log(`[getDefaultSetContent] Returning INITIAL_PHRASES for default set`);
    return INITIAL_PHRASES;
  }
  
  // Check if it's one of the new default sets
  const defaultSetId = setId.replace('default-', '');
  console.log(`[getDefaultSetContent] Looking for set with ID: ${defaultSetId}`);
  
  const defaultSet = ALL_DEFAULT_SETS.find(set => set.id === defaultSetId);
  
  if (defaultSet) {
    console.log(`[getDefaultSetContent] Found set ${defaultSet.name} with ${defaultSet.phrases.length} phrases`);
    return defaultSet.phrases;
  }
  
  console.warn(`[getDefaultSetContent] No content found for set ${setId}`);
  return null;
} 
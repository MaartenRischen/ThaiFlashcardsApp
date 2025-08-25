import { ALL_DEFAULT_SETS } from '@/app/data/default-sets';
import { INITIAL_PHRASES, Phrase } from '@/app/data/phrases';
import { SetMetaData } from './storage/types';

/**
 * Makes default sets available for non-authenticated users
 */
export function getDefaultSetsForUnauthenticatedUsers(): SetMetaData[] {
  console.log('[SEED-DEFAULT-SETS] Getting default sets for unauthenticated users');
  console.log('[SEED-DEFAULT-SETS] ALL_DEFAULT_SETS length:', ALL_DEFAULT_SETS.length);
  
  const defaultSets: SetMetaData[] = [
    {
      id: 'default',
      name: 'Default Set',
      createdAt: new Date().toISOString(),
      phraseCount: INITIAL_PHRASES.length,
      source: 'default',
      isFullyLearned: false,
      seriousnessLevel: null,
      toneLevel: null
    }
  ];
  
  // Add all the new default sets
  ALL_DEFAULT_SETS.forEach((set, index) => {
    defaultSets.push({
      id: `default-${set.id}`,
      name: set.name,
      createdAt: new Date().toISOString(),
      phraseCount: set.phrases.length,
      source: 'default',
      level: set.level as 'complete beginner' | 'basic understanding' | 'intermediate' | 'advanced' | 'native/fluent' | 'god mode',
      specificTopics: set.description,
      imageUrl: `/images/defaults/default-thailand-${(index + 1).toString().padStart(2, '0')}.png`,
      isFullyLearned: false,
      seriousnessLevel: null,
      toneLevel: null
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
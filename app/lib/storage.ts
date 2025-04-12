import { Phrase } from '../lib/set-generator';
import { v4 as uuidv4 } from 'uuid';

// Storage key prefixes
const PREFIX = 'thaiFlashcards_';
const AVAILABLE_SETS_KEY = `${PREFIX}availableSets`;
const setContentKey = (id: string) => `${PREFIX}content_${id}`;
const setProgressKey = (id: string) => `${PREFIX}progress_${id}`;

// --- Type Definitions --- 
export interface SetMetaData { 
  id: string; 
  name: string; 
  cleverTitle?: string;
  createdAt: string; 
  phraseCount: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  goals?: string[];
  specificTopics?: string;
  source: 'default' | 'import' | 'generated';
  isFullyLearned?: boolean; // Keep the flag here
}

export interface PhraseProgressData {
  srsLevel: number;
  nextReviewDate: string; 
  lastReviewedDate: string;
  difficulty: 'easy' | 'good' | 'hard';
  repetitions: number;
  easeFactor: number;
}

export type SetProgress = { [cardIndex: number]: PhraseProgressData };

// --- Helper Functions --- 
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key “${key}”:`, error);
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting localStorage key “${key}”:`, error);
    return false;
  }
}

// --- Set MetaData Management --- 

export function getAllSetMetaData(): SetMetaData[] {
  const allSets = getFromStorage<SetMetaData[]>(AVAILABLE_SETS_KEY, []);
  // Ensure the default isFullyLearned value is present
  return allSets.map(set => ({ ...set, isFullyLearned: set.isFullyLearned ?? false }));
}

export function saveAllSetMetaData(sets: SetMetaData[]): boolean {
  // Ensure the flag is set before saving
  const setsToSave = sets.map(set => ({ ...set, isFullyLearned: set.isFullyLearned ?? false }));
  return setToStorage(AVAILABLE_SETS_KEY, setsToSave);
}

export function addSetMetaData(newSet: SetMetaData): boolean {
  const sets = getAllSetMetaData();
  // Ensure flag on new set
  const setToAdd = { ...newSet, isFullyLearned: newSet.isFullyLearned ?? false };
  sets.push(setToAdd);
  return saveAllSetMetaData(sets);
}

export function updateSetMetaData(updatedSet: SetMetaData): boolean {
  let sets = getAllSetMetaData();
  const index = sets.findIndex(set => set.id === updatedSet.id);
  if (index !== -1) {
    // Ensure flag on updated set
    sets[index] = { ...updatedSet, isFullyLearned: updatedSet.isFullyLearned ?? false };
    return saveAllSetMetaData(sets);
  } 
  return false;
}

export function deleteSetMetaData(id: string): boolean {
  let sets = getAllSetMetaData();
  const filteredSets = sets.filter(set => set.id !== id);
  // Also delete content and progress associated with the set
  deleteSetContent(id);
  deleteSetProgress(id);
  return saveAllSetMetaData(filteredSets);
}

// --- Set Content Management --- 

export function getSetContent(setId: string): Phrase[] | null {
  return getFromStorage<Phrase[] | null>(setContentKey(setId), null);
}

export function saveSetContent(setId: string, phrases: Phrase[]): boolean {
  return setToStorage(setContentKey(setId), phrases);
}

export function deleteSetContent(setId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.removeItem(setContentKey(setId));
    return true;
  } catch (error) {
    console.error(`Error deleting set content for ${setId}:`, error);
    return false;
  }
}

// --- Set Progress Management --- 

export function getSetProgress(setId: string): SetProgress {
  return getFromStorage<SetProgress>(setProgressKey(setId), {});
}

export function saveSetProgress(setId: string, progress: SetProgress): boolean {
  return setToStorage(setProgressKey(setId), progress);
}

export function deleteSetProgress(setId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.removeItem(setProgressKey(setId));
    return true;
  } catch (error) {
    console.error(`Error deleting progress for ${setId}:`, error);
    return false;
  }
}

// --- Utility --- 

export function generateUUID(): string {
  return uuidv4();
} 
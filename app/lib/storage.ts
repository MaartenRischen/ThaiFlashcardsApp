import { Phrase } from '../lib/set-generator';
import { v4 as uuidv4 } from 'uuid';

// Storage key prefixes
const PREFIX = 'thaiFlashcards_';
const AVAILABLE_SETS_KEY = `${PREFIX}availableSets`;
const ACTIVE_SET_ID_KEY = `${PREFIX}activeSetId`;
const setContentKey = (id: string) => `${PREFIX}set_${id}`;
const setProgressKey = (id: string) => `${PREFIX}progress_${id}`;

// Type definitions
export interface SetMetaData {
  id: string;
  name: string;
  cleverTitle?: string;
  createdAt: string;
  phraseCount: number;
  level?: string;
  goals?: string[];
  specificTopics?: string;
  source: 'default' | 'wizard' | 'import';
}

export interface CardProgressData {
  srsLevel: number;
  nextReviewDate: string;
  lastReviewedDate: string;
  difficulty: 'new' | 'hard' | 'good' | 'easy';
  repetitions: number;
  easeFactor: number;
}

export interface SetProgress {
  [cardIndex: number]: CardProgressData;
}

// Helper Functions

/**
 * Safely get data from localStorage with error handling
 */
function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Safely set data to localStorage with error handling
 */
function setToStorage(key: string, value: any): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
    return false;
  }
}

/**
 * Get all available sets
 */
export function getAvailableSets(): SetMetaData[] {
  return getFromStorage<SetMetaData[]>(AVAILABLE_SETS_KEY, []);
}

/**
 * Save the list of available sets
 */
export function saveAvailableSets(sets: SetMetaData[]): boolean {
  return setToStorage(AVAILABLE_SETS_KEY, sets);
}

/**
 * Get content of a specific set
 */
export function getSetContent(setId: string): Phrase[] | null {
  return getFromStorage<Phrase[] | null>(setContentKey(setId), null);
}

/**
 * Save content of a specific set
 */
export function saveSetContent(setId: string, phrases: Phrase[]): boolean {
  return setToStorage(setContentKey(setId), phrases);
}

/**
 * Delete content of a specific set
 */
export function deleteSetContent(setId: string): boolean {
  try {
    localStorage.removeItem(setContentKey(setId));
    return true;
  } catch (error) {
    console.error(`Error deleting set content for ${setId}:`, error);
    return false;
  }
}

/**
 * Get progress for a specific set
 */
export function getSetProgress(setId: string): SetProgress {
  return getFromStorage<SetProgress>(setProgressKey(setId), {});
}

/**
 * Save progress for a specific set
 */
export function saveSetProgress(setId: string, progress: SetProgress): boolean {
  return setToStorage(setProgressKey(setId), progress);
}

/**
 * Delete progress for a specific set
 */
export function deleteSetProgress(setId: string): boolean {
  try {
    localStorage.removeItem(setProgressKey(setId));
    return true;
  } catch (error) {
    console.error(`Error deleting progress for ${setId}:`, error);
    return false;
  }
}

/**
 * Get ID of the active set
 */
export function getActiveSetId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_SET_ID_KEY);
  } catch (error) {
    console.error(`Error getting active set ID:`, error);
    return null;
  }
}

/**
 * Set the active set ID
 */
export function setActiveSetId(setId: string): boolean {
  try {
    localStorage.setItem(ACTIVE_SET_ID_KEY, setId);
    return true;
  } catch (error) {
    console.error(`Error setting active set ID:`, error);
    return false;
  }
}

/**
 * Generate a UUID for new sets
 */
export function generateUUID(): string {
  return uuidv4();
} 
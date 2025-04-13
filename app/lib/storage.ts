import { Phrase } from '../lib/set-generator';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabaseClient'; // Correct path assuming it's in the same lib directory

// Storage key prefixes
const PREFIX = 'thaiFlashcards_';
const AVAILABLE_SETS_KEY = `${PREFIX}availableSets`;
const setContentKey = (id: string) => `${PREFIX}content_${id}`;
const setProgressKey = (id: string) => `${PREFIX}progress_${id}`;

// --- Type Definitions --- 

// Interface matching the Supabase FlashcardSet table (based on schema visualizer)
interface FlashcardSetRecord {
  id: string;
  userId: string;
  name: string;
  cleverTitle?: string | null;
  level?: string | null;
  goals?: string[] | null; // Assuming stored as text[] or similar in Supabase
  specificTopics?: string | null;
  source: string;
  createdAt: string; // Timestamptz becomes string
  updatedAt?: string;
  phraseCount?: number | null; // Added phraseCount, assuming it exists
}

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
  isFullyLearned?: boolean; // Keep the flag here (not in DB)
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

// --- Helper Functions (Local Storage - Keep temporarily) --- 
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

// Fetches from Supabase
export async function getAllSetMetaData(userId: string): Promise<SetMetaData[]> {
  if (!userId) {
    console.error("getAllSetMetaData called without userId.");
    return [];
  }
  console.log(`Fetching SetMetaData from Supabase for userId: ${userId}`);
  try {
    // Explicitly select columns matching FlashcardSetRecord
    const { data, error } = await supabase
      .from('FlashcardSet')
      .select('id, userId, name, cleverTitle, level, goals, specificTopics, source, createdAt, updatedAt, phraseCount')
      .eq('userId', userId);

    if (error) {
      console.error('Error fetching SetMetaData from Supabase:', error);
      throw error; 
    }
    console.log('Successfully fetched SetMetaData:', data);
    const sets = data || [];

    // Map Supabase record to SetMetaData interface
    return sets.map((dbSet: FlashcardSetRecord) => ({ // Add type to dbSet
      id: dbSet.id,
      name: dbSet.name,
      cleverTitle: dbSet.cleverTitle || undefined,
      createdAt: dbSet.createdAt, 
      phraseCount: dbSet.phraseCount || 0, // Use fetched or default
      level: dbSet.level as SetMetaData['level'] || undefined, // Cast level
      goals: dbSet.goals || [], 
      specificTopics: dbSet.specificTopics || undefined,
      source: dbSet.source as SetMetaData['source'] || 'generated', // Cast source
      isFullyLearned: false // Default to false
    }));

  } catch (error) {
    console.error('Unexpected error in getAllSetMetaData:', error);
    return []; 
  }
}

// REFACTOR: Insert into Supabase instead of localStorage
export async function addSetMetaData(userId: string, newSetMetaData: Omit<SetMetaData, 'id' | 'createdAt' | 'phraseCount'> & { phraseCount: number }): Promise<SetMetaData | null> {
  if (!userId) {
    console.error("addSetMetaData called without userId.");
    return null;
  }
  if (!newSetMetaData) {
    console.error("addSetMetaData called without newSetMetaData.");
    return null;
  }

  const newSetId = uuidv4();
  const createdAt = new Date().toISOString();

  // Prepare record for Supabase, matching FlashcardSetRecord structure
  const recordToInsert: Omit<FlashcardSetRecord, 'updatedAt'> = {
    id: newSetId,
    userId: userId,
    name: newSetMetaData.name,
    cleverTitle: newSetMetaData.cleverTitle || null,
    level: newSetMetaData.level || null,
    goals: newSetMetaData.goals || null,
    specificTopics: newSetMetaData.specificTopics || null,
    source: newSetMetaData.source,
    createdAt: createdAt,
    phraseCount: newSetMetaData.phraseCount
  };

  console.log(`Inserting SetMetaData into Supabase for userId: ${userId}`, recordToInsert);

  try {
    const { data, error } = await supabase
      .from('FlashcardSet')
      .insert(recordToInsert)
      .select() // Select the newly inserted record
      .single(); // Expect only one record back

    if (error) {
      console.error('Error inserting SetMetaData into Supabase:', error);
      throw error; // Re-throw
    }

    if (!data) {
        console.error('Supabase insert did not return the new record.');
        return null;
    }

    console.log('Successfully inserted SetMetaData:', data);

    // Convert the returned DB record back to SetMetaData format
    const insertedRecord = data as FlashcardSetRecord;
    const resultMetaData: SetMetaData = {
      id: insertedRecord.id,
      name: insertedRecord.name,
      cleverTitle: insertedRecord.cleverTitle || undefined,
      createdAt: insertedRecord.createdAt,
      phraseCount: insertedRecord.phraseCount || 0,
      level: insertedRecord.level as SetMetaData['level'] || undefined,
      goals: insertedRecord.goals || [],
      specificTopics: insertedRecord.specificTopics || undefined,
      source: insertedRecord.source as SetMetaData['source'] || 'generated',
      isFullyLearned: false // Default
    };
    return resultMetaData;

  } catch (error) {
    console.error('Unexpected error in addSetMetaData:', error);
    return null; // Return null on unexpected errors
  }
}

// KEEPING OLD FUNCTIONS TEMPORARILY - Need refactoring
export function saveAllSetMetaData(sets: SetMetaData[]): boolean {
  // This function is likely obsolete with DB storage, 
  // unless batch updates are needed later.
  console.warn('saveAllSetMetaData using localStorage - needs refactoring/removal for Supabase');
  return false; // No longer directly applicable
}

export function updateSetMetaData(updatedSet: SetMetaData): boolean {
  // TODO: Refactor this to update Supabase FlashcardSet table by id
  console.warn('updateSetMetaData using localStorage - needs refactoring for Supabase');
  // let sets = getAllSetMetaData(); // Needs userId, async
  // const index = sets.findIndex(set => set.id === updatedSet.id);
  // if (index !== -1) {
  //   sets[index] = { ...updatedSet, isFullyLearned: updatedSet.isFullyLearned ?? false };
  //   return saveAllSetMetaData(sets); // Needs refactoring
  // } 
  return false;
}

export function deleteSetMetaData(id: string): boolean {
  // TODO: Refactor this to delete from Supabase FlashcardSet table by id
  // TODO: Also needs to handle deletion of associated Phrases and UserSetProgress
  console.warn('deleteSetMetaData using localStorage - needs refactoring for Supabase');
  // let sets = getAllSetMetaData(); // Needs userId, async
  // const filteredSets = sets.filter(set => set.id !== id);
  // deleteSetContent(id);
  // deleteSetProgress(id);
  // return saveAllSetMetaData(filteredSets); // Needs refactoring
  return false;
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
import { Phrase } from '../lib/set-generator';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabaseClient'; // Use path alias

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
  imageUrl?: string | null; // Add imageUrl to match DB
  seriousnessLevel?: number | null; // Add seriousnessLevel to match DB
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
  imageUrl?: string; // Add optional imageUrl here
  isFullyLearned?: boolean; // Keep the flag here (not in DB)
  seriousnessLevel?: number; // Add seriousnessLevel for tone/ridiculousness
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
    // Add imageUrl to select
    const { data, error } = await supabase
      .from('FlashcardSet')
      .select('id, userId, name, cleverTitle, level, goals, specificTopics, source, createdAt, updatedAt, imageUrl, seriousnessLevel')
      .eq('userId', userId);

    if (error) {
      console.error('Error fetching SetMetaData from Supabase:', error);
      throw error; 
    }
    console.log('Successfully fetched SetMetaData:', data);
    const sets = data || [];

    // Map Supabase record to SetMetaData interface, including imageUrl
    return sets.map((dbSet: FlashcardSetRecord) => ({ 
      id: dbSet.id,
      name: dbSet.name,
      cleverTitle: dbSet.cleverTitle || undefined,
      createdAt: dbSet.createdAt, 
      phraseCount: 0, // Set default 0
      level: dbSet.level as SetMetaData['level'] || undefined, 
      goals: dbSet.goals || [], 
      specificTopics: dbSet.specificTopics || undefined,
      source: dbSet.source as SetMetaData['source'] || 'generated',
      imageUrl: dbSet.imageUrl || undefined, // Map imageUrl
      isFullyLearned: false,
      seriousnessLevel: dbSet.seriousnessLevel || undefined
    }));

  } catch (error) {
    console.error('Unexpected error in getAllSetMetaData:', error);
    return []; 
  }
}

// REFACTOR: Insert into Supabase - Add imageUrl
// Adjust input type to include optional imageUrl
export async function addSetMetaData(userId: string, newSetData: Omit<SetMetaData, 'id' | 'createdAt' | 'phraseCount' | 'isFullyLearned'>): Promise<Omit<FlashcardSetRecord, 'phraseCount'> | null> {
  if (!userId || !newSetData) {
      console.error("addSetMetaData called without userId or newSetData.");
      return null;
  }

  const newSetId = uuidv4();
  const createdAt = new Date().toISOString();

  // Prepare record for Supabase, including imageUrl
  const recordToInsert: Omit<FlashcardSetRecord, 'phraseCount'> = {
    id: newSetId,
    userId: userId,
    name: newSetData.name,
    cleverTitle: newSetData.cleverTitle || null,
    level: newSetData.level || null,
    goals: newSetData.goals || null,
    specificTopics: newSetData.specificTopics || null,
    source: newSetData.source,
    createdAt: createdAt,
    updatedAt: createdAt, // Set updatedAt same as createdAt on initial insert
    imageUrl: newSetData.imageUrl || null, // Include imageUrl
    seriousnessLevel: newSetData.seriousnessLevel || null // Include seriousnessLevel
  };

  console.log(`Inserting SetMetaData into Supabase for userId: ${userId}`, recordToInsert);

  try {
    const { data, error } = await supabase
      .from('FlashcardSet')
      .insert(recordToInsert)
      .select('id, userId, name, cleverTitle, level, goals, specificTopics, source, createdAt, updatedAt, imageUrl, seriousnessLevel') // Select imageUrl too
      .single();

    if (error) {
      console.error('Error inserting SetMetaData into Supabase:', error);
      throw error; 
    }

    if (!data) {
        console.error('Supabase insert did not return the new record.');
        return null;
    }

    console.log('Successfully inserted SetMetaData:', data);
    return data as Omit<FlashcardSetRecord, 'phraseCount'>;

  } catch (error) {
    console.error('Unexpected error in addSetMetaData:', error);
    return null; 
  }
}

// REFACTOR: Update Supabase record - Add imageUrl
export async function updateSetMetaData(updatedSet: SetMetaData): Promise<boolean> {
  if (!updatedSet || !updatedSet.id) {
      console.error("updateSetMetaData called without valid updatedSet data or ID.");
      return false;
  }

  // Prepare record for Supabase update, including imageUrl
  const recordToUpdate: Partial<Omit<FlashcardSetRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'phraseCount'> & { updatedAt: string }> = {
      name: updatedSet.name,
      cleverTitle: updatedSet.cleverTitle || null,
      level: updatedSet.level || null,
      goals: updatedSet.goals || null,
      specificTopics: updatedSet.specificTopics || null,
      source: updatedSet.source,
      imageUrl: updatedSet.imageUrl || null, // Update imageUrl
      seriousnessLevel: updatedSet.seriousnessLevel || null, // Update seriousnessLevel
      updatedAt: new Date().toISOString()
  };
  
  console.log(`Updating SetMetaData in Supabase for id: ${updatedSet.id}`, recordToUpdate);
  try {
    const { error } = await supabase
      .from('FlashcardSet')
      .update(recordToUpdate)
      .eq('id', updatedSet.id);
    if (error) {
      console.error('Error updating SetMetaData in Supabase:', error);
      return false;
    }
    console.log(`Successfully updated SetMetaData for id: ${updatedSet.id}`);
    return true;
  } catch (error) {
    console.error('Unexpected error in updateSetMetaData:', error);
    return false;
  }
}

// REFACTOR: Delete from Supabase (including related data)
export async function deleteSetMetaData(setId: string): Promise<boolean> {
  if (!setId) {
    console.error("deleteSetMetaData called without setId.");
    return false;
  }

  console.log(`Attempting to delete SetMetaData and related data for id: ${setId}`);

  try {
    // TODO: Consider using Supabase Edge Functions or DB Triggers for cascading deletes 
    // for better atomicity and performance. Manual deletion order is important here.

    // 1. Delete associated progress (important: use composite key or just setId if unique)
    // Assuming UserSetProgress table has userId and setId columns
    // We need userId here - this function signature might need changing or we assume 
    // RLS handles the user context if called from a secure context.
    // For now, let's assume we delete based on setId only, requiring RLS.
    console.log(`Deleting UserSetProgress for setId: ${setId}`);
    const { error: progressError } = await supabase
        .from('UserSetProgress')
        .delete()
        .eq('setId', setId);
    if (progressError) {
        console.error('Error deleting associated UserSetProgress:', progressError);
        // Decide if we should proceed or return false
        // return false; 
    }

    // 2. Delete associated phrases
    console.log(`Deleting Phrases for setId: ${setId}`);
    const { error: phraseError } = await supabase
        .from('Phrase')
        .delete()
        .eq('setId', setId);
    if (phraseError) {
        console.error('Error deleting associated Phrases:', phraseError);
        // Decide if we should proceed or return false
        // return false;
    }

    // 3. Delete the set metadata itself
    console.log(`Deleting FlashcardSet record for id: ${setId}`);
    const { error: setError } = await supabase
      .from('FlashcardSet')
      .delete()
      .eq('id', setId);

    if (setError) {
      console.error('Error deleting SetMetaData from Supabase:', setError);
      return false;
    }

    console.log(`Successfully deleted SetMetaData and potentially related data for id: ${setId}`);
    return true;

  } catch (error) {
    console.error('Unexpected error in deleteSetMetaData:', error);
    return false;
  }
}

// --- Set Content Management --- 

// REFACTOR: Fetch Phrases from Supabase, include ID
export async function getSetContent(setId: string): Promise<Phrase[]> {
  if (!setId) {
    console.error("getSetContent called without setId.");
    return [];
  }
  console.log(`Fetching Phrases from Supabase for setId: ${setId}`);
  try {
    const { data, error } = await supabase
      .from('Phrase')
      .select('id, english, thai, thaiMasculine, thaiFeminine, pronunciation, mnemonic, examplesJson') // Select id
      .eq('setId', setId);

    if (error) {
      console.error('Error fetching Phrases from Supabase:', error);
      throw error; 
    }
    console.log(`Successfully fetched ${data?.length || 0} Phrases for setId: ${setId}`);
    const phrasesData = data || [];

    // Map Supabase record to Phrase interface (handle examplesJson)
    return phrasesData.map((dbPhrase: any) => ({ 
      id: dbPhrase.id, // Include id
      english: dbPhrase.english,
      thai: dbPhrase.thai,
      thaiMasculine: dbPhrase.thaiMasculine,
      thaiFeminine: dbPhrase.thaiFeminine,
      pronunciation: dbPhrase.pronunciation,
      mnemonic: dbPhrase.mnemonic || undefined,
      examples: dbPhrase.examplesJson ? JSON.parse(dbPhrase.examplesJson) : [] 
    }));

  } catch (error) {
    // Handle potential JSON parsing errors for examplesJson
    if (error instanceof SyntaxError) {
        console.error('Error parsing examplesJson from Supabase:', error);
    } else {
        console.error('Unexpected error in getSetContent:', error);
    }
    return []; 
  }
}

// REFACTOR: Batch insert Phrases into Supabase, generate IDs
export async function saveSetContent(setId: string, phrases: Phrase[]): Promise<boolean> {
  if (!setId || !phrases || phrases.length === 0) {
    console.error("saveSetContent called without setId or with empty phrases array.");
    return false;
  }

  console.log(`Saving ${phrases.length} Phrases to Supabase for setId: ${setId}`);

  // Prepare records for Supabase batch insert, generating a unique ID for each phrase
  const recordsToInsert = phrases.map(phrase => ({
    id: uuidv4(), // Generate unique ID for each phrase
    setId: setId,
    english: phrase.english,
    thai: phrase.thai,
    thaiMasculine: phrase.thaiMasculine,
    thaiFeminine: phrase.thaiFeminine,
    pronunciation: phrase.pronunciation,
    mnemonic: phrase.mnemonic || null, 
    examplesJson: phrase.examples && phrase.examples.length > 0 ? JSON.stringify(phrase.examples) : null 
  }));

  try {
    const { error } = await supabase
      .from('Phrase')
      .insert(recordsToInsert);

    if (error) {
      console.error('Error batch inserting Phrases into Supabase:', error);
      return false;
    }

    console.log(`Successfully saved ${phrases.length} Phrases for setId: ${setId}`);
    return true;

  } catch (error) {
    console.error('Unexpected error in saveSetContent:', error);
    return false;
  }
}

// REFACTOR: Delete Phrases from Supabase
export async function deleteSetContent(setId: string): Promise<boolean> {
  if (!setId) {
    console.error("deleteSetContent called without setId.");
    return false;
  }
  console.log(`Deleting Phrases from Supabase for setId: ${setId}`);
  try {
    const { error } = await supabase
      .from('Phrase')
      .delete()
      .eq('setId', setId);

    if (error) {
      console.error('Error deleting Phrases from Supabase:', error);
      return false;
    }
    
    console.log(`Successfully deleted Phrases for setId: ${setId}`);
    return true;

  } catch (error) {
    console.error('Unexpected error in deleteSetContent:', error);
    return false;
  }
}

// --- Set Progress Management --- 

// REFACTOR: Fetch progress from Supabase
export async function getSetProgress(userId: string, setId: string): Promise<SetProgress> {
  // Trivial change comment
  if (!userId || !setId) {
    console.error("getSetProgress called without userId or setId.");
    return {};
  }
  console.log(`Fetching UserSetProgress from Supabase for userId: ${userId}, setId: ${setId}`);
  try {
    const { data, error } = await supabase
      .from('UserSetProgress')
      .select('progressData') // Select only the JSONB column
      .eq('userId', userId)
      .eq('setId', setId)
      .maybeSingle(); // Expect 0 or 1 record

    if (error) {
      console.error('Error fetching UserSetProgress from Supabase:', error);
      throw error;
    }

    if (data && data.progressData) {
      console.log(`Successfully fetched UserSetProgress`);
      // Parse the JSONB data
      return data.progressData as SetProgress; // Assuming it's stored correctly
    } else {
      console.log(`No UserSetProgress found for userId: ${userId}, setId: ${setId}. Returning empty object.`);
      return {}; // Return empty object if no progress found
    }

  } catch (error) {
    console.error('Unexpected error in getSetProgress:', error);
    return {}; // Return empty object on error
  }
}

// REFACTOR: Upsert progress into Supabase
export async function saveSetProgress(userId: string, setId: string, progress: SetProgress): Promise<boolean> {
  if (!userId || !setId) {
    console.error("saveSetProgress called without userId or setId.");
    return false;
  }
  if (progress === undefined || progress === null) { 
    console.error("saveSetProgress called with invalid progress data.");
    return false;
  }

  console.log(`Saving/Updating UserSetProgress to Supabase for userId: ${userId}, setId: ${setId}`);

  // Generate an ID, needed primarily for potential INSERT during upsert
  const progressRecordId = uuidv4(); 

  const recordToUpsert = {
    id: progressRecordId, // Add the generated ID
    userId: userId,
    setId: setId,
    progressData: progress, 
    lastAccessedAt: new Date().toISOString()
  };

  try {
    // Upsert: Inserts if combo (userId, setId) doesn't exist, updates if it does
    const { error } = await supabase
      .from('UserSetProgress')
      .upsert(recordToUpsert, {
        onConflict: 'userId, setId', // Specify conflict target
        // ignoreDuplicates: false // Default is false, ensures update happens on conflict
      });
      
    if (error) {
      console.error('Error upserting UserSetProgress into Supabase:', error);
      return false;
    }

    console.log(`Successfully saved UserSetProgress for userId: ${userId}, setId: ${setId}`);
    return true;

  } catch (error) {
    console.error('Unexpected error in saveSetProgress:', error);
    return false;
  }
}

// REFACTOR: Delete progress from Supabase
export async function deleteSetProgress(userId: string, setId: string): Promise<boolean> {
  if (!userId || !setId) {
    console.error("deleteSetProgress called without userId or setId.");
    return false;
  }
  console.log(`Deleting UserSetProgress from Supabase for userId: ${userId}, setId: ${setId}`);
  try {
    const { error } = await supabase
      .from('UserSetProgress')
      .delete()
      .eq('userId', userId)
      .eq('setId', setId);

    if (error) {
      console.error('Error deleting UserSetProgress from Supabase:', error);
      return false;
    }

    console.log(`Successfully deleted UserSetProgress for userId: ${userId}, setId: ${setId}`);
    return true;

  } catch (error) {
    console.error('Unexpected error in deleteSetProgress:', error);
    return false;
  }
}

// --- Utility --- 

export function generateUUID(): string {
  return uuidv4();
}

// --- Cleanup --- 
// Remove old localStorage helpers if no longer needed anywhere else
// Commenting out for now, can be deleted later after full verification.
/*
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
*/ 
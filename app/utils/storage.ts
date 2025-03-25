// Types for our stored data
export interface UserData {
  mnemonics: { [phraseId: string]: string };
  progress: { [phraseId: string]: number };
  lastReviewDates: { [phraseId: string]: string };
  phoneticNotes: { [phraseId: string]: string };
}

const STORAGE_KEY = 'thai_flashcards_data';

// Initialize empty user data
const emptyUserData: UserData = {
  mnemonics: {},
  progress: {},
  lastReviewDates: {},
  phoneticNotes: {},
};

// Load data from localStorage
export function loadUserData(): UserData {
  if (typeof window === 'undefined') return emptyUserData;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return emptyUserData;
    
    const data = JSON.parse(stored);
    return {
      mnemonics: data.mnemonics || {},
      progress: data.progress || {},
      lastReviewDates: data.lastReviewDates || {},
      phoneticNotes: data.phoneticNotes || {},
    };
  } catch (error) {
    console.error('Error loading user data:', error);
    return emptyUserData;
  }
}

// Save data to localStorage
export function saveUserData(data: Partial<UserData>) {
  if (typeof window === 'undefined') return;
  
  try {
    const currentData = loadUserData();
    const newData = {
      ...currentData,
      ...data,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
}

// Helper functions for specific data types
export function saveMnemonic(phraseId: string, mnemonic: string) {
  const data = loadUserData();
  data.mnemonics[phraseId] = mnemonic;
  saveUserData({ mnemonics: data.mnemonics });
}

export function savePhoneticNote(phraseId: string, note: string) {
  const data = loadUserData();
  data.phoneticNotes[phraseId] = note;
  saveUserData({ phoneticNotes: data.phoneticNotes });
}

export function updateProgress(phraseId: string, progress: number) {
  const data = loadUserData();
  data.progress[phraseId] = progress;
  data.lastReviewDates[phraseId] = new Date().toISOString();
  saveUserData({
    progress: data.progress,
    lastReviewDates: data.lastReviewDates,
  });
}

// Export data as JSON file
export function exportUserData() {
  const data = loadUserData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'thai_flashcards_backup.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import data from JSON file
export async function importUserData(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        saveUserData(data);
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
} 
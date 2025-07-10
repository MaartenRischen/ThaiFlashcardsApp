import { initializeStorage } from './imageStorage';

export async function initializeApp() {
  try {
    // Initialize Supabase Storage bucket
    const storageInitialized = await initializeStorage();
    if (!storageInitialized) {
      console.error('Failed to initialize storage bucket');
    } else {
      console.log('Storage bucket initialized successfully');
    }
  } catch (error) {
    console.error('Error during app initialization:', error);
  }
} 
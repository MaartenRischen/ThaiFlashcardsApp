import { initializeStorage } from './imageStorage';

let initialized = false;

export async function initializeApp() {
  // Only run initialization once and only on server-side
  if (initialized || typeof window !== 'undefined') {
    return;
  }
  
  initialized = true;
  
  try {
    // Only try to initialize storage if we're in a proper environment
    if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      // Initialize Supabase Storage bucket
      const storageInitialized = await initializeStorage();
      if (!storageInitialized) {
        console.error('Failed to initialize storage bucket');
      } else {
        console.log('Storage bucket initialized successfully');
      }
    } else {
      console.log('Skipping storage initialization - missing required environment variables');
    }
  } catch (error) {
    console.error('Error during app initialization:', error);
    // Don't throw - let the app continue to run
  }
} 
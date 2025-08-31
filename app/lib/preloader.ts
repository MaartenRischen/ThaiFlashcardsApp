import { SetMetaData, PhraseProgressData } from './storage/types';
import { Phrase } from './generation/types';
import { getDefaultSetContent } from '@/app/lib/seed-default-sets';
import { Folder } from './storage/folders';
import { INITIAL_PHRASES } from '@/app/data/phrases';

export interface PreloadedData {
  sets: SetMetaData[];
  folders: Folder[];
  setContents: Record<string, Phrase[]>;
  setProgress: Record<string, Record<number, PhraseProgressData>>;
  userMnemonics: Record<string, Record<string, string>>;
  breakdowns?: Record<string, unknown>; // Optional word breakdowns
  images: Record<string, boolean>; // Track which images are preloaded
}

export interface PreloadProgress {
  stage: 'init' | 'auth' | 'folders' | 'sets' | 'content' | 'progress' | 'mnemonics' | 'images' | 'complete';
  progress: number; // 0-100
  message: string;
  subProgress?: {
    current: number;
    total: number;
    item?: string;
  };
}

export class AppPreloader {
  private userId?: string | null;
  private onProgress?: (progress: PreloadProgress) => void;
  private abortController?: AbortController;

  constructor(onProgress?: (progress: PreloadProgress) => void) {
    this.onProgress = onProgress;
  }

  private updateProgress(progress: PreloadProgress) {
    this.onProgress?.(progress);
  }

  async preloadApp(userId?: string | null): Promise<PreloadedData> {
    this.userId = userId;
    this.abortController = new AbortController();

    try {
      // Stage 1: Initialization
      this.updateProgress({
        stage: 'init',
        progress: 0,
        message: 'Initializing Thai Flashcards...'
      });

      const data: PreloadedData = {
        sets: [],
        folders: [],
        setContents: {},
        setProgress: {},
        userMnemonics: {},
        images: {}
      };

      // Stage 2: Authentication check
      this.updateProgress({
        stage: 'auth',
        progress: 10,
        message: userId ? 'Loading your personalized content...' : 'Loading default content...'
      });

      if (userId) {
        // Initialize user data structures
        await this.initializeUserData(userId);
      }

      // Stage 3: Load folders
      this.updateProgress({
        stage: 'folders',
        progress: 20,
        message: 'Loading folders...'
      });
      data.folders = await this.loadFolders(userId);

      // Stage 4: Load sets metadata
      this.updateProgress({
        stage: 'sets',
        progress: 30,
        message: 'Loading flashcard sets...'
      });
      data.sets = await this.loadSets(userId);

      // Stage 5: Load all set contents in parallel
      this.updateProgress({
        stage: 'content',
        progress: 40,
        message: 'Loading flashcards...',
        subProgress: { current: 0, total: data.sets.length }
      });
      
      const contentPromises = data.sets.map((set, index) => 
        this.loadSetContent(set.id, userId).then(content => {
          data.setContents[set.id] = content;
          this.updateProgress({
            stage: 'content',
            progress: 40 + (20 * (index + 1) / data.sets.length),
            message: 'Loading flashcards...',
            subProgress: { 
              current: index + 1, 
              total: data.sets.length,
              item: set.name
            }
          });
          return content;
        })
      );
      
      await Promise.all(contentPromises);

      // Stage 6: Load progress data
      this.updateProgress({
        stage: 'progress',
        progress: 60,
        message: 'Loading your progress...'
      });
      
      if (userId) {
        const progressPromises = data.sets.map(set => 
          this.loadSetProgress(userId, set.id).then(progress => {
            data.setProgress[set.id] = progress;
          })
        );
        await Promise.all(progressPromises);
      } else {
        // Load progress from localStorage for non-authenticated users
        data.sets.forEach(set => {
          const storedProgress = localStorage.getItem(`progress_${set.id}`);
          if (storedProgress) {
            try {
              data.setProgress[set.id] = JSON.parse(storedProgress);
            } catch (e) {
              console.error('Failed to parse progress:', e);
            }
          }
        });
      }

      // Stage 7: Load user mnemonics
      this.updateProgress({
        stage: 'mnemonics',
        progress: 70,
        message: 'Loading custom mnemonics...'
      });
      
      if (userId) {
        data.userMnemonics = await this.loadUserMnemonics(userId);
      } else {
        // Load from localStorage for non-authenticated users
        const storedMnemonics = localStorage.getItem('mnemonics-v2');
        if (storedMnemonics) {
          try {
            data.userMnemonics = JSON.parse(storedMnemonics);
          } catch (e) {
            console.error('Failed to parse mnemonics:', e);
          }
        }
      }

      // Stage 8: Preload images
      this.updateProgress({
        stage: 'images',
        progress: 80,
        message: 'Loading images...',
        subProgress: { current: 0, total: data.sets.length }
      });
      
      const imagePromises = data.sets.map((set, index) => {
        const imageUrl = set.imageUrl || '/images/default-set-logo.png';
        return this.preloadImage(imageUrl).then(loaded => {
          data.images[imageUrl] = loaded;
          this.updateProgress({
            stage: 'images',
            progress: 80 + (15 * (index + 1) / data.sets.length),
            message: 'Loading images...',
            subProgress: { 
              current: index + 1, 
              total: data.sets.length,
              item: set.name
            }
          });
        });
      });
      
      await Promise.all(imagePromises);

      // Stage 9: Complete
      this.updateProgress({
        stage: 'complete',
        progress: 100,
        message: 'Ready to learn Thai!'
      });

      return data;

    } catch (error) {
      console.error('Preloader error:', error);
      throw error;
    }
  }

  private async initializeUserData(_userId: string): Promise<void> {
    try {
      // Initialize folders
      const folderInitResponse = await fetch('/api/init-folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: this.abortController?.signal
      });
      
      if (!folderInitResponse.ok) {
        console.error('Failed to initialize folders:', folderInitResponse.status);
      }
      
      // Fix folder assignments
      const fixResponse = await fetch('/api/fix-folder-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: this.abortController?.signal
      });
      
      if (!fixResponse.ok) {
        console.error('Failed to fix folder assignments:', fixResponse.status);
      }
    } catch (error) {
      console.error('Failed to initialize user data:', error);
    }
  }

  private async loadFolders(_userId?: string | null): Promise<Folder[]> {
    try {
      const response = await fetch('/api/folders', {
        credentials: 'include',
        signal: this.abortController?.signal
      });
      
      if (response.ok) {
        const folders = await response.json();
        return folders;
      }
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
    
    // Return default folders as fallback
    const now = new Date().toISOString();
    return [
      { 
        id: 'default-folder-default-sets', 
        name: 'Default Sets', 
        userId: 'default', 
        isDefault: true,
        orderIndex: 0,
        createdAt: now, 
        updatedAt: now 
      },
      { 
        id: 'default-folder-100-words', 
        name: '100 Most Used Thai Words', 
        userId: 'default', 
        isDefault: true,
        orderIndex: 1,
        createdAt: now, 
        updatedAt: now 
      },
      { 
        id: 'default-folder-100-sentences', 
        name: '100 Most Used Thai Sentences', 
        userId: 'default', 
        isDefault: true,
        orderIndex: 2,
        createdAt: now, 
        updatedAt: now 
      }
    ];
  }

  private async loadSets(userId?: string | null): Promise<SetMetaData[]> {
    if (userId) {
      try {
        const response = await fetch('/api/flashcard-sets', {
          credentials: 'include',
          signal: this.abortController?.signal
        });
        
        if (response.ok) {
          const sets = await response.json();
          return sets;
        }
      } catch (error) {
        console.error('Failed to load user sets:', error);
      }
    }
    
    // Return default sets for non-authenticated users or as fallback
    const now = new Date().toISOString();
    const defaultSetMetadata: SetMetaData = {
      id: 'default',
      name: 'Default Thai Flashcards',
      imageUrl: '/images/defaultnew.png',
      level: 'complete beginner',
      folderId: 'default-folder-default-sets',
      userId: 'default',
      createdAt: now,
      updatedAt: now,
      source: 'default',
      phraseCount: INITIAL_PHRASES.length,
      isFullyLearned: false,
      seriousnessLevel: null,
      toneLevel: null
    };
    
    return [defaultSetMetadata];
  }

  private async loadSetContent(setId: string, _userId?: string | null): Promise<Phrase[]> {
    // Try API first
    try {
      const response = await fetch(`/api/flashcard-sets/${setId}/content`, {
        credentials: 'include',
        signal: this.abortController?.signal
      });
      
      if (response.ok) {
        const content = await response.json();
        return Array.isArray(content) ? content : content.phrases || [];
      }
    } catch (error) {
      console.error(`Failed to load content for set ${setId}:`, error);
    }
    
    // Fallback to default content
    const defaultContent = getDefaultSetContent(setId);
    return defaultContent || [];
  }

  private async loadSetProgress(_userId: string, setId: string): Promise<Record<number, PhraseProgressData>> {
    try {
      const response = await fetch(`/api/flashcard-sets/${setId}/progress`, {
        credentials: 'include',
        signal: this.abortController?.signal
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.progress || {};
      }
    } catch (error) {
      console.error(`Failed to load progress for set ${setId}:`, error);
    }
    
    return {};
  }

  private async loadUserMnemonics(_userId: string): Promise<Record<string, Record<string, string>>> {
    try {
      const response = await fetch('/api/user-mnemonics', {
        credentials: 'include',
        signal: this.abortController?.signal
      });
      
      if (response.ok) {
        const mnemonics = await response.json();
        // Transform array format to nested object format
        const mnemonicMap: Record<string, Record<string, string>> = {};
        
        mnemonics.forEach((item: { setId: string; phraseIndex: number; mnemonic: string }) => {
          if (!mnemonicMap[item.setId]) {
            mnemonicMap[item.setId] = {};
          }
          mnemonicMap[item.setId][item.phraseIndex.toString()] = item.mnemonic;
        });
        
        return mnemonicMap;
      }
    } catch (error) {
      console.error('Failed to load user mnemonics:', error);
    }
    
    return {};
  }

  private async preloadImage(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!url || url === '/images/default-set-logo.png') {
        resolve(true); // Default image is always available
        return;
      }

      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  cancel() {
    this.abortController?.abort();
  }
}

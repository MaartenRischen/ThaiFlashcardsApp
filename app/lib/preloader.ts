import { SetMetaData, PhraseProgressData } from './storage/types';
import { Phrase } from './generation/types';
import { getDefaultSetContent, getDefaultSetsForUnauthenticatedUsers } from '@/app/lib/seed-default-sets';
import { Folder } from './storage/folders';

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

      // Skip initializeUserData - it's redundant and slows down loading
      // The backend already handles folder initialization when needed

      // Stage 3-4: Load folders and sets in parallel
      this.updateProgress({
        stage: 'folders',
        progress: 20,
        message: 'Loading folders and sets...'
      });
      
      // Load folders with progressive updates
      const folders = await this.loadFoldersWithProgress(userId);
      
      // Kick off sets fetch but don't block on it to start warming previews quickly
      const setsPromise = this.loadSets(userId);
      
      // Preload a small number of images immediately to avoid empty cards while sets resolve
      try {
        const minimalImageUrlsEarly = ['/images/default-set-logo.png', '/images/defaultnew.png'];
        await Promise.all(minimalImageUrlsEarly.map((url) => this.preloadImage(url).then(loaded => { data.images[url] = loaded; })));
      } catch {}

      const sets = await setsPromise;
      
      data.folders = folders;
      data.sets = sets;

      // Stage 5-7: Load ONLY essential data - not all content!
      this.updateProgress({
        stage: 'content',
        progress: 40,
        message: 'Loading your progress...',
        subProgress: { current: 0, total: 3 }
      });
      
      if (userId) {
        // For authenticated users, load only essential data
        const [userMnemonics] = await Promise.all([
          // Load user mnemonics (small data)
          this.loadUserMnemonics(userId)
        ]);
        
        data.userMnemonics = userMnemonics;
        
        // Skip loading all progress during preload - it's loaded on-demand per set
        // This significantly speeds up initial load
        
        // As a compromise, only preload content for the user's most recent set
        const lastSetId = typeof window !== 'undefined' ? localStorage.getItem('lastActiveSetId') : null;
        if (lastSetId && data.sets.find(s => s.id === lastSetId)) {
          const lastSet = data.sets.find(s => s.id === lastSetId);
          this.updateProgress({
            stage: 'content',
            progress: 45,
            message: 'Loading your last active set...',
            subProgress: { 
              current: 1, 
              total: 1,
              item: lastSet ? lastSet.name : 'Last set'
            }
          });
          const content = await this.loadSetContent(lastSetId, userId);
          data.setContents[lastSetId] = content;
        }
        
      } else {
        // For unauthenticated users, only load content for the main default set
        const defaultSetId = 'default';
        if (data.sets.find(s => s.id === defaultSetId)) {
          const content = await this.loadSetContent(defaultSetId, userId);
          data.setContents[defaultSetId] = content;
        }
        
        // Load progress from localStorage (only for sets with progress)
        data.sets.forEach(set => {
          const storedProgress = localStorage.getItem(`progress_${set.id}`);
          if (storedProgress) {
            try {
              const progress = JSON.parse(storedProgress);
              if (progress.learnedPhrases && progress.learnedPhrases.length > 0) {
                data.setProgress[set.id] = progress;
              }
            } catch (e) {
              console.error('Failed to parse progress:', e);
            }
          }
        });
        
        // Load mnemonics from localStorage
        const storedMnemonics = localStorage.getItem('mnemonics-v2');
        if (storedMnemonics) {
          try {
            data.userMnemonics = JSON.parse(storedMnemonics);
          } catch (e) {
            console.error('Failed to parse mnemonics:', e);
          }
        }
      }
      
      this.updateProgress({
        stage: 'mnemonics',
        progress: 70,
        message: 'Processing data...'
      });

      // Stage 7.5: Preload lightweight folder view assets so My Sets shows immediately
      try {
        const minimalImageUrls = data.sets.map(s => s.imageUrl).filter((u): u is string => !!u);
        minimalImageUrls.push('/images/default-set-logo.png');
        minimalImageUrls.push('/images/defaultnew.png');
        await Promise.all(minimalImageUrls.map((url) => this.preloadImage(url).then(loaded => { data.images[url] = loaded; })));
      } catch (e) {
        console.warn('[Preloader] Minimal image warmup failed', e);
      }

      // Stage 8: Preload only essential images (thumbnails for speed)
      this.updateProgress({
        stage: 'images',
        progress: 80,
        message: 'Loading set images...',
        subProgress: { current: 0, total: sets.length + 2 } // +2 for default images
      });
      
      // Import getThumbnailUrl to convert to thumbnails
      const { getThumbnailUrl } = await import('@/app/lib/image-utils');
      
      // Only preload images for sets we've loaded content for and also a first screen of folder previews
      const imageUrls = new Set<string>();
      
      // Add images for sets with content - convert to thumbnails
      Object.keys(data.setContents).forEach(setId => {
        const set = data.sets.find(s => s.id === setId);
        if (set?.imageUrl) {
          imageUrls.add(getThumbnailUrl(set.imageUrl));
        }
      });
      
      // Add default images (already thumbnails)
      imageUrls.add('/images/thumbnails/default-set-logo.png');
      imageUrls.add('/images/thumbnails/defaultnew.png');
      
      // Add ALL set thumbnails to ensure every set has its image ready
      sets.forEach(s => { 
        if (s?.imageUrl) {
          imageUrls.add(getThumbnailUrl(s.imageUrl));
        }
      });

      // Preload only these essential images
      const imagePromises = Array.from(imageUrls).map((url, index) => {
        return this.preloadImage(url).then(loaded => {
          data.images[url] = loaded;
                  // Extract set name from image URL if possible
        let imageName = 'set image';
        const setForImage = sets.find(s => s.imageUrl === url);
        if (setForImage) {
          imageName = `${setForImage.name} image`;
        }
        
        this.updateProgress({
          stage: 'images',
          progress: 80 + (15 * (index + 1) / imageUrls.size),
          message: 'Loading images...',
          subProgress: { 
            current: index + 1, 
            total: imageUrls.size,
            item: imageName
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

  private async loadFoldersWithProgress(userId?: string | null): Promise<Folder[]> {
    const defaultFolderNames = [
      'Default Sets',
      '100 Most Used Thai Words', 
      '100 Most Used Thai Sentences',
      'My Automatic Sets',
      'My Manual Sets'
    ];
    
    // Show initial progress
    this.updateProgress({
      stage: 'folders',
      progress: 20,
      message: 'Loading folders...',
      subProgress: { current: 0, total: 5 }
    });
    
    // Small delay to ensure UI updates
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Simulate progressive loading for better UX
    for (let i = 0; i < defaultFolderNames.length; i++) {
      this.updateProgress({
        stage: 'folders',
        progress: 20 + (5 * (i + 1) / defaultFolderNames.length),
        message: 'Loading folders...',
        subProgress: { 
          current: i + 1, 
          total: defaultFolderNames.length,
          item: defaultFolderNames[i]
        }
      });
      // Small delay between updates to make them visible
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Now actually load the folders
    return this.loadFolders(userId);
  }

  private async loadFolders(userId?: string | null): Promise<Folder[]> {
    // For faster loading, always use default folders immediately
    const now = new Date().toISOString();
    const defaultFolders = [
      { 
        id: 'default-folder-default-sets', 
        name: 'Default Sets', 
        userId: userId || 'default', 
        isDefault: true,
        orderIndex: 0,
        createdAt: now, 
        updatedAt: now 
      },
      { 
        id: 'default-folder-100-words', 
        name: '100 Most Used Thai Words', 
        userId: userId || 'default', 
        isDefault: true,
        orderIndex: 1,
        createdAt: now, 
        updatedAt: now 
      },
      { 
        id: 'default-folder-100-sentences', 
        name: '100 Most Used Thai Sentences', 
        userId: userId || 'default', 
        isDefault: true,
        orderIndex: 2,
        createdAt: now, 
        updatedAt: now 
      },
      { 
        id: 'default-folder-automatic-sets', 
        name: 'My Automatic Sets', 
        userId: userId || 'default', 
        isDefault: true,
        orderIndex: 3,
        createdAt: now, 
        updatedAt: now 
      },
      { 
        id: 'default-folder-manual-sets', 
        name: 'My Manual Sets', 
        userId: userId || 'default', 
        isDefault: true,
        orderIndex: 4,
        createdAt: now, 
        updatedAt: now 
      }
    ];

    // Return default folders immediately without delays
    // Progress updates are handled in loadFoldersWithProgress
    return defaultFolders;
  }

  private async loadSets(userId?: string | null): Promise<SetMetaData[]> {
    if (!userId) {
      // For unauthenticated users, return default sets
      const defaultSets = getDefaultSetsForUnauthenticatedUsers();
      console.log(`[Preloader] Using ${defaultSets.length} default sets for unauthenticated user`);
      return defaultSets;
    }
    
    // For authenticated users, load ALL their sets (metadata only, not content)
    try {
      const response = await fetch('/api/flashcard-sets?skipEnsureDefaults=true', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        // API returns { sets: [...] }
        if (data && Array.isArray(data.sets)) {
          console.log(`[Preloader] Loaded ${data.sets.length} sets from API`);
          
          // Show progress for each set being processed
          for (let i = 0; i < data.sets.length; i++) {
            const set = data.sets[i];
            this.updateProgress({
              stage: 'sets',
              progress: 30 + (5 * (i + 1) / data.sets.length),
              message: `Loading sets...`,
              subProgress: { 
                current: i + 1, 
                total: data.sets.length,
                item: set.name
              }
            });
            // Very small delay to show progress
            if (i % 5 === 0) { // Only delay every 5th set
              await new Promise(resolve => setTimeout(resolve, 10));
            }
          }
          
          return data.sets;
        } else {
          console.warn('[Preloader] Unexpected API response format:', data);
        }
      } else {
        console.warn(`[Preloader] Sets API returned ${response.status}`);
      }
    } catch (error) {
      console.warn('[Preloader] Failed to load user sets:', error);
    }
    
    // Don't throw away everything! Just return empty array and let SetContext handle it
    console.log(`[Preloader] API failed or timed out, returning empty array. SetContext will load sets later.`);
    return [];
  }

  private async loadSetContent(setId: string, _userId?: string | null): Promise<Phrase[]> {
    console.log(`[Preloader] Loading content for set: ${setId}`);
    
    // For default sets, get content directly without API call
    if (setId.startsWith('default-') || setId === 'default') {
      const defaultContent = getDefaultSetContent(setId);
      if (defaultContent && defaultContent.length > 0) {
        console.log(`[Preloader] Found default content for ${setId}: ${defaultContent.length} phrases`);
        return defaultContent;
      }
      // If no default content found, don't try API - just return empty
      console.warn(`[Preloader] No default content found for set ${setId}, skipping API call`);
      return [];
    }
    
    // Try API for user sets
    try {
      const response = await fetch(`/api/flashcard-sets/${setId}/content`, {
        credentials: 'include',
        signal: this.abortController?.signal
      });
      
      if (response.ok) {
        const content = await response.json();
        const phrases = Array.isArray(content) ? content : content.phrases || [];
        console.log(`[Preloader] Loaded ${phrases.length} phrases from API for ${setId}`);
        return phrases;
      } else {
        console.warn(`[Preloader] API returned ${response.status} for set ${setId}`);
      }
    } catch (error) {
      console.error(`[Preloader] Failed to load content for set ${setId}:`, error);
    }
    
    // Final fallback
    console.warn(`[Preloader] No content found for set ${setId}`);
    return [];
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
        const body = await response.json();
        // API may return an array or wrap in { mnemonics } | { items }
        const list = Array.isArray(body)
          ? body
          : Array.isArray(body?.mnemonics)
            ? body.mnemonics
            : Array.isArray(body?.items)
              ? body.items
              : [];

        // Transform array format to nested object format
        const mnemonicMap: Record<string, Record<string, string>> = {};
        list.forEach((item: { setId: string; phraseIndex: number; mnemonic: string }) => {
          if (!item || !item.setId) return;
          if (!mnemonicMap[item.setId]) {
            mnemonicMap[item.setId] = {};
          }
          mnemonicMap[item.setId][String(item.phraseIndex)] = item.mnemonic;
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

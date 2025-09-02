'use client';

import React, { createContext, useState, useContext, useCallback, ReactNode, useEffect } from 'react';
import { Phrase } from '@/app/lib/set-generator';
import type { PhraseProgressData } from '@/app/lib/storage';
import { getDefaultSetContent } from '@/app/lib/seed-default-sets';
import { Folder } from '@/app/lib/storage/folders';
import { usePreloader } from './PreloaderContext';

interface SetContentCache {
  phrases: Phrase[];
  progress: Record<number, PhraseProgressData>;
  lastFetched: number;
}

interface FolderCache {
  folders: Folder[];
  lastFetched: number;
}

interface SetCacheContextProps {
  cache: Record<string, SetContentCache>;
  folderCache: FolderCache | null;
  getCachedContent: (setId: string) => SetContentCache | null;
  getCachedFolders: () => Folder[] | null;
  preloadSetContent: (setId: string, forceRefresh?: boolean) => Promise<SetContentCache>;
  preloadAllSets: (setIds: string[]) => Promise<void>;
  preloadFolders: (forceRefresh?: boolean) => Promise<Folder[]>;
  clearCache: () => void;
  clearSetCache: (setId: string) => void;
  clearFolderCache: () => void;
  preloadImages: (imageUrls: (string | null | undefined)[]) => Promise<void>;
}

const SetCacheContext = createContext<SetCacheContextProps | undefined>(undefined);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache validity

export const SetCacheProvider = ({ children }: { children: ReactNode }) => {
  const { preloadedData } = usePreloader();
  const [cache, setCache] = useState<Record<string, SetContentCache>>({});
  const [folderCache, setFolderCache] = useState<FolderCache | null>(null);
  
  // Initialize cache with preloaded data
  useEffect(() => {
    if (preloadedData) {
      console.log('[SetCacheContext] Updating cache with preloaded data');
      const newCache: Record<string, SetContentCache> = {};
      
      // Add all preloaded set contents to cache
      Object.entries(preloadedData.setContents).forEach(([setId, phrases]) => {
        newCache[setId] = {
          phrases,
          progress: preloadedData.setProgress[setId] || {},
          lastFetched: Date.now()
        };
      });
      
      // Merge with existing cache instead of replacing
      setCache(prevCache => ({
        ...prevCache,
        ...newCache
      }));
      
      // Also cache folders
      if (preloadedData.folders.length > 0) {
        setFolderCache({
          folders: preloadedData.folders,
          lastFetched: Date.now()
        });
      }
    }
  }, [preloadedData]); // eslint-disable-line react-hooks/exhaustive-deps

  const getCachedContent = useCallback((setId: string): SetContentCache | null => {
    const cached = cache[setId];
    if (!cached) return null;
    
    // Check if cache is still valid
    const now = Date.now();
    if (now - cached.lastFetched > CACHE_DURATION) {
      return null; // Cache expired
    }
    
    return cached;
  }, [cache]);

  const getCachedFolders = useCallback((): Folder[] | null => {
    if (!folderCache) return null;
    
    // Check if cache is still valid
    const now = Date.now();
    if (now - folderCache.lastFetched > CACHE_DURATION) {
      return null; // Cache expired
    }
    
    return folderCache.folders;
  }, [folderCache]);

  const preloadSetContent = useCallback(async (setId: string, forceRefresh = false): Promise<SetContentCache> => {
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = getCachedContent(setId);
      if (cached) {
        console.log(`[SetCache] Using cached content for set ${setId}`);
        return cached;
      }
    }

    console.log(`[SetCache] Fetching content for set ${setId}`);
    let phrases: Phrase[] = [];
    let progress: Record<number, PhraseProgressData> = {};

    try {
      // Handle default sets
      if (setId === 'default' || setId.startsWith('default-')) {
        // Try database first for default sets
        try {
          const contentResponse = await fetch(`/api/flashcard-sets/${setId}/content`, {
            credentials: 'include'
          });
          
          if (contentResponse.ok) {
            const dbContent = await contentResponse.json();
            if (dbContent && dbContent.length > 0) {
              phrases = dbContent;
            } else {
              throw new Error('Empty database content');
            }
          } else {
            throw new Error('Database fetch failed');
          }
        } catch {
          // Fallback to hardcoded content
          const defaultContent = getDefaultSetContent(setId);
          if (defaultContent) {
            phrases = defaultContent;
          }
        }
        
        // For default sets, check localStorage for progress
        const storedProgress = localStorage.getItem(`progress_${setId}`);
        if (storedProgress) {
          try {
            progress = JSON.parse(storedProgress);
          } catch (e) {
            console.error(`[SetCache] Failed to parse localStorage progress for set ${setId}:`, e);
          }
        }
      } else {
        // For user sets, fetch via API
        const [contentResponse, progressResponse] = await Promise.all([
          fetch(`/api/flashcard-sets/${setId}/content`, { credentials: 'include' }),
          fetch(`/api/flashcard-sets/${setId}/progress`, { credentials: 'include' })
        ]);

        if (contentResponse.ok) {
          phrases = await contentResponse.json();
        }

        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          progress = progressData.progress || {};
        }
      }

      const newCache: SetContentCache = {
        phrases,
        progress,
        lastFetched: Date.now()
      };

      // Update cache
      setCache(prev => ({
        ...prev,
        [setId]: newCache
      }));

      console.log(`[SetCache] Cached content for set ${setId}: ${phrases.length} phrases`);
      return newCache;

    } catch (error) {
      console.error(`[SetCache] Error loading content for set ${setId}:`, error);
      // Return empty cache entry on error
      const emptyCache: SetContentCache = {
        phrases: [],
        progress: {},
        lastFetched: Date.now()
      };
      return emptyCache;
    }
  }, [getCachedContent]);

  const preloadAllSets = useCallback(async (setIds: string[]) => {
    console.log(`[SetCache] Pre-loading ${setIds.length} sets...`);
    
    // Load sets in batches to avoid overwhelming the server
    // Slightly larger batches to speed up first-load counts without overloading the server
    const BATCH_SIZE = 12;
    for (let i = 0; i < setIds.length; i += BATCH_SIZE) {
      const batch = setIds.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(setId => preloadSetContent(setId).catch(err => {
          console.error(`[SetCache] Failed to preload set ${setId}:`, err);
        }))
      );
    }
    
    console.log(`[SetCache] Pre-loading complete`);
  }, [preloadSetContent]);

  const clearCache = useCallback(() => {
    console.log('[SetCache] Clearing entire cache');
    setCache({});
  }, []);

  const clearSetCache = useCallback((setId: string) => {
    console.log(`[SetCache] Clearing cache for set ${setId}`);
    setCache(prev => {
      const newCache = { ...prev };
      delete newCache[setId];
      return newCache;
    });
  }, []);

  const clearFolderCache = useCallback(() => {
    console.log('[SetCache] Clearing folder cache');
    setFolderCache(null);
  }, []);

  const preloadFolders = useCallback(async (forceRefresh = false): Promise<Folder[]> => {
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = getCachedFolders();
      if (cached) {
        console.log('[SetCache] Using cached folders');
        return cached;
      }
    }

    console.log('[SetCache] Fetching folders');
    try {
      const response = await fetch('/api/folders', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch folders');
      }

      const data = await response.json();
      // API sometimes returns an array directly, or { folders: Folder[] }
      const folders = Array.isArray(data) ? data : (data.folders || []);
      
      // Update cache
      setFolderCache({
        folders,
        lastFetched: Date.now()
      });

      console.log(`[SetCache] Cached ${folders.length} folders`);
      return folders;
    } catch (error) {
      console.error('[SetCache] Error loading folders:', error);
      return [];
    }
  }, [getCachedFolders]);

  const preloadImages = useCallback(async (imageUrls: (string | null | undefined)[]) => {
    const validUrls = imageUrls.filter((url): url is string => !!url);
    const uniqueUrls = Array.from(new Set(validUrls));
    
    console.log(`[SetCache] Pre-loading ${uniqueUrls.length} images...`);
    
    const imagePromises = uniqueUrls.map(url => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          console.log(`[SetCache] Successfully preloaded image: ${url}`);
          resolve();
        };
        img.onerror = () => {
          console.error(`[SetCache] Failed to preload image: ${url}`);
          resolve(); // Still resolve to not block other images
        };
        img.src = url;
      });
    });
    
    await Promise.all(imagePromises);
    console.log(`[SetCache] Image pre-loading complete`);
  }, []);

  return (
    <SetCacheContext.Provider value={{
      cache,
      folderCache,
      getCachedContent,
      getCachedFolders,
      preloadSetContent,
      preloadAllSets,
      preloadFolders,
      clearCache,
      clearSetCache,
      clearFolderCache,
      preloadImages
    }}>
      {children}
    </SetCacheContext.Provider>
  );
};

export const useSetCache = () => {
  const context = useContext(SetCacheContext);
  if (context === undefined) {
    throw new Error('useSetCache must be used within a SetCacheProvider');
  }
  return context;
};

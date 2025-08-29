'use client';

import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { Phrase } from '@/app/lib/set-generator';
import type { PhraseProgressData } from '@/app/lib/storage';
import { getDefaultSetContent } from '@/app/lib/seed-default-sets';

interface SetContentCache {
  phrases: Phrase[];
  progress: Record<number, PhraseProgressData>;
  lastFetched: number;
}

interface SetCacheContextProps {
  cache: Record<string, SetContentCache>;
  getCachedContent: (setId: string) => SetContentCache | null;
  preloadSetContent: (setId: string, forceRefresh?: boolean) => Promise<SetContentCache>;
  preloadAllSets: (setIds: string[]) => Promise<void>;
  clearCache: () => void;
  clearSetCache: (setId: string) => void;
  preloadImages: (imageUrls: (string | null | undefined)[]) => Promise<void>;
}

const SetCacheContext = createContext<SetCacheContextProps | undefined>(undefined);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache validity

export const SetCacheProvider = ({ children }: { children: ReactNode }) => {
  const [cache, setCache] = useState<Record<string, SetContentCache>>({});

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
    const BATCH_SIZE = 5;
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

  const preloadImages = useCallback(async (imageUrls: (string | null | undefined)[]) => {
    const validUrls = imageUrls.filter((url): url is string => !!url);
    const uniqueUrls = [...new Set(validUrls)];
    
    console.log(`[SetCache] Pre-loading ${uniqueUrls.length} images...`);
    
    const imagePromises = uniqueUrls.map(url => {
      return new Promise<void>((resolve, reject) => {
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
      getCachedContent,
      preloadSetContent,
      preloadAllSets,
      clearCache,
      clearSetCache,
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

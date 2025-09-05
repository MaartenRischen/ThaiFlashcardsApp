'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppPreloader, PreloadedData, PreloadProgress } from '@/app/lib/preloader';
import { useAuth } from '@clerk/nextjs';

interface PreloaderContextType {
  isLoading: boolean;
  progress: PreloadProgress;
  preloadedData: PreloadedData | null;
  retryPreload: () => Promise<void>;
}

const PreloaderContext = createContext<PreloaderContextType | undefined>(undefined);

export function PreloaderProvider({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded: isAuthLoaded } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<PreloadProgress>({
    stage: 'init',
    progress: 0,
    message: 'Initializing...'
  });
  const [preloadedData, setPreloadedData] = useState<PreloadedData | null>(null);
  const preloaderRef = useRef<AppPreloader | null>(null);
  const hasPreloadedRef = useRef(false);
  const lastUserIdRef = useRef<string | null | undefined>(undefined);

  const performPreload = useCallback(async () => {
    // Don't preload if we already have data for the same user
    if (hasPreloadedRef.current && lastUserIdRef.current === userId && preloadedData) {
      console.log('[Preloader] Skipping preload - data already loaded for user:', userId);
      setIsLoading(false);
      return;
    }

    console.log('[Preloader] Starting preload for user:', userId);
    setIsLoading(true);
    hasPreloadedRef.current = false;

    try {
      // Cancel any existing preload
      preloaderRef.current?.cancel();

      // Create new preloader
      const preloader = new AppPreloader((progress) => {
        setProgress(progress);
      });
      preloaderRef.current = preloader;

      // Perform preload
      const data = await preloader.preloadApp(userId);
      
      setPreloadedData(data);
      hasPreloadedRef.current = true;
      lastUserIdRef.current = userId;
      
      console.log('[Preloader] Preload complete:', {
        sets: data.sets.length,
        folders: data.folders.length,
        contents: Object.keys(data.setContents).length,
        progress: Object.keys(data.setProgress).length,
        mnemonics: Object.keys(data.userMnemonics).length,
        images: Object.keys(data.images).length
      });

      // Immediately hide loading screen - data is ready
      setIsLoading(false);

    } catch (error) {
      console.error('[Preloader] Error during preload:', error);
      setProgress({
        stage: 'init',
        progress: 0,
        message: 'Error loading app. Please refresh.'
      });
      // Still hide loading screen on error to allow user to see the app
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    }
  }, [userId, preloadedData]);

  const retryPreload = useCallback(async () => {
    hasPreloadedRef.current = false;
    await performPreload();
  }, [performPreload]);

  // Preload when auth state is loaded
  useEffect(() => {
    if (!isAuthLoaded) {
      console.log('[Preloader] Waiting for auth to load...');
      return;
    }

    performPreload();

    // Cleanup on unmount
    return () => {
      preloaderRef.current?.cancel();
    };
  }, [isAuthLoaded, userId, performPreload]);

  return (
    <PreloaderContext.Provider
      value={{
        isLoading,
        progress,
        preloadedData,
        retryPreload
      }}
    >
      {children}
    </PreloaderContext.Provider>
  );
}

export function usePreloader() {
  const context = useContext(PreloaderContext);
  if (!context) {
    throw new Error('usePreloader must be used within PreloaderProvider');
  }
  return context;
}

'use client';

import { useEffect, useState } from 'react';
import { useSet } from '@/app/context/SetContext';
import { useSetCache } from '@/app/context/SetCacheContext';
import { useAuth } from '@clerk/nextjs';

export function AppInitializer() {
  const { isLoaded, userId } = useAuth();
  const { availableSets } = useSet();
  const { preloadAllSets, preloadImages, preloadFolders } = useSetCache();
  const [initialized, setInitialized] = useState(false);
  const [setsPreloaded, setSetsPreloaded] = useState(false);

  useEffect(() => {
    // Only run initialization once
    if (initialized) return;

    const initializeApp = async () => {
      try {
        console.log('Starting app initialization...');
        const response = await fetch('/api/init', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          console.log('App initialization completed:', result.message);
        } else {
          console.warn('App initialization failed, but app will continue to work');
        }
      } catch (error) {
        console.warn('App initialization error, but app will continue to work:', error);
      } finally {
        setInitialized(true);
      }
    };

    // Delay initialization slightly to ensure the app is fully loaded
    const timer = setTimeout(initializeApp, 1000);
    return () => clearTimeout(timer);
  }, [initialized]);

  // Preload sets after user is authenticated and sets are available
  useEffect(() => {
    if (!isLoaded || !userId || setsPreloaded || availableSets.length <= 1) {
      return;
    }

    const preloadData = async () => {
      console.log('[AppInitializer] Starting background preload of folders and sets...');
      
      try {
        // Preload folders first
        await preloadFolders();
        console.log('[AppInitializer] Folders preloaded');
        
        // Get first 10 sets to preload (excluding default)
        const setsToPreload = availableSets
          .filter(set => set.id !== 'generating')
          .slice(0, 10)
          .map(set => set.id);
        
        // Preload set content
        await preloadAllSets(setsToPreload);
        
        // Preload images for ALL sets (not just first 10) to ensure My Sets modal has all images
        const imageUrls = availableSets
          .map(set => {
            if (set.imageUrl) return set.imageUrl;
            if (set.id === 'default') return '/images/defaultnew.png';
            return '/images/default-set-logo.png';
          });
        
        await preloadImages(imageUrls);
        
        console.log('[AppInitializer] Background preload completed');
        setSetsPreloaded(true);
      } catch (error) {
        console.error('[AppInitializer] Error during background preload:', error);
      }
    };

    // Delay preloading to not interfere with initial page load
    const timer = setTimeout(preloadData, 3000);
    return () => clearTimeout(timer);
  }, [isLoaded, userId, availableSets, setsPreloaded, preloadAllSets, preloadImages, preloadFolders]);

  // This component doesn't render anything visible
  return null;
} 
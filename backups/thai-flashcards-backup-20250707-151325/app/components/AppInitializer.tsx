'use client';

import { useEffect, useState } from 'react';

export function AppInitializer() {
  const [initialized, setInitialized] = useState(false);

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

  // This component doesn't render anything visible
  return null;
} 
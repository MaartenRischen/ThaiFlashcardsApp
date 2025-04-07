'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { INITIAL_PHRASES } from '@/app/data/phrases';
import { Phrase } from '@/app/lib/set-generator';
import { useSession } from 'next-auth/react';
import * as storage from '@/app/lib/storage'; // Keep for fallback/offline mode
import { SetMetaData, SetProgress } from '@/app/lib/storage';

interface SetContextProps {
  availableSets: SetMetaData[];
  activeSetId: string | null;
  activeSetContent: Phrase[];
  activeSetProgress: SetProgress;
  isLoading: boolean;
  switchSet: (setId: string) => Promise<void>;
  addSet: (newSetData: Omit<SetMetaData, 'id' | 'createdAt' | 'phraseCount'>, phrases: Phrase[]) => Promise<string>;
  updateSetProgress: (newProgress: SetProgress) => void;
  deleteSet: (setId: string) => Promise<void>;
  exportSet: (setId: string) => void;
  renameSet: (setId: string, newTitle: string) => Promise<void>;
}

const SetContext = createContext<SetContextProps | undefined>(undefined);

// Define default set
const DEFAULT_SET_ID = 'default';
const DEFAULT_SET_METADATA: SetMetaData = {
  id: DEFAULT_SET_ID,
  name: "Default Set",
  createdAt: new Date().toISOString(),
  phraseCount: INITIAL_PHRASES.length,
  source: 'default'
};

export const SetProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const [availableSets, setAvailableSets] = useState<SetMetaData[]>([DEFAULT_SET_METADATA]);
  const [activeSetId, setActiveSetId] = useState<string | null>(DEFAULT_SET_ID);
  const [activeSetContent, setActiveSetContent] = useState<Phrase[]>(INITIAL_PHRASES as unknown as Phrase[]);
  const [activeSetProgress, setActiveSetProgress] = useState<SetProgress>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial load based on authentication state
  useEffect(() => {
    const initializeSetData = async () => {
      try {
        setIsLoading(true);
        
        if (status === 'authenticated') {
          // User is logged in, fetch sets from the server
          await fetchUserSets();
        } else if (status === 'unauthenticated') {
          // User is not logged in, use localStorage
          const storedSets = storage.getAvailableSets();
          
          // Ensure Default Set metadata is always present
          const setsWithDefault = storedSets.some(s => s.id === DEFAULT_SET_ID)
            ? storedSets
            : [DEFAULT_SET_METADATA, ...storedSets];
          
          if (!storedSets.some(s => s.id === DEFAULT_SET_ID)) {
            storage.saveAvailableSets(setsWithDefault);
          }
          
          setAvailableSets(setsWithDefault);

          const storedActiveId = storage.getActiveSetId() || DEFAULT_SET_ID;
          await loadSetData(storedActiveId);
        }
      } catch (error) {
        console.error("Error initializing set data:", error);
        // Fall back to Default Set if something goes wrong
        setActiveSetId(DEFAULT_SET_ID);
        setActiveSetContent(INITIAL_PHRASES as unknown as Phrase[]);
        setActiveSetProgress({});
      } finally {
        setIsLoading(false);
      }
    };

    if (status !== 'loading') {
      initializeSetData();
    }
  }, [status]);

  // Fetch user sets from the server
  const fetchUserSets = async () => {
    try {
      const response = await fetch('/api/flashcard-sets');
      
      if (!response.ok) {
        throw new Error('Failed to fetch sets');
      }
      
      const data = await response.json();
      
      // Transform to match SetMetaData format
      const formattedSets: SetMetaData[] = data.sets.map((set: any) => ({
        id: set.id,
        name: set.name,
        cleverTitle: set.cleverTitle,
        createdAt: set.createdAt,
        phraseCount: set._count?.phrases || 0,
        level: set.level,
        goals: set.goals,
        specificTopics: set.specificTopics,
        source: set.source
      }));
      
      // Ensure Default Set is present
      let setsToUse = formattedSets;
      if (!formattedSets.some(s => s.source === 'default')) {
        // Create default set if it doesn't exist
        await createDefaultSet();
        // Refetch sets
        return fetchUserSets();
      }
      
      setAvailableSets(setsToUse);
      
      // Load the active set
      const storedActiveId = storage.getActiveSetId() || DEFAULT_SET_ID;
      await loadSetData(storedActiveId);
    } catch (error) {
      console.error('Error fetching user sets:', error);
      // Fall back to default set
      setAvailableSets([DEFAULT_SET_METADATA]);
      setActiveSetId(DEFAULT_SET_ID);
      setActiveSetContent(INITIAL_PHRASES as unknown as Phrase[]);
      setActiveSetProgress({});
    }
  };

  // Create the default set for a user in the database
  const createDefaultSet = async () => {
    try {
      const response = await fetch('/api/flashcard-sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Default Set',
          source: 'default',
          phrases: INITIAL_PHRASES
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create default set');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating default set:', error);
      throw error;
    }
  };

  const loadSetData = useCallback(async (setId: string) => {
    setIsLoading(true);
    
    try {
      setActiveSetId(setId);
      storage.setActiveSetId(setId); // Still save activeSetId to localStorage for convenience

      // If user is authenticated, fetch from API
      if (status === 'authenticated') {
        // Fetch set content from API
        const contentResponse = await fetch(`/api/flashcard-sets/${setId}`);
        
        if (!contentResponse.ok) {
          throw new Error(`Failed to fetch set ${setId}`);
        }
        
        const contentData = await contentResponse.json();
        setActiveSetContent(contentData.set.phrases);
        
        // Fetch progress from API
        const progressResponse = await fetch(`/api/user-progress?setId=${setId}`);
        
        if (!progressResponse.ok) {
          throw new Error(`Failed to fetch progress for set ${setId}`);
        }
        
        const progressData = await progressResponse.json();
        setActiveSetProgress(progressData.progressData);
      } else {
        // User is not authenticated, use localStorage
        let content: Phrase[];
        if (setId === DEFAULT_SET_ID) {
          content = INITIAL_PHRASES as unknown as Phrase[];
        } else {
          const storedContent = storage.getSetContent(setId);
          if (!storedContent) {
            throw new Error(`Content for set ${setId} not found`);
          }
          content = storedContent;
        }
        
        setActiveSetContent(content);

        const progress = storage.getSetProgress(setId);
        setActiveSetProgress(progress);
      }
    } catch (error) {
      console.error(`Error loading set ${setId}:`, error);
      // Fall back to Default Set on error
      if (setId !== DEFAULT_SET_ID) {
        await loadSetData(DEFAULT_SET_ID);
      }
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  const switchSet = useCallback(async (setId: string) => {
    if (activeSetId === setId) return; // Already on this set
    
    // Save progress of current set before switching
    if (activeSetId) {
      if (status === 'authenticated') {
        try {
          await fetch('/api/user-progress', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              setId: activeSetId,
              progressData: activeSetProgress
            }),
          });
        } catch (error) {
          console.error('Error saving progress before switch:', error);
          // Fall back to localStorage as backup
          storage.saveSetProgress(activeSetId, activeSetProgress);
        }
      } else {
        // Use localStorage for unauthenticated users
        storage.saveSetProgress(activeSetId, activeSetProgress);
      }
    }

    await loadSetData(setId);
  }, [activeSetId, activeSetProgress, loadSetData, status]);

  const updateSetProgress = useCallback((newProgress: SetProgress) => {
    if (!activeSetId) return;
    console.log(`SetContext: updateSetProgress called for activeSetId=${activeSetId}`);
    console.log(`SetContext: Updating progress state with:`, JSON.stringify(newProgress));
    
    setActiveSetProgress(newProgress);
    
    // Save progress
    if (status === 'authenticated') {
      // Save to server (don't await to avoid blocking UI)
      fetch('/api/user-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          setId: activeSetId,
          progressData: newProgress
        }),
      }).catch(error => {
        console.error('Error saving progress to server:', error);
        // Fall back to localStorage as backup
        storage.saveSetProgress(activeSetId, newProgress);
      });
    } else {
      // Use localStorage for unauthenticated users
      storage.saveSetProgress(activeSetId, newProgress);
    }
  }, [activeSetId, status]);

  const addSet = useCallback(async (
    newSetData: Omit<SetMetaData, 'id' | 'createdAt' | 'phraseCount'>,
    phrases: Phrase[]
  ): Promise<string> => {
    if (status === 'authenticated') {
      try {
        const response = await fetch('/api/flashcard-sets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...newSetData,
            phrases
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create set');
        }
        
        const data = await response.json();
        const newId = data.set.id;
        
        // Refresh the sets list
        await fetchUserSets();
        
        // Switch to the new set
        await switchSet(newId);
        
        return newId;
      } catch (error) {
        console.error('Error creating set:', error);
        throw error;
      }
    } else {
      // User is not authenticated, use localStorage
      const newId = storage.generateUUID();
      const now = new Date().toISOString();
      
      const newMetaData: SetMetaData = {
        ...newSetData,
        id: newId,
        createdAt: now,
        phraseCount: phrases.length,
      };

      // Save the set content
      storage.saveSetContent(newId, phrases);
      
      // Update available sets list
      const currentSets = storage.getAvailableSets();
      const updatedSets = [...currentSets, newMetaData];
      storage.saveAvailableSets(updatedSets);
      
      // Update state
      setAvailableSets(prev => [...prev, newMetaData]);
      
      // Automatically switch to the new set
      await switchSet(newId);

      return newId;
    }
  }, [fetchUserSets, switchSet, status]);

  const deleteSet = useCallback(async (setId: string) => {
    if (setId === DEFAULT_SET_ID) {
      alert("The Default Set cannot be deleted.");
      return;
    }

    if (!confirm(`Are you sure you want to delete this set? This action cannot be undone.`)) {
      return;
    }

    // If deleting the active set, switch to Default Set first
    if (activeSetId === setId) {
      await switchSet(DEFAULT_SET_ID);
    }

    if (status === 'authenticated') {
      try {
        const response = await fetch(`/api/flashcard-sets/${setId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete set');
        }
        
        // Refresh the sets list
        await fetchUserSets();
      } catch (error) {
        console.error('Error deleting set:', error);
        alert(`Error deleting set: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      // User is not authenticated, use localStorage
      // Delete set data
      storage.deleteSetContent(setId);
      storage.deleteSetProgress(setId);

      // Update available sets list
      const currentSets = storage.getAvailableSets();
      const updatedSets = currentSets.filter(set => set.id !== setId);
      storage.saveAvailableSets(updatedSets);
      
      // Update state
      setAvailableSets(prev => prev.filter(set => set.id !== setId));
    }
  }, [activeSetId, switchSet, fetchUserSets, status]);

  const exportSet = useCallback((setId: string) => {
    try {
      // Get set metadata
      const metadata = availableSets.find(set => set.id === setId);
      if (!metadata) {
        throw new Error(`Set metadata for ${setId} not found`);
      }

      // Get set content (either from state or by fetching)
      let content: Phrase[];
      if (setId === activeSetId) {
        content = activeSetContent;
      } else if (status === 'authenticated') {
        // For authenticated users, we need to fetch the content
        alert("Please switch to the set you want to export first.");
        return;
      } else {
        // For unauthenticated users, we can use localStorage
        if (setId === DEFAULT_SET_ID) {
          content = INITIAL_PHRASES as unknown as Phrase[];
        } else {
          const storedContent = storage.getSetContent(setId);
          if (!storedContent) {
            throw new Error(`Content for set ${setId} not found`);
          }
          content = storedContent;
        }
      }

      // Prepare export data
      const exportData = {
        name: metadata.name,
        level: metadata.level,
        goals: metadata.goals,
        specificTopics: metadata.specificTopics,
        createdAt: metadata.createdAt,
        phrases: content,
        source: metadata.source
      };

      // Generate download
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileName = metadata.name.replace(/\s+/g, '-').toLowerCase() + '.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);
      linkElement.click();
    } catch (error) {
      console.error(`Error exporting set ${setId}:`, error);
      alert(`Error exporting set: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [availableSets, activeSetId, activeSetContent, status]);

  const renameSet = useCallback(async (setId: string, newTitle: string) => {
    console.log(`renameSet called: setId=${setId}, newTitle="${newTitle}"`);
    if (!newTitle.trim()) {
      alert("Set title cannot be empty.");
      return;
    }
    
    if (status === 'authenticated') {
      try {
        const response = await fetch(`/api/flashcard-sets/${setId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newTitle }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to rename set');
        }
        
        // Refresh the sets list
        await fetchUserSets();
      } catch (error) {
        console.error('Error renaming set:', error);
        alert(`Error renaming set: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      // User is not authenticated, use localStorage
      const currentSets = storage.getAvailableSets();
      const setIndex = currentSets.findIndex(set => set.id === setId);
      
      if (setIndex === -1) {
        console.error(`Set with ID ${setId} not found for renaming.`);
        alert("Error: Could not find the set to rename.");
        return;
      }
      
      const updatedSetData = { 
        ...currentSets[setIndex],
        name: newTitle
      };
      
      const updatedSets = [
        ...currentSets.slice(0, setIndex),
        updatedSetData,
        ...currentSets.slice(setIndex + 1)
      ];
      
      storage.saveAvailableSets(updatedSets);
      setAvailableSets(updatedSets);
    }
  }, [fetchUserSets, status]);

  return (
    <SetContext.Provider value={{
      availableSets,
      activeSetId,
      activeSetContent,
      activeSetProgress,
      isLoading,
      switchSet,
      addSet,
      updateSetProgress,
      deleteSet,
      exportSet,
      renameSet
    }}>
      {children}
    </SetContext.Provider>
  );
};

export const useSet = () => {
  const context = useContext(SetContext);
  if (context === undefined) {
    throw new Error('useSet must be used within a SetProvider');
  }
  return context;
}; 
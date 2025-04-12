'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { INITIAL_PHRASES } from '@/app/data/phrases';
import { Phrase } from '@/app/lib/set-generator';
import * as storage from '@/app/lib/storage'; // Use renamed storage
import { SetMetaData, SetProgress } from '@/app/lib/storage';

interface SetContextProps {
  availableSets: SetMetaData[];
  activeSetId: string | null;
  activeSetContent: Phrase[];
  activeSetProgress: SetProgress;
  isLoading: boolean;
  switchSet: (id: string) => Promise<void>;
  addSet: (
    setData: Omit<SetMetaData, 'id' | 'createdAt' | 'phraseCount' | 'isFullyLearned'>, 
    phrases: Phrase[]
  ) => Promise<string>;
  updateSetProgress: (newProgress: SetProgress) => Promise<void>;
  deleteSet: (id: string) => Promise<void>;
  exportSet: (id: string) => Promise<void>;
  renameSet: (id: string, newName: string) => Promise<void>;
}

const SetContext = createContext<SetContextProps | undefined>(undefined);

// Define default set
const DEFAULT_SET_ID = 'default';
const DEFAULT_SET_METADATA: SetMetaData = {
  id: DEFAULT_SET_ID,
  name: "Default Set",
  createdAt: new Date().toISOString(),
  phraseCount: INITIAL_PHRASES.length,
  source: 'default',
  isFullyLearned: false // Ensure default has the flag
};

export const SetProvider = ({ children }: { children: ReactNode }) => {
  const [availableSets, setAvailableSets] = useState<SetMetaData[]>([DEFAULT_SET_METADATA]);
  const [activeSetId, setActiveSetId] = useState<string | null>(null); // Initialize as null
  const [activeSetContent, setActiveSetContent] = useState<Phrase[]>([]);
  const [activeSetProgress, setActiveSetProgress] = useState<SetProgress>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Function to load content and progress for a specific set ID
  const loadSetData = useCallback(async (id: string | null) => {
    console.log(`SetContext: loadSetData called for id=${id}`);
    if (!id) { 
      console.log("SetContext: No ID provided, cannot load data.");
      setIsLoading(false);
      return; // Exit early if no valid ID determined
    }

    setIsLoading(true);
    try {
      let content: Phrase[] | null = null;
      let progress: SetProgress = {};

      if (id === DEFAULT_SET_ID) {
        content = INITIAL_PHRASES as unknown as Phrase[];
        progress = storage.getSetProgress(id); // Load progress even for default
        console.log(`SetContext: Loading DEFAULT set content (${content?.length} phrases) and progress`);
      } else {
        content = storage.getSetContent(id); // Use storage function
        progress = storage.getSetProgress(id); // Use storage function
        console.log(`SetContext: Loading content (${content?.length} phrases) and progress for set ${id}`);
      }
      
      if (content) {
        setActiveSetContent(content);
        setActiveSetProgress(progress || {});
      } else {
        console.warn(`SetContext: No content found for set ${id}. Falling back to default display.`);
        // Don't change activeSetId here, just show default content/empty state
        setActiveSetContent(INITIAL_PHRASES as unknown as Phrase[]);
        setActiveSetProgress({});
        // Optionally switch back to default ID if preferred:
        // setActiveSetId(DEFAULT_SET_ID);
      }
      
    } catch (error) {
      console.error(`SetContext: Error loading data for set ${id}:`, error);
      // Fallback to default display state on error
      setActiveSetContent(INITIAL_PHRASES as unknown as Phrase[]);
      setActiveSetProgress({});
      setActiveSetId(DEFAULT_SET_ID); // Switch back to default ID on error
    } finally {
      setIsLoading(false);
    }
  }, []); 


  // Function to save progress for the active set
  const updateSetProgress = useCallback(async (newProgress: SetProgress) => {
    if (!activeSetId) return;
    console.log(`SetContext: updateSetProgress called for activeSetId=${activeSetId}`);
    setActiveSetProgress(newProgress);
    // Use storage function
    storage.saveSetProgress(activeSetId, newProgress);

    // Check if all cards in the current set are marked 'easy'
    const currentSetContent = activeSetContent;
    if (currentSetContent && currentSetContent.length > 0 && activeSetId !== DEFAULT_SET_ID) { // Don't track for default
      const allEasy = currentSetContent.every((phrase, index) => {
        const cardProgress = newProgress[index];
        return cardProgress?.difficulty === 'easy';
      });

      const currentMeta = availableSets.find(set => set.id === activeSetId);
      if (currentMeta) {
        const needsUpdate = (currentMeta.isFullyLearned !== allEasy);

        if (needsUpdate) {
          console.log(`Set ${activeSetId}: Fully learned status changed to ${allEasy}. Updating metadata.`);
          const updatedMeta: SetMetaData = { ...currentMeta, isFullyLearned: allEasy };
          // Use storage function
          storage.updateSetMetaData(updatedMeta); // Use the correct update function
          // Update the availableSets state immediately for UI reactivity
          setAvailableSets(prevSets => 
            prevSets.map(set => set.id === activeSetId ? updatedMeta : set)
          );
        }
      }
    }
  // Adjusted dependencies
  }, [activeSetId, activeSetContent, availableSets]);

  // Function to load all sets and progress on mount
  useEffect(() => {
    const loadInitialData = async () => {
      console.log("SetContext: Initial load starting...");
      setIsLoading(true);
      // Load all metadata first
      const allMeta = storage.getAllSetMetaData(); // Use storage function
      setAvailableSets([DEFAULT_SET_METADATA, ...allMeta.filter(set => set.id !== DEFAULT_SET_ID)]);
      console.log(`SetContext: Loaded ${allMeta.length} set metadata entries.`);
      
      // Determine initial active set ID (e.g., last used or default)
      // Persisting last active ID is optional, default to DEFAULT_SET_ID for simplicity
      const initialActiveId = DEFAULT_SET_ID;
      setActiveSetId(initialActiveId); // Set state here, triggers the next useEffect
      
      setIsLoading(false); 
      console.log("SetContext: Initial load finished, activeSetId set to:", initialActiveId);
    };
    loadInitialData();
  }, []); // Empty dependency array to run only once on mount

  // Effect to load data when activeSetId changes
  useEffect(() => {
    if (activeSetId) {
      console.log(`SetContext: activeSetId changed to ${activeSetId}, triggering loadSetData.`);
      loadSetData(activeSetId);
    } else {
        // Handle case where activeSetId becomes null (e.g., initial state)
        console.log("SetContext: activeSetId is null, loading default set data.");
        setActiveSetId(DEFAULT_SET_ID); // Ensure default is set if it becomes null
    }
  }, [activeSetId, loadSetData]); // Keep loadSetData dependency here


  const addSet = useCallback(async (
    setData: Omit<SetMetaData, 'id' | 'createdAt' | 'phraseCount' | 'isFullyLearned'>, 
    phrases: Phrase[]
  ): Promise<string> => {
    const newId = storage.generateUUID();
    const now = new Date().toISOString();
    const newMetaData: SetMetaData = {
      ...setData,
      id: newId,
      createdAt: now,
      phraseCount: phrases.length,
      isFullyLearned: false // Default to false
    };

    // Use storage functions
    storage.addSetMetaData(newMetaData); // Use the correct add function
    storage.saveSetContent(newId, phrases);
    storage.saveSetProgress(newId, {}); // Save empty progress

    setAvailableSets(prev => [...prev, newMetaData]);
    setActiveSetId(newId); // Switch to the new set (will trigger useEffect)
    console.log(`SetContext: Added new set ${newId} with ${phrases.length} phrases.`);
    return newId;
  }, []); 

  const deleteSet = useCallback(async (id: string) => {
    if (id === DEFAULT_SET_ID) {
      console.warn("SetContext: Attempted to delete default set. Operation aborted.");
      return; 
    }
    console.log(`SetContext: Deleting set ${id}`);
    // Use storage function - it handles content/progress deletion now
    storage.deleteSetMetaData(id);

    setAvailableSets(prev => prev.filter(set => set.id !== id));
    
    // Switch back to default set if the active one was deleted
    if (activeSetId === id) {
      setActiveSetId(DEFAULT_SET_ID); // Triggers useEffect to load default
    }
  }, [activeSetId]);

  const switchSet = useCallback(async (id: string) => {
    if (id === activeSetId) {
      console.log(`SetContext: Set ${id} is already active.`);
      return; // No need to switch if already active
    }
    console.log(`SetContext: Switching to set ${id}`);
    // No need to persist active ID separately if we just set the state
    setActiveSetId(id); // Triggers useEffect to load new set data
  }, [activeSetId]);

  const exportSet = useCallback(async (id: string) => {
    console.log(`SetContext: Exporting set ${id}`);
    if (id === DEFAULT_SET_ID) {
        alert("Cannot export the default set.");
        return;
    }
    try {
        const metaData = availableSets.find(set => set.id === id);
        const content = storage.getSetContent(id); // Use storage
        const progress = storage.getSetProgress(id); // Use storage

        if (!metaData || !content) {
            throw new Error('Set data could not be loaded for export.');
        }

        const exportData = {
            version: "1.0", // Add a version number for future compatibility
            metaData: metaData,
            content: content,
            progress: progress || {} // Include progress
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `${metaData.name.replace(/[^a-z0-9]/gi, '_') || 'custom_set'}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        console.log(`SetContext: Set ${id} exported successfully.`);
    } catch (error) {
        console.error(`SetContext: Error exporting set ${id}:`, error);
        alert(`Failed to export set: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [availableSets]);

  const renameSet = useCallback(async (id: string, newName: string) => {
    console.log(`SetContext: Renaming set ${id} to \"${newName}\"`);
    // Find the set in the current state first
    const setIndex = availableSets.findIndex(set => set.id === id);
    if (setIndex !== -1) {
      const currentSet = availableSets[setIndex];
      // Update the specific set's name/cleverTitle
      const updatedSetData = { ...currentSet, name: newName, cleverTitle: newName }; // Update both for consistency
      // Use storage function to update persisted data
      storage.updateSetMetaData(updatedSetData);
      // Update the state
      setAvailableSets(prevSets => 
        prevSets.map(set => set.id === id ? updatedSetData : set)
      );
      console.log(`SetContext: Set ${id} renamed successfully.`);
    } else {
      console.error(`SetContext: Set ${id} not found for renaming.`);
    }
  }, [availableSets]); // Depends on availableSets state


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
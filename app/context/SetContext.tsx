'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { INITIAL_PHRASES } from '@/app/data/phrases';
import { Phrase } from '@/app/lib/set-generator';
import * as storage from '@/app/lib/storage';
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
  const [availableSets, setAvailableSets] = useState<SetMetaData[]>([DEFAULT_SET_METADATA]);
  const [activeSetId, setActiveSetId] = useState<string | null>(DEFAULT_SET_ID);
  const [activeSetContent, setActiveSetContent] = useState<Phrase[]>(INITIAL_PHRASES as unknown as Phrase[]);
  const [activeSetProgress, setActiveSetProgress] = useState<SetProgress>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial load
  useEffect(() => {
    const initializeSetData = async () => {
      try {
        setIsLoading(true);
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

    initializeSetData();
  }, []);

  const loadSetData = useCallback(async (setId: string) => {
    setIsLoading(true);
    
    try {
      setActiveSetId(setId);
      storage.setActiveSetId(setId);

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
    } catch (error) {
      console.error(`Error loading set ${setId}:`, error);
      // Fall back to Default Set on error
      if (setId !== DEFAULT_SET_ID) {
        await loadSetData(DEFAULT_SET_ID);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchSet = useCallback(async (setId: string) => {
    if (activeSetId === setId) return; // Already on this set
    
    // Save progress of current set before switching
    if (activeSetId) {
      storage.saveSetProgress(activeSetId, activeSetProgress);
    }

    await loadSetData(setId);
  }, [activeSetId, activeSetProgress, loadSetData]);

  const updateSetProgress = useCallback((newProgress: SetProgress) => {
    if (!activeSetId) return;
    console.log(`SetContext: updateSetProgress called for activeSetId=${activeSetId}`);
    console.log(`SetContext: Updating progress state with:`, JSON.stringify(newProgress));
    
    setActiveSetProgress(newProgress);
    storage.saveSetProgress(activeSetId, newProgress);
  }, [activeSetId]);

  const addSet = useCallback(async (
    newSetData: Omit<SetMetaData, 'id' | 'createdAt' | 'phraseCount'>,
    phrases: Phrase[]
  ): Promise<string> => {
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
  }, [switchSet]);

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

    // Delete set data
    storage.deleteSetContent(setId);
    storage.deleteSetProgress(setId);

    // Update available sets list
    const currentSets = storage.getAvailableSets();
    const updatedSets = currentSets.filter(set => set.id !== setId);
    storage.saveAvailableSets(updatedSets);
    
    // Update state
    setAvailableSets(prev => prev.filter(set => set.id !== setId));
  }, [activeSetId, switchSet]);

  const exportSet = useCallback((setId: string) => {
    try {
      // Get set metadata
      const metadata = availableSets.find(set => set.id === setId);
      if (!metadata) {
        throw new Error(`Set metadata for ${setId} not found`);
      }

      // Get set content
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
  }, [availableSets]);

  const renameSet = useCallback(async (setId: string, newTitle: string) => {
    console.log(`renameSet called: setId=${setId}, newTitle="${newTitle}"`);
    if (!newTitle.trim()) {
      alert("Set title cannot be empty.");
      return;
    }
    
    const currentSets = storage.getAvailableSets();
    const setIndex = currentSets.findIndex(set => set.id === setId);
    
    if (setIndex === -1) {
      console.error(`Set with ID ${setId} not found for renaming.`);
      alert("Error: Could not find the set to rename.");
      return;
    }
    
    const updatedSetData = { 
      ...currentSets[setIndex], 
      cleverTitle: newTitle.trim(), // Update cleverTitle primarily
      name: newTitle.trim() // Also update name for consistency/fallback
    };
    
    const updatedSets = [...currentSets];
    updatedSets[setIndex] = updatedSetData;
    
    storage.saveAvailableSets(updatedSets);
    setAvailableSets(updatedSets);
    console.log(`Set ${setId} renamed to "${newTitle.trim()}"`);
    
  }, []); // Dependency array might need other state if used

  return (
    <SetContext.Provider
      value={{
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
      }}
    >
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
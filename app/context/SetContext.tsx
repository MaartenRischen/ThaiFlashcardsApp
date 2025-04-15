'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react'; // Import useSession
import { INITIAL_PHRASES } from '@/app/data/phrases';
import { Phrase } from '@/app/lib/set-generator';
import * as storage from '@/app/lib/storage'; // Use renamed storage
import { SetMetaData, SetProgress } from '@/app/lib/storage';
import { generateImage } from '@/app/lib/ideogram-service'; // Import image generation service

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
  ) => Promise<string | null>;
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
  const { data: session, status } = useSession(); // Get session
  const [userId, setUserId] = useState<string | null>(null); // Store userId

  const [availableSets, setAvailableSets] = useState<SetMetaData[]>([DEFAULT_SET_METADATA]);
  const [activeSetId, setActiveSetId] = useState<string | null>(DEFAULT_SET_ID);
  const [activeSetContent, setActiveSetContent] = useState<Phrase[]>(INITIAL_PHRASES as unknown as Phrase[]);
  const [activeSetProgress, setActiveSetProgress] = useState<SetProgress>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Function to load content and progress for a specific set ID
  const loadSetData = useCallback(async (id: string | null) => {
    // This function now needs userId
    if (!userId && id !== DEFAULT_SET_ID) {
        console.warn(`SetContext: loadSetData called for non-default set ${id} but userId is not available.`);
        setActiveSetId(DEFAULT_SET_ID);
        setActiveSetContent(INITIAL_PHRASES as unknown as Phrase[]);
        setActiveSetProgress({});
        setIsLoading(false);
        return;
    }
    
    console.log(`SetContext: loadSetData called for id=${id}, userId=${userId}`);
    if (!id) { 
      console.log("SetContext: No ID provided, defaulting to default set.");
      setActiveSetId(DEFAULT_SET_ID);
      setActiveSetContent(INITIAL_PHRASES as unknown as Phrase[]);
      setActiveSetProgress({});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let content: Phrase[] | null = null;
      let progress: SetProgress = {};

      if (id === DEFAULT_SET_ID) {
        content = INITIAL_PHRASES as unknown as Phrase[];
        // Still try to load progress for default IF user is logged in
        if (userId) {
          progress = await storage.getSetProgress(userId, id); // Needs userId and await
        } else {
          progress = {}; // No progress for logged-out default set
        }
        console.log(`SetContext: Loading DEFAULT set content (${content?.length} phrases) and progress`);
      } else if (userId) { // Only load non-default if userId exists
        // Fetch async from Supabase
        content = await storage.getSetContent(id); // Needs await
        progress = await storage.getSetProgress(userId, id); // Needs userId and await
        console.log(`SetContext: Loading content (${content?.length} phrases) and progress for set ${id}`);
      } else {
         throw new Error("Attempted to load user set without userId");
      }
      
      setActiveSetContent(content || (INITIAL_PHRASES as unknown as Phrase[])); 
      setActiveSetProgress(progress || {});
      setActiveSetId(id); 
      
    } catch (error) {
      console.error(`SetContext: Error loading data for set ${id}:`, error);
      setAvailableSets(prev => prev.filter(s => s.id === DEFAULT_SET_ID)); 
      setActiveSetId(DEFAULT_SET_ID); 
      setActiveSetContent(INITIAL_PHRASES as unknown as Phrase[]);
      setActiveSetProgress({});
    } finally {
      setIsLoading(false);
    }
  // Add userId to dependencies
  }, [userId]); 


  // Function to save progress for the active set
  const updateSetProgress = useCallback(async (newProgress: SetProgress) => {
    if (!activeSetId || !userId || activeSetId === DEFAULT_SET_ID) { 
      if(activeSetId === DEFAULT_SET_ID) console.log("SetContext: Not saving progress for default set.");
      else console.warn(`SetContext: updateSetProgress called without activeSetId (${activeSetId}) or userId (${userId}).`);
      if (activeSetId === DEFAULT_SET_ID) {
          setActiveSetProgress(newProgress);
      }
      return;
    }
    console.log(`SetContext: updateSetProgress called for activeSetId=${activeSetId}, userId=${userId}`);
    setActiveSetProgress(newProgress); // Update local state immediately

    try {
      // Save async to Supabase
      const success = await storage.saveSetProgress(userId, activeSetId, newProgress); // Needs userId and await
      if (success) {
        console.log("SetContext: Successfully saved progress to Supabase.");
      } else {
        console.error("SetContext: Failed to save progress to Supabase.");
      }
    } catch (error) {
        console.error("SetContext: Error saving progress:", error);
    }

    // Update isFullyLearned status
    const currentSetContent = activeSetContent;
    if (currentSetContent && currentSetContent.length > 0) {
      const allEasy = currentSetContent.every((_, index) => {
        const cardProgress = newProgress[index];
        return cardProgress?.difficulty === 'easy';
      });

      const currentMeta = availableSets.find(set => set.id === activeSetId);
      if (currentMeta && currentMeta.isFullyLearned !== allEasy) {
          console.log(`Set ${activeSetId}: Fully learned status changed to ${allEasy}. Updating metadata.`);
          const updatedMeta: SetMetaData = { ...currentMeta, isFullyLearned: allEasy };
          try {
            // Use storage function (now async)
            await storage.updateSetMetaData(updatedMeta); // Needs await
            setAvailableSets(prevSets => 
              prevSets.map(set => set.id === activeSetId ? updatedMeta : set)
            );
          } catch (error) {
            console.error("SetContext: Failed to update isFullyLearned metadata:", error);
          }
      }
    }
  // Add userId to dependencies
  }, [activeSetId, userId, activeSetContent, availableSets]);

  // --- Refactored Initial Data Loading --- 
  useEffect(() => {
    const loadInitialData = async () => {
      if (status === 'authenticated' && session?.user?.id) {
        const currentUserId = session.user.id;
        setUserId(currentUserId); // Store the userId
        console.log(`SetContext: User authenticated (userId: ${currentUserId}). Loading initial data...`);
        setIsLoading(true);
        try {
          // Load user-specific sets from Supabase (now async)
          const userSets = await storage.getAllSetMetaData(currentUserId);
          setAvailableSets([DEFAULT_SET_METADATA, ...userSets.filter(set => set.id !== DEFAULT_SET_ID)]);
          console.log(`SetContext: Loaded ${userSets.length} user-specific set metadata entries.`);
          setActiveSetId(DEFAULT_SET_ID); // Keep default active initially

        } catch (error) {
           console.error("SetContext: Error loading initial user data:", error);
           setAvailableSets([DEFAULT_SET_METADATA]);
           setActiveSetId(DEFAULT_SET_ID);
        } finally {
          setIsLoading(false);
          console.log("SetContext: Initial data load finished for authenticated user.");
        }
      } else if (status === 'unauthenticated') {
        console.log("SetContext: User unauthenticated. Clearing user data and showing default set.");
        setUserId(null);
        setAvailableSets([DEFAULT_SET_METADATA]); 
        setActiveSetId(DEFAULT_SET_ID);
        setActiveSetContent(INITIAL_PHRASES as unknown as Phrase[]); 
        setActiveSetProgress({});
        setIsLoading(false);
      } else {
        console.log("SetContext: Auth status loading...");
        setIsLoading(true); 
      }
    };

    loadInitialData();
  }, [status, session]); // Rerun when auth status or session changes

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
  ): Promise<string | null> => {
    if (!userId) {
      console.error("addSet: Cannot add set, user not authenticated.");
      alert("You must be logged in to create and save sets.");
      return null;
    }
    
    console.log(`SetContext: Adding new set for userId: ${userId}`);
    setIsLoading(true);
    let newMetaId: string | null = null; 
    let generatedImageUrl: string | null = null;
    
    try {
      // Generate an image for the set if not imported
      if (setData.source !== 'import') {
        const prompt = `Playful cartoon illustration for a Thai language flashcard set named "${setData.name}". Theme: ${setData.goals?.join(', ') || 'general Thai vocabulary'}. Style: simple, colorful, cute donkey mascot.`;
        console.log(`[addSet] Generating image with prompt:`, prompt);
        
        try {
          generatedImageUrl = await generateImage(prompt);
          console.log(`[addSet] Ideogram API returned imageUrl:`, generatedImageUrl);
          if (generatedImageUrl) {
            console.log(`[addSet] Successfully generated image URL: ${generatedImageUrl}`);
          } else {
            console.warn("[addSet] Image generation failed or returned null, proceeding without image.");
          }
        } catch (imageError) {
          console.error("[addSet] Error during image generation:", imageError);
          // Continue without an image
        }
      }
      
      // For the default set (special case)
      if (setData.source === 'default') {
        generatedImageUrl = '/images/default-set-logo.png';
      }
      
      // Prepare metadata for *storage* including the generated image URL
      const metaDataForStorage: Omit<SetMetaData, 'id' | 'createdAt' | 'phraseCount' | 'isFullyLearned'> = {
          ...setData,
          imageUrl: generatedImageUrl || undefined
      };
      console.log(`[addSet] metaDataForStorage:`, metaDataForStorage);
      
      // 1. Add metadata to DB 
      const insertedRecord = await storage.addSetMetaData(userId, metaDataForStorage);
      console.log(`[addSet] insertedRecord from DB:`, insertedRecord);
      
      if (!insertedRecord) {
        throw new Error("Failed to save set metadata to database.");
      }
      newMetaId = insertedRecord.id; // Store ID for cleanup and state update

      // 2. Save content to DB
      const contentSaved = await storage.saveSetContent(newMetaId, phrases); 
      if (!contentSaved) {
        console.error(`[addSet] Failed to save content for new set ${newMetaId}. Attempting cleanup.`);
        await storage.deleteSetMetaData(newMetaId); 
        throw new Error("Failed to save set content to database.");
      }

      // 3. Save empty progress to DB
      const progressSaved = await storage.saveSetProgress(userId, newMetaId, {}); 
      if (!progressSaved) {
         console.error(`[addSet] Failed to save initial progress for new set ${newMetaId}. Attempting cleanup.`);
         await storage.deleteSetContent(newMetaId);
         await storage.deleteSetMetaData(newMetaId); 
         throw new Error("Failed to save initial set progress.");
      }

      // Create the *complete* SetMetaData object for local state, including calculated phraseCount
      const completeNewMetaData: SetMetaData = {
          id: insertedRecord.id,
          name: insertedRecord.name,
          cleverTitle: insertedRecord.cleverTitle || undefined,
          createdAt: insertedRecord.createdAt,
          level: insertedRecord.level as SetMetaData['level'] || undefined,
          goals: insertedRecord.goals || [],
          specificTopics: insertedRecord.specificTopics || undefined,
          source: insertedRecord.source as SetMetaData['source'] || 'generated',
          imageUrl: insertedRecord.imageUrl || undefined,
          phraseCount: phrases.length, // Calculate here for local state
          isFullyLearned: false // Default
      };
      console.log(`[addSet] completeNewMetaData for local state:`, completeNewMetaData);

      // Update local state
      setAvailableSets(prev => [...prev, completeNewMetaData]);
      setActiveSetId(completeNewMetaData.id); 
      console.log(`SetContext: Added new set ${completeNewMetaData.id} with ${phrases.length} phrases.`);
      return completeNewMetaData.id;

    } catch (error) {
      console.error("SetContext: Error adding set:", error);
      alert(`Failed to add set: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (newMetaId) {
          console.log(`Error occurred during addSet for ${newMetaId}, ensuring cleanup.`);
          await storage.deleteSetMetaData(newMetaId); 
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId]); 

  // --- Refactor deleteSet --- 
  const deleteSet = useCallback(async (id: string) => {
    if (id === DEFAULT_SET_ID) {
      console.warn("SetContext: Attempted to delete default set. Operation aborted.");
      return; 
    }
    if (!userId) { 
        console.error("deleteSet: Cannot delete set, user not authenticated.");
        return;
    }

    console.log(`SetContext: Deleting set ${id} for userId ${userId}`);
    setIsLoading(true);
    try {
      // Call async storage function (which handles related data deletion)
      const success = await storage.deleteSetMetaData(id); 

      if (!success) {
        throw new Error("Failed to delete set from database.");
      }

      // Update local state
      setAvailableSets(prev => prev.filter(set => set.id !== id));
      // Switch back to default set if the active one was deleted
      if (activeSetId === id) {
        setActiveSetId(DEFAULT_SET_ID); // Triggers useEffect to load default
      }
      console.log(`SetContext: Set ${id} deleted successfully.`);

    } catch (error) {
       console.error("SetContext: Error deleting set:", error);
       alert(`Failed to delete set: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
       setIsLoading(false);
    }
  // Add userId dependency
  }, [activeSetId, userId]);

  // --- switchSet (No backend call needed, just state update) --- 
  const switchSet = useCallback(async (id: string) => {
    if (id === activeSetId) {
      console.log(`SetContext: Set ${id} is already active.`);
      return; // No need to switch if already active
    }
    console.log(`SetContext: Switching to set ${id}`);
    setActiveSetId(id); // Triggers useEffect to load new set data
  }, [activeSetId]);

  // --- Refactor exportSet --- 
  const exportSet = useCallback(async (id: string) => {
    console.log(`SetContext: Exporting set ${id}`);
    if (id === DEFAULT_SET_ID) {
        alert("Cannot export the default set.");
        return;
    }
    // Need userId to get progress
    if (!userId) {
        alert("Cannot export set, user not logged in.");
        return;
    }
    setIsLoading(true);
    try {
        const metaData = availableSets.find(set => set.id === id);
        // Fetch async from Supabase
        const content = await storage.getSetContent(id); // Needs await
        const progress = await storage.getSetProgress(userId, id); // Needs userId and await

        if (!metaData || !content) {
            throw new Error('Set data could not be loaded for export.');
        }

        const exportData = {
            version: "1.0",
            metaData: metaData,
            content: content,
            progress: progress || {} 
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
    } finally {
       setIsLoading(false);
    }
  // Add userId dependency
  }, [availableSets, userId]);

  // --- Refactor renameSet --- 
  const renameSet = useCallback(async (id: string, newName: string) => {
    console.log(`SetContext: Renaming set ${id} to \"${newName}\"`);
    if (id === DEFAULT_SET_ID || !userId) {
        console.warn("Cannot rename default set or user not logged in.");
        return;
    }

    const setIndex = availableSets.findIndex(set => set.id === id);
    if (setIndex !== -1) {
      const currentSet = availableSets[setIndex];
      const updatedSetData = { ...currentSet, name: newName, cleverTitle: newName }; 
      
      setIsLoading(true);
      try {
          // Use storage function (now async)
          const success = await storage.updateSetMetaData(updatedSetData); // Needs await
          if (!success) throw new Error("Failed to update set metadata in database.");
          
          // Update the state
          setAvailableSets(prevSets => 
            prevSets.map(set => set.id === id ? updatedSetData : set)
          );
          console.log(`SetContext: Set ${id} renamed successfully.`);
      } catch(error) {
          console.error("SetContext: Error renaming set:", error);
          alert(`Failed to rename set: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
          setIsLoading(false);
      }
    } else {
      console.error(`SetContext: Set ${id} not found for renaming.`);
    }
  // Add userId dependency
  }, [availableSets, userId]);


  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
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
  // Update dependencies for useMemo - include all functions now
  }), [availableSets, activeSetId, activeSetContent, activeSetProgress, isLoading, switchSet, addSet, updateSetProgress, deleteSet, exportSet, renameSet]);

  return (
    <SetContext.Provider value={contextValue}>
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
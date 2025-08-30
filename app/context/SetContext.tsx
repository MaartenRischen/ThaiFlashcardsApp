'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@clerk/nextjs'; // <-- Import useAuth from Clerk
import { INITIAL_PHRASES, Phrase } from '@/app/data/phrases';
import { getDefaultSetsForUnauthenticatedUsers, getDefaultSetContent } from '@/app/lib/seed-default-sets';
import { SetMetaData, SetProgress } from '@/app/lib/storage';
import { useAudioGeneration } from '@/app/context/AudioGenerationContext';
import { useSetCache } from '@/app/context/SetCacheContext';

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
  refreshSets: () => Promise<void>;
  reloadActiveSet: () => Promise<void>;
  setAvailableSets: React.Dispatch<React.SetStateAction<SetMetaData[]>>;
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
  isFullyLearned: false,
  imageUrl: '/images/defaultnew.png', // Ensure default set uses correct image
  seriousnessLevel: null, // Add default null value
  toneLevel: null // Add default null value
};

// Helper to get initial active set ID from localStorage (client-side only)
// const getInitialActiveSetId = (): string => {
//   if (typeof window !== 'undefined') {
//     const saved = localStorage.getItem('activeSetId');
//     return saved || DEFAULT_SET_ID;
//   }
//   return DEFAULT_SET_ID;
// };

export const SetProvider = ({ children }: { children: ReactNode }) => {
  const { userId, isLoaded } = useAuth(); // <-- Use Clerk's useAuth hook
  const audioGeneration = useAudioGeneration();
  const { clearSetCache } = useSetCache(); // Get cache management functions
  const [availableSets, setAvailableSets] = useState<SetMetaData[]>([DEFAULT_SET_METADATA]);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const [activeSetContent, setActiveSetContent] = useState<Phrase[]>(INITIAL_PHRASES as unknown as Phrase[]);
  const [activeSetProgress, setActiveSetProgress] = useState<SetProgress>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [setsHaveLoaded, setSetsHaveLoaded] = useState(false);

  // ADD LOGGING HERE TO SEE STATE ON RENDER
  console.log('[SetProvider Render] availableSets:', availableSets);

  // Function to load content and progress for a specific set ID
  const loadSetData = useCallback(async (id: string | null) => {
    if (!isLoaded) {
      console.log("SetContext: loadSetData - Clerk not loaded yet.");
      setIsLoading(true);
      return;
    }
    if (!userId && id !== DEFAULT_SET_ID && !id?.startsWith('default-')) {
        console.warn(`SetContext: loadSetData called for non-default set ${id} but userId is not available.`);
        setActiveSetId(DEFAULT_SET_ID);
        setActiveSetContent(INITIAL_PHRASES as unknown as Phrase[]);
        setActiveSetProgress({});
        setIsLoading(false);
        return;
    }
    
    console.log(`SetContext: loadSetData called for id=${id}, userId=${userId}`);
    setIsLoading(true);
    setActiveSetContent([]); // Clear content while loading
    setActiveSetProgress({}); // Clear progress while loading

    let fetchedContent: Phrase[] = [];
    let fetchedProgress: SetProgress = {};

    try {
      // For default sets or when user is not logged in, load from localStorage
      if (!userId || id === DEFAULT_SET_ID || id?.startsWith('default-')) {
        const storedProgress = localStorage.getItem(`progress_${id}`);
        if (storedProgress) {
          try {
            fetchedProgress = JSON.parse(storedProgress);
            console.log(`SetContext: Progress loaded from localStorage for set ${id}:`, fetchedProgress);
          } catch (e) {
            console.error(`SetContext: Failed to parse localStorage progress for set ${id}:`, e);
            fetchedProgress = {};
          }
        } else {
          fetchedProgress = {};
          console.log(`SetContext: No localStorage progress found for set ${id}`);
        }
      } else {
        // For user sets, fetch progress via API
        console.log(`SetContext: Fetching progress via API for set ${id}`);
        const progressResponse = await fetch(`/api/user-progress?setId=${id}`, { credentials: 'include' });
        if (!progressResponse.ok) {
          console.error(`SetContext: Error fetching progress API for set ${id}: ${progressResponse.statusText}`);
          fetchedProgress = {};
        } else {
          // FIX: Extract the inner progress object
          const result = await progressResponse.json();
          fetchedProgress = result.progress || {}; // Assign the inner object or empty if missing
        }
        console.log(`SetContext: Progress fetched via API for set ${id}:`, fetchedProgress);
      }

      // Fetch content
      if (id === DEFAULT_SET_ID || id?.startsWith('default-')) {
        // For default sets, first try to load from database (in case user added custom cards)
        try {
          console.log(`SetContext: Trying to fetch default set ${id} from database first`);
          const contentResponse = await fetch(`/api/flashcard-sets/${id}/content`, { credentials: 'include' });
          if (contentResponse.ok) {
            const dbContent = await contentResponse.json();
            if (dbContent && dbContent.length > 0) {
              console.log(`SetContext: Loading default set ${id} from database (${dbContent.length} phrases)`);
              fetchedContent = dbContent;
            } else {
              throw new Error('Empty database content, fallback to default');
            }
          } else {
            throw new Error('Database fetch failed, fallback to default');
          }
        } catch (error) {
          console.log(`SetContext: Database fetch failed for default set ${id}, falling back to hardcoded content`);
          // Fall back to default content
          const defaultContent = getDefaultSetContent(id);
          if (defaultContent) {
            console.log(`SetContext: Loading default set content for ${id} (${defaultContent.length} phrases)`);
            fetchedContent = defaultContent;
          } else {
            console.error(`SetContext: No default content found for ${id}`);
            fetchedContent = [];
          }
        }
      } else {
        // Fetch user-specific set content via API
        console.log(`SetContext: Fetching content via API for set ${id}`);
        const contentResponse = await fetch(`/api/flashcard-sets/${id}/content`, { credentials: 'include' });
        if (!contentResponse.ok) {
           console.error(`SetContext: Error fetching content API for set ${id}: ${contentResponse.statusText}`);
           // Decide how to handle content fetch error - maybe load empty?
           fetchedContent = [];
        } else {
           fetchedContent = await contentResponse.json();
        }
        console.log(`SetContext: Content fetched via API for set ${id} (${fetchedContent.length} phrases)`);
      }

      // Update state after both fetches are complete (or failed)
      setActiveSetContent(fetchedContent);
      setActiveSetProgress(fetchedProgress);

    } catch (error) {
      console.error(`SetContext: Error in loadSetData for id=${id}:`, error);
      // Set empty state on error
      setActiveSetContent([]);
      setActiveSetProgress({});
    } finally {
      setIsLoading(false);
    }
  }, [userId, isLoaded]); // Add isLoaded dependency

  // Function to force refresh the list of available sets from the backend
  const refreshSets = useCallback(async () => {
    if (!userId || !isLoaded) {
      console.warn('[refreshSets] User not loaded yet, cannot refresh.');
      return;
    }
    setIsLoading(true);
    console.log(`[refreshSets] Fetching sets for userId: ${userId}`);
    try {
      const response = await fetch('/api/flashcard-sets', { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      let userSetsResponse = await response.json(); // Expect { sets: [...] }
      
      // FIX: Extract sets array from the response object
      if (!userSetsResponse || !Array.isArray(userSetsResponse.sets)) {
          console.warn('[refreshSets] API response was not the expected object { sets: [...] }:', userSetsResponse);
          userSetsResponse = { sets: [] }; // Treat as empty
      }

      const userSets: SetMetaData[] = userSetsResponse.sets; // Extract the array

      console.log(`[refreshSets] Sets returned from API: ${userSets?.length ?? 0}`);
      
      // Don't manually add DEFAULT_SET_METADATA - it should come from the database
      // The database now includes all default sets with proper folder assignments
      setAvailableSets(userSets);
      console.log(`[refreshSets] Updated available sets with ${userSets.length} sets from database`);

      setSetsHaveLoaded(true); // Mark as loaded after successful refresh

    } catch (error: unknown) {
      console.error('[refreshSets] Error fetching sets:', error);
      setSetsHaveLoaded(true); 
    } finally {
      setIsLoading(false);
    }
  }, [userId, isLoaded]);

  // Function to save progress for the active set
  const updateSetProgress = useCallback(async (newProgress: SetProgress) => {
    if (!isLoaded) return; // Don't run if Clerk isn't ready
    if (!activeSetId) {
      console.warn(`SetContext: updateSetProgress called without activeSetId`);
      return;
    }
    
    console.log(`SetContext: updateSetProgress called for activeSetId=${activeSetId}, userId=${userId}`);
    setActiveSetProgress(newProgress); // Update local state immediately

    // For default sets or when user is not logged in, save to localStorage
    if (!userId || activeSetId === DEFAULT_SET_ID || activeSetId.startsWith('default-')) {
      try {
        localStorage.setItem(`progress_${activeSetId}`, JSON.stringify(newProgress));
        console.log(`SetContext: Saved progress to localStorage for ${activeSetId}`);
      } catch (error) {
        console.error("SetContext: Error saving progress to localStorage:", error);
      }
      return;
    }

    // For user sets, save via API
    try {
      const response = await fetch(`/api/flashcard-sets/${activeSetId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress: newProgress }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `API request failed with status ${response.status}`);
      }
      
      console.log("SetContext: Successfully saved progress via API.");
    } catch (error) {
        console.error("SetContext: Error saving progress:", error);
    }

    // Clear cache when progress is updated
    if (activeSetId) {
      clearSetCache(activeSetId);
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
            // Update metadata via API
            const response = await fetch(`/api/flashcard-sets/${activeSetId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                name: updatedMeta.name,
                cleverTitle: updatedMeta.cleverTitle,
                level: updatedMeta.level,
                goals: updatedMeta.goals,
                specificTopics: updatedMeta.specificTopics
              }),
              credentials: 'include'
            });
            
            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || `API request failed with status ${response.status}`);
            }
            
            setAvailableSets(prevSets => 
              prevSets.map(set => set.id === activeSetId ? updatedMeta : set)
            );
          } catch (error) {
            console.error("SetContext: Failed to update isFullyLearned metadata:", error);
          }
      }
    }
  }, [activeSetId, userId, isLoaded, activeSetContent, availableSets, clearSetCache]);

  // --- Refactored Initial Data Loading --- (updated to use useAuth and fetch)
  useEffect(() => {
    const loadInitialData = async () => {
      if (!isLoaded) {
        console.log("SetContext: Initial load - Clerk not loaded yet.");
        setIsLoading(true);
        setSetsHaveLoaded(false);
        return; // Wait for Clerk to load
      }

      // Don't reload if we already have sets loaded
      if (setsHaveLoaded && availableSets.length > 0) {
        console.log("SetContext: Sets already loaded, skipping reload");
        return;
      }

      setSetsHaveLoaded(false);
      setIsLoading(true); // Set loading true while fetching

      if (userId) { // Check if userId is available (user is authenticated)
        try {
          // Initialize folders first
          console.log(`SetContext: Initializing folders for user...`);
          const folderInitResponse = await fetch('/api/init-folders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });
          
          if (!folderInitResponse.ok) {
            console.error('Failed to initialize folders:', folderInitResponse.status);
          }
          
          // Fix folder assignments for existing sets
          console.log(`SetContext: Fixing folder assignments...`);
          const fixResponse = await fetch('/api/fix-folder-assignments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });
          
          if (!fixResponse.ok) {
            console.error('Failed to fix folder assignments:', fixResponse.status);
          } else {
            const fixResult = await fixResponse.json();
            console.log('Folder assignments fixed:', fixResult);
          }
          
          console.log(`SetContext: Fetching initial sets via API for userId: ${userId}`);
          const response = await fetch('/api/flashcard-sets', { // <-- Fetch from API
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include' // <-- Include credentials
          });

          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }

          let userSetsResponse = await response.json(); // Expect { sets: [...] }
          
          // FIX: Extract sets array from the response object
          if (!userSetsResponse || !Array.isArray(userSetsResponse.sets)) { 
            console.warn('SetContext: Fetched initial sets API response was not the expected object { sets: [...] }:', userSetsResponse);
            userSetsResponse = { sets: [] }; // Treat as empty
          }

          const userSets: SetMetaData[] = userSetsResponse.sets; // Extract the array
          
          // Just use the sets from the database (they now include all default sets)
          setAvailableSets(userSets); 
          console.log(`SetContext: Loaded ${userSets.length} sets via API.`);

        } catch (error) {
          console.error("SetContext: Error loading initial user data via API:", error);
          setAvailableSets(getDefaultSetsForUnauthenticatedUsers()); // Fallback to all default sets
        } finally {
          setIsLoading(false);
          setSetsHaveLoaded(true);
          console.log("SetContext: Initial data load finished for authenticated user.");
        }
      } else { // User is unauthenticated (userId is null)
        console.log("SetContext: User unauthenticated (Clerk userId is null). Clearing user data and showing default set.");
        const defaultSets = getDefaultSetsForUnauthenticatedUsers();
        setAvailableSets(defaultSets);
        setActiveSetId(DEFAULT_SET_ID);
        setActiveSetContent(INITIAL_PHRASES as unknown as Phrase[]);
        setActiveSetProgress({});
        setIsLoading(false);
        setSetsHaveLoaded(true);
      }
    };

    loadInitialData();
  }, [isLoaded, userId, setsHaveLoaded, availableSets.length]); // Depend on Clerk's isLoaded and userId

  // --- Restoration Effect (depends on setsHaveLoaded) ---
  useEffect(() => {
    if (setsHaveLoaded && availableSets.length > 0 && !restored) {
      const savedId = typeof window !== 'undefined' ? localStorage.getItem('activeSetId') : null;
      const isValid = savedId && availableSets.some(set => set.id === savedId);
      const validId = isValid
        ? savedId!
        : availableSets.find(set => set.id === DEFAULT_SET_ID)?.id || availableSets[0].id;

      setActiveSetId(validId);
      setRestored(true);

      // Debug logs
      console.log("Restoration: setsHaveLoaded & availableSets ready");
      console.log("Restoration: savedId", savedId, "isValid", isValid, "using", validId);
    }
  }, [setsHaveLoaded, availableSets, restored]);

  // --- Persistence Effect (waits for setsHaveLoaded & restored) ---
  useEffect(() => {
    if (restored && setsHaveLoaded && activeSetId) {
      localStorage.setItem('activeSetId', activeSetId);
      console.log("Persisted activeSetId to localStorage:", activeSetId);
    }
  }, [activeSetId, restored, setsHaveLoaded]);

  // Reset flags on auth change (now based on Clerk's userId)
  const prevUserIdRef = useRef(userId);
  useEffect(() => {
    // Only reset if userId actually changed (not just re-validated)
    if (prevUserIdRef.current !== userId) {
      console.log(`SetContext: User changed from ${prevUserIdRef.current} to ${userId}`);
      prevUserIdRef.current = userId;
      
      setRestored(false);
      setSetsHaveLoaded(false);
      // Also reset activeSetId if user logs out
      if (isLoaded && !userId) {
        setActiveSetId(DEFAULT_SET_ID);
      }
    }
  }, [isLoaded, userId]);

  // Data loading effect (no change needed, but add debug log)
  useEffect(() => {
    if (restored && activeSetId && availableSets.some(set => set.id === activeSetId)) {
      console.log("Loading data for activeSetId:", activeSetId); // Debug log
      loadSetData(activeSetId);
    }
  }, [activeSetId, availableSets, restored, loadSetData]);

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
    console.log(`[addSet ENTRY] isLoaded: ${isLoaded}, current hook userId: ${userId}`);

    if (!isLoaded) {
      console.error("addSet: Cannot add set, Clerk not loaded yet.");
      alert("Authentication is still loading. Please try again in a moment.");
      return null;
    }

    const currentUserId = userId;
    console.log(`[addSet CHECK] Captured userId: ${currentUserId}`);

    if (!currentUserId) {
      console.error("addSet: Cannot add set, user not authenticated (Clerk userId is null AFTER isLoaded check).");
      alert("You must be logged in to create and save sets.");
      return null;
    }
    
    console.log(`SetContext: Initiating add set via API for userId: ${currentUserId}`);
    setIsLoading(true);
    
    try {
      // Log objects just before stringifying
      console.log("[addSet PRE-FETCH] setData:", JSON.stringify(setData, null, 2));
      console.log("[addSet PRE-FETCH] phrases (first 2):", JSON.stringify(phrases?.slice(0, 2), null, 2)); // Log first 2 phrases for brevity
      
      // Call the new backend API route
      const response = await fetch('/api/flashcard-sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ setData, phrases }), // Stringify here
        credentials: 'include' // Send Clerk session cookie
      });

      const result = await response.json();

      if (!response.ok) {
        // Use the error message from the API response if available
        throw new Error(result.error || `API request failed with status ${response.status}`);
      }

      // Get the complete metadata returned by the API
      const completeNewMetaData: SetMetaData = result.newSetMetaData;

      if (!completeNewMetaData || !completeNewMetaData.id) {
          throw new Error("API did not return valid set metadata.");
      }

      console.log(`[addSet] Received completeNewMetaData from API:`, completeNewMetaData);

      // Refresh the sets to get the updated phrase count
      await refreshSets();

      // Switch to the newly added set
      setActiveSetId(completeNewMetaData.id);
      console.log(`SetContext: Added new set ${completeNewMetaData.id} via API with ${phrases.length} phrases.`);
      return completeNewMetaData.id;

    } catch (error) {
      console.error("SetContext: Error calling add set API:", error);
      alert(`Failed to add set: ${error instanceof Error ? error.message : 'Unknown API error'}`);
      // No need for manual cleanup here, the API route handles it
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId, isLoaded, refreshSets]); // Add refreshSets to dependencies

  // --- Refactor deleteSet --- 
  const deleteSet = useCallback(async (id: string) => {
    if (!isLoaded) return;
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
      // Use the API endpoint instead of directly calling storage functions
      const response = await fetch(`/api/flashcard-sets/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `API request failed with status ${response.status}`);
      }

      // Clear cache for the deleted set
      clearSetCache(id);
      
      // Refresh the sets to get the updated phrase counts
      await refreshSets();

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
  // Add refreshSets and clearSetCache to dependencies
  }, [activeSetId, userId, isLoaded, refreshSets, clearSetCache]);

  // --- switchSet (No backend call needed, just state update) --- 
  const switchSet = useCallback(async (id: string) => {
    if (id === activeSetId) {
      console.log(`SetContext: Set ${id} is already active.`);
      return; // No need to switch if already active
    }
    
    // Check if audio generation is in progress
    if (audioGeneration.state.isGenerating) {
      const confirmed = window.confirm(
        'Audio generation is in progress. Switching sets will cancel it. Continue?'
      );
      if (!confirmed) {
        return;
      }
      audioGeneration.cancelGeneration();
    }
    
    console.log(`SetContext: Switching to set ${id}`);
    setActiveSetId(id); // Triggers useEffect to load new set data
  }, [activeSetId, audioGeneration]);

  // --- reloadActiveSet (Force reload current set content) --- 
  const reloadActiveSet = useCallback(async () => {
    if (!activeSetId) {
      console.warn('SetContext: Cannot reload active set - no active set ID');
      return;
    }
    console.log(`SetContext: Force reloading active set ${activeSetId}`);
    await loadSetData(activeSetId);
  }, [activeSetId, loadSetData]);

  // --- Refactor exportSet --- 
  const exportSet = useCallback(async (id: string) => {
    if (!isLoaded) return;
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
        if (!metaData) {
            throw new Error('Set metadata not found for export.');
        }
        
        // Fetch content via API
        const contentResponse = await fetch(`/api/flashcard-sets/${id}/content`, {
          credentials: 'include'
        });
        
        if (!contentResponse.ok) {
          const data = await contentResponse.json();
          throw new Error(data.error || `Failed to fetch content: ${contentResponse.status}`);
        }
        
        const content = await contentResponse.json();
        
        // Fetch progress via API
        const progressResponse = await fetch(`/api/flashcard-sets/${id}/progress`, {
          credentials: 'include'
        });
        
        if (!progressResponse.ok) {
          const data = await progressResponse.json();
          throw new Error(data.error || `Failed to fetch progress: ${progressResponse.status}`);
        }
        
        const progressData = await progressResponse.json();
        const progress = progressData.progress || {};

        const exportData = {
            version: "1.0",
            metaData: metaData,
            content: content,
            progress: progress
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
  }, [availableSets, userId, isLoaded]);

  // --- Refactor renameSet --- 
  const renameSet = useCallback(async (id: string, newName: string) => {
    if (!isLoaded) return;
    console.log(`SetContext: Renaming set ${id} to \"${newName}\"`);
    if (id === DEFAULT_SET_ID || !userId) {
        console.warn("Cannot rename default set or user not logged in.");
        return;
    }

    const setIndex = availableSets.findIndex(set => set.id === id);
    if (setIndex !== -1) {
      const _currentSet = availableSets[setIndex];
      
      setIsLoading(true);
      try {
          // Update via API endpoint
          const response = await fetch(`/api/flashcard-sets/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              name: newName,
              cleverTitle: newName
            }),
            credentials: 'include'
          });
          
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || `API request failed with status ${response.status}`);
          }
          
          // Refresh the sets to get the updated phrase counts
          await refreshSets();
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
  // Add refreshSets to dependencies
  }, [availableSets, userId, isLoaded, refreshSets]);

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
      renameSet,
      refreshSets,
      reloadActiveSet,
      setAvailableSets
  }), [
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
    renameSet,
    refreshSets,
    reloadActiveSet
  ]);

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
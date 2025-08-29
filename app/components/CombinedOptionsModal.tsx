'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Switch } from "@/app/components/ui/switch"; // Assuming path for Switch
import { useSet } from '@/app/context/SetContext';
import { useSetCache } from '@/app/context/SetCacheContext';
import Image from 'next/image';
import { Phrase } from '@/app/lib/set-generator';
import type { PhraseProgressData } from '@/app/lib/storage';
import type { SetMetaData } from '@/app/lib/storage';
import { useUser } from '@clerk/nextjs'; // Add Clerk hook
import PublishConfirmationModal from './PublishConfirmationModal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SetCompletionBadge from './SetCompletionBadge';

import { toast } from 'sonner';

interface CombinedOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // App Options State & Setters
  isDarkMode: boolean;
  toggleDarkMode: (checked: boolean) => void;
  isMale: boolean;
  setIsMale: (checked: boolean) => void;
  isPoliteMode: boolean;
  setIsPoliteMode: (checked: boolean) => void;
  autoplay: boolean;
  setAutoplay: (checked: boolean) => void;
  // Set Options State & Actions
  currentSetName: string;
  activeSetId: string | null;
  onOpenSetManager: () => void;
  onExportSet: () => void;
  onResetSetProgress: () => void; // Placeholder - needs implementation
  onDeleteSet: () => void;
  isLoading: boolean; // For disabling buttons during actions
}

export function CombinedOptionsModal({ 
    isOpen, 
    onClose, 
    isDarkMode,
    toggleDarkMode,
    isMale,
    setIsMale,
    isPoliteMode,
    setIsPoliteMode,
    autoplay,
    setAutoplay,
    currentSetName,
    activeSetId,
    onOpenSetManager,
    onExportSet,
    onResetSetProgress,
    onDeleteSet,
    isLoading,
}: CombinedOptionsModalProps) {
  const [showShare, setShowShare] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const isDefaultSet = activeSetId === 'default';

  const handleShare = async () => {
    setShareLoading(true);
    setShareError(null);
    setShareUrl(null);
    try {
      const res = await fetch(`/api/flashcard-sets/${activeSetId}/share`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to get share link');
      const data = await res.json();
      if (!data.shareId) throw new Error('No shareId returned');
      const url = `${window.location.origin}/share/${data.shareId}`;
      setShareUrl(url);
      setShowShare(true);
    } catch (err: unknown) {
      let message = 'Unknown error';
      if (typeof err === 'object' && err && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
        message = (err as { message: string }).message;
      } else {
        message = String(err);
      }
      setShareError(message);
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" 
      onClick={onClose}
    >
      <div 
        className="neumorphic max-w-lg w-full p-6 bg-[#1f1f1f] max-h-[85vh] overflow-y-auto flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-xl font-bold text-[#E0E0E0]">Options</h2>
          <button onClick={onClose} className="text-[#BDBDBD] hover:text-[#E0E0E0] text-2xl">&times;</button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto pr-2 flex-grow space-y-6">
        
          {/* App Options Section */}
          <section>
            <h3 className="text-lg font-semibold text-[#A9C4FC] mb-3 border-b border-[#404040] pb-1">App Options</h3>
            <div className="space-y-4">
              {/* Dark Mode */}
              <div className="flex items-center justify-between">
                <label htmlFor="darkModeToggleApp" className="text-[#E0E0E0]">Dark Mode</label>
                <Switch
                  id="darkModeToggleApp"
                  checked={isDarkMode}
                  onCheckedChange={toggleDarkMode}
                  className="neumorphic-switch"
                />
              </div>
              {/* Voice Gender */}
              <div className="flex items-center justify-between">
                 <label htmlFor="genderToggleApp" className="text-[#E0E0E0]">Voice Gender (Krap/Ka)</label>
                 <div className="flex items-center">
                   <span className="mr-2 text-sm font-medium text-[#BDBDBD]">Female</span>
                    <Switch
                      id="genderToggleApp"
                      checked={isMale}
                      onCheckedChange={setIsMale}
                      className="neumorphic-switch"
                    />
                   <span className="ml-2 text-sm font-medium text-[#BDBDBD]">Male</span>
                 </div>
              </div>
              {/* Polite Mode */}
              <div className="flex items-center justify-between">
                 <label htmlFor="politeToggleApp" className="text-[#E0E0E0]">Polite Mode (Add ครับ/ค่ะ)</label>
                 <div className="flex items-center">
                    <span className="mr-2 text-sm font-medium text-[#BDBDBD]">Casual</span>
                     <Switch
                       id="politeToggleApp"
                       checked={isPoliteMode}
                       onCheckedChange={setIsPoliteMode}
                       className="neumorphic-switch"
                     />
                    <span className="ml-2 text-sm font-medium text-[#BDBDBD]">Polite</span>
                 </div>
              </div>
              {/* Autoplay Audio */}
              <div className="flex items-center justify-between">
                <label htmlFor="autoplayToggleApp" className="text-[#E0E0E0]">Autoplay Audio on Reveal</label>
                <Switch
                  id="autoplayToggleApp"
                  checked={autoplay}
                  onCheckedChange={setAutoplay}
                  className="neumorphic-switch"
                />
              </div>
            </div>
          </section>

          {/* Set Options Section */}
          <section>
            <h3 className="text-lg font-semibold text-[#A9C4FC] mb-3 border-b border-[#404040] pb-1">Current Set Options</h3>
            <div className="bg-[#2C2C2C] p-4 rounded-lg text-center mb-4">
              <p className="text-sm text-[#BDBDBD] mb-1">Current Set:</p>
              <p className="text-lg text-[#E0E0E0] font-semibold">
                {currentSetName}
              </p>
            </div>
            <div className="space-y-3">
                <button
                  onClick={() => { onClose(); onOpenSetManager(); }}
                  className="neumorphic-button w-full text-[#A9C4FC]"
                >
                  Open My Sets...
                </button>
                <button
                  onClick={onExportSet}
                  className="neumorphic-button w-full text-[#A9C4FC]"
                  disabled={isLoading || isDefaultSet} 
                >
                  Export This Set
                </button>
                <button
                  onClick={onResetSetProgress}
                  className="neumorphic-button w-full text-[#A9C4FC]"
                  disabled={isLoading || isDefaultSet}
                >
                  Reset Progress for This Set
                </button>
                <button
                  onClick={onDeleteSet}
                  className="neumorphic-button w-full text-red-400"
                  disabled={isLoading || isDefaultSet}
                >
                  Delete This Set
                </button>
                <button
                  onClick={handleShare}
                  className="neumorphic-button w-full text-[#A9C4FC]"
                  disabled={isLoading || isDefaultSet || shareLoading}
                >
                  {shareLoading ? 'Generating Link...' : 'Share This Set'}
                </button>
                {shareError && <div className="text-red-400 text-xs mt-2">{shareError}</div>}
            </div>
          </section>

        </div> {/* End Scrollable Content */}

        {/* Share Dialog */}
        {showShare && shareUrl && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-60" onClick={() => setShowShare(false)}>
            <div className="bg-[#1F1F1F] p-6 rounded-lg shadow-lg max-w-md w-full border border-[#404040]" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-2 text-[#A9C4FC]">Share This Set</h3>
              <p className="text-[#E0E0E0] mb-2">Anyone with this link can view and import your set:</p>
              <div className="flex items-center bg-[#2C2C2C] rounded px-2 py-1 mb-3 border border-[#404040]">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-transparent text-[#E0E0E0] outline-none text-sm"
                  onFocus={e => e.target.select()}
                />
                <button onClick={handleCopy} className="ml-2 px-2 py-1 text-xs bg-[#A9C4FC] text-[#121212] rounded hover:bg-[#A9C4FC]/80">Copy</button>
              </div>
              <button onClick={() => setShowShare(false)} className="mt-2 neumorphic-button text-sm text-[#BDBDBD]">Close</button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#404040] flex justify-end flex-shrink-0">
           <button onClick={onClose} className="neumorphic-button text-sm text-[#BDBDBD]">Close</button>
        </div>

      </div>
    </div>
  );
}

// --- SettingsModal: Only App Settings ---
export function SettingsModal({ isOpen, onClose, isDarkMode, toggleDarkMode, isMale, setIsMale, isPoliteMode, setIsPoliteMode, autoplay, setAutoplay }: {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  toggleDarkMode: (checked: boolean) => void;
  isMale: boolean;
  setIsMale: (checked: boolean) => void;
  isPoliteMode: boolean;
  setIsPoliteMode: (checked: boolean) => void;
  autoplay: boolean;
  setAutoplay: (checked: boolean) => void;
}) {
  const [useTurboRendering, setUseTurboRendering] = useState(true); // Default to TURBO
  const { refreshSets } = useSet();

  useEffect(() => {
    // Load the rendering speed preference from localStorage
    const savedSpeed = localStorage.getItem('renderingSpeed');
    setUseTurboRendering(savedSpeed !== 'NORMAL');
  }, []);

  const handleRenderingSpeedChange = (checked: boolean) => {
    setUseTurboRendering(checked);
    localStorage.setItem('renderingSpeed', checked ? 'TURBO' : 'NORMAL');
  };

  const handleResetDefaultSets = async () => {
    if (!window.confirm('Are you sure you want to reset all default sets to their original state? This will overwrite any customizations you made to default sets.')) {
      return;
    }

    try {
      const response = await fetch('/api/reset-default-sets', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to reset default sets');
      }

      const result = await response.json();
      await refreshSets();
      toast.success(result.message || 'Default sets have been reset to original state');
    } catch (error) {
      console.error('Error resetting default sets:', error);
      toast.error('Failed to reset default sets');
    }
  };

  const handleFactoryResetPreferences = () => {
    if (window.confirm('Are you sure you want to reset all preferences? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };
  const handleFactoryResetFull = async () => {
    if (window.confirm('Are you sure you want to reset the entire app, including all sets and progress? This cannot be undone.')) {
      try {
        const res = await fetch('/api/factory-reset', { method: 'POST', credentials: 'include' });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to reset app data.');
        }
        // Optionally show a success message
        // alert('All sets and progress deleted. The app will now reload.');
      } catch (err) {
        alert('Factory reset failed: ' + (err instanceof Error ? err.message : String(err)));
        return;
      }
      indexedDB.deleteDatabase('localforage'); // If using localforage or similar
      localStorage.clear();
      window.location.reload();
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="neumorphic max-w-lg w-full p-6 bg-[#1f1f1f] max-h-[85vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-xl font-bold text-[#E0E0E0]">Settings</h2>
          <button onClick={onClose} className="text-[#BDBDBD] hover:text-[#E0E0E0] text-2xl">&times;</button>
        </div>
        <div className="overflow-y-auto pr-2 flex-grow space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-[#A9C4FC] mb-4">App Settings</h3>
            <div className="grid grid-cols-[1fr_auto] gap-y-4 gap-x-6 items-center">
              <label htmlFor="genderToggleApp" className="text-[#E0E0E0]">Voice/Particle Gender</label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#BDBDBD]">Female (Ka)</span>
                <Switch id="genderToggleApp" checked={isMale} onCheckedChange={setIsMale} />
                <span className="text-sm font-medium text-[#BDBDBD]">Male (Krap)</span>
              </div>
              <label htmlFor="politeToggleApp" className="text-[#E0E0E0]">Politeness Particles</label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#BDBDBD]">Casual</span>
                <Switch id="politeToggleApp" checked={isPoliteMode} onCheckedChange={setIsPoliteMode} />
                <span className="text-sm font-medium text-[#BDBDBD]">Polite</span>
              </div>
              <label htmlFor="autoplayToggleApp" className="text-[#E0E0E0]">Autoplay Voice</label>
              <Switch id="autoplayToggleApp" checked={autoplay} onCheckedChange={setAutoplay} />
              <label htmlFor="darkModeToggleApp" className="text-[#E0E0E0]">Dark Mode</label>
              <Switch id="darkModeToggleApp" checked={isDarkMode} onCheckedChange={toggleDarkMode} />
              <label htmlFor="renderingSpeedToggle" className="text-[#E0E0E0] flex items-center gap-2">
                Image Generation Speed
                <span className="text-xs text-[#BDBDBD] italic">(TURBO = faster but may be less accurate)</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#BDBDBD]">Normal</span>
                <Switch id="renderingSpeedToggle" checked={useTurboRendering} onCheckedChange={handleRenderingSpeedChange} />
                <span className="text-sm font-medium text-[#BDBDBD]">Turbo</span>
              </div>
            </div>
          </section>
          <div className="mt-10 flex flex-col gap-2">
            <button onClick={handleFactoryResetPreferences} className="w-full border border-[#A9C4FC] text-[#A9C4FC] rounded py-2 text-sm font-semibold hover:bg-[#A9C4FC] hover:text-[#121212] transition flex items-center justify-center gap-2 bg-transparent">
              Factory Reset (Preferences)
            </button>
            <button onClick={handleResetDefaultSets} className="w-full border border-yellow-400 text-yellow-400 rounded py-2 text-sm font-semibold hover:bg-yellow-400 hover:text-[#121212] transition flex items-center justify-center gap-2 bg-transparent">
              Reset Default Sets to Original
            </button>
            <button onClick={handleFactoryResetFull} className="w-full border border-red-400 text-red-400 rounded py-2 text-sm font-semibold hover:bg-red-400 hover:text-[#121212] transition flex items-center justify-center gap-2 bg-transparent">
              Factory Reset (Full App + Sets)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add this helper function at the top level
function scrollToBottom(containerRef: React.RefObject<HTMLDivElement>) {
  if (containerRef.current) {
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }
}

// --- SetManagerModal: Only Set Management ---
export function SetManagerModal({ isOpen, onClose, highlightSetId }: {
  isOpen: boolean;
  onClose: () => void;
  highlightSetId: string | null;
}) {
  const { availableSets, switchSet, activeSetId, deleteSet } = useSet();
  const { user } = useUser(); // Get user data
  const { preloadAllSets, getCachedContent, preloadSetContent, preloadImages } = useSetCache();
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [cardsModalSetId, setCardsModalSetId] = useState<string | null>(null);
  const [cardsModalPhrases, setCardsModalPhrases] = useState<Phrase[]>([]);
  const [cardsModalProgress, setCardsModalProgress] = useState<Record<number, PhraseProgressData>>({});
  const [cardsModalLoading, setCardsModalLoading] = useState(false);
  const [publishingSetId, setPublishingSetId] = useState<string | null>(null);
  const setListRef = useRef<HTMLDivElement>(null);
  const highlightedSetRef = useRef<HTMLDivElement>(null);
  
  // --- State for Publish Confirmation Modal ---
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [setBeingPublished, setSetBeingPublished] = useState<SetMetaData | null>(null);

  // Auto-scroll when a new set is being generated
  useEffect(() => {
    const hasGeneratingSet = availableSets.some(set => set.id === 'generating');
    if (hasGeneratingSet) {
      scrollToBottom(setListRef);
    }
  }, [availableSets]);

  useEffect(() => {
    if (highlightSetId && isOpen) {
      const timer = setTimeout(() => {
        if (highlightedSetRef.current) {
          highlightedSetRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          });
        }
      }, 100); // Small delay for rendering
      return () => clearTimeout(timer);
    }
  }, [highlightSetId, isOpen, availableSets]);

  // Pre-load all sets and images when modal opens
  useEffect(() => {
    if (isOpen && availableSets.length > 0) {
      console.log('[SetManagerModal] Preloading all sets and images...');
      
      // Preload set content
      const setIds = availableSets.map(set => set.id);
      preloadAllSets(setIds).catch(error => {
        console.error('[SetManagerModal] Error preloading sets:', error);
      });
      
      // Preload images
      const imageUrls = availableSets.map(set => {
        if (set.imageUrl) return set.imageUrl;
        if (set.id === 'default') return '/images/defaultnew.png';
        return '/images/default-set-logo.png';
      });
      preloadImages(imageUrls).catch(error => {
        console.error('[SetManagerModal] Error preloading images:', error);
      });
    }
  }, [isOpen, availableSets, preloadAllSets, preloadImages]);

  if (!isOpen) return null;

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    const setsToDelete = availableSets.filter(set => selected.includes(set.id) && set.id !== 'default');
    if (setsToDelete.length === 0) return;
    const names = setsToDelete.map(set => set.cleverTitle || set.name).join('\n');
    if (!confirm(`Delete the following sets? This cannot be undone.\n\n${names}`)) return;
    setBulkLoading(true);
    try {
      for (const set of setsToDelete) {
        await deleteSet(set.id);
      }
      setSelected([]);
      alert('Selected sets deleted successfully.');
    } catch (err) {
      alert('Error deleting sets. Please try again.');
    } finally {
      setBulkLoading(false);
    }
  };

  // Helper to open the cards modal for a set
  const handleOpenCardsModal = async (set: SetMetaData) => {
    setCardsModalSetId(set.id);
    setCardsModalLoading(true);
    try {
      // First try to get from cache
      const cached = getCachedContent(set.id);
      
      if (cached) {
        console.log(`[SetManagerModal] Using cached data for set ${set.id}`);
        setCardsModalPhrases(cached.phrases);
        setCardsModalProgress(cached.progress);
      } else {
        console.log(`[SetManagerModal] No cache found, loading set ${set.id}`);
        // Load the set content and it will be cached automatically
        const content = await preloadSetContent(set.id);
        setCardsModalPhrases(content.phrases);
        setCardsModalProgress(content.progress);
      }
    } catch (error: unknown) {
      console.error('Error loading cards:', error instanceof Error ? error.message : String(error));
      setCardsModalPhrases([]);
      setCardsModalProgress({});
    } finally {
      setCardsModalLoading(false);
    }
  };

  // Helper to get status for a card
  const getCardStatus = (progress: Record<number, PhraseProgressData>, idx: number) => {
    const p = progress[idx];
    if (!p || !p.difficulty) return 'Unseen';
    if (p.difficulty === 'hard') return 'Wrong';
    if (p.difficulty === 'good') return 'Correct';
    if (p.difficulty === 'easy') return 'Easy';
    return 'Unseen';
  };

  // Helper to handle clicking a phrase in the modal
  const handlePhraseClick = async (setId: string, idx: number) => {
    if (setId !== activeSetId) {
      await switchSet(setId);
    }
    // Set the active card index in localStorage so main UI can pick it up
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeCardIndex', String(idx));
    }
    onClose();
  };

  // Summary
  const totalSets = availableSets.length;
  const totalCards = availableSets.reduce((sum, set) => sum + (set.phraseCount || 0), 0);
  const totalLearned = 0; // Placeholder, not available
  const dueToday = 0; // Placeholder, not available

  // --- Function to OPEN the confirmation modal ---
  const handleOpenPublishModal = (set: SetMetaData) => {
    setSetBeingPublished(set);
    setIsPublishModalOpen(true);
  };

  // --- Function to CLOSE the confirmation modal ---
  const handleClosePublishModal = () => {
    setIsPublishModalOpen(false);
    setSetBeingPublished(null); 
    setPublishingSetId(null); // Also reset loading state if modal is cancelled
  };

  // --- Function to handle the ACTUAL publication (will be called by the modal) ---
  const handleConfirmPublish = async (authorName: string | null) => {
    if (!setBeingPublished) return;
    
    const set = setBeingPublished;
    setPublishingSetId(set.id); // Indicate loading on the card
    setIsPublishModalOpen(false); // Close the modal immediately

    try {
      // Use cached content if available, otherwise load it
      let phrases = [];
      const cached = getCachedContent(set.id);
      
      if (cached) {
        phrases = cached.phrases;
      } else {
        const content = await preloadSetContent(set.id);
        phrases = content.phrases;
      }
      
      // Determine author based on input
      const author = authorName === null ? '' : authorName; // Use empty string for Anonymous

      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: set.cleverTitle || set.name,
          description: set.specificTopics || '', 
          phrases: phrases || [],
          author: author,
          imageUrl: set.imageUrl || '', 
          cardCount: phrases.length,
          llmBrand: set.llmBrand || '', 
          llmModel: set.llmModel || '', 
          seriousnessLevel: set.seriousnessLevel, 
          specificTopics: set.specificTopics, 
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Publish API Error');
      }
      alert('Set published to gallery!');
    } catch (err: unknown) {
      alert('Failed to publish: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setPublishingSetId(null);
      setSetBeingPublished(null); // Clear the set being published state
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl bg-[#1f1f1f] border-[#333] text-white">
        <DialogHeader>
          <DialogTitle>My Sets</DialogTitle>
          <DialogDescription>
            Manage your flashcard sets
          </DialogDescription>
        </DialogHeader>

        {/* Set list container - add ref here */}
        <div ref={setListRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto py-4 px-1 max-h-[calc(85vh-150px)]">
          {availableSets.map(set => {
            const isHighlighted = set.id === highlightSetId || (highlightSetId === 'generating' && set.id === 'generating');
            const isSelected = activeSetId === set.id || isHighlighted;
            const isDefault = set.id === 'default';
            const checked = selected.includes(set.id);
            // Set image logic
            console.log(`SetManagerModal: Raw set.imageUrl for "${set.name}":`, set.imageUrl);
            let imgUrl: string | undefined | null = set.imageUrl;
            if (!imgUrl) {
              imgUrl = set.id === 'default'
                ? '/images/defaultnew.png'
                : '/images/default-set-logo.png';
            }
            console.log(`SetManagerModal: Rendering set "${set.name}" (ID: ${set.id}) with imageUrl:`, imgUrl);
            return (
              <div
                key={set.id}
                ref={isHighlighted ? highlightedSetRef : null}
                className={`relative bg-gray-900 rounded-xl p-3 flex flex-col shadow-lg border border-gray-800 cursor-pointer hover:ring-2 hover:ring-[#A9C4FC] transition neumorphic-card-static
                ${isSelected ? 'neumorphic-card-active' : ''}
                ${selected.includes(set.id) ? 'ring-2 ring-blue-500' : ''}`}
                onClick={async () => {
                  if (set.id !== activeSetId) {
                    await switchSet(set.id);
                  }
                  onClose();
                }}
              >
                {/* Checkbox for bulk actions */}
                <input
                  type="checkbox"
                  className="absolute top-3 right-3 w-5 h-5 accent-[#A9C4FC] z-10"
                  disabled={isDefault || bulkLoading}
                  checked={checked}
                  onClick={e => e.stopPropagation()}
                  onChange={e => {
                    if (e.target.checked) setSelected(sel => [...sel, set.id]);
                    else setSelected(sel => sel.filter(x => x !== set.id));
                  }}
                />
                {/* Completion Badge */}
                <SetCompletionBadge setId={set.id} />
                {/* Set Image */}
                <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden mb-2 bg-[#2C2C2C]">
                  <Image
                    src={imgUrl}
                    alt={set.cleverTitle || set.name}
                    className="object-contain"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized={true}
                    onError={ev => {
                      const target = ev.currentTarget as HTMLImageElement;
                      if (target.src !== '/images/default-set-logo.png') {
                        target.src = '/images/default-set-logo.png';
                      }
                    }}
                  />
                  {/* Text overlay for generating sets */}
                  {set.id === 'generating' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-500 mb-2">Generating...</div>
                        <div className="text-lg text-white">About 2 mins</div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Set Name */}
                <h3 className="text-base font-medium text-gray-200 group-hover:text-white transition-colors line-clamp-3" title={set.name}>{
                  (set.cleverTitle || set.name).charAt(0).toUpperCase() + (set.cleverTitle || set.name).slice(1)
                }</h3>
                {set.createdAt && (
                  <div className="text-xs text-gray-500 mb-1">
                    {(() => {
                      const date = typeof set.createdAt === 'string' ? new Date(set.createdAt) : set.createdAt;
                      return date ? date.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
                    })()}
                  </div>
                )}
                
                {/* ADDED: Proficiency and Tone Level - Hide for manual sets */}
                {set.source !== 'manual' && (
                  <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap gap-x-2">
                    {set.level && <span>Level: <span className="font-medium text-[#A9C4FC]">{set.level}</span></span>}
                    {set.toneLevel !== undefined && set.toneLevel !== null && <span>Tone Level: <span className="font-medium text-[#A9C4FC]">{set.toneLevel}</span></span>}
                  </div>
                )}
                
                {/* Phrase Count - moved lower */}
                <p className="text-xs text-gray-400 mt-0.5">{set.phraseCount} cards</p>
                
                {/* Card Actions: Publish and Cards icon buttons side by side */}
                <div className="flex gap-1.5 justify-end mt-auto pt-2">
                  {/* Cards icon button */}
                  <div className="flex flex-col items-center">
                    <button
                      className="p-2.5 rounded-full bg-gray-700 hover:bg-gray-800 text-white text-xs font-semibold transition flex items-center justify-center"
                      title="View Cards"
                      onClick={e => { e.stopPropagation(); handleOpenCardsModal(set); }}
                    >
                      {/* Layers/stack SVG icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <path d="M3 7l9 5 9-5-9-5-9 5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                        <path d="M3 12l9 5 9-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                        <path d="M3 17l9 5 9-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <span className="text-xs text-gray-400 mt-1">View Cards</span>
                  </div>
                  {/* Publish icon button - MODIFIED onClick */}
                  {!isDefault && (
                    <div className="flex flex-col items-center">
                      <button
                        className={`p-2.5 rounded-full bg-[#A9C4FC] hover:bg-[#A9C4FC]/80 text-[#121212] text-xs font-semibold transition flex items-center justify-center${publishingSetId === set.id ? ' opacity-50 cursor-not-allowed' : ''}`}
                        title="Publish to Gallery"
                        disabled={publishingSetId === set.id}
                        onClick={async e => {
                          e.stopPropagation();
                          handleOpenPublishModal(set);
                        }}
                      >
                        {/* Paper plane SVG icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21l16.5-9-16.5-9v7.5l13.5 1.5-13.5 1.5V21z" />
                        </svg>
                      </button>
                      <span className="text-xs text-gray-400 mt-1">Publish</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {/* Bulk Actions */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#333]">
          <div className="flex gap-2">
            <button
              onClick={() => setSelected(availableSets.filter(s => s.id !== 'default').map(s => s.id))}
              className="neumorphic-button px-3 py-1.5 text-xs text-[#A9C4FC] disabled:opacity-50"
              disabled={bulkLoading}
            >
              Select All
            </button>
            <button
              onClick={() => setSelected([])}
              className="neumorphic-button px-3 py-1.5 text-xs text-[#A9C4FC] disabled:opacity-50"
              disabled={bulkLoading || selected.length === 0}
            >
              Clear Selection
            </button>
            <button
              onClick={handleBulkDelete}
              className="neumorphic-button px-3 py-1.5 text-xs text-red-400 disabled:opacity-50"
              disabled={bulkLoading || selected.length === 0}
            >
              Delete Selected ({selected.length})
            </button>
          </div>
          <div className="flex gap-4 text-xs text-gray-400">
            <span>Total Sets: {totalSets}</span>
            <span>Total Cards: {totalCards}</span>
            <span>Learned: {totalLearned}</span>
            <span>Due Today: {dueToday}</span>
          </div>
        </div>
        {/* Cards Modal */}
        {cardsModalSetId && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={() => setCardsModalSetId(null)}>
            <div className="bg-gray-900 rounded-xl p-4 max-w-md w-full max-h-[80vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
              <button className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl" onClick={() => setCardsModalSetId(null)}>&times;</button>
              <h3 className="text-lg font-bold text-[#A9C4FC] mb-3">Cards in Set</h3>
              {cardsModalLoading ? (
                <div className="text-center text-gray-400">Loading...</div>
              ) : (
                <>
                  {/* Progress Section */}
                  <div className="mb-6 bg-gray-800 rounded-lg p-4">
                    <div className="flex flex-col gap-2">
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${cardsModalPhrases.length > 0 ? (Object.keys(cardsModalProgress).length / cardsModalPhrases.length * 100) : 0}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-300 mt-1">
                        <span>{Object.keys(cardsModalProgress).length} learned</span>
                        <span>{cardsModalPhrases.length} total</span>
                        <span>{cardsModalPhrases.length > 0 ? Math.round(Object.keys(cardsModalProgress).length / cardsModalPhrases.length * 100) : 0}%</span>
                      </div>
                    </div>
                  </div>
                  {/* Cards List */}
                  <div className="bg-[#1a1b26] rounded-lg overflow-hidden">
                    {cardsModalPhrases.map((phrase, idx) => (
                      <div
                        key={idx}
                        onClick={() => handlePhraseClick(cardsModalSetId, idx)}
                        className="cursor-pointer border-b border-gray-700/50 last:border-b-0 hover:bg-[#1f2937]"
                      >
                        <div className="flex p-4 items-center gap-3">
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <p className="text-[15px] text-white break-words" style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              wordBreak: 'break-word',
                              lineHeight: '1.4'
                            }}>
                              {phrase.english}
                            </p>
                            <p className="text-[13px] text-gray-400 mt-1 truncate">
                              {phrase.thai}
                            </p>
                          </div>
                          <div className="flex-shrink-0 ml-2">
                            <div
                              className="px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap text-center"
                              style={{
                                backgroundColor: getCardStatus(cardsModalProgress, idx) === 'Easy' ? '#22c55e' :
                                  getCardStatus(cardsModalProgress, idx) === 'Correct' ? '#3b82f6' :
                                    getCardStatus(cardsModalProgress, idx) === 'Wrong' ? '#ef4444' :
                                      '#6b7280',
                                minWidth: '80px'
                              }}
                            >
                              {getCardStatus(cardsModalProgress, idx)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* --- Render Publish Confirmation Modal --- */}
        {isPublishModalOpen && setBeingPublished && (
          <PublishConfirmationModal
            isOpen={isPublishModalOpen}
            onClose={handleClosePublishModal}
            onConfirm={handleConfirmPublish}
            set={setBeingPublished}
            defaultUsername={user?.username || user?.firstName || ''} // Pass default username
            isPublishing={publishingSetId === setBeingPublished.id} // Pass loading state
          />
        )}
      </DialogContent>
    </Dialog>
  );
} 
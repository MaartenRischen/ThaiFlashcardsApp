'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/app/components/ui/switch";
import { useSet } from '@/app/context/SetContext';
import { Upload } from 'lucide-react';
import { getToneLabel } from '@/app/lib/utils';
import type { Phrase } from '@/app/lib/set-generator';
import type { PhraseProgressData, SetMetaData } from '@/app/lib/storage';

interface CombinedOptionsModalProps {
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
  currentSetName: string;
  activeSetId: string | null;
  onOpenSetManager: () => void;
  onExportSet: () => void;
  onResetSetProgress: () => void;
  onDeleteSet: () => void;
  isLoading: boolean;
}

export function SettingsModal({ 
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
}: Omit<CombinedOptionsModalProps, 'currentSetName' | 'activeSetId' | 'onOpenSetManager' | 'onExportSet' | 'onResetSetProgress' | 'onDeleteSet' | 'isLoading'>) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-[#1F1F1F] border-[#404040] text-[#E0E0E0]">
        <DialogHeader>
          <DialogTitle className="text-white">App Settings</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="darkModeToggleApp" className="text-[#E0E0E0]">Dark Mode (Experimental)</label>
              <Switch
                id="darkModeToggleApp"
                checked={isDarkMode}
                onCheckedChange={toggleDarkMode}
                className="neumorphic-switch"
              />
            </div>
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
        <DialogFooter>
           <Button variant="ghost" onClick={onClose}>Close</Button>
         </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SetManagerModal({ isOpen, onClose }: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { availableSets, switchSet, activeSetId, deleteSet } = useSet();
  const [publishingSetId, setPublishingSetId] = useState<string | null>(null);
  const [cardsModalSetId, setCardsModalSetId] = useState<string | null>(null);
  const [cardsModalPhrases, setCardsModalPhrases] = useState<Phrase[]>([]);
  const [cardsModalProgress, setCardsModalProgress] = useState<Record<number, PhraseProgressData>>({});
  const [cardsModalLoading, setCardsModalLoading] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [setBeingPublished, setSetBeingPublished] = useState<SetMetaData | null>(null);

  const handleImportClick = () => {
    // ... implementation ...
  };

  const handleSelectSet = async (setId: string) => {
    if (setId !== activeSetId) {
      await switchSet(setId);
    }
    onClose();
  };

  // Helper to open the cards modal for a set
  const handleOpenCardsModal = async (set: SetMetaData) => {
    setCardsModalSetId(set.id);
    setCardsModalLoading(true);
    try {
      // Fetch content via API
      const contentResponse = await fetch(`/api/flashcard-sets/${set.id}/content`, {
        credentials: 'include'
      });
      
      if (!contentResponse.ok) {
        throw new Error(`Failed to fetch content: ${contentResponse.status}`);
      }
      
      const phrases = await contentResponse.json();
      setCardsModalPhrases(phrases);
      
      // Fetch progress via API if user is logged in
      const userId = localStorage.getItem('userId');
      if (userId) {
        const progressResponse = await fetch(`/api/flashcard-sets/${set.id}/progress`, {
          credentials: 'include'
        });
        
        if (!progressResponse.ok) {
          throw new Error(`Failed to fetch progress: ${progressResponse.status}`);
        }
        
        const progressData = await progressResponse.json();
        setCardsModalProgress(progressData.progress || {});
      } else {
        setCardsModalProgress({});
      }
    } catch (error: unknown) {
      console.error('Error loading cards:', error instanceof Error ? error.message : String(error));
    } finally {
      setCardsModalLoading(false);
    }
  };

  // Helper to handle opening the publish modal
  const handleOpenPublishModal = (set: SetMetaData) => {
    setSetBeingPublished(set);
    setIsPublishModalOpen(true);
  };

  // Helper to determine if a set is the default set
  const isDefault = (set: SetMetaData) => set.id === 'default';

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] bg-[#1F1F1F] border-[#404040] text-[#E0E0E0]">
        <DialogHeader>
          <DialogTitle className="text-white">My Sets</DialogTitle>
          <DialogDescription>Select a set to study, or manage your sets.</DialogDescription>
        </DialogHeader>
        
        <div className="absolute top-4 right-16">
          <Button variant="ghost" size="icon" onClick={handleImportClick} title="Import Set (.json)">
            <Upload className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto py-4 px-1 max-h-[calc(85vh-150px)]">
          {availableSets.map(set => {
            const isActive = set.id === activeSetId;
            
            return (
              <div 
                key={set.id}
                className={`relative group bg-[#2C2C2C] rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 ${isActive ? 'border-blue-500 shadow-lg shadow-blue-500/30' : 'border-transparent hover:border-blue-600/50'}`}
                onClick={() => handleSelectSet(set.id)}
              >
                <div className="px-3 pb-3">
                  <h3 className="text-base font-medium text-gray-200 group-hover:text-white transition-colors line-clamp-3 mb-1" title={set.name}>{set.name}</h3>
                  
                  <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap gap-x-2">
                    {set.level && <span>Level: <span className="font-medium text-[#A9C4FC]">{set.level}</span></span>}
                    {set.seriousnessLevel !== null && 
                      <span>Tone: <span className="font-medium text-[#A9C4FC]">{getToneLabel(set.seriousnessLevel)}</span></span>
                    }
                  </div>
                  
                  <p className="text-xs text-gray-400 mt-0.5">{set.phraseCount} cards</p>
                </div>
                {/* Card Actions: Publish and Cards icon buttons side by side */}
                <div className="flex gap-1.5 justify-end mt-auto pt-2">
                  {/* Publish icon button - MODIFIED onClick */}
                  {!isDefault(set) && (
                    <button
                      className={`px-3 py-1.5 rounded-full bg-[#A9C4FC] hover:bg-[#A9C4FC]/80 text-[#121212] text-xs font-semibold transition flex items-center justify-center gap-1.5${publishingSetId === set.id ? ' opacity-50 cursor-not-allowed' : ''}`}
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
                      <span>Publish</span>
                    </button>
                  )}
                  {/* Cards icon button */}
                  <button
                    className="px-3 py-1.5 rounded-full bg-gray-700 hover:bg-gray-800 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5"
                    title="View Cards"
                    onClick={e => { e.stopPropagation(); handleOpenCardsModal(set); }}
                  >
                    {/* Layers/stack SVG icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path d="M3 7l9 5 9-5-9-5-9 5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                      <path d="M3 12l9 5 9-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                      <path d="M3 17l9 5 9-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    </svg>
                    <span>View Cards</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/app/components/ui/switch";
import { useSet } from '@/app/context/SetContext';
import Image from 'next/image';
import type { PhraseProgressData, SetMetaData } from '@/app/lib/storage';
import { useUser } from '@clerk/nextjs';
import PublishConfirmationModal from '@/app/components/PublishConfirmationModal';
import { toast } from 'sonner';
import { X, Loader2, User, EyeOff, Edit, Trash2, Check, ChevronDown, Share2, Download, Upload } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { getToneLabel } from '@/app/lib/utils';

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
  currentSetName?: string;
  activeSetId?: string | null;
  onOpenSetManager?: () => void;
  onExportSet?: () => void;
  onResetSetProgress?: () => void;
  onDeleteSet?: () => void;
  isLoading?: boolean;
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
  const { availableSets, switchSet, activeSetId, deleteSet, renameSet, exportSet, addSet } = useSet();
  const [isLongPress, setIsLongPress] = useState<string | null>(null);
  const longPressTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");

  const handleTouchStart = (setId: string) => {
    // ... implementation ...
  };

  const handleTouchEnd = () => {
    // ... implementation ...
  };

  const handleContextMenu = (e: React.MouseEvent, setId: string) => {
    // ... implementation ...
  };

  const handleStartRename = (set: SetMetaData) => {
    // ... implementation ...
  };

  const handleSaveRename = async () => {
    // ... implementation ...
  };

  const handleCancelRename = () => {
    // ... implementation ...
  };

  const handleDeleteSet = (setId: string) => {
    // ... implementation ...
  };

  const handleImportClick = () => {
    // ... implementation ...
  };

  const handleSelectSet = (setId: string) => {
    // ... implementation ...
  };

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
            const isDefault = set.id === 'default';
            const isActive = set.id === activeSetId;
            let imgUrl = set.imageUrl || '/images/default-set-logo.png';
            if (isDefault) imgUrl = '/images/default-set-logo.png';
            
            return (
              <div 
                key={set.id}
                className={`relative group bg-[#2C2C2C] rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 ${isActive ? 'border-blue-500 shadow-lg shadow-blue-500/30' : 'border-transparent hover:border-blue-600/50'}`}
                onClick={() => handleSelectSet(set.id)}
                onTouchStart={() => handleTouchStart(set.id)}
                onTouchEnd={handleTouchEnd}
                onContextMenu={(e) => handleContextMenu(e, set.id)}
              >
                {/* ... (Overlays, Edit Input, Image rendering) ... */}
                <div className="px-3 pb-3">
                  <h3 className="text-base font-medium text-gray-200 group-hover:text-white transition-colors line-clamp-3 mb-1" title={set.name}>{set.name}</h3>
                  {/* ... CreatedAt ... */}
                  
                  <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap gap-x-2">
                    {set.level && <span>Level: <span className="font-medium text-[#A9C4FC]">{set.level}</span></span>}
                    {set.toneLevel !== undefined && 
                      <span>Tone: <span className="font-medium text-[#A9C4FC]">{getToneLabel(set.toneLevel)}</span></span>
                    }
                  </div>
                  
                  <p className="text-xs text-gray-400 mt-0.5">{set.phraseCount} cards</p>
                </div>
                {/* ... Active Indicator ... */}
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
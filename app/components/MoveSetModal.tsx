'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Folder } from '@/app/lib/storage/folders';
import { SetMetaData } from '@/app/lib/storage';
import { FolderIcon, FolderOpen, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MoveSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  sets: SetMetaData[];
  folders: Folder[];
  currentFolderId?: string | null;
  onMove: (setIds: string[], targetFolderId: string | null) => Promise<void>;
}

export function MoveSetModal({ 
  isOpen, 
  onClose, 
  sets, 
  folders, 
  currentFolderId,
  onMove 
}: MoveSetModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  // Filter out current folder from options
  const availableFolders = folders.filter(f => f.id !== currentFolderId);

  const handleMove = async () => {
    setIsMoving(true);
    try {
      await onMove(sets.map(s => s.id), selectedFolderId);
      onClose();
    } catch (error) {
      console.error('Failed to move sets:', error);
    } finally {
      setIsMoving(false);
    }
  };

  const getSetNames = () => {
    if (sets.length === 1) return `"${sets[0].name}"`;
    if (sets.length === 2) return `"${sets[0].name}" and "${sets[1].name}"`;
    return `${sets.length} sets`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[#1F1F1F] border-[#404040] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#E0E0E0]">
            Move {getSetNames()}
          </DialogTitle>
          <DialogDescription className="text-[#BDBDBD] mt-2">
            Select a folder to move {sets.length === 1 ? 'this set' : 'these sets'} to
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-3">
          {/* Root/No Folder Option */}
          <button
            onClick={() => setSelectedFolderId(null)}
            className={cn(
              "w-full p-4 rounded-xl border transition-all duration-200 flex items-center gap-4",
              selectedFolderId === null
                ? "bg-[#A9C4FC]/20 border-[#A9C4FC] shadow-lg"
                : "bg-[#2C2C2C]/40 border-[#404040]/50 hover:bg-[#2C2C2C]/60 hover:border-[#404040]"
            )}
          >
            <div className="p-2 rounded-lg bg-[#3C3C3C]/50">
              <FolderOpen size={24} className="text-[#BDBDBD]" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-[#E0E0E0]">No Folder</p>
              <p className="text-sm text-[#BDBDBD]">Move to root level</p>
            </div>
            {selectedFolderId === null && (
              <CheckCircle2 size={20} className="text-[#A9C4FC]" />
            )}
          </button>

          {/* Folder Options */}
          {availableFolders.map(folder => {
            const isSelected = selectedFolderId === folder.id;
            
            return (
              <button
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                className={cn(
                  "w-full p-4 rounded-xl border transition-all duration-200 flex items-center gap-4",
                  isSelected
                    ? "bg-[#A9C4FC]/20 border-[#A9C4FC] shadow-lg"
                    : "bg-[#2C2C2C]/40 border-[#404040]/50 hover:bg-[#2C2C2C]/60 hover:border-[#404040]"
                )}
              >
                <div className="p-2 rounded-lg bg-[#3C3C3C]/50">
                  <FolderIcon size={24} className={cn(
                    "transition-colors",
                    isSelected ? "text-[#A9C4FC]" : "text-[#BDBDBD]"
                  )} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-[#E0E0E0]">{folder.name}</p>
                  {folder.description && (
                    <p className="text-sm text-[#BDBDBD] line-clamp-1">{folder.description}</p>
                  )}
                  <p className="text-xs text-[#BDBDBD]/60 mt-1">
                    {folder.setCount || 0} {folder.setCount === 1 ? 'set' : 'sets'}
                  </p>
                </div>
                {isSelected && (
                  <CheckCircle2 size={20} className="text-[#A9C4FC]" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 mt-8">
          <Button
            onClick={handleMove}
            disabled={isMoving || selectedFolderId === undefined}
            className="flex-1 bg-[#A9C4FC] hover:bg-[#A9C4FC]/90 text-[#121212] font-medium"
          >
            {isMoving ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#121212] border-t-transparent" />
                Moving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Move Here
                <ArrowRight size={16} />
              </div>
            )}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 bg-transparent border-[#404040] text-[#E0E0E0] hover:bg-[#2C2C2C]/50"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

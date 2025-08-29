'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSet } from '@/app/context/SetContext';
import { useSetCache } from '@/app/context/SetCacheContext';
import { Folder, FolderWithSets } from '@/app/lib/storage/folders';
import FolderCard from './FolderCard';
import Image from 'next/image';
import SetCompletionBadge from './SetCompletionBadge';
import type { SetMetaData } from '@/app/lib/storage';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, FolderOpen, ArrowLeft, X } from 'lucide-react';

interface FolderViewProps {
  isOpen: boolean;
  onClose: () => void;
  highlightSetId: string | null;
}

export function FolderView({ isOpen, onClose, highlightSetId: _highlightSetId }: FolderViewProps) {
  const { availableSets, switchSet, activeSetId } = useSet();
  const { preloadFolders, getCachedFolders, clearFolderCache, preloadAllSets, preloadImages } = useSetCache();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FolderWithSets | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isEditingFolder, setIsEditingFolder] = useState<Folder | null>(null);
  const [folderForm, setFolderForm] = useState({ name: '', description: '' });
  const [folderError, setFolderError] = useState('');

  // Fetch folders on mount
  useEffect(() => {
    if (isOpen) {
      fetchFolders();
    }
  }, [isOpen]);

  const fetchFolders = async () => {
    // Try cache first
    const cachedFolders = getCachedFolders();
    if (cachedFolders) {
      console.log('[FolderView] Using cached folders');
      setFolders(cachedFolders);
      return;
    }

    // Otherwise load and cache
    setLoading(true);
    try {
      const loadedFolders = await preloadFolders();
      setFolders(loadedFolders);
    } catch (error) {
      console.error('Error fetching folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolderDetails = async (folderId: string) => {
    // Find the folder from our cached data
    const folder = folders.find(f => f.id === folderId);
    if (!folder) {
      console.error('Folder not found:', folderId);
      return;
    }

    setLoading(true);
    try {
      // Get all sets that belong to this folder (by folderId or folderName)
      const folderSets = availableSets.filter(set => 
        set.folderId === folder.id || set.folderName === folder.name
      );
      
      // Preload content for sets in this folder
      const setIds = folderSets.map(set => set.id);
      if (setIds.length > 0) {
        console.log(`[FolderView] Preloading ${setIds.length} sets for folder ${folder.name}`);
        await preloadAllSets(setIds);
        
        // Also preload images
        const imageUrls = folderSets.map(set => set.imageUrl || '/images/default-set-logo.png');
        await preloadImages(imageUrls);
      }
      
      // Enhance the folder with the actual sets
      setCurrentFolder({
        ...folder,
        sets: folderSets.map(set => ({
          id: set.id,
          name: set.name,
          imageUrl: set.imageUrl,
          phraseCount: set.phraseCount,
          createdAt: set.createdAt
        }))
      });
    } catch (error) {
      console.error('Error loading folder details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!folderForm.name.trim()) {
      setFolderError('Folder name is required');
      return;
    }

    setLoading(true);
    setFolderError('');

    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folderForm),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create folder');
      }

      // Clear cache and reload
      clearFolderCache();
      await fetchFolders();
      setIsCreatingFolder(false);
      setFolderForm({ name: '', description: '' });
    } catch (error) {
      setFolderError(error instanceof Error ? error.message : 'Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFolder = async () => {
    if (!isEditingFolder || !folderForm.name.trim()) return;

    setLoading(true);
    setFolderError('');

    try {
      const response = await fetch(`/api/folders/${isEditingFolder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folderForm),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to update folder');
      }

      // Clear cache and reload
      clearFolderCache();
      await fetchFolders();
      setIsEditingFolder(null);
      setFolderForm({ name: '', description: '' });
    } catch (error) {
      setFolderError('Failed to update folder');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFolder = async (folder: Folder) => {
    if (!confirm(`Delete folder "${folder.name}"? Sets will not be deleted.`)) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/folders/${folder.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete folder');
      }

      // Clear cache and reload
      clearFolderCache();
      await fetchFolders();
    } catch (error) {
      alert('Failed to delete folder');
    } finally {
      setLoading(false);
    }
  };

  const handleSetClick = async (set: SetMetaData) => {
    if (set.id !== activeSetId) {
      await switchSet(set.id);
    }
    onClose();
  };

  const handleBackToFolders = () => {
    setCurrentFolder(null);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl bg-[#1F1F1F] border-[#404040] text-white p-0 overflow-hidden h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#2C2C2C] border-b border-[#404040] px-8 py-6 flex-shrink-0">
          <DialogHeader>
            <DialogTitle asChild>
              {currentFolder ? (
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBackToFolders}
                    className="p-2.5 rounded-lg bg-[#3C3C3C] hover:bg-[#4C4C4C] transition-all duration-200 border border-[#404040] group"
                  >
                    <ArrowLeft size={20} className="text-[#A9C4FC] group-hover:text-[#A9C4FC]/80" />
                  </button>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-[#E0E0E0]">{currentFolder.name}</h2>
                    {currentFolder.description && (
                      <p className="text-sm text-[#BDBDBD] mt-1">{currentFolder.description}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-[#E0E0E0]">My Sets</h2>
                  <p className="text-sm text-[#BDBDBD] mt-1">Organize your flashcard sets into folders</p>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {loading && (
            <div className="flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#A9C4FC]"></div>
            </div>
          )}

          {!loading && !currentFolder && (
            <>
              {/* Create/Edit Folder Form */}
              {(isCreatingFolder || isEditingFolder) && (
                <div className="mb-6 p-6 bg-[#2C2C2C] rounded-xl border border-[#404040]">
                  <h3 className="text-lg font-semibold mb-4 text-[#E0E0E0]">
                    {isCreatingFolder ? 'Create New Folder' : 'Edit Folder'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="folder-name" className="text-[#E0E0E0]">Name</Label>
                      <Input
                        id="folder-name"
                        value={folderForm.name}
                        onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                        placeholder="Enter folder name"
                        className="mt-1 bg-[#3C3C3C] border-[#404040] text-[#E0E0E0] focus:border-[#A9C4FC] focus:ring-1 focus:ring-[#A9C4FC]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="folder-description" className="text-[#E0E0E0]">Description (optional)</Label>
                      <Textarea
                        id="folder-description"
                        value={folderForm.description}
                        onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                        placeholder="Enter folder description"
                        className="mt-1 bg-[#3C3C3C] border-[#404040] text-[#E0E0E0] focus:border-[#A9C4FC] focus:ring-1 focus:ring-[#A9C4FC] min-h-[80px]"
                        rows={3}
                      />
                    </div>
                    {folderError && (
                      <p className="text-red-400 text-sm">{folderError}</p>
                    )}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={isCreatingFolder ? handleCreateFolder : handleUpdateFolder}
                        disabled={loading}
                        className="px-6 py-2.5 bg-[#A9C4FC] hover:bg-[#A9C4FC]/90 text-[#121212] font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
                      >
                        {isCreatingFolder ? 'Create' : 'Update'}
                      </button>
                      <button
                        onClick={() => {
                          setIsCreatingFolder(false);
                          setIsEditingFolder(null);
                          setFolderForm({ name: '', description: '' });
                          setFolderError('');
                        }}
                        className="px-6 py-2.5 bg-[#3C3C3C] hover:bg-[#4C4C4C] text-[#E0E0E0] font-medium rounded-lg transition-all duration-200 border border-[#404040]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Folder Button */}
              {!isCreatingFolder && !isEditingFolder && (
                <button
                  onClick={() => {
                    setIsCreatingFolder(true);
                    setFolderForm({ name: '', description: '' });
                  }}
                  className="w-full mb-6 p-4 rounded-xl bg-[#2C2C2C] hover:bg-[#323232] border-2 border-dashed border-[#404040] hover:border-[#A9C4FC]/50 transition-all duration-200 group"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Plus size={24} className="text-[#A9C4FC] group-hover:text-[#A9C4FC]/80" />
                    <span className="text-lg font-medium text-[#E0E0E0]">Create New Folder</span>
                  </div>
                </button>
              )}

              {/* Folders Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {folders.map(folder => {
                  // Get sets for this folder - handle both folderId and folderName
                  const folderSets = availableSets.filter(set => 
                    set.folderId === folder.id || set.folderName === folder.name
                  );
                  
                  // Create enhanced folder with preview images from actual sets
                  const enhancedFolder = {
                    ...folder,
                    setCount: folderSets.length,
                    previewImages: folderSets
                      .slice(0, 4)
                      .map(set => set.imageUrl)
                      .filter((url): url is string => url !== null)
                  };
                  
                  return (
                    <FolderCard
                      key={folder.id}
                      folder={enhancedFolder}
                      onClick={() => fetchFolderDetails(folder.id)}
                      onEdit={() => {
                        setIsEditingFolder(folder);
                        setFolderForm({
                          name: folder.name,
                          description: folder.description || ''
                        });
                      }}
                      onDelete={() => handleDeleteFolder(folder)}
                    />
                  );
                })}

                {/* Unfiled Sets */}
                {availableSets.filter(set => !set.folderId && !set.folderName && set.id !== 'default').length > 0 && (
                  <div
                    onClick={() => {
                      // Show unfiled sets
                      setCurrentFolder({
                        id: 'unfiled',
                        userId: '',
                        name: 'Unfiled Sets',
                        description: 'Sets not organized in any folder',
                        isDefault: false,
                        orderIndex: 999,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        sets: availableSets
                          .filter(set => !set.folderId && !set.folderName && set.id !== 'default')
                          .map(set => ({
                            id: set.id,
                            name: set.name,
                            imageUrl: set.imageUrl,
                            phraseCount: set.phraseCount,
                            createdAt: set.createdAt
                          }))
                      });
                    }}
                    className="cursor-pointer"
                  >
                    <div className="neumorphic-card-static hover:neumorphic-card-static hover:border-[#505050] hover:bg-[#323232] transition-all duration-200 h-full">
                      <div className="aspect-[4/3] relative bg-gradient-to-br from-[#2C2C2C] to-[#1F1F1F] flex items-center justify-center">
                        <div className="p-4 rounded-2xl bg-[#1F1F1F]/80 backdrop-blur-sm border border-[#404040]/50">
                          <FolderOpen size={48} className="text-[#BDBDBD]" />
                        </div>
                        
                        <div className="absolute top-3 left-3">
                          <div className="px-3 py-1 rounded-full bg-[#1F1F1F]/90 backdrop-blur-sm border border-[#404040]/50">
                            <span className="text-sm font-medium text-[#E0E0E0]">
                              {availableSets.filter(set => !set.folderId && !set.folderName && set.id !== 'default').length} sets
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-lg text-[#E0E0E0]">Unfiled Sets</h3>
                        <p className="text-sm text-[#BDBDBD] mt-1">Sets not in any folder</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Folder Contents View */}
          {!loading && currentFolder && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {currentFolder.sets.map(set => {
                const fullSet = availableSets.find(s => s.id === set.id);
                if (!fullSet) return null;

                const isSelected = activeSetId === set.id;
                const imgUrl = set.imageUrl || '/images/default-set-logo.png';

                return (
                  <div
                    key={set.id}
                    className={`group cursor-pointer transition-all duration-200 ${
                      isSelected ? 'scale-105' : ''
                    }`}
                    onClick={() => handleSetClick(fullSet)}
                  >
                    <div className={`neumorphic-card-static hover:border-[#505050] hover:bg-[#323232] relative overflow-hidden ${
                      isSelected ? 'ring-2 ring-[#A9C4FC] border-[#A9C4FC]' : ''
                    }`}>
                      <SetCompletionBadge setId={set.id} />
                      
                      <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-[#2C2C2C] to-[#1F1F1F] overflow-hidden">
                        <Image
                          src={imgUrl}
                          alt={set.name}
                          className="object-cover"
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          unoptimized={true}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1F1F1F] via-transparent to-transparent opacity-50" />
                      </div>

                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-[#E0E0E0] line-clamp-2 mb-1">
                          {set.name}
                        </h3>
                        <p className="text-sm text-[#BDBDBD]">
                          {set.phraseCount} cards
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Close button - always visible */}
        <button
          onClick={onClose}
          className="absolute top-6 right-8 p-2 rounded-lg bg-[#3C3C3C] hover:bg-[#4C4C4C] transition-all duration-200 border border-[#404040] group"
        >
          <X size={20} className="text-[#BDBDBD] group-hover:text-[#E0E0E0]" />
        </button>
      </DialogContent>
    </Dialog>
  );
}
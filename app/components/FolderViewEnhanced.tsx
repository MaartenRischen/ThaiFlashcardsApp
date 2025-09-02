'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSet } from '@/app/context/SetContext';
import { useSetCache } from '@/app/context/SetCacheContext';
import { Folder, FolderWithSets } from '@/app/lib/storage/folders';
import FolderCardEnhanced from './FolderCardEnhanced';
import { MoveSetModal } from './MoveSetModal';
import { ConfirmationModal } from './ConfirmationModal';
import { EmptyState } from './EmptyState';
import Image from 'next/image';
import SetCompletionBadge from './SetCompletionBadge';
import type { SetMetaData } from '@/app/lib/storage';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  ArrowLeft, 
  X, 
  Search,
  CheckSquare,
  Square,
  MoveRight,
  Grid3X3,
  List,
  Eye,
  Play
} from 'lucide-react';
import { ShareButton } from './ShareButton';
import { GoLiveButton } from './GoLiveButton';
import { SetPreviewModal } from './SetPreviewModal';
import { usePreloadedFolders } from '@/app/hooks/usePreloadedData';
import { usePreloader } from '@/app/context/PreloaderContext';
import MySetCard from './MySetCard';
import ThaiFactInline from './ThaiFactInline';

interface FolderViewEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  highlightSetId: string | null;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'date' | 'size';

export function FolderViewEnhanced({ isOpen, onClose, highlightSetId: _highlightSetId }: FolderViewEnhancedProps) {
  const { availableSets, switchSet, activeSetId, refreshSets, isLoading: setsLoading } = useSet();
  const { preloadFolders, getCachedFolders, clearFolderCache, preloadAllSets, preloadImages, getCachedContent } = useSetCache();
  // Access preloaded data to avoid unnecessary spinners if cache hasn't been primed yet
  const { preloadedData, isLoading: isPreloading } = usePreloader();
  const { folders: preloadedFolders } = usePreloadedFolders();
  
  // State
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FolderWithSets | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOption, setSortOption] = useState<SortOption>('name');
  
  // Multi-select state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedSets, setSelectedSets] = useState<Set<string>>(new Set());
  
  // Modal states
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isEditingFolder, setIsEditingFolder] = useState<Folder | null>(null);
  const [folderForm, setFolderForm] = useState({ name: '', description: '' });
  const [folderError, setFolderError] = useState('');
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [setsToMove, setSetsToMove] = useState<SetMetaData[]>([]);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
  
  // Preview modal state
  const [previewSet, setPreviewSet] = useState<{
    id: string;
    name: string;
    phraseCount: number;
    imageUrl?: string | null;
  } | null>(null);

  // Use preloaded folders when available
  useEffect(() => {
    if (isOpen) {
      console.log('[FolderViewEnhanced] isOpen:', isOpen, 'preloadedFolders:', preloadedFolders);
      if (preloadedFolders.length > 0) {
        console.log('[FolderViewEnhanced] Using preloaded folders:', preloadedFolders);
        setFolders(preloadedFolders);
      } else {
        console.log('[FolderViewEnhanced] No preloaded folders, fetching...');
        fetchFolders();
      }
    }
  }, [isOpen, preloadedFolders]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset selection when leaving select mode
  useEffect(() => {
    if (!isSelectMode) {
      setSelectedSets(new Set());
    }
  }, [isSelectMode]);

  const fetchFolders = async () => {
    // First try preloaded data
    if (preloadedFolders.length > 0) {
      console.log('[FolderViewEnhanced] Using preloaded folders');
      setFolders(preloadedFolders);
      return;
    }
    
    // Then try cache
    const cachedFolders = getCachedFolders();
    if (cachedFolders) {
      console.log('[FolderViewEnhanced] Using cached folders');
      setFolders(cachedFolders);
      return;
    }

    // Only load if we really need to
    console.log('[FolderViewEnhanced] No cached/preloaded folders, fetching...');
    setLoading(true);
    try {
      const loadedFolders = await preloadFolders();
      setFolders(loadedFolders);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast.error('Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const fetchFolderDetails = async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) {
      console.error('Folder not found:', folderId);
      return;
    }

    // Don't show loading if we already have the data
    let shouldShowLoading = false;
    
    try {
      let folderSets: SetMetaData[] = [];
      
      // For unauthenticated users, match sets by their IDs
      if (folderId.startsWith('default-folder-')) {
        if (folder.name === 'Default Sets') {
          // Include original default sets
          folderSets = availableSets.filter(set => 
            (set.id === 'default' || 
             (set.id.startsWith('default-') && 
              !set.id.includes('common-words') && 
              !set.id.includes('common-sentences')))
          );
        } else if (folder.name === '100 Most Used Thai Words') {
          folderSets = availableSets.filter(set => 
            set.id.startsWith('default-common-words-')
          );
        } else if (folder.name === '100 Most Used Thai Sentences') {
          folderSets = availableSets.filter(set => 
            set.id.startsWith('default-common-sentences-')
          );
        }
      } else {
        // For authenticated users, use the existing logic
        console.log(`[FolderView] Folder ${folder.name} (${folder.id}), looking for sets`);
        console.log('[FolderView] Available sets:', availableSets.map(s => ({ 
          id: s.id, 
          name: s.name, 
          folderId: s.folderId, 
          folderName: s.folderName,
          source: s.source 
        })));
        
        folderSets = availableSets.filter(set => 
          set.folderId === folder.id || set.folderName === folder.name
        );
        
        if (folder.name === 'Default Sets' && folder.isDefault) {
          const unfiledSets = availableSets.filter(set => 
            (!set.folderId && !set.folderName) || set.id === 'default'
          );
          const setIds = new Set(folderSets.map(s => s.id));
          const uniqueUnfiledSets = unfiledSets.filter(set => !setIds.has(set.id));
          folderSets = [...folderSets, ...uniqueUnfiledSets];
        }
        
        console.log(`[FolderView] Found ${folderSets.length} sets for folder ${folder.name}`);
      }
      
      const setIds = folderSets.map(set => set.id);
      if (setIds.length > 0) {
        // Check if we need to load anything
        // Consider preloaded data as well, so we don't spinner while cache is being primed
        const isInPreloadedData = (id: string) => {
          try {
            return !!(preloadedData && preloadedData.setContents && preloadedData.setContents[id] && preloadedData.setContents[id].length > 0);
          } catch {
            return false;
          }
        };
        const needsLoading = setIds.some(id => !getCachedContent(id) && !isInPreloadedData(id));
        if (needsLoading) {
          const missing = setIds.filter(id => !getCachedContent(id) && !isInPreloadedData(id));
          console.log(`[FolderViewEnhanced] Need to load content for ${missing.length} sets`);
          // Only show loading if preloader isn't still finishing up
          if (!isPreloading) {
            shouldShowLoading = true;
            setLoading(true);
          }
          
          // Only preload sets that aren't cached
          const uncachedSetIds = missing;
          if (uncachedSetIds.length > 0) {
            await preloadAllSets(uncachedSetIds);
          }
        }
        
        // Images can be loaded in background without showing spinner
        const imageUrls = folderSets.map(set => set.imageUrl || '/images/default-set-logo.png');
        preloadImages(imageUrls); // Don't await, let it load in background
      }
      
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
      
      // Reset search and selection when entering folder
      setSearchQuery('');
      setIsSelectMode(false);
      setSelectedSets(new Set());
    } catch (error) {
      console.error('Error loading folder details:', error);
      toast.error('Failed to load folder contents');
    } finally {
      if (shouldShowLoading) {
        setLoading(false);
      }
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

      clearFolderCache();
      await fetchFolders();
      setIsCreatingFolder(false);
      setFolderForm({ name: '', description: '' });
      toast.success('Folder created successfully');
    } catch (error) {
      setFolderError(error instanceof Error ? error.message : 'Failed to create folder');
      toast.error('Failed to create folder');
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

      clearFolderCache();
      await fetchFolders();
      setIsEditingFolder(null);
      setFolderForm({ name: '', description: '' });
      toast.success('Folder updated successfully');
    } catch (error) {
      setFolderError('Failed to update folder');
      toast.error('Failed to update folder');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/folders/${folderToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete folder');
      }

      clearFolderCache();
      await fetchFolders();
      setFolderToDelete(null);
      toast.success('Folder deleted successfully');
    } catch (error) {
      toast.error('Failed to delete folder');
    } finally {
      setLoading(false);
    }
  };

  const handleSetClick = async (set: SetMetaData) => {
    if (isSelectMode) {
      toggleSetSelection(set.id);
    }
    // Remove the preview opening - clicking the image should do nothing when not in select mode
  };
  
  const handleLoadSet = async (setId: string) => {
    if (setId !== activeSetId) {
      await switchSet(setId);
    }
    onClose();
  };

  const toggleSetSelection = (setId: string) => {
    const newSelection = new Set(selectedSets);
    if (newSelection.has(setId)) {
      newSelection.delete(setId);
    } else {
      newSelection.add(setId);
    }
    setSelectedSets(newSelection);
  };

  const handleSelectAll = () => {
    if (!currentFolder) return;
    
    if (selectedSets.size === currentFolder.sets.length) {
      setSelectedSets(new Set());
    } else {
      setSelectedSets(new Set(currentFolder.sets.map(s => s.id)));
    }
  };

  const handleMoveSelected = () => {
    const sets = availableSets.filter(s => selectedSets.has(s.id));
    setSetsToMove(sets);
    setShowMoveModal(true);
  };

  const handleMove = async (setIds: string[], targetFolderId: string | null) => {
    setLoading(true);
    try {
      const promises = setIds.map(setId => 
        fetch(`/api/flashcard-sets/${setId}/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folderId: targetFolderId }),
          credentials: 'include'
        })
      );

      const results = await Promise.all(promises);
      const failedCount = results.filter(r => !r.ok).length;

      if (failedCount > 0) {
        toast.error(`Failed to move ${failedCount} set(s)`);
      } else {
        toast.success(
          targetFolderId 
            ? `Moved ${setIds.length} set(s) successfully`
            : `Removed ${setIds.length} set(s) from folder`
        );
      }

      // Refresh data
      clearFolderCache();
      await refreshSets();
      await fetchFolders();
      
      if (currentFolder) {
        await fetchFolderDetails(currentFolder.id);
      }
      
      setIsSelectMode(false);
      setSelectedSets(new Set());
    } catch (error) {
      console.error('Error moving sets:', error);
      toast.error('Failed to move sets');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort logic
  const filteredAndSortedSets = useMemo(() => {
    if (!currentFolder) return [];
    
    let filtered = currentFolder.sets;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(set => 
        set.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'size':
          return b.phraseCount - a.phraseCount;
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [currentFolder, searchQuery, sortOption]);

  const handleBackToFolders = () => {
    setCurrentFolder(null);
    setIsSelectMode(false);
    setSelectedSets(new Set());
    setSearchQuery('');
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl bg-[#1F1F1F]/95 backdrop-blur-md border-[#404040]/50 text-white p-0 overflow-hidden h-[90vh] flex flex-col [&>button]:hidden">
        {/* Header */}
        <div className="bg-[#2C2C2C]/80 backdrop-blur-sm border-b border-[#404040]/50 px-8 py-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogHeader className="flex-1">
              <DialogTitle asChild>
                {currentFolder ? (
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleBackToFolders}
                      className="p-4 rounded-xl bg-[#3C3C3C]/50 hover:bg-[#3C3C3C]/70 backdrop-blur-sm transition-all duration-200 border border-[#404040]/50 group"
                    >
                      <ArrowLeft size={24} className="text-[#A9C4FC] group-hover:text-[#A9C4FC]/80" />
                    </button>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-[#E0E0E0]">{currentFolder.name}</h2>
                      {currentFolder.description && (
                        <p className="text-sm text-[#BDBDBD] mt-1">{currentFolder.description}</p>
                      )}
                    </div>
                    
                    {/* Set Actions */}
                    {currentFolder.sets.length > 0 && (
                      <div className="flex items-center gap-3">
                        {isSelectMode ? (
                          <>
                            <span className="text-sm text-[#BDBDBD]">
                              {selectedSets.size} selected
                            </span>
                            <Button
                              onClick={handleSelectAll}
                              variant="outline"
                              size="sm"
                              className="bg-transparent border-[#404040] text-[#E0E0E0] hover:bg-[#2C2C2C]/50"
                            >
                              {selectedSets.size === currentFolder.sets.length ? 'Deselect All' : 'Select All'}
                            </Button>
                            {selectedSets.size > 0 && (
                              <Button
                                onClick={handleMoveSelected}
                                size="sm"
                                className="bg-[#A9C4FC] hover:bg-[#A9C4FC]/90 text-[#121212]"
                              >
                                <MoveRight size={16} className="mr-2" />
                                Move
                              </Button>
                            )}
                            <Button
                              onClick={() => setIsSelectMode(false)}
                              variant="outline"
                              size="sm"
                              className="bg-transparent border-[#404040] text-[#E0E0E0] hover:bg-[#2C2C2C]/50"
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => setIsSelectMode(true)}
                            variant="outline"
                            size="sm"
                            className="bg-transparent border-[#404040] text-[#E0E0E0] hover:bg-[#2C2C2C]/50"
                          >
                            <CheckSquare size={16} className="mr-2" />
                            Select
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold text-[#E0E0E0]">My Sets</h2>
                    <p className="text-sm text-[#BDBDBD] mt-1">Organize your flashcard sets into folders</p>
                  </div>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <button
              onClick={onClose}
              className="p-4 rounded-xl bg-[#3C3C3C]/50 hover:bg-[#3C3C3C]/70 backdrop-blur-sm transition-all duration-200 border border-[#404040]/50 group ml-4"
            >
              <X size={24} className="text-[#BDBDBD] group-hover:text-[#E0E0E0]" />
            </button>
          </div>

          {/* Search and Filter Bar for Sets View */}
          {currentFolder && currentFolder.sets.length > 0 && (
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#BDBDBD]/60" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sets..."
                  className="pl-10 bg-[#3C3C3C]/50 backdrop-blur-sm border-[#404040]/50 text-[#E0E0E0] placeholder-[#BDBDBD]/60"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-[#404040] text-[#E0E0E0] hover:bg-[#2C2C2C]/50"
                >
                  {viewMode === 'grid' ? <List size={16} /> : <Grid3X3 size={16} />}
                </Button>
                
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="px-3 py-1.5 rounded-lg bg-[#3C3C3C]/50 backdrop-blur-sm border border-[#404040]/50 text-[#E0E0E0] text-sm"
                >
                  <option value="name">Name</option>
                  <option value="date">Date</option>
                  <option value="size">Size</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {(loading || setsLoading || isPreloading) && (
            <div className="flex justify-center items-center py-24">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#A9C4FC]"></div>
                <div className="text-sm text-[#A9C4FC]">Loading folders and sets…</div>
                <ThaiFactInline />
              </div>
            </div>
          )}

          {!(loading || setsLoading || isPreloading) && !currentFolder && (
            <>
              {/* Easy Cards Exam Button */}
              <div className="mb-6">
                <button
                  onClick={() => {
                    onClose();
                    window.location.href = '/the-everything-exam';
                  }}
                  className="w-full p-6 bg-gradient-to-r from-green-500/20 to-blue-500/20 hover:from-green-500/30 hover:to-blue-500/30 backdrop-blur-sm rounded-xl border border-[#404040]/50 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-blue-500 text-white">
                        <CheckSquare className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-[#E0E0E0] group-hover:text-white transition-colors">
                          The Everything Exam
                        </h3>
                        <p className="text-sm text-[#A0A0A0] mt-1">
                          Review all cards you've marked as "Easy" across all sets
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Play className="w-5 h-5 text-[#A0A0A0] group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </button>
              </div>

              {/* Create/Edit Folder Form */}
              {(isCreatingFolder || isEditingFolder) && (
                <div className="mb-6 p-6 bg-[#2C2C2C]/40 backdrop-blur-sm rounded-xl border border-[#404040]/50 animate-in fade-in slide-in-from-top-2 duration-300">
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
                        className="mt-1 bg-[#3C3C3C]/50 backdrop-blur-sm border-[#404040]/50 text-[#E0E0E0] focus:border-[#A9C4FC] focus:ring-1 focus:ring-[#A9C4FC]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="folder-description" className="text-[#E0E0E0]">Description (optional)</Label>
                      <Textarea
                        id="folder-description"
                        value={folderForm.description}
                        onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                        placeholder="Enter folder description"
                        className="mt-1 bg-[#3C3C3C]/50 backdrop-blur-sm border-[#404040]/50 text-[#E0E0E0] focus:border-[#A9C4FC] focus:ring-1 focus:ring-[#A9C4FC] min-h-[80px]"
                        rows={3}
                      />
                    </div>
                    {folderError && (
                      <p className="text-red-400 text-sm">{folderError}</p>
                    )}
                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={isCreatingFolder ? handleCreateFolder : handleUpdateFolder}
                        disabled={loading}
                        className="bg-[#A9C4FC] hover:bg-[#A9C4FC]/90 text-[#121212]"
                      >
                        {isCreatingFolder ? 'Create' : 'Update'}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsCreatingFolder(false);
                          setIsEditingFolder(null);
                          setFolderForm({ name: '', description: '' });
                          setFolderError('');
                        }}
                        variant="outline"
                        className="bg-transparent border-[#404040] text-[#E0E0E0] hover:bg-[#2C2C2C]/50"
                      >
                        Cancel
                      </Button>
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
                  className="w-full mb-6 p-4 rounded-xl bg-[#2C2C2C]/40 hover:bg-[#2C2C2C]/60 border-2 border-dashed border-[#404040]/50 hover:border-[#A9C4FC]/50 transition-all duration-200 group backdrop-blur-sm animate-in fade-in duration-300"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Plus size={24} className="text-[#A9C4FC] group-hover:text-[#A9C4FC]/80" />
                    <span className="text-lg font-medium text-[#E0E0E0]">Create New Folder</span>
                  </div>
                </button>
              )}

              {/* Folders Grid */}
              {folders.length === 0 ? (
                <EmptyState
                  type="folders"
                  onAction={() => {
                    setIsCreatingFolder(true);
                    setFolderForm({ name: '', description: '' });
                  }}
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 animate-in fade-in duration-300">
                  {folders.map((folder, index) => {
                    let folderSets: SetMetaData[] = [];
                    
                    // For unauthenticated users, match sets by their IDs
                    if (folder.id.startsWith('default-folder-')) {
                      if (folder.name === 'Default Sets') {
                        folderSets = availableSets.filter(set => 
                          (set.id === 'default' || 
                           (set.id.startsWith('default-') && 
                            !set.id.includes('common-words') && 
                            !set.id.includes('common-sentences')))
                        );
                      } else if (folder.name === '100 Most Used Thai Words') {
                        folderSets = availableSets.filter(set => 
                          set.id.startsWith('default-common-words-')
                        );
                      } else if (folder.name === '100 Most Used Thai Sentences') {
                        folderSets = availableSets.filter(set => 
                          set.id.startsWith('default-common-sentences-')
                        );
                      }
                    } else {
                      // For authenticated users, use the existing logic
                      folderSets = availableSets.filter(set => 
                        set.folderId === folder.id || set.folderName === folder.name
                      );
                    }
                    
                    const isFolderLoading = (loading || setsLoading || isPreloading);
                    const enhancedFolder = {
                      ...folder,
                      setCount: folderSets.length,
                      previewImages: folderSets
                        .slice(0, 4)
                        .map(set => set.imageUrl)
                        .filter((url): url is string => url !== null)
                    };
                    
                    return (
                      <div
                        key={folder.id}
                        className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <FolderCardEnhanced
                          folder={enhancedFolder}
                          isLoading={isFolderLoading && folderSets.length === 0}
                          onClick={() => fetchFolderDetails(folder.id)}
                          onEdit={() => {
                            setIsEditingFolder(folder);
                            setFolderForm({
                              name: folder.name,
                              description: folder.description || ''
                            });
                          }}
                          onDelete={() => setFolderToDelete(folder)}
                          onCustomize={() => {
                            toast.info('Folder customization coming soon!');
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Folder Contents View */}
          {!(loading || setsLoading || isPreloading) && currentFolder && (
            <>
              {filteredAndSortedSets.length === 0 ? (
                searchQuery ? (
                  <EmptyState type="search" />
                ) : (
                  <EmptyState type="sets" />
                )
              ) : (
                <div className={cn(
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6" 
                    : "space-y-4",
                  "animate-in fade-in duration-300"
                )}>
                  {filteredAndSortedSets.map((set, index) => {
                    const fullSet = availableSets.find(s => s.id === set.id);
                    if (!fullSet) return null;

                    const isSelected = selectedSets.has(set.id);
                    const isActive = activeSetId === set.id;
                    const imgUrl = set.imageUrl || '/images/default-set-logo.png';

                    return (
                      <div
                        key={set.id}
                        className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {viewMode === 'grid' ? (
                          <div className="relative">
                            {/* Selection Checkbox overlay */}
                            {isSelectMode && (
                              <div className="absolute top-3 left-3 z-30">
                                <div 
                                  className="p-2 rounded-lg bg-[#1F1F1F]/80 backdrop-blur-sm cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetClick(fullSet);
                                  }}
                                >
                                  {isSelected ? (
                                    <CheckSquare size={20} className="text-[#A9C4FC]" />
                                  ) : (
                                    <Square size={20} className="text-[#BDBDBD]" />
                                  )}
                                </div>
                              </div>
                            )}
                            <MySetCard
                              set={fullSet}
                              onLoadSet={handleLoadSet}
                              onPreview={(_id) => {
                                setPreviewSet({
                                  id: fullSet.id,
                                  name: fullSet.name,
                                  phraseCount: fullSet.phraseCount,
                                  imageUrl: fullSet.imageUrl
                                });
                              }}
                              isLoading={loading}
                              currentSetId={activeSetId}
                            />
                          </div>
                        ) : (
                          // List view
                          <div
                            className={cn(
                              "group transition-all duration-200",
                              isSelectMode ? 'cursor-pointer' : ''
                            )}
                            onClick={() => handleSetClick(fullSet)}
                          >
                            <div className={cn(
                              "bg-[#2C2C2C]/40 backdrop-blur-sm rounded-xl border transition-all duration-200 relative overflow-hidden",
                              "flex items-center gap-4 p-4",
                              isSelected 
                                ? "border-[#A9C4FC] ring-2 ring-[#A9C4FC] bg-[#A9C4FC]/10" 
                                : "border-[#404040]/30 hover:bg-[#2C2C2C]/60 hover:border-[#404040]/50",
                              isActive ? "ring-2 ring-[#22c55e] border-[#22c55e]" : ""
                            )}>
                              {/* Selection Checkbox */}
                              {isSelectMode && (
                                <div className="relative order-first">
                                  <div className="p-2 rounded-lg bg-[#1F1F1F]/80 backdrop-blur-sm">
                                    {isSelected ? (
                                      <CheckSquare size={20} className="text-[#A9C4FC]" />
                                    ) : (
                                      <Square size={20} className="text-[#BDBDBD]" />
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="relative w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                                <Image
                                  src={imgUrl}
                                  alt={set.name}
                                  className="object-cover"
                                  fill
                                  sizes="96px"
                                  unoptimized={true}
                                />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-[#E0E0E0] truncate">
                                    {set.name}
                                  </h3>

                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  {fullSet.level && (
                                    <span className="text-sm text-[#A9C4FC]">
                                      Level: {fullSet.level}
                                    </span>
                                  )}
                                  {fullSet.toneLevel && (
                                    <>
                                      {fullSet.level && <span className="text-[#606060]">•</span>}
                                      <span className="text-sm text-[#FFB84D]">
                                        Tone: {fullSet.toneLevel}
                                      </span>
                                    </>
                                  )}
                                  <span className="text-[#606060]">•</span>
                                  <span className="text-sm text-[#BDBDBD]">
                                    {set.phraseCount} cards / {getCachedContent(set.id) ? 
                                      Object.values(getCachedContent(set.id)?.progress || {}).filter(p => p.difficulty === 'easy').length 
                                      : 0} learned
                                  </span>
                                </div>
                              </div>
                              
                              <SetCompletionBadge setId={set.id} />
                              
                              {!isSelectMode && (
                                <div className="flex items-center gap-2 ml-auto">
                                  {/* Preview Button - simpler */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewSet({
                                        id: fullSet.id,
                                        name: fullSet.name,
                                        phraseCount: fullSet.phraseCount,
                                        imageUrl: fullSet.imageUrl
                                      });
                                    }}
                                    className="px-3 py-1.5 bg-[#2F2F2F] text-[#E0E0E0] text-xs font-medium rounded-md hover:bg-[#3A3A3A] border border-[#444] transition-colors flex items-center gap-1.5"
                                    title="Preview this set"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-[#E0E0E0]" />
                                    <span>Preview</span>
                                  </button>
                                  
                                  {/* Load Set Button - solid */}
                                  <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleLoadSet(fullSet.id);
                                      }}
                                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1.5"
                                      title="Load this set"
                                  >
                                      <Play className="h-3.5 w-3.5 text-white" />
                                      <span>Load Set</span>
                                  </button>
                                  
                                  {/* Only show Publish button for user-created sets (not default sets) */}
                                  {fullSet && fullSet.source !== 'default' && !fullSet.id.startsWith('default-') && (
                                    <GoLiveButton
                                      setId={set.id}
                                      setName={set.name}
                                      variant="default"
                                      className=""
                                    />
                                  )}
                                  
                                  <ShareButton
                                    setId={set.id}
                                    setName={set.name}
                                    variant="prominent"
                                    className="scale-90"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modals */}
        <MoveSetModal
          isOpen={showMoveModal}
          onClose={() => {
            setShowMoveModal(false);
            setSetsToMove([]);
          }}
          sets={setsToMove}
          folders={folders}
          currentFolderId={currentFolder?.id}
          onMove={handleMove}
        />

        <ConfirmationModal
          isOpen={!!folderToDelete}
          onClose={() => setFolderToDelete(null)}
          onConfirm={handleDeleteFolder}
          title="Delete Folder"
          description={`Are you sure you want to delete "${folderToDelete?.name}"? Sets inside this folder will not be deleted.`}
          confirmText="Delete"
          variant="danger"
          icon="folder-delete"
        />
        
        {previewSet && (
          <SetPreviewModal
            isOpen={!!previewSet}
            onClose={() => setPreviewSet(null)}
            setId={previewSet.id}
            setName={previewSet.name}
            phraseCount={previewSet.phraseCount}
            imageUrl={previewSet.imageUrl}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSet } from '@/app/context/SetContext';
import { Folder, FolderWithSets } from '@/app/lib/storage/folders';
import FolderCard from './FolderCard';
import Image from 'next/image';
import SetCompletionBadge from './SetCompletionBadge';
import type { SetMetaData } from '@/app/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface FolderViewProps {
  isOpen: boolean;
  onClose: () => void;
  highlightSetId: string | null;
}

export function FolderView({ isOpen, onClose, highlightSetId }: FolderViewProps) {
  const { availableSets, switchSet, activeSetId } = useSet();
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
    setLoading(true);
    try {
      const response = await fetch('/api/folders', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch folders');
      }

      const data = await response.json();
      setFolders(data.folders);
    } catch (error) {
      console.error('Error fetching folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolderDetails = async (folderId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch folder details');
      }

      const data = await response.json();
      setCurrentFolder(data.folder);
    } catch (error) {
      console.error('Error fetching folder details:', error);
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
      <DialogContent className="max-w-6xl bg-[#1f1f1f] border-[#333] text-white">
        <DialogHeader>
          <DialogTitle>
            {currentFolder ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBackToFolders}
                  className="hover:bg-gray-800 p-2 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span>{currentFolder.name}</span>
              </div>
            ) : (
              'My Sets'
            )}
          </DialogTitle>
          <DialogDescription>
            {currentFolder ? currentFolder.description : 'Organize your flashcard sets into folders'}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}

        {!loading && !currentFolder && (
          <>
            {/* Create/Edit Folder Form */}
            {(isCreatingFolder || isEditingFolder) && (
              <div className="mb-6 p-4 bg-gray-900 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">
                  {isCreatingFolder ? 'Create New Folder' : 'Edit Folder'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="folder-name">Name</Label>
                    <Input
                      id="folder-name"
                      value={folderForm.name}
                      onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                      placeholder="Enter folder name"
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="folder-description">Description (optional)</Label>
                    <Textarea
                      id="folder-description"
                      value={folderForm.description}
                      onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                      placeholder="Enter folder description"
                      className="bg-gray-800 border-gray-700"
                      rows={3}
                    />
                  </div>
                  {folderError && (
                    <p className="text-red-500 text-sm">{folderError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={isCreatingFolder ? handleCreateFolder : handleUpdateFolder}
                      disabled={loading}
                    >
                      {isCreatingFolder ? 'Create' : 'Update'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreatingFolder(false);
                        setIsEditingFolder(null);
                        setFolderForm({ name: '', description: '' });
                        setFolderError('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Add Folder Button */}
            {!isCreatingFolder && !isEditingFolder && (
              <div className="mb-4">
                <Button
                  onClick={() => {
                    setIsCreatingFolder(true);
                    setFolderForm({ name: '', description: '' });
                  }}
                  className="w-full sm:w-auto"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Folder
                </Button>
              </div>
            )}

            {/* Folders Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-y-auto max-h-[calc(80vh-200px)]">
              {folders.map(folder => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
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
              ))}

              {/* Unfiled Sets */}
              {availableSets.filter(set => !set.folderId).length > 0 && (
                <div
                  onClick={() => {
                    // Show unfiled sets
                    setCurrentFolder({
                      id: 'unfiled',
                      userId: '',
                      name: 'Unfiled Sets',
                      description: 'Sets not in any folder',
                      isDefault: false,
                      orderIndex: 999,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      sets: availableSets
                        .filter(set => !set.folderId)
                        .map(set => ({
                          id: set.id,
                          name: set.name,
                          imageUrl: set.imageUrl,
                          phraseCount: set.phraseCount,
                          createdAt: set.createdAt
                        }))
                    });
                  }}
                  className="relative group cursor-pointer transition-all duration-200 hover:scale-105"
                >
                  <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden shadow-md flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-16 h-16 text-gray-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <p className="text-sm text-gray-500">Unfiled Sets</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <h3 className="font-semibold text-gray-400">Unfiled Sets</h3>
                    <p className="text-sm text-gray-600">
                      {availableSets.filter(set => !set.folderId).length} sets
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Folder Contents View */}
        {!loading && currentFolder && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-[calc(80vh-150px)]">
            {currentFolder.sets.map(set => {
              const fullSet = availableSets.find(s => s.id === set.id);
              if (!fullSet) return null;

              const isSelected = activeSetId === set.id;
              const imgUrl = set.imageUrl || '/images/default-set-logo.png';

              return (
                <div
                  key={set.id}
                  className={`relative bg-gray-900 rounded-xl p-3 flex flex-col shadow-lg border border-gray-800 cursor-pointer hover:ring-2 hover:ring-[#A9C4FC] transition
                  ${isSelected ? 'ring-2 ring-[#A9C4FC]' : ''}`}
                  onClick={() => handleSetClick(fullSet)}
                >
                  <SetCompletionBadge setId={set.id} />
                  
                  <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden mb-2 bg-[#2C2C2C]">
                    <Image
                      src={imgUrl}
                      alt={set.name}
                      className="object-contain"
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      unoptimized={true}
                    />
                  </div>

                  <h3 className="text-base font-medium text-gray-200 line-clamp-2">
                    {set.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {set.phraseCount} cards
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

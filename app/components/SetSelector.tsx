'use client';

import React, { useState } from 'react';
import { useSet } from '../context/SetContext';

export const SetSelector = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const { 
    availableSets, 
    activeSetId, 
    switchSet, 
    isLoading,
    exportSet,
    deleteSet,
    addSet
  } = useSet();

  const handleSetChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    await switchSet(selectedId);
  };

  // Filter out the active set from the list for management modal
  const setsForManagement = availableSets.filter(set => set.id !== 'default');

  return (
    <>
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-400">Current Set:</div>
          <div className="flex-1 relative min-w-[180px]">
            <select
              value={activeSetId || 'default'}
              onChange={handleSetChange}
              disabled={isLoading}
              className="neumorphic-button text-blue-400 font-medium py-1 px-2 text-sm w-full appearance-none cursor-pointer"
            >
              {availableSets.map(set => (
                <option key={set.id} value={set.id}>
                  {set.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <button 
            onClick={() => setIsManagementModalOpen(true)}
            className="neumorphic-button text-xs text-blue-400 p-1"
            title="Manage Sets"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Set Management Modal */}
      {isManagementModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setIsManagementModalOpen(false)}>
          <div className="neumorphic max-w-2xl w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-200">Manage Sets</h2>
              <button
                onClick={() => setIsManagementModalOpen(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Current Set Info */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-blue-400 font-medium mb-2">Current Set:</h3>
                <div className="text-lg text-white font-bold">
                  {availableSets.find(set => set.id === activeSetId)?.name || 'Default Set'}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {availableSets.find(set => set.id === activeSetId)?.phraseCount || 0} cards
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => activeSetId && exportSet(activeSetId)}
                    className="neumorphic-button text-xs text-green-400 mr-2"
                  >
                    Export Current Set
                  </button>
                </div>
              </div>

              {/* Available Sets List */}
              <div>
                <h3 className="text-white font-medium mb-3">Available Sets:</h3>
                
                {setsForManagement.length === 0 ? (
                  <div className="text-gray-400 text-center py-6">
                    <p>No custom sets available.</p>
                    <p className="text-sm mt-2">Create a set using the "Make Your Own Set!" button or import one below.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {setsForManagement.map(set => (
                      <div key={set.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                        <div>
                          <div className="font-medium text-white">{set.name}</div>
                          <div className="text-xs text-gray-400">
                            {set.phraseCount} cards • Created {new Date(set.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => switchSet(set.id)}
                            className="neumorphic-button text-xs text-blue-400"
                            disabled={activeSetId === set.id}
                          >
                            {activeSetId === set.id ? 'Active' : 'Switch'}
                          </button>
                          <button
                            onClick={() => exportSet(set.id)}
                            className="neumorphic-button text-xs text-green-400"
                          >
                            Export
                          </button>
                          <button
                            onClick={() => deleteSet(set.id)}
                            className="neumorphic-button text-xs text-red-400"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Import Set Section */}
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-white font-medium mb-3">Import Set:</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      // Create file input and trigger click
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.json';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = async (event) => {
                            try {
                              const importedData = JSON.parse(event.target?.result as string);
                              
                              // Basic validation
                              if (!Array.isArray(importedData.phrases)) {
                                throw new Error('Invalid file format: phrases array not found');
                              }

                              // Close modal
                              setIsManagementModalOpen(false);
                              
                              // Prepare metadata for the set
                              const setData = {
                                name: importedData.name || file.name.replace(/\.[^/.]+$/, ""),
                                level: importedData.level || 'beginner',
                                goals: importedData.goals || [],
                                specificTopics: importedData.specificTopics,
                                source: 'import' as const
                              };
                              
                              // Add the set using context
                              const newSetId = await addSet(setData, importedData.phrases);
                              
                              alert(`Successfully imported set "${setData.name}" with ${importedData.phrases.length} phrases.`);
                              
                              // Force page reload to ensure UI updates correctly
                              window.location.reload();
                            } catch (error) {
                              alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                            }
                          };
                          reader.readAsText(file);
                        }
                      };
                      input.click();
                    }}
                    className="neumorphic-button text-blue-400 text-sm"
                  >
                    Import Set
                  </button>
                  <span className="text-xs text-gray-400">
                    Import a Thai flashcard set (.json)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 
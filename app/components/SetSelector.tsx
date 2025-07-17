'use client';

import React from 'react';
import { useSet } from '../context/SetContext';

export const SetSelector = () => {
  const { 
    availableSets, 
    activeSetId, 
    switchSet, 
    isLoading
  } = useSet();

  const handleSetChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    await switchSet(selectedId);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative min-w-[180px]">
          <select
            value={activeSetId || 'default'}
            onChange={handleSetChange}
            disabled={isLoading}
            className="neumorphic-button text-blue-400 font-medium py-1 px-2 text-sm w-full appearance-none cursor-pointer text-center"
          >
            {/* Add Default Set Option manually if needed or handle differently */}
            {/* Example: Add a default option if activeSetId can be null initially */}
            {/* <option value="default" disabled={activeSetId !== null}>Select a Set</option> */}
            
            {availableSets.map(set => (
              <option key={set.id} value={set.id} className="text-center">
                {/* NEW: Prepend emoji if isFullyLearned is true */}
                {set.cleverTitle || set.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}; 
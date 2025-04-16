'use client';

import React from 'react';
import { Switch } from "@/app/components/ui/switch"; // Assuming path for Switch

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
  if (!isOpen) return null;

  const isDefaultSet = activeSetId === 'default';

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
          <h2 className="text-xl font-bold text-blue-400">Options</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto pr-2 flex-grow space-y-6">
        
          {/* App Options Section */}
          <section>
            <h3 className="text-lg font-semibold text-gray-200 mb-3 border-b border-gray-700 pb-1">App Options</h3>
            <div className="space-y-4">
              {/* Dark Mode */}
              <div className="flex items-center justify-between">
                <label htmlFor="darkModeToggleApp" className="text-gray-300">Dark Mode</label>
                <Switch
                  id="darkModeToggleApp"
                  checked={isDarkMode}
                  onCheckedChange={toggleDarkMode}
                  className="neumorphic-switch"
                />
              </div>
              {/* Voice Gender */}
              <div className="flex items-center justify-between">
                 <label htmlFor="genderToggleApp" className="text-gray-300">Voice Gender (Krap/Ka)</label>
                 <div className="flex items-center">
                   <span className="mr-2 text-sm font-medium text-gray-400">Female</span>
                    <Switch
                      id="genderToggleApp"
                      checked={isMale}
                      onCheckedChange={setIsMale}
                      className="neumorphic-switch"
                    />
                   <span className="ml-2 text-sm font-medium text-gray-400">Male</span>
                 </div>
              </div>
              {/* Polite Mode */}
              <div className="flex items-center justify-between">
                 <label htmlFor="politeToggleApp" className="text-gray-300">Polite Mode (Add ครับ/ค่ะ)</label>
                 <div className="flex items-center">
                    <span className="mr-2 text-sm font-medium text-gray-400">Casual</span>
                     <Switch
                       id="politeToggleApp"
                       checked={isPoliteMode}
                       onCheckedChange={setIsPoliteMode}
                       className="neumorphic-switch"
                     />
                    <span className="ml-2 text-sm font-medium text-gray-400">Polite</span>
                 </div>
              </div>
              {/* Autoplay Audio */}
              <div className="flex items-center justify-between">
                <label htmlFor="autoplayToggleApp" className="text-gray-300">Autoplay Audio on Reveal</label>
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
            <h3 className="text-lg font-semibold text-gray-200 mb-3 border-b border-gray-700 pb-1">Current Set Options</h3>
            <div className="bg-gray-800 p-4 rounded-lg text-center mb-4">
              <p className="text-sm text-gray-400 mb-1">Current Set:</p>
              <p className="text-lg text-white font-semibold">
                {currentSetName}
              </p>
            </div>
            <div className="space-y-3">
                <button
                  onClick={() => { onClose(); onOpenSetManager(); }}
                  className="neumorphic-button w-full text-blue-400"
                >
                  Open Full Set Manager...
                </button>
                <button
                  onClick={onExportSet}
                  className="neumorphic-button w-full text-green-400"
                  disabled={isLoading || isDefaultSet} 
                >
                  Export This Set
                </button>
                <button
                  onClick={onResetSetProgress} // Call the passed function
                  className="neumorphic-button w-full text-yellow-400"
                  disabled={isLoading || isDefaultSet}
                >
                  Reset Progress for This Set
                </button>
                  <button
                    onClick={onDeleteSet} // Call the passed function
                    className="neumorphic-button w-full text-red-400"
                    disabled={isLoading || isDefaultSet}
                  >
                    Delete This Set
                  </button>
            </div>
          </section>

        </div> {/* End Scrollable Content */}

        {/* Footer (optional, maybe for a main close button) */}
        <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end flex-shrink-0">
           <button onClick={onClose} className="neumorphic-button text-sm text-gray-400">Close</button>
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
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="neumorphic max-w-lg w-full p-6 bg-[#1f1f1f] max-h-[85vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-xl font-bold text-blue-400">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div className="overflow-y-auto pr-2 flex-grow space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-blue-400 mb-4">App Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="genderToggleApp" className="text-gray-300">Voice/Particle Gender</label>
                <div className="flex items-center">
                  <span className="mr-2 text-sm font-medium text-gray-400">Female (Ka)</span>
                  <Switch id="genderToggleApp" checked={isMale} onCheckedChange={setIsMale} />
                  <span className="ml-2 text-sm font-medium text-gray-400">Male (Krap)</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="politeToggleApp" className="text-gray-300">Politeness Particles</label>
                <div className="flex items-center">
                  <span className="mr-2 text-sm font-medium text-gray-400">Casual</span>
                  <Switch id="politeToggleApp" checked={isPoliteMode} onCheckedChange={setIsPoliteMode} />
                  <span className="ml-2 text-sm font-medium text-gray-400">Polite</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="autoplayToggleApp" className="text-gray-300">Autoplay Voice</label>
                <Switch id="autoplayToggleApp" checked={autoplay} onCheckedChange={setAutoplay} />
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="darkModeToggleApp" className="text-gray-300">Dark Mode</label>
                <Switch id="darkModeToggleApp" checked={isDarkMode} onCheckedChange={toggleDarkMode} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// --- SetManagerModal: Only Set Management ---
export function SetManagerModal({ isOpen, onClose, currentSetName, activeSetId, onOpenSetManager, onExportSet, onResetSetProgress, onDeleteSet, isLoading }: {
  isOpen: boolean;
  onClose: () => void;
  currentSetName: string;
  activeSetId: string | null;
  onOpenSetManager: () => void;
  onExportSet: () => void;
  onResetSetProgress: () => void;
  onDeleteSet: () => void;
  isLoading: boolean;
}) {
  if (!isOpen) return null;
  const isDefaultSet = activeSetId === 'default';
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="neumorphic max-w-lg w-full p-6 bg-[#1f1f1f] max-h-[85vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-xl font-bold text-blue-400">Set Manager</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div className="overflow-y-auto pr-2 flex-grow space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-blue-400 mb-4">Current Set Settings</h3>
            <div className="bg-gray-800 p-4 rounded-lg text-center mb-4">
              <p className="text-sm text-gray-400 mb-1">Current Set:</p>
              <p className="text-lg text-white font-semibold">{currentSetName}</p>
            </div>
            <div className="space-y-3">
              <button onClick={onOpenSetManager} className="neumorphic-button w-full text-blue-400">Open Full Set Manager...</button>
              <button onClick={onExportSet} className="neumorphic-button w-full text-green-400" disabled={isLoading || isDefaultSet}>Export This Set</button>
              <button onClick={onResetSetProgress} className="neumorphic-button w-full text-yellow-400" disabled={isLoading || isDefaultSet}>Reset Progress for This Set</button>
              <button onClick={onDeleteSet} className="neumorphic-button w-full text-red-400" disabled={isLoading || isDefaultSet}>Delete This Set</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
} 
'use client';

import React from 'react';
import { Switch } from "@/app/components/ui/switch"; // Assuming path for Switch
import { useSet } from '@/app/context/SetContext';
import { useState } from 'react';

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
export function SetManagerModal({ isOpen, onClose }: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    availableSets,
    activeSetId,
    activeSetProgress,
    deleteSet,
    exportSet,
    updateSetProgress,
    // addSet, switchSet, etc. if needed
  } = useSet();
  const [selected, setSelected] = useState<string[]>([]);
  const [editSetId, setEditSetId] = useState<string|null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  if (!isOpen) return null;

  // Find the active set
  const activeSet = availableSets.find(set => set.id === activeSetId);
  const learned = Object.keys(activeSetProgress || {}).length;
  const total = activeSet?.phraseCount || 0;
  const percent = total > 0 ? Math.round((learned / total) * 100) : 0;

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
  const handleBulkReset = () => {
    if (selected.length === 0) return;
    alert('Bulk reset progress is not yet implemented.');
    setSelected([]);
  };
  const handleBulkExport = () => {
    selected.forEach(id => exportSet(id));
  };

  // Table rows
  const rows = availableSets.map(set => {
    const isDefault = set.id === 'default';
    const checked = selected.includes(set.id);
    return (
      <tr key={set.id} className="border-b border-gray-700 hover:bg-gray-800">
        <td><input type="checkbox" disabled={isDefault || bulkLoading} checked={checked} onChange={e => {
          if (e.target.checked) setSelected(sel => [...sel, set.id]);
          else setSelected(sel => sel.filter(x => x !== set.id));
        }} /></td>
        <td><img src={set.imageUrl || '/images/default-set-logo.png'} alt="set" className="w-10 h-10 rounded object-cover" /></td>
        <td className="font-semibold text-white">{set.cleverTitle || set.name}</td>
        <td className="text-gray-400">{set.specificTopics || '-'}</td>
        <td className="text-gray-400">-</td>
        <td className="text-gray-400">{set.phraseCount || '-'}</td>
        <td className="text-gray-400">{set.createdAt ? new Date(set.createdAt).toLocaleDateString() : '-'}</td>
        <td className="flex gap-1">
          <button className="neumorphic-button text-xs px-2 py-1" onClick={() => setEditSetId(set.id)}>Edit</button>
          <button className="neumorphic-button text-xs px-2 py-1 opacity-50 cursor-not-allowed" title="Coming soon!" disabled>Share</button>
          <button className="neumorphic-button text-xs px-2 py-1 text-yellow-400" onClick={() => alert('Reset progress for this set is not yet implemented.')}>Reset</button>
          <button className="neumorphic-button text-xs px-2 py-1 text-red-400" disabled={isDefault || bulkLoading} onClick={() => { if (!isDefault && confirm('Delete this set?')) deleteSet(set.id); }}>Delete</button>
          <button className="neumorphic-button text-xs px-2 py-1 text-green-400" onClick={() => exportSet(set.id)}>Export</button>
        </td>
      </tr>
    );
  });

  // Summary
  const totalSets = availableSets.length;
  const totalCards = availableSets.reduce((sum, set) => sum + (set.phraseCount || 0), 0);
  const totalLearned = 0; // Placeholder, not available
  const dueToday = 0; // Placeholder, not available

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="neumorphic max-w-5xl w-full p-6 bg-[#1f1f1f] max-h-[90vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-xl font-bold text-blue-400">Set Manager</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        {/* Current Set Progress Section */}
        <div className="mb-6 bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">Current Set Progress</h3>
          <div className="flex flex-col gap-2">
            <span className="text-white font-bold">{activeSet?.cleverTitle || activeSet?.name || 'No Set Selected'}</span>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-300 mt-1">
              <span>{learned} learned</span>
              <span>{total} total</span>
              <span>{percent}%</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <button className="neumorphic-button text-sm px-4 py-2 text-green-400" disabled={bulkLoading}>Create New Set</button>
          <button className="neumorphic-button text-sm px-4 py-2" disabled={selected.length === 0 || bulkLoading} onClick={handleBulkDelete}>Bulk Delete</button>
          <button className="neumorphic-button text-sm px-4 py-2" disabled={selected.length === 0 || bulkLoading} onClick={handleBulkReset}>Bulk Reset Progress</button>
          <button className="neumorphic-button text-sm px-4 py-2" disabled={selected.length === 0 || bulkLoading} onClick={handleBulkExport}>Bulk Export</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-900 text-gray-300">
              <tr>
                <th></th>
                <th>Image</th>
                <th>Name</th>
                <th>Topics</th>
                <th>Ridiculousness</th>
                <th>#Cards</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </table>
        </div>
        <div className="flex gap-4 mt-6 text-xs text-gray-400 justify-end">
          <span>Total Sets: {totalSets}</span>
          <span>Total Cards: {totalCards}</span>
          <span>Learned: {totalLearned}</span>
          <span>Due Today: {dueToday}</span>
        </div>
      </div>
    </div>
  );
} 
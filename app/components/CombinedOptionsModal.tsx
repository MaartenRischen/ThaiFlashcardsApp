'use client';

import React from 'react';
import { Switch } from "@/app/components/ui/switch"; // Assuming path for Switch
import { useSet } from '@/app/context/SetContext';
import { useState } from 'react';
import { INITIAL_PHRASES } from '@/app/data/phrases';
import * as storage from '@/app/lib/storage';
import Image from 'next/image';

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
  const [showShare, setShowShare] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const isDefaultSet = activeSetId === 'default';

  const handleShare = async () => {
    setShareLoading(true);
    setShareError(null);
    setShareUrl(null);
    try {
      const res = await fetch(`/api/flashcard-sets/${activeSetId}/share`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to get share link');
      const data = await res.json();
      if (!data.shareId) throw new Error('No shareId returned');
      const url = `${window.location.origin}/share/${data.shareId}`;
      setShareUrl(url);
      setShowShare(true);
    } catch (err: any) {
      setShareError(err.message || 'Unknown error');
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  if (!isOpen) return null;

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
                <button
                  onClick={handleShare}
                  className="neumorphic-button w-full text-purple-400"
                  disabled={isLoading || isDefaultSet || shareLoading}
                >
                  {shareLoading ? 'Generating Link...' : 'Share This Set'}
                </button>
                {shareError && <div className="text-red-400 text-xs mt-2">{shareError}</div>}
            </div>
          </section>

        </div> {/* End Scrollable Content */}

        {/* Share Dialog */}
        {showShare && shareUrl && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-60" onClick={() => setShowShare(false)}>
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg max-w-md w-full" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-2 text-purple-300">Share This Set</h3>
              <p className="text-gray-300 mb-2">Anyone with this link can view and import your set:</p>
              <div className="flex items-center bg-gray-800 rounded px-2 py-1 mb-3">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-transparent text-white outline-none text-sm"
                  onFocus={e => e.target.select()}
                />
                <button onClick={handleCopy} className="ml-2 px-2 py-1 text-xs bg-purple-700 text-white rounded hover:bg-purple-600">Copy</button>
              </div>
              <button onClick={() => setShowShare(false)} className="mt-2 neumorphic-button text-sm text-gray-400">Close</button>
            </div>
          </div>
        )}

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
  const handleFactoryResetPreferences = () => {
    if (window.confirm('Are you sure you want to reset all preferences? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };
  const handleFactoryResetFull = () => {
    if (window.confirm('Are you sure you want to reset the entire app, including all sets and progress? This cannot be undone.')) {
      indexedDB.deleteDatabase('localforage'); // If using localforage or similar
      localStorage.clear();
      window.location.reload();
    }
  };
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
            <div className="grid grid-cols-[1fr_auto] gap-y-4 gap-x-6 items-center">
              <label htmlFor="genderToggleApp" className="text-gray-300">Voice/Particle Gender</label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-400">Female (Ka)</span>
                <Switch id="genderToggleApp" checked={isMale} onCheckedChange={setIsMale} />
                <span className="text-sm font-medium text-gray-400">Male (Krap)</span>
              </div>
              <label htmlFor="politeToggleApp" className="text-gray-300">Politeness Particles</label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-400">Casual</span>
                <Switch id="politeToggleApp" checked={isPoliteMode} onCheckedChange={setIsPoliteMode} />
                <span className="text-sm font-medium text-gray-400">Polite</span>
              </div>
              <label htmlFor="autoplayToggleApp" className="text-gray-300">Autoplay Voice</label>
              <Switch id="autoplayToggleApp" checked={autoplay} onCheckedChange={setAutoplay} />
              <label htmlFor="darkModeToggleApp" className="text-gray-300">Dark Mode</label>
              <Switch id="darkModeToggleApp" checked={isDarkMode} onCheckedChange={toggleDarkMode} />
            </div>
          </section>
          <div className="mt-10 flex flex-col gap-2">
            <button onClick={handleFactoryResetPreferences} className="w-full border border-yellow-400 text-yellow-400 rounded py-2 text-sm font-semibold hover:bg-yellow-400 hover:text-black transition flex items-center justify-center gap-2 bg-transparent">
              <span aria-hidden="true">⚠️</span> Factory Reset (Preferences)
            </button>
            <button onClick={handleFactoryResetFull} className="w-full border border-red-400 text-red-400 rounded py-2 text-sm font-semibold hover:bg-red-400 hover:text-black transition flex items-center justify-center gap-2 bg-transparent">
              <span aria-hidden="true">⚠️</span> Factory Reset (Full App + Sets)
            </button>
          </div>
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
    switchSet,
    deleteSet,
    exportSet,
    updateSetProgress,
    // addSet, etc.
  } = useSet();
  const [selected, setSelected] = useState<string[]>([]);
  const [editSetId, setEditSetId] = useState<string|null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [cardsModalSetId, setCardsModalSetId] = useState<string | null>(null);
  const [cardsModalPhrases, setCardsModalPhrases] = useState<any[]>([]);
  const [cardsModalProgress, setCardsModalProgress] = useState<any>({});
  const [cardsModalLoading, setCardsModalLoading] = useState(false);
  const [publishingSetId, setPublishingSetId] = useState<string | null>(null);

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

  // Helper to open the cards modal for a set
  const handleOpenCardsModal = async (set: any) => {
    setCardsModalSetId(set.id);
    setCardsModalLoading(true);
    let phrases = [];
    let progress = {};
    if (set.id === 'default') {
      phrases = INITIAL_PHRASES;
      progress = activeSetId === 'default' ? activeSetProgress : {};
    } else {
      phrases = await storage.getSetContent(set.id);
      // Try to get progress for this set (if user is logged in)
      try {
        const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
        if (userId) {
          progress = await storage.getSetProgress(userId, set.id);
        }
      } catch {}
    }
    setCardsModalPhrases(phrases);
    setCardsModalProgress(progress || {});
    setCardsModalLoading(false);
  };

  // Helper to get status for a card
  const getCardStatus = (progress: any, idx: number) => {
    const p = progress[idx];
    if (!p || !p.difficulty) return 'Unseen';
    if (p.difficulty === 'hard') return 'Wrong';
    if (p.difficulty === 'good') return 'Correct';
    if (p.difficulty === 'easy') return 'Easy';
    return 'Unseen';
  };

  // Helper to handle clicking a phrase in the modal
  const handlePhraseClick = async (setId: string, idx: number) => {
    if (setId !== activeSetId) {
      await switchSet(setId);
    }
    // Set the active card index in localStorage so main UI can pick it up
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeCardIndex', String(idx));
    }
    onClose();
  };

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
          <h3 className="text-lg font-semibold text-blue-300 mb-2 text-center">Current Set Progress</h3>
          <div className="flex flex-col gap-2">
            <span className="text-white font-bold text-center">{activeSet?.cleverTitle || activeSet?.name || 'No Set Selected'}</span>
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
        {/* Set Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {availableSets.map(set => {
            const isDefault = set.id === 'default';
            const checked = selected.includes(set.id);
            const setProgress = set.id === activeSetId ? activeSetProgress : {};
            const learned = Object.keys(setProgress || {}).length;
            const total = set.phraseCount || 0;
            const percent = total > 0 ? Math.round((learned / total) * 100) : 0;
            // Set image logic
            let imgUrl: string | undefined | null = set.imageUrl;
            if (!imgUrl) {
              imgUrl = set.id === 'default'
                ? '/images/defaultnew.png'
                : '/images/default-set-logo.png';
            }
            return (
              <div
                key={set.id}
                className="relative bg-gray-900 rounded-xl p-4 flex flex-col shadow-lg border border-gray-800 cursor-pointer hover:ring-2 hover:ring-blue-400 transition"
                onClick={async () => {
                  if (set.id !== activeSetId) {
                    await switchSet(set.id);
                  }
                  onClose();
                }}
              >
                {/* Checkbox for bulk actions */}
                <input
                  type="checkbox"
                  className="absolute top-3 right-3 w-5 h-5 accent-blue-500 z-10"
                  disabled={isDefault || bulkLoading}
                  checked={checked}
                  onClick={e => e.stopPropagation()}
                  onChange={e => {
                    if (e.target.checked) setSelected(sel => [...sel, set.id]);
                    else setSelected(sel => sel.filter(x => x !== set.id));
                  }}
                />
                {/* Set Image */}
                <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden mb-3 bg-gray-800">
                  <Image
                    src={imgUrl}
                    alt={set.cleverTitle || set.name}
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    onError={ev => {
                      const target = ev.currentTarget as HTMLImageElement;
                      if (target.src !== '/images/default-set-logo.png') {
                        target.src = '/images/default-set-logo.png';
                      }
                    }}
                  />
                </div>
                {/* Set Name */}
                <div className="font-bold text-lg text-white mb-1 text-center line-clamp-3 break-words whitespace-pre-line">{set.cleverTitle || set.name}</div>
                {/* Topics */}
                <div className="text-sm text-gray-300 mb-1 truncate">{set.specificTopics || '-'}</div>
                {/* Ridiculousness */}
                <div className="text-xs text-gray-400 mb-2">Ridiculousness: {typeof set.seriousnessLevel === 'number' ? `${100 - set.seriousnessLevel}%` : '-'}</div>
                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>{learned} learned</span>
                  <span>{total} total</span>
                  <span>{percent}%</span>
                </div>
                {/* Meta info */}
                <div className="flex justify-between text-xs text-gray-500 mt-auto pt-2 border-t border-gray-800">
                  <span>#Cards: {set.phraseCount || '-'}</span>
                  <span>{set.createdAt ? new Date(set.createdAt).toLocaleDateString() : '-'}</span>
                </div>
                {/* NEW: AI model/brand modest note */}
                {(set.llmBrand || set.llmModel) && (
                  <div className="text-xs text-gray-500 italic mt-1 text-center">
                    Generated using {set.llmBrand ? set.llmBrand.charAt(0).toUpperCase() + set.llmBrand.slice(1) : ''}{set.llmBrand && set.llmModel ? ' ' : ''}{set.llmModel ? set.llmModel : ''} AI
                  </div>
                )}
                {/* Card Actions: Publish and Cards icon buttons side by side */}
                <div className="flex gap-2 justify-end mt-2">
                  {/* Publish icon button */}
                  {!isDefault && (
                    <button
                      className={`p-2 rounded-full bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition flex items-center justify-center${publishingSetId === set.id ? ' opacity-50 cursor-not-allowed' : ''}`}
                      title="Publish to Gallery"
                      disabled={publishingSetId === set.id}
                      onClick={async e => {
                        e.stopPropagation();
                        setPublishingSetId(set.id);
                        try {
                          const phrases = await storage.getSetContent(set.id);
                          const res = await fetch('/api/gallery', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              id: set.id,
                              title: set.cleverTitle || set.name,
                              description: set.specificTopics || '',
                              phrases: phrases || [],
                              author: 'Anonymous',
                              imageUrl: set.imageUrl || '',
                              cardCount: set.phraseCount || 0,
                              llmBrand: set.llmBrand || '',
                              llmModel: set.llmModel || '',
                              seriousnessLevel: set.seriousnessLevel,
                              specificTopics: set.specificTopics,
                            }),
                          });
                          if (!res.ok) throw new Error(await res.text());
                          alert('Set published to gallery!');
                        } catch (err: any) {
                          alert('Failed to publish: ' + (err.message || err));
                        } finally {
                          setPublishingSetId(null);
                        }
                      }}
                    >
                      {/* Paper plane SVG icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21l16.5-9-16.5-9v7.5l13.5 1.5-13.5 1.5V21z" />
                      </svg>
                    </button>
                  )}
                  {/* Cards icon button */}
                  <button
                    className="p-2 rounded-full bg-gray-700 hover:bg-gray-800 text-white text-xs font-semibold transition flex items-center justify-center"
                    title="View Cards"
                    onClick={e => { e.stopPropagation(); handleOpenCardsModal(set); }}
                  >
                    {/* Layers/stack SVG icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                      <path d="M3 7l9 5 9-5-9-5-9 5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                      <path d="M3 12l9 5 9-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                      <path d="M3 17l9 5 9-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-6 text-xs text-gray-400 justify-end">
          <span>Total Sets: {totalSets}</span>
          <span>Total Cards: {totalCards}</span>
          <span>Learned: {totalLearned}</span>
          <span>Due Today: {dueToday}</span>
        </div>
        {/* Cards Modal */}
        {cardsModalSetId && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={() => setCardsModalSetId(null)}>
            <div className="bg-gray-900 rounded-xl p-4 max-w-md w-full max-h-[80vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
              <button className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl" onClick={() => setCardsModalSetId(null)}>&times;</button>
              <h3 className="text-lg font-bold text-blue-300 mb-3">Cards in Set</h3>
              {cardsModalLoading ? (
                <div className="text-center text-gray-400">Loading...</div>
              ) : (
                <ul className="divide-y divide-gray-700">
                  {cardsModalPhrases.map((phrase, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-800 rounded px-2"
                      onClick={() => handlePhraseClick(cardsModalSetId, idx)}
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-white truncate">{phrase.english}</div>
                        <div className="text-sm text-gray-400 truncate">{phrase.thai}</div>
                      </div>
                      <span className="ml-3 text-xs px-2 py-1 rounded-full font-bold"
                        style={{
                          backgroundColor: getCardStatus(cardsModalProgress, idx) === 'Easy' ? '#22c55e' : getCardStatus(cardsModalProgress, idx) === 'Correct' ? '#3b82f6' : getCardStatus(cardsModalProgress, idx) === 'Wrong' ? '#ef4444' : '#6b7280',
                          color: 'white',
                        }}
                      >
                        {getCardStatus(cardsModalProgress, idx)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
import React from 'react';
import { SetSelector } from '@/app/components/SetSelector'; // Assuming path
import { useSet } from '@/app/context/SetContext'; // Import useSet hook
import { Layers, Grid, Plus, Settings, HelpCircle, Share2 } from 'lucide-react';
import { useState } from 'react';

// Update props for combined settings modal
interface FlashcardHeaderProps {
  setShowHowItWorks: (show: boolean) => void;
  onOpenSettings: () => void;
  setShowProgress: (show: boolean) => void;
  onOpenSetManager: () => void;
  onOpenCards: () => void;
  showAnswer: boolean;
}

export function FlashcardHeader({
  setShowHowItWorks,
  onOpenSettings,
  setShowProgress,
  onOpenSetManager,
  onOpenCards,
  showAnswer,
}: FlashcardHeaderProps) {
  // Access the active set metadata to get the image URL
  const { availableSets, activeSetId } = useSet();
  
  // Find the active set metadata (removed type assertion)
  const activeSet = availableSets.find(set => set.id === activeSetId);
  
  // Get the image URL (use new monthly Thailand image for default set, fallback to old logo)
  let setImageUrl = activeSet?.imageUrl;
  if (!setImageUrl && activeSet?.id === 'default') {
    setImageUrl = '/images/defaultnew.png';
  }
  setImageUrl = setImageUrl || '/images/defaultnew.png';
  
  const isDefaultSet = activeSet?.id === 'default';
  const [showShare, setShowShare] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

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

  return (
    <div className="bg-[#111] border-b border-[#333] flex flex-col">
      {/* Full-width Ideogram set image (16:9 aspect ratio) */}
      <div className="w-full flex items-center justify-center py-3 relative mt-6">
        <div className="w-full max-w-2xl aspect-[16/9] rounded-lg overflow-hidden relative">
          {/* Overlay */}
          <div
            className="absolute top-0 left-0 right-0 z-20 flex flex-col items-center pointer-events-none"
            style={{ paddingTop: '8px' }}
          >
            <div
              className="bg-black bg-opacity-30 rounded-none px-0 py-1 text-white text-lg font-semibold shadow-none border-b border-white border-opacity-10 w-full max-w-2xl mx-auto text-center"
              style={{
                textShadow: '0 1px 4px rgba(0,0,0,0.3)',
                letterSpacing: '0.04em',
                backdropFilter: 'blur(1px)',
                maxWidth: '100%',
                textAlign: 'center',
                fontWeight: 600,
                lineHeight: 1.1,
                paddingBottom: 0,
              }}
            >
              Donkey Bridge
            </div>
          </div>
          <img
            src={setImageUrl}
            alt={`${activeSet?.name || 'Set'} image`}
            className="w-full h-full object-contain"
            key={activeSetId}
            style={{ objectFit: 'contain', objectPosition: 'center' }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/images/defaultnew.png';
            }}
          />
        </div>
      </div>
      {/* Content column - with all the buttons and dropdown */}
      <div className="flex flex-col w-full">
        {/* Line 1: Cards button and Set Selector in a row */}
        <div className="px-2 py-2 w-full">
          <div className="flex flex-row gap-x-2 items-center w-full">
            <div className="flex-1 min-w-[180px]">
              <SetSelector />
            </div>
          </div>
        </div>
        {/* Line 2: All action buttons in a single row, always full width */}
        <div className="px-2 py-2 w-full">
          <div className="flex flex-row items-center w-full justify-between gap-x-2">
            {/* Cards */}
            <div className="flex flex-col items-center">
              <button
                onClick={onOpenCards}
                className="neumorphic-icon-button text-xl text-white"
                title="Cards"
                aria-label="Cards"
              >
                <Layers />
              </button>
              <span className="block text-xs text-gray-200 mt-1 text-center">Cards</span>
            </div>
            {/* Set Manager */}
            <div className="flex flex-col items-center">
              <button
                onClick={onOpenSetManager}
                className="neumorphic-icon-button text-xl text-white"
                title="Sets"
                aria-label="Sets"
              >
                <Grid />
              </button>
              <span className="block text-xs text-gray-200 mt-1 text-center">Sets</span>
            </div>
            {/* Share Set */}
            <div className="flex flex-col items-center">
              <button
                onClick={handleShare}
                className="neumorphic-icon-button text-xl text-purple-400"
                title="Share"
                aria-label="Share"
                disabled={isDefaultSet || shareLoading}
              >
                <Share2 />
              </button>
              <span className="block text-xs text-gray-200 mt-1 text-center">Share</span>
            </div>
            {/* Create Set! */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => window.open('/set-wizard', '_blank')}
                className="neumorphic-icon-button text-xl text-green-300 shadow-[0_0_10px_#10B981]"
                title="Create"
                aria-label="Create"
              >
                <Plus size={28} />
              </button>
              <span className="block text-xs text-green-300 mt-1 text-center">Create</span>
            </div>
            {/* Settings */}
            <div className="flex flex-col items-center">
              <button
                onClick={onOpenSettings}
                className="neumorphic-icon-button text-xl text-white"
                title="Settings"
                aria-label="Settings"
              >
                <Settings />
              </button>
              <span className="block text-xs text-gray-200 mt-1 text-center">Settings</span>
            </div>
            {/* Help */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => setShowHowItWorks(true)}
                className="neumorphic-icon-button text-xl text-white"
                title="Help"
                aria-label="Help"
              >
                <HelpCircle />
              </button>
              <span className="block text-xs text-gray-200 mt-1 text-center">Help</span>
            </div>
          </div>
        </div>
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
      </div>
    </div>
  );
} 
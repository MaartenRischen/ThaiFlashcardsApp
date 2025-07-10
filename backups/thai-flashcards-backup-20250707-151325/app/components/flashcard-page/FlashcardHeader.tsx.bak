import React from 'react';
import { SetSelector } from '@/app/components/SetSelector'; // Assuming path
import { useSet } from '@/app/context/SetContext'; // Import useSet hook

// Update props for combined settings modal
interface FlashcardHeaderProps {
  setShowHowItWorks: (show: boolean) => void;
  onOpenSettings: () => void;
  setShowProgress: (show: boolean) => void;
}

export function FlashcardHeader({
  setShowHowItWorks,
  onOpenSettings,
  setShowProgress,
}: FlashcardHeaderProps) {
  // Access the active set metadata to get the image URL
  const { availableSets, activeSetId } = useSet();
  
  // Find the active set metadata (removed type assertion)
  const activeSet = availableSets.find(set => set.id === activeSetId);
  
  // Get the image URL (use new monthly Thailand image for default set, fallback to old logo)
  let setImageUrl = activeSet?.imageUrl;
  if (!setImageUrl && activeSet?.id === 'default') {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    setImageUrl = `/images/defaults/default-thailand-${month}.png`;
  }
  setImageUrl = setImageUrl || '/images/default-set-logo.png';
  
  return (
    <div className="bg-[#111] border-b border-[#333] flex flex-col">
      {/* Fixed Donkey Bridge overlay at the top, just under the navbar */}
      <div
        className="fixed left-1/2 transform -translate-x-1/2 z-50 w-full flex justify-center"
        style={{ top: 56, pointerEvents: 'none' }} // Adjust 'top' if your navbar is taller/shorter
      >
        <div
          className="bg-black bg-opacity-50 rounded px-8 py-3 text-white text-4xl font-extrabold shadow-lg border-2 border-white mt-2"
          style={{
            textShadow: '0 2px 8px rgba(0,0,0,0.7)',
            letterSpacing: '0.08em',
            backdropFilter: 'blur(2px)',
            maxWidth: '90%',
            textAlign: 'center',
          }}
        >
          Donkey Bridge
        </div>
      </div>
      {/* Full-width Ideogram set image (16:9 aspect ratio) */}
      <div className="w-full flex items-center justify-center py-3 relative">
        <div className="w-full max-w-2xl aspect-[16/9] rounded-lg overflow-hidden relative">
          <img
            src={setImageUrl}
            alt={`${activeSet?.name || 'Set'} image`}
            className="w-full h-full object-contain"
            key={activeSetId}
            style={{ objectFit: 'contain', objectPosition: 'center' }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/images/default-set-logo.png';
            }}
          />
        </div>
      </div>
      {/* Content column - with all the buttons and dropdown */}
      <div className="flex flex-col">
        {/* Top Row: Set Selector (MOVED) */}
        <div className="px-4 py-2 flex justify-end">
          <div className="w-64">
            <SetSelector />
          </div>
        </div>
        {/* Middle Row: Progress & Make Your Own Set buttons (MOVED) */}
        <div className="px-4 py-2 flex justify-end items-center gap-x-3">
          <button
            onClick={() => setShowProgress(true)}
            className="neumorphic-button text-sm px-3 py-1.5 whitespace-nowrap"
            aria-label="View Set Progress"
          >
            Progress
          </button>
          <button
            onClick={() => window.open('/set-wizard', '_blank')}
            className="neumorphic-button text-sm font-semibold text-green-300 border-green-500 hover:bg-green-800 hover:text-white px-3 py-1.5 shadow-[0_0_10px_#10B981] inline-flex items-center justify-center whitespace-nowrap"
          >
            Make Your Own Set!
          </button>
        </div>
        {/* Bottom Row: Action Buttons */}
        <div className="px-4 py-2 flex justify-end items-center gap-x-3 flex-wrap gap-y-2">
          <button
            onClick={() => setShowHowItWorks(true)}
            className="neumorphic-icon-button text-xl font-bold text-blue-400 p-2 leading-none inline-flex items-center justify-center w-8 h-8"
            title="How It Works"
            aria-label="How It Works"
          >
            ?
          </button>
          <button
            onClick={onOpenSettings}
            className="neumorphic-button text-sm px-3 py-1.5 whitespace-nowrap"
            aria-label="Settings"
          >
            Settings
          </button>
        </div>
      </div>
    </div>
  );
} 
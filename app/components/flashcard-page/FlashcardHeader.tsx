import React from 'react';
import { SetSelector } from '@/app/components/SetSelector'; // Assuming path
import { useSet } from '@/app/context/SetContext'; // Import useSet hook
import { SetMetaData } from '@/app/lib/storage'; // Import the SetMetaData type

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
  
  // Find the active set metadata
  const activeSet = availableSets.find(set => set.id === activeSetId);
  
  // Get the image URL (use default logo as fallback)
  const setImageUrl = activeSet?.imageUrl || '/images/default-set-logo.png';
  
  return (
    <div className="bg-[#111] border-b border-[#333] grid grid-cols-[180px_1fr]">
      {/* Logo column - increased width to accommodate both logos */}
      <div className="flex items-center justify-start py-3 pl-2 gap-2">
        <a href="/" title="Go to Home" className="flex-shrink-0">
          <img
            src="/images/donkey-bridge-logo.png"
            alt="Donkey Bridge Logo"
            className="h-20 w-auto"
          />
        </a>
        
        {/* Set image */}
        <div className="h-16 w-16 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={setImageUrl}
            alt={`${activeSet?.name || 'Set'} image`}
            className="h-full w-full object-cover"
            key={activeSetId} // Force re-render when set changes
            onError={(e) => {
              // Fallback to default logo if image fails to load
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
          {/* Progress Button */}
          <button
            onClick={() => setShowProgress(true)}
            className="neumorphic-button text-sm px-3 py-1.5 whitespace-nowrap"
            aria-label="View Set Progress"
          >
            Progress
          </button>
          
          {/* Make Your Own Set button */}
          <button
            onClick={() => window.open('/set-wizard', '_blank')}
            className="neumorphic-button text-sm font-semibold text-green-300 border-green-500 hover:bg-green-800 hover:text-white px-3 py-1.5 shadow-[0_0_10px_#10B981] inline-flex items-center justify-center whitespace-nowrap"
          >
            Make Your Own Set!
          </button>
        </div>

        {/* Bottom Row: Action Buttons */}
        <div className="px-4 py-2 flex justify-end items-center gap-x-3 flex-wrap gap-y-2">
          {/* How It Works Button (?) */}
          <button
            onClick={() => setShowHowItWorks(true)}
            className="neumorphic-icon-button text-xl font-bold text-blue-400 p-2 leading-none inline-flex items-center justify-center w-8 h-8"
            title="How It Works"
            aria-label="How It Works"
          >
            ?
          </button>

          {/* Combined Settings Button (replaces Set Options & App Options) */}
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
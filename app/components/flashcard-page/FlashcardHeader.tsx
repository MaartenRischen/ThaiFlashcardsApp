import React from 'react';
import { SetSelector } from '@/app/components/SetSelector'; // Assuming path
import { useSet } from '@/app/context/SetContext'; // Import useSet hook

// Update props for combined settings modal
interface FlashcardHeaderProps {
  setShowHowItWorks: (show: boolean) => void;
  onOpenSettings: () => void;
  setShowProgress: (show: boolean) => void;
  onOpenSetManager: () => void;
  onOpenCards: () => void;
}

export function FlashcardHeader({
  setShowHowItWorks,
  onOpenSettings,
  setShowProgress,
  onOpenSetManager,
  onOpenCards,
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
      {/* Full-width Ideogram set image (16:9 aspect ratio) */}
      <div className="w-full flex items-center justify-center py-3 relative">
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
              <span style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 400,
                color: '#b3e5fc',
                letterSpacing: '0.01em',
                marginTop: '1px',
                opacity: 0.85,
                lineHeight: 1.1,
              }}>
                Super Personalized Thai Language Learning App
              </span>
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
              target.src = '/images/default-set-logo.png';
            }}
          />
        </div>
      </div>
      {/* Content column - with all the buttons and dropdown */}
      <div className="flex flex-col w-full">
        {/* Line 1: Cards button and Set Selector in a row */}
        <div className="px-2 py-2 w-full">
          <div className="flex flex-row gap-x-2 items-center w-full">
            <button
              onClick={onOpenCards}
              className="neumorphic-button text-sm px-3 py-1.5 whitespace-nowrap font-semibold text-blue-300 border-blue-500 hover:bg-blue-800 hover:text-white flex-none"
              aria-label="Cards"
            >
              Cards
            </button>
            <div className="flex-1 min-w-[180px]">
              <SetSelector />
            </div>
          </div>
        </div>
        {/* Line 2: All action buttons in a single row, always full width */}
        <div className="px-2 py-2 w-full">
          <div className="flex flex-row items-center w-full justify-between gap-x-2">
            <button
              onClick={onOpenSetManager}
              className="neumorphic-button text-sm px-3 py-1.5 whitespace-nowrap font-semibold text-yellow-300 border-yellow-500 hover:bg-yellow-800 hover:text-white"
              aria-label="Set Manager"
            >
              Set Manager
            </button>
            <button
              onClick={() => window.open('/set-wizard', '_blank')}
              className="neumorphic-button text-sm font-semibold text-green-300 border-green-500 hover:bg-green-800 hover:text-white px-3 py-1.5 shadow-[0_0_10px_#10B981] inline-flex items-center justify-center whitespace-nowrap"
            >
              Create Set!
            </button>
            <button
              onClick={onOpenSettings}
              className="neumorphic-icon-button text-xl font-bold text-gray-400 p-2 leading-none inline-flex items-center justify-center w-8 h-8"
              title="Settings"
              aria-label="Settings"
            >
              {/* Cog wheel SVG icon */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={() => setShowHowItWorks(true)}
              className="neumorphic-icon-button text-xl font-bold text-blue-400 p-2 leading-none inline-flex items-center justify-center w-8 h-8"
              title="How It Works"
              aria-label="How It Works"
            >
              ?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
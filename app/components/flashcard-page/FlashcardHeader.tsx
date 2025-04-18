import React from 'react';
import { SetSelector } from '@/app/components/SetSelector'; // Assuming path
import { useSet } from '@/app/context/SetContext'; // Import useSet hook
import { Layers, Grid, Wand2, Plus, Settings, HelpCircle } from 'lucide-react';

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
              className="bg-black bg-opacity-40 rounded px-2 py-1 text-white text-lg font-semibold shadow-none border-b border-white border-opacity-10 w-full max-w-2xl mx-auto text-center"
              style={{
                textShadow: '0 2px 8px rgba(0,0,0,0.7)',
                letterSpacing: '0.04em',
                backdropFilter: 'blur(2px)',
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
                fontSize: '0.9rem',
                fontWeight: 500,
                color: '#fff',
                letterSpacing: '0.01em',
                marginTop: '2px',
                opacity: 0.96,
                lineHeight: 1.1,
                textShadow: '0 2px 8px rgba(0,0,0,0.85)',
                background: 'rgba(0,0,0,0.25)',
                borderRadius: '0.25rem',
                padding: '2px 8px',
                backdropFilter: 'blur(2px)',
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
            <div className="flex-1 min-w-[180px]">
              <SetSelector />
            </div>
          </div>
        </div>
        {/* Line 2: All action buttons in a single row, always full width */}
        <div className="px-2 py-2 w-full">
          <div className="flex flex-row items-center w-full justify-between gap-x-2">
            {/* Cards */}
            <button
              onClick={onOpenCards}
              className="neumorphic-icon-button text-xl text-white"
              title="Cards"
              aria-label="Cards"
            >
              <Layers />
            </button>
            {/* Set Manager */}
            <button
              onClick={onOpenSetManager}
              className="neumorphic-icon-button text-xl text-white"
              title="Set Manager"
              aria-label="Set Manager"
            >
              <Grid />
            </button>
            {/* Create Set! */}
            <button
              onClick={() => window.open('/set-wizard', '_blank')}
              className="neumorphic-icon-button text-xl text-green-300 shadow-[0_0_10px_#10B981] relative"
              title="Create Set!"
              aria-label="Create Set!"
              style={{ position: 'relative' }}
            >
              <Wand2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" size={22} />
              <Plus className="absolute left-1/2 top-1/2 -translate-x-[70%] -translate-y-[70%] text-green-200" size={13} />
            </button>
            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="neumorphic-icon-button text-xl text-white"
              title="Settings"
              aria-label="Settings"
            >
              <Settings />
            </button>
            {/* Help */}
            <button
              onClick={() => setShowHowItWorks(true)}
              className="neumorphic-icon-button text-xl text-white"
              title="How It Works"
              aria-label="How It Works"
            >
              <HelpCircle />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
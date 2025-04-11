import React from 'react';
import { SetSelector } from '@/app/components/SetSelector'; // Assuming path

// Define props required by the header (REMOVED props only needed for SetSelector)
interface FlashcardHeaderProps {
  setShowHowItWorks: (show: boolean) => void;
  setIsSetOptionsMenuOpen: (open: boolean) => void;
  setIsAppOptionsMenuOpen: (open: boolean) => void;
}

export function FlashcardHeader({
  setShowHowItWorks,
  setIsSetOptionsMenuOpen,
  setIsAppOptionsMenuOpen,
}: FlashcardHeaderProps) {
  return (
    <div className="bg-[#111] border-b border-[#333] relative">
      {/* Start with a container for the logo that spans the full height */}
      <div className="absolute left-4 top-0 bottom-0 flex items-center z-10">
        <a href="/" title="Go to Home" className="flex-shrink-0">
          <img
            src="/images/donkey-bridge-logo.png"
            alt="Donkey Bridge Logo"
            className="h-16 w-auto"
          />
        </a>
      </div>

      {/* Top Row: Just the Make Your Own Set button, positioned to the right */}
      <div className="px-4 py-2 flex justify-end">
        <button
          onClick={() => window.open('/set-wizard', '_blank')}
          className="neumorphic-button text-sm font-semibold text-green-300 border-green-500 hover:bg-green-800 hover:text-white px-3 py-1.5 shadow-[0_0_10px_#10B981] inline-flex items-center justify-center whitespace-nowrap"
        >
          Make Your Own Set!
        </button>
      </div>

      {/* Bottom Row: Set Selector and Action Buttons */}
      <div className="px-4 py-2 flex justify-end flex-wrap items-center gap-x-3 gap-y-2 pl-24">
        {/* Set Selector - with fixed/reasonable width */}
        <div className="w-64">
          <SetSelector />
        </div>

        {/* Action Buttons Group */}
        <div className="flex items-center gap-x-2">
          {/* How It Works Button (?) */}
          <button
            onClick={() => setShowHowItWorks(true)}
            className="neumorphic-icon-button text-xl font-bold text-blue-400 p-2 leading-none inline-flex items-center justify-center w-8 h-8"
            title="How It Works"
            aria-label="How It Works"
          >
            ?
          </button>

          {/* Set Options Button */}
          <button
            onClick={() => setIsSetOptionsMenuOpen(true)}
            className="neumorphic-button text-sm px-3 py-1.5 whitespace-nowrap"
            aria-label="Set Options"
          >
            Set Options
          </button>

          {/* App Options Button */}
          <button
            onClick={() => setIsAppOptionsMenuOpen(true)}
            className="neumorphic-button text-sm px-3 py-1.5 whitespace-nowrap"
            aria-label="App Options"
          >
            App Options
          </button>
        </div>
      </div>
    </div>
  );
} 
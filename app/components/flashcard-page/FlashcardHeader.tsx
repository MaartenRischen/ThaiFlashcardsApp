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
    // Outer container with dark background
    <div className="bg-[#111] border-b border-[#333]">
      {/* Top Row: Logo and Make Your Own Set button */}
      <div className="px-4 py-2 flex items-center justify-between">
        {/* Logo */}
        <a href="/" title="Go to Home" className="flex-shrink-0 flex items-center">
          <img
            src="/images/donkey-bridge-logo.png"
            alt="Donkey Bridge Logo"
            className="h-10 w-auto"
          />
        </a>

        {/* Make Your Own Set Button - prominently placed in top row */}
        <button
          onClick={() => window.open('/set-wizard', '_blank')}
          className="neumorphic-button text-sm font-semibold text-green-300 border-green-500 hover:bg-green-800 hover:text-white px-3 py-1.5 shadow-[0_0_10px_#10B981] inline-flex items-center justify-center whitespace-nowrap"
        >
          Make Your Own Set!
        </button>
      </div>

      {/* Bottom Row: Set Selector and Action Buttons */}
      <div className="px-4 py-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        {/* Set Selector - given more width */}
        <div className="flex-grow max-w-md">
          <SetSelector />
        </div>

        {/* Action Buttons Group - consistently styled and right-aligned */}
        <div className="flex items-center gap-x-2 ml-auto">
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
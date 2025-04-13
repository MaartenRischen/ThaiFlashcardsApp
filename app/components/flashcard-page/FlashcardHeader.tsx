import React from 'react';
import { SetSelector } from '@/app/components/SetSelector'; // Assuming path

// Define props required by the header (REMOVED props only needed for SetSelector)
interface FlashcardHeaderProps {
  setShowHowItWorks: (show: boolean) => void;
  setIsSetOptionsMenuOpen: (open: boolean) => void;
  setIsAppOptionsMenuOpen: (open: boolean) => void;
  setShowProgress: (show: boolean) => void;
}

export function FlashcardHeader({
  setShowHowItWorks,
  setIsSetOptionsMenuOpen,
  setIsAppOptionsMenuOpen,
  setShowProgress,
}: FlashcardHeaderProps) {
  return (
    <div className="bg-[#111] border-b border-[#333] grid grid-cols-[90px_1fr]">
      {/* Logo column - fixed width */}
      <div className="flex items-center justify-center py-3">
        <a href="/" title="Go to Home" className="flex-shrink-0">
          <img
            src="/images/donkey-bridge-logo.png"
            alt="Donkey Bridge Logo"
            className="h-20 w-auto"
          />
        </a>
      </div>

      {/* Content column - with all the buttons and dropdown */}
      <div className="flex flex-col">
        {/* Top Row: Progress & Make Your Own Set buttons */}
        <div className="px-4 py-2 flex justify-end items-center gap-x-3">
          {/* Progress Button - MOVED HERE */}
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

        {/* Middle Row: Set Selector */}
        <div className="px-4 py-2 flex justify-end">
          <div className="w-64">
            <SetSelector />
          </div>
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
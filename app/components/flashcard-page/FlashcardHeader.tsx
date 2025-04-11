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
  // Removed console log as props are simpler now

  return (
    // Header structure based on app/page.tsx approx line 1012+, with additions
    // Added min-h-[4rem] to ensure minimum height and flex-wrap to the main div
    <div className="relative px-4 py-3 bg-[#111] border-b border-[#333] flex flex-wrap items-center justify-between gap-x-4 gap-y-2 min-h-[4rem]">
      {/* Logo */}
      <a href="/" title="Go to Home" className="flex-shrink-0 self-stretch flex items-center mr-4"> {/* Added margin-right */}
        <img
          src="/images/donkey-bridge-logo.png"
          alt="Donkey Bridge Logo"
          className="h-10 sm:h-12 md:h-16 w-auto" // Responsive height
        />
      </a>

      {/* Right-aligned Group - Allows Wrapping */}
      {/* Added flex-grow to allow wrapping elements to take available space */}
      <div className="flex items-center flex-wrap justify-end gap-x-3 gap-y-2 flex-grow">
        {/* Set Selector Component - Rendered WITHOUT passing props */}
        <div className="flex-shrink-0">
          <SetSelector />
        </div>

        {/* Make Your Own Set Button */}
        {/* Added flex-shrink-0 to prevent shrinking */}
        <button
          onClick={() => window.open('/set-wizard', '_blank')}
          className="neumorphic-button text-sm font-semibold text-green-300 border-green-500 hover:bg-green-800 hover:text-white px-3 py-1.5 shadow-[0_0_10px_#10B981] inline-flex items-center justify-center flex-shrink-0 whitespace-nowrap"
        >
          Make Your Own Set!
        </button>

        {/* How It Works Button (?) */}
        {/* Added flex-shrink-0 */}
        <button
          onClick={() => setShowHowItWorks(true)}
          className="neumorphic-icon-button text-xl font-bold text-blue-400 p-2 leading-none inline-flex items-center justify-center w-8 h-8 flex-shrink-0"
          title="How It Works"
        >
          ?
        </button>

        {/* Set Options Button - Added */}
        {/* Added flex-shrink-0 */}
        <button
          onClick={() => setIsSetOptionsMenuOpen(true)}
          className="neumorphic-button text-sm px-3 py-1.5 flex-shrink-0 whitespace-nowrap" // Basic styling + prevent wrap
        >
          Set Options
        </button>

        {/* App Options Button - Added */}
        {/* Added flex-shrink-0 */}
        <button
          onClick={() => setIsAppOptionsMenuOpen(true)}
          className="neumorphic-button text-sm px-3 py-1.5 flex-shrink-0 whitespace-nowrap" // Basic styling + prevent wrap
        >
          App Options
        </button>
      </div>
    </div>
  );
} 
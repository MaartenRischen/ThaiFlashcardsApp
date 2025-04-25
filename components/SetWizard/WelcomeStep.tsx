import React from 'react';
import Image from 'next/image';

export function WelcomeStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div className="flex flex-col items-center text-center space-y-6">
      {/* Image with decorative background */}
      <div className="relative w-[400px] h-[280px] mb-6">
        {/* Gradient background circle */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-blue-400/20 to-blue-600/10 rounded-2xl blur-md"></div>
        
        {/* Subtle animated glow effect */}
        <div className="absolute inset-0 bg-blue-400/10 rounded-2xl animate-pulse"></div>
        
        {/* Image container */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/images/donkeycards.png"
            alt="Donkey Bridge Logo"
            width={380}
            height={260}
            className="object-contain z-10"
          />
        </div>
      </div>
      
      <div className="space-y-3 max-w-md">
        <div className="bg-gray-900/60 border border-blue-900/30 rounded-lg p-3 mb-3">
          <p className="text-blue-100 text-sm leading-relaxed">
            Let&apos;s personalize your Thai learning journey! Answer a few quick questions to create your perfect flashcard set.
          </p>
        </div>
        
        <p className="text-xs text-gray-500 italic">
          You can skip this and use the default set or import public sets anytime.
        </p>
      </div>

      <div className="flex justify-center pt-3 w-full">
        <button 
          onClick={onNext}
          className="neumorphic-button text-blue-400 px-8"
        >
          Let's Go!
        </button>
      </div>
    </div>
  );
} 
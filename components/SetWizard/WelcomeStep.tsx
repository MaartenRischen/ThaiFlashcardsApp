import React from 'react';
import Image from 'next/image';

export function WelcomeStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div className="flex flex-col items-center text-center space-y-6">
      <div className="w-24 h-24 relative">
        <Image
          src="/images/donkey-bridge-logo.png"
          alt="Donkey Bridge Logo"
          width={96}
          height={96}
          className="object-contain"
        />
      </div>
      
      <div className="space-y-3">
        <h2 className="text-xl font-medium text-blue-400">
          Welcome to Donkey Bridge
        </h2>
        <p className="text-gray-400 max-w-md text-sm">
          Let&apos;s personalize your Thai learning journey! Answer a few quick questions to create your perfect flashcard set.
        </p>
        <p className="text-xs text-gray-500">
          You can skip this and use the default set or import public sets anytime.
        </p>
      </div>

      <div className="flex gap-3 pt-3">
        <button 
          onClick={onNext}
          className="rounded-full bg-blue-600/90 hover:bg-blue-600 text-white px-6 py-2 text-sm"
        >
          Get Started
        </button>
        <button 
          onClick={onSkip}
          className="rounded-full bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-400 px-6 py-2 text-sm"
        >
          Skip for Now
        </button>
      </div>
    </div>
  );
} 
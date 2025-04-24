import React from 'react';

export function WelcomeStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div className="flex flex-col items-center text-center space-y-8">
      <div className="neumorphic-circle w-24 h-24 flex items-center justify-center bg-[#1a1a1a]">
        <span className="text-4xl">🐴</span>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          Welcome to Donkey Bridge
        </h2>
        <p className="text-gray-400 max-w-md text-lg">
          Let's personalize your Thai learning journey! Answer a few quick questions to create your perfect flashcard set.
        </p>
        <p className="text-sm text-gray-500">
          You can skip this and use the default set or import public sets anytime.
        </p>
      </div>

      <div className="flex gap-4 pt-4">
        <button 
          onClick={onNext}
          className="neumorphic-button bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-medium"
        >
          Get Started
        </button>
        <button 
          onClick={onSkip}
          className="neumorphic-button bg-[#2a2a2a] hover:bg-[#333333] text-gray-300 px-8 py-3 rounded-full font-medium"
        >
          Skip for Now
        </button>
      </div>
    </div>
  );
} 
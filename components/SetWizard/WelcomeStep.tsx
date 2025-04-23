import React from 'react';

export function WelcomeStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div className="flex flex-col items-center text-center space-y-6 p-4">
      {/* Mascot or logo can go here */}
      <div className="text-3xl font-bold text-blue-600">🐴 Donkey Bridge</div>
      <h2 className="text-2xl font-semibold">Let&apos;s personalize your Thai learning journey!</h2>
      <p className="text-gray-600 max-w-md">
        Answer a few quick questions to help us create your perfect flashcard set. You can skip this and use the default set or import public sets anytime.
      </p>
      <div className="flex gap-4 mt-6">
        <button className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700" onClick={onNext}>
          Get Started
        </button>
        <button className="bg-gray-200 text-gray-700 px-6 py-2 rounded shadow hover:bg-gray-300" onClick={onSkip}>
          Skip for Now
        </button>
      </div>
    </div>
  );
} 
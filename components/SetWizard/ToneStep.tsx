import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const getToneLevelLabel = (value: number): string => {
  switch (value) {
    case 1: return 'Textbook realism';
    case 2: return 'Serious & practical';
    case 3: return 'Sorta funny, but like your \'funny\' uncle';
    case 4: return 'Actually funny';
    case 5: return 'A little too much maybe';
    case 6: return 'Definitely too much';
    case 7: return 'Woah now';
    case 8: return 'Ehrm..';
    case 9: return 'You sure about this?';
    case 10: return '̷̛̤̖̯͕̭͙̏̀̏̑̔̆͝Ǫ̶̬̩͇̼͖͖͈̯̳͎͛̀̐͌̅̿̈́̏̾̏̽̎H̶̼̹͓̩̥͈̞̫̯͋̓̄́̓̽̈́̈́̈́͛̎͒̿͜H̴̘͎̗̮̱̗̰̱͓̪̘͛̅̅̐͌̑͆̆̐͐̈́͌̚O̴̖̥̺͎̰̰̠͙̹̔̑̆͆͋̀̐̄̈́͝ͅI̴̢̛̩͔̺͓̯̯̟̱͎͓̾̃̅̈́̍͋̒̔̚͜͠͠͝͝Ḋ̵̻͓̹̼̳̻̼̼̥̳͍͛̈́̑̆̈́̈́̅͜͝͝͠͝Ǫ̶͔̯̟͙̪͗̆͛̍̓̒̔̒̎̄̈́̅͜͝͠N̵̢̢̩̫͚̪̦̥̳̯͚̺̍̏͂͗̌̍̿̾̿́̓͌͛͝K̷̨̨̟̺͔̻̮̯̰̤̬͇̟̙̆͆͗̀̈́̔̅͒͛͊͘͝͠I̶̡̢̡̛͔͎͍̤̤̪͍͙̜͚̓̀͋́̈́̈́̿͂̈́̐͘͘͜';
    default: return 'Textbook realism';
  }
};

export function ToneStep({ toneLevel, onNext, onBack }: { 
  toneLevel: number,
  onNext: (toneLevel: number) => void,
  onBack: () => void
}) {
  const [currentToneLevel, setCurrentToneLevel] = useState(toneLevel);
  const [isDragging, setIsDragging] = useState(false);

  // Handle touch events for better mobile experience
  useEffect(() => {
    const handleTouchEnd = () => setIsDragging(false);
    document.addEventListener('touchend', handleTouchEnd);
    return () => document.removeEventListener('touchend', handleTouchEnd);
  }, []);

  // Ensure currentToneLevel is within valid range and is a number
  const safeToneLevel = Math.max(1, Math.min(10, Number(currentToneLevel) || 1));

  return (
    <div className="space-y-5 px-2">
      <div className="space-y-2.5 text-center">
        <h3 className="text-base font-medium text-white">
          How would you like to learn?
        </h3>
      </div>

      {/* Learning Style Image */}
      <div className="flex justify-center">
        <div className="relative w-full max-w-[300px] h-[160px] rounded-lg overflow-hidden border border-blue-900/30">
          <Image
            src={`/images/level2/${safeToneLevel}.png`}
            alt={`Learning style illustration - Tone Level ${safeToneLevel}`}
            fill
            className={`object-cover transition-opacity duration-300 ${isDragging ? 'opacity-100' : 'opacity-100'}`}
            priority
          />
        </div>
      </div>

      {/* Style Label */}
      <div className="text-center">
        <h4 className="text-lg font-semibold text-blue-400 leading-tight transition-all duration-300">
          {getToneLevelLabel(safeToneLevel)}
        </h4>
        {safeToneLevel === 1 && (
          <p className="text-xs text-gray-400 mt-0.5">(Recommended if you want to use this app seriously.)</p>
        )}
        {safeToneLevel === 2 && (
          <p className="text-xs text-gray-400 mt-0.5">(...ish. Still absolutely useful for your learning journey.)</p>
        )}
        {safeToneLevel === 4 && (
          <p className="text-xs text-gray-400 mt-0.5">(But getting borderline useless.)</p>
        )}
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <input
          type="range"
          min="1"
          max="10"
          value={safeToneLevel}
          onChange={(e) => setCurrentToneLevel(parseInt(e.target.value))}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-blue-900/30
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 
            [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 
            [&::-webkit-slider-thumb]:border-blue-400 [&::-webkit-slider-thumb]:shadow-lg
            [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full 
            [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:cursor-pointer 
            [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-blue-400
            [&::-moz-range-thumb]:shadow-lg"
        />
        <div className="flex justify-between px-1 text-xs text-gray-400">
          <span>Tone Level: {safeToneLevel}/10</span>
          <span>10/10</span>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="neumorphic-button text-blue-400"
        >
          Back
        </button>
        <button
          onClick={() => onNext(safeToneLevel)}
          className="neumorphic-button text-blue-400"
        >
          Next
        </button>
      </div>
    </div>
  );
} 
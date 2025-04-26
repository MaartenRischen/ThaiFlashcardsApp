import React, { useState } from 'react';
import Image from 'next/image';

// Define proficiency levels with matching capabilities
const proficiencyLevels = [
  {
    level: 'Complete Beginner',
    value: 0,
    examples: 'Just starting to learn basic words and phrases'
  },
  {
    level: 'Basic Understanding',
    value: 25,
    examples: 'Can use basic greetings and recognize common phrases'
  },
  {
    level: 'Intermediate',
    value: 50,
    examples: 'Can have simple conversations and order food in restaurants'
  },
  {
    level: 'Advanced',
    value: 75,
    examples: 'Can discuss daily activities and give directions confidently'
  },
  {
    level: 'Native/Fluent',
    value: 100,
    examples: 'Can understand Thai media and engage in complex conversations'
  },
  {
    level: 'God Mode',
    value: 200,
    examples: ''
  }
];

interface ProficiencyValue {
  canDoSelections: string[];
  levelEstimate: string;
}

export function ProficiencyStep({ value, onNext, onBack }: { 
  value: ProficiencyValue, 
  onNext: (value: ProficiencyValue) => void,
  onBack: () => void
}) {
  // Find the level index based on the current value
  const initialLevelIndex = value?.levelEstimate 
    ? proficiencyLevels.findIndex(pl => pl.level === value.levelEstimate)
    : 2; // Default to 'Intermediate' if not set

  const [selectedIndex, setSelectedIndex] = useState(initialLevelIndex);

  const handleSelect = (idx: number) => {
    setSelectedIndex(idx);
  };

  const handleNext = () => {
    if (selectedIndex < 0) return;
    const selectedLevel = proficiencyLevels[selectedIndex];
    let capabilities: string[] = [];
    switch(selectedIndex) {
      case 1: // Basic Understanding
        capabilities = ['Basic greetings'];
        break;
      case 2: // Intermediate
        capabilities = ['Basic greetings', 'Simple conversations', 'Order food'];
        break;
      case 3: // Advanced
        capabilities = ['Basic greetings', 'Simple conversations', 'Order food', 
                       'Give directions', 'Discuss daily activities'];
        break;
      case 4: // Native/Fluent
        capabilities = ['Basic greetings', 'Simple conversations', 'Order food', 
                       'Give directions', 'Discuss daily activities', 'Watch Thai media'];
        break;
      default: // Complete Beginner
        capabilities = [];
    }
    onNext({
      canDoSelections: capabilities,
      levelEstimate: selectedLevel.level
    });
  };

  // Use selectedIndex for image and description, fallback to 0 if none selected
  const activeLevelIndex = selectedIndex >= 0 ? selectedIndex : 0;

  return (
    <div className="space-y-6 px-2">
      <div className="space-y-2.5">
        <h3 className="text-base font-medium text-white">
          What is your Thai proficiency level?
        </h3>
        <p className="text-xs text-gray-400">
          Tap your current level of Thai speaking and listening ability.
        </p>
      </div>

      {/* Proficiency Level Image */}
      <div className="flex justify-center">
        <div className="relative w-full max-w-[300px] h-[160px] rounded-lg overflow-hidden border border-blue-900/30">
          <Image
            src={`/images/level/${activeLevelIndex + 1}.png`}
            alt={`${proficiencyLevels[activeLevelIndex].level} level illustration`}
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* Choice Buttons with numbering and labels */}
      <div className="flex flex-col gap-2 items-stretch">
        <div className="flex justify-start mb-1">
          <span className="text-xs text-gray-400 pl-2">Lowest</span>
        </div>
        {proficiencyLevels.map((level, idx) => (
          <button
            key={level.level}
            type="button"
            onClick={() => handleSelect(idx)}
            className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all font-medium
              ${selectedIndex === idx
                ? 'bg-blue-600/90 text-white border-blue-500 shadow-md scale-105'
                : 'bg-[#1e1e1e] text-gray-200 border-blue-900/30 hover:bg-blue-900/30'}
            `}
          >
            <span className={`flex items-center justify-center font-bold rounded-full w-7 h-7 text-base
              ${selectedIndex === idx ? 'bg-blue-400 text-white' : 'bg-gray-800 text-blue-300 border border-blue-900/30'}`}>{idx + 1}</span>
            <div>
              <div className="text-base">{level.level}</div>
              <div className="text-xs text-gray-400 mt-1">{level.examples}</div>
            </div>
          </button>
        ))}
        <div className="flex justify-end mt-1">
          <span className="text-xs text-gray-400 pr-2">Highest</span>
        </div>
      </div>

      <div className="flex justify-between pt-3">
        <button
          onClick={onBack}
          className="neumorphic-button text-blue-400"
        >
          Back
        </button>
        <button
          className="neumorphic-button text-blue-400"
          onClick={handleNext}
          disabled={selectedIndex < 0}
        >
          Next
        </button>
      </div>
    </div>
  );
} 
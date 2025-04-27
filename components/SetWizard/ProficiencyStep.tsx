import React, { useState } from 'react';
import Image from 'next/image';

// Define the specific proficiency level type
type ProficiencyLevelString = 'Complete Beginner' | 'Basic Understanding' | 'Intermediate' | 'Advanced' | 'Native/Fluent' | 'God Mode';

// Define proficiency levels with matching capabilities and specific type
const proficiencyLevels: { level: ProficiencyLevelString; value: number; examples: string }[] = [
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
    examples: '' // God Mode doesn't need examples here
  }
];

interface ProficiencyValue {
  canDoSelections: string[];
  levelEstimate: ProficiencyLevelString; // Use the specific type
}

export function ProficiencyStep({ value, onNext, onBack }: { 
  value: ProficiencyValue, 
  onNext: (value: ProficiencyValue) => void,
  onBack: () => void
}) {
  // Find the level index based on the current value
  const initialLevelIndex = value?.levelEstimate 
    ? proficiencyLevels.findIndex(pl => pl.level === value.levelEstimate)
    : 2; // Default to 'Intermediate' index if not set

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
    <div className="space-y-4 px-2">
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
        <div className="relative w-full max-w-[300px] h-[140px] rounded-lg overflow-hidden border border-blue-900/30">
          <Image
            src={`/images/level/${activeLevelIndex + 1}.png`}
            alt={`${proficiencyLevels[activeLevelIndex].level} level illustration`}
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* Choice Buttons with numbering and labels */}
      <div className="space-y-1.5">
        {proficiencyLevels.map((level, idx) => (
          <button
            key={level.level}
            type="button"
            onClick={() => handleSelect(idx)}
            className={`flex items-center w-full rounded-lg border-2 px-3 py-2 text-left transition-all ${
              activeLevelIndex === idx
                ? 'bg-blue-600/90 text-white border-blue-500 shadow-md'
                : 'bg-blue-900/30 text-blue-300 border-blue-600/30 hover:bg-blue-800/40'
            }`}
          >
            <span className={`flex h-6 w-6 items-center justify-center rounded-full mr-3 text-xs font-bold ${
              activeLevelIndex === idx ? 'bg-white text-blue-600' : 'bg-blue-950/60 text-blue-400'
            }`}>
              {idx + 1}
            </span>
            <div>
              <div className="font-medium text-sm">{level.level}</div>
              <div className="text-xs mt-0.5 opacity-80">{level.examples}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-between pt-2">
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
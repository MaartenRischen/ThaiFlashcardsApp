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
    : 0;
  
  // Use level value for the slider
  const [sliderValue, setSliderValue] = useState(
    initialLevelIndex >= 0 ? proficiencyLevels[initialLevelIndex].value : 0
  );
  
  // Derived active level based on slider value
  const getActiveLevelIndex = () => {
    // Get the closest level based on slider value
    const closest = proficiencyLevels.reduce((prev, curr) => {
      return (Math.abs(curr.value - sliderValue) < Math.abs(prev.value - sliderValue) ? curr : prev);
    });
    return proficiencyLevels.findIndex(pl => pl.level === closest.level);
  };
  
  const activeLevelIndex = getActiveLevelIndex();
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderValue(Number(e.target.value));
  };

  const handleNext = () => {
    // Get the selected level based on slider position
    const selectedLevel = proficiencyLevels[activeLevelIndex];
    
    // Derive capabilities based on the selected level
    let capabilities: string[] = [];
    
    switch(activeLevelIndex) {
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

  return (
    <div className="space-y-6 px-2">
      <div className="space-y-2.5">
        <h3 className="text-base font-medium text-white">
          What is your Thai proficiency level?
        </h3>
        <p className="text-xs text-gray-400">
          Slide to select your current level of Thai speaking and listening ability.
        </p>
      </div>

      {/* Proficiency Level Image */}
      <div className="flex justify-center">
        <div className="relative w-[340px] h-[220px] rounded-lg overflow-hidden border border-blue-900/30">
          <Image
            src={`/images/level/${activeLevelIndex + 1}.png`}
            alt={`${proficiencyLevels[activeLevelIndex].level} level illustration`}
            width={340}
            height={220}
            className="object-cover"
          />
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-5">
        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={handleSliderChange}
          className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        
        {/* Labels */}
        <div className="grid grid-cols-5 text-[0.6rem] text-gray-500">
          {proficiencyLevels.map((level, index) => (
            <div key={index} className="text-center">
              {level.level}
            </div>
          ))}
        </div>
      </div>

      {/* Active level details */}
      <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-400 mb-1">
          {proficiencyLevels[activeLevelIndex].level}
        </h4>
        <p className="text-xs text-gray-300">
          {proficiencyLevels[activeLevelIndex].examples}
        </p>
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
        >
          Next
        </button>
      </div>
    </div>
  );
} 
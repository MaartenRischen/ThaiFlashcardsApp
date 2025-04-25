import React, { useState } from 'react';

const canDoOptions = [
  'Read Thai script',
  'Basic greetings',
  'Simple conversations',
  'Order food',
  'Give directions',
  'Discuss daily activities',
  'Watch Thai media',
  'Read Thai news'
];

const levelOptions = [
  'Complete Beginner',
  'Basic Understanding',
  'Intermediate',
  'Advanced',
  'Native/Fluent'
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
  const [selections, setSelections] = useState<string[]>(value?.canDoSelections || []);
  const [level, setLevel] = useState(value?.levelEstimate || '');

  const toggleSelection = (option: string) => {
    setSelections(prev =>
      prev.includes(option)
        ? prev.filter(s => s !== option)
        : [...prev, option]
    );
  };

  const handleNext = () => {
    onNext({
      canDoSelections: selections,
      levelEstimate: level || 'Complete Beginner'
    });
  };

  return (
    <div className="space-y-5 px-2">
      <div className="space-y-2.5">
        <h3 className="text-base font-medium text-white">
          What can you already do in Thai?
        </h3>
        <p className="text-xs text-gray-400">
          Select all that apply to help us personalize your learning experience.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {canDoOptions.map(option => (
          <button
            key={option}
            onClick={() => toggleSelection(option)}
            onTouchStart={(e) => {
              e.preventDefault();
              toggleSelection(option);
            }}
            className={`
              text-left px-3 py-2 rounded-full text-xs transition-all
              ${selections.includes(option)
                ? 'bg-blue-600/90 text-white shadow-sm'
                : 'bg-[#1e1e1e] text-gray-300 hover:bg-[#2a2a2a]'}
              active:bg-blue-600/90 active:text-white
              touch-none select-none
            `}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="space-y-2.5 mt-2">
        <h4 className="text-sm font-medium text-white">
          Overall Thai Level
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {levelOptions.map(option => (
            <button
              key={option}
              onClick={() => setLevel(option)}
              onTouchStart={(e) => {
                e.preventDefault();
                setLevel(option);
              }}
              className={`
                px-3 py-1.5 rounded-full text-xs transition-all text-center
                ${level === option
                  ? 'bg-blue-600/90 text-white shadow-sm'
                  : 'bg-[#1e1e1e] text-gray-300 hover:bg-[#2a2a2a]'}
                active:bg-blue-600/90 active:text-white
                touch-none select-none
              `}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-3">
        <button
          onClick={onBack}
          className="rounded-full bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-400 px-4 py-1.5 text-xs"
        >
          Back
        </button>
        <button
          className="rounded-full bg-blue-600/90 hover:bg-blue-600 text-white px-4 py-1.5 text-xs"
          onClick={handleNext}
        >
          Next
        </button>
      </div>
    </div>
  );
} 
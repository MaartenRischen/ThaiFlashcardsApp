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
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">
          What can you already do in Thai?
        </h3>
        <p className="text-gray-400">
          Select all that apply to help us personalize your learning experience.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {canDoOptions.map(option => (
          <button
            key={option}
            onClick={() => toggleSelection(option)}
            className={`
              neumorphic-button text-left px-4 py-3 transition-all
              ${selections.includes(option)
                ? 'bg-blue-600 text-white border-blue-500 shadow-blue-900/20'
                : 'bg-[#2a2a2a] text-gray-300 hover:text-white'}
            `}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">
          Overall Thai Level
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {levelOptions.map(option => (
            <button
              key={option}
              onClick={() => setLevel(option)}
              className={`
                neumorphic-button px-4 py-3 transition-all text-center
                ${level === option
                  ? 'bg-blue-600 text-white border-blue-500 shadow-blue-900/20'
                  : 'bg-[#2a2a2a] text-gray-300 hover:text-white'}
              `}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="neumorphic-button bg-[#2a2a2a] hover:bg-[#333333] text-white px-8 py-3"
        >
          Back
        </button>
        <button
          className="neumorphic-button bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
          onClick={handleNext}
        >
          Next
        </button>
      </div>
    </div>
  );
} 
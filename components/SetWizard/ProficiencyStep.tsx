import React, { useState } from 'react';
import Image from 'next/image';
import { StarIcon, SparklesIcon } from '@heroicons/react/24/solid';

// Define the specific proficiency level type
type ProficiencyLevel = {
  value: ProficiencyLevelString;
  label: string;
  description: string;
  example: string;
  icon: JSX.Element;
};

type ProficiencyLevelString = 'Complete Beginner' | 'Basic Understanding' | 'Intermediate' | 'Advanced' | 'Native/Fluent' | 'God Mode';

// Define proficiency levels with matching capabilities and specific type
const proficiencyLevels: ProficiencyLevel[] = [
  {
    value: 'Complete Beginner',
    label: 'Complete Beginner',
    description: 'Single words and two-word combinations only',
    example: 'ลา บนสะพาน (donkey on bridge)',
    icon: <StarIcon className="h-5 w-5" />
  },
  {
    value: 'Basic Understanding',
    label: 'Basic Understanding',
    description: 'Short phrases with 2-4 words',
    example: 'ลาเดินบนสะพาน (donkey walks on bridge)',
    icon: <StarIcon className="h-5 w-5" />
  },
  {
    value: 'Intermediate',
    label: 'Intermediate',
    description: 'Medium-length sentences with 4-7 words',
    example: 'ลาตัวนี้กำลังเดินข้ามสะพาน (This donkey is crossing the bridge)',
    icon: <StarIcon className="h-5 w-5" />
  },
  {
    value: 'Advanced',
    label: 'Advanced',
    description: 'Complex sentences with 7-12 words',
    example: 'ลาตัวนี้ชอบเดินเล่นบนสะพานไม้ทุกๆเช้า (This donkey likes to walk on the wooden bridge every morning)',
    icon: <StarIcon className="h-5 w-5" />
  },
  {
    value: 'Native/Fluent',
    label: 'Native/Fluent',
    description: 'Natural, idiomatic Thai of any appropriate length',
    example: 'ทุกครั้งที่เห็นลาเดินอยู่บนสะพาน มันดูมีความสุขมากที่ได้ชมวิวสวยๆ (Every time I see the donkey on the bridge, it looks so happy enjoying the beautiful view)',
    icon: <StarIcon className="h-5 w-5" />
  },
  {
    value: 'God Mode',
    label: 'God Mode',
    description: 'Sophisticated, elaborate Thai with literary/academic language',
    example: 'Heeyyy donkey dude! You good on that bridge duude?\n\nเฮ้ยยย ไอ้หนุ่มลา! สบายดีบนสะพานนั้นปะเพื่อน นน?\n\nheyyy ai noom laa! sa-baai dee bon sa-paan nan pa puean?\n\nThink "ai noom" for "dude" and stretch "pueaan" like "duuude" - super casual!',
    icon: <SparklesIcon className="h-5 w-5" />
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
    ? proficiencyLevels.findIndex(pl => pl.value === value.levelEstimate)
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
      levelEstimate: selectedLevel.value
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
        {/* <p className="text-xs text-gray-400">
          Tap your current level of Thai speaking and listening ability.
        </p> */}
      </div>

      {/* Proficiency Level Image */}
      <div className="flex justify-center">
        <div className="relative w-full max-w-[300px] h-[300px] rounded-lg overflow-hidden border border-blue-900/30 scale-[0.8]">
          <Image
            src={`/images/level/${activeLevelIndex + 1}.png`}
            alt={`${proficiencyLevels[activeLevelIndex].label} level illustration`}
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* Choice Buttons with numbering and labels */}
      <div className="space-y-1.5">
        {proficiencyLevels.map((level, idx) => (
          <button
            key={level.value}
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
              <div className="font-medium text-sm">{level.label}</div>
              <div className="text-xs mt-0.5 opacity-80">{level.description}</div>
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
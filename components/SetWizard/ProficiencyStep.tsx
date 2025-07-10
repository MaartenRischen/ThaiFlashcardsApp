import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

// Define the specific proficiency level type
type ProficiencyLevel = {
  value: ProficiencyLevelString;
  label: string;
  description: string;
  example: string;
  emoji: string;
};

type ProficiencyLevelString = 'Complete Beginner' | 'Basic Understanding' | 'Intermediate' | 'Advanced' | 'Native/Fluent' | 'God Mode';

// Define proficiency levels with matching capabilities and specific type
const proficiencyLevels: ProficiencyLevel[] = [
  {
    value: 'Complete Beginner',
    label: 'Complete Beginner',
    description: 'Single words and two-word combinations only',
    example: 'ลา บนสะพาน (donkey on bridge)',
    emoji: '🌱'
  },
  {
    value: 'Basic Understanding',
    label: 'Basic Understanding',
    description: 'Short phrases with 2-4 words',
    example: 'ลาเดินบนสะพาน (donkey walks on bridge)',
    emoji: '🌿'
  },
  {
    value: 'Intermediate',
    label: 'Intermediate',
    description: 'Medium-length sentences with 4-7 words',
    example: 'ลาตัวนี้กำลังเดินข้ามสะพาน (This donkey is crossing the bridge)',
    emoji: '🌳'
  },
  {
    value: 'Advanced',
    label: 'Advanced',
    description: 'Complex sentences with 7-12 words',
    example: 'ลาตัวนี้ชอบเดินเล่นบนสะพานไม้ทุกๆเช้า (This donkey likes to walk on the wooden bridge every morning)',
    emoji: '🏔️'
  },
  {
    value: 'Native/Fluent',
    label: 'Native/Fluent',
    description: 'Natural, idiomatic Thai of any appropriate length',
    example: 'ทุกครั้งที่เห็นลาเดินอยู่บนสะพาน มันดูมีความสุขมากที่ได้ชมวิวสวยๆ (Every time I see the donkey on the bridge, it looks so happy enjoying the beautiful view)',
    emoji: '🌟'
  },
  {
    value: 'God Mode',
    label: 'God Mode',
    description: 'Sophisticated, elaborate Thai with literary/academic language',
    example: 'Heeyyy donkey dude! You good on that bridge duude?\n\nเฮ้ยยย ไอ้หนุ่มลา! สบายดีบนสะพานนั้นปะเพื่อน นน?\n\nheyyy ai noom laa! sa-baai dee bon sa-paan nan pa puean?\n\nThink "ai noom" for "dude" and stretch "pueaan" like "duuude" - super casual!',
    emoji: '⚡'
  }
];

// Can-do options
const CAN_DO_OPTIONS = [
  'Basic greetings',
  'Simple conversations',
  'Order food',
  'Give directions',
  'Discuss daily activities',
  'Watch Thai media',
  'Read simple texts',
  'Write basic messages'
];

interface ProficiencyValue {
  canDoSelections: string[];
  levelEstimate: ProficiencyLevelString;
}

export function ProficiencyStep({ 
  value, 
  onNext, 
  onBack 
}: { 
  value: ProficiencyValue,
  onNext: (value: ProficiencyValue) => void,
  onBack: () => void
}) {
  const [levelEstimate, setLevelEstimate] = useState<ProficiencyLevelString>(value.levelEstimate);
  const [canDoSelections, setCanDoSelections] = useState<string[]>(value.canDoSelections);

  const toggleCanDo = (option: string) => {
    setCanDoSelections(prev => 
      prev.includes(option)
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

  const handleNext = () => {
    onNext({
      canDoSelections,
      levelEstimate
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-[#E0E0E0]">
          What's your current Thai level?
        </h3>
        <p className="text-sm text-gray-400">
          This helps us create content that matches your abilities
        </p>
      </div>

      {/* Level Selection Grid */}
      <div className="grid grid-cols-2 gap-3">
        {proficiencyLevels.map((level, index) => (
          <motion.button
            key={level.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setLevelEstimate(level.value)}
            className={`
              relative p-4 rounded-xl transition-all duration-200
              ${levelEstimate === level.value 
                ? 'neumorphic-card-active border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                : 'neumorphic-card-static hover:scale-[1.02]'
              }
            `}
          >
            <div className="text-2xl mb-2">{level.emoji}</div>
            <div className={`font-medium ${levelEstimate === level.value ? 'text-blue-400' : 'text-[#E0E0E0]'}`}>
              {level.label}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {level.description}
            </div>
            {levelEstimate === level.value && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
              >
                <Check className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Can Do Section */}
      <div className="space-y-3 neumorphic p-4 rounded-xl">
        <h4 className="text-sm font-medium text-blue-400">
          I can already... (select all that apply)
        </h4>
        <div className="space-y-2">
          {CAN_DO_OPTIONS.map((option) => (
            <label
              key={option}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors"
            >
              <div className="relative">
                <input
                  type="checkbox"
                  checked={canDoSelections.includes(option)}
                  onChange={() => toggleCanDo(option)}
                  className="sr-only"
                />
                <div className={`
                  w-5 h-5 rounded border-2 transition-all duration-200
                  ${canDoSelections.includes(option) 
                    ? 'bg-blue-500 border-blue-500' 
                    : 'border-gray-600 bg-gray-800'
                  }
                `}>
                  {canDoSelections.includes(option) && (
                    <Check className="w-3 h-3 text-white absolute top-0.5 left-0.5" />
                  )}
                </div>
              </div>
              <span className="text-sm text-gray-300">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="neumorphic-button text-gray-400"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="neumorphic-button text-blue-400"
        >
          Next
        </button>
      </div>
    </div>
  );
} 
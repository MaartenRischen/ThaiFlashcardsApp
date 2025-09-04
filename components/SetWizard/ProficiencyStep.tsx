import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// Image Preloader Component
const ImagePreloader = dynamic(() => import('./ImagePreloader'), { ssr: false });

type ProficiencyLevelString = 'Complete Beginner' | 'Basic Understanding' | 'Intermediate' | 'Advanced' | 'Native/Fluent' | 'God Mode';

interface ProficiencyValue {
  canDoSelections: string[];
  levelEstimate: ProficiencyLevelString;
}

const proficiencyLevels: Array<{
  value: ProficiencyLevelString;
  label: string;
  description: string;
  emoji: string;
  imageIndex: number;
}> = [
  {
    value: 'Complete Beginner',
    label: 'Complete Beginner',
    description: 'Single words and two-word combinations only',
    emoji: '🌱',
    imageIndex: 1
  },
  {
    value: 'Basic Understanding',
    label: 'Basic Understanding',
    description: 'Short phrases with 2-4 words',
    emoji: '🌿',
    imageIndex: 2
  },
  {
    value: 'Intermediate',
    label: 'Intermediate',
    description: 'Medium-length sentences with 4-7 words',
    emoji: '🌳',
    imageIndex: 3
  },
  {
    value: 'Advanced',
    label: 'Advanced',
    description: 'Complex sentences with 7-12 words',
    emoji: '',
    imageIndex: 4
  },
  {
    value: 'Native/Fluent',
    label: 'Native/Fluent',
    description: 'Natural, idiomatic Thai of any appropriate length',
    emoji: '',
    imageIndex: 5
  },
  {
    value: 'God Mode',
    label: 'God Mode',
    description: 'Sophisticated, elaborate Thai with literary/academic language',
    emoji: '',
    imageIndex: 6
  }
];

const getLevelColor = (index: number): string => {
  if (index <= 1) return 'text-green-400';
  if (index <= 3) return 'text-blue-400';
  if (index === 4) return 'text-yellow-400';
  return 'text-purple-400';
};

export function ProficiencyStep({ 
  _value: _unused, // Explicitly mark as unused
  onNext, 
  onBack 
}: { 
  _value: ProficiencyValue | string,
  onNext: (value: ProficiencyValue) => void,
  onBack: () => void
}) {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(1); // Default to Basic Understanding (index 1)

  const safeLevelIndex = Math.max(0, Math.min(5, currentLevelIndex));
  const currentLevel = proficiencyLevels[safeLevelIndex];

  const handleNext = () => {
    onNext({
      canDoSelections: [],
      levelEstimate: currentLevel.value
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="neumorphic-button px-6 py-3 text-[#BDBDBD] rounded-xl"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-3 rounded-xl bg-[#BB86FC] hover:bg-[#A374E8] 
                   transition-colors text-white font-medium"
        >
          Next →
        </button>
      </div>

      <ImagePreloader />
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-[#E0E0E0]">
          What's your current Thai level?
        </h3>
        <p className="text-sm text-gray-400">
          This helps us create content that matches your abilities
        </p>
      </div>

      {/* Level Display */}
      <motion.div 
        key={safeLevelIndex}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="neumorphic p-6 rounded-xl text-center space-y-4"
      >
        {/* Image */}
        <div className="relative w-full max-w-[280px] h-[160px] mx-auto rounded-lg overflow-hidden neumorphic-inset">
          <Image
            src={`/images/level/${currentLevel.imageIndex}.png`}
            alt={currentLevel.label}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Label */}
        <div className="space-y-1">
          <div className="text-2xl mb-2">{currentLevel.emoji}</div>
          <h4 className={`text-2xl font-bold transition-colors duration-300 ${getLevelColor(safeLevelIndex)}`}>
            {currentLevel.label}
          </h4>
          <p className="text-sm text-gray-400">{currentLevel.description}</p>
        </div>

        {/* Level Number */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-gray-400">Level:</span>
          <span className={`text-3xl font-bold ${getLevelColor(safeLevelIndex)}`}>
            {safeLevelIndex + 1}
          </span>
          <span className="text-sm text-gray-400">/ 6</span>
        </div>
      </motion.div>

      {/* Slider */}
      <div className="space-y-3">
        <div className="relative">
          <input
            type="range"
            min="0"
            max="5"
            value={safeLevelIndex}
            onChange={(e) => setCurrentLevelIndex(parseInt(e.target.value))}
            className="w-full h-4 rounded-full appearance-none cursor-pointer bg-gray-800
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
              [&::-webkit-slider-thumb]:from-blue-500 [&::-webkit-slider-thumb]:to-purple-500
              [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_20px_rgba(59,130,246,0.5)]
              [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200
              [&::-webkit-slider-thumb]:hover:shadow-[0_0_30px_rgba(59,130,246,0.7)]
              [&::-moz-range-thumb]:w-8 [&::-moz-range-thumb]:h-8 [&::-moz-range-thumb]:rounded-full 
              [&::-moz-range-thumb]:bg-gradient-to-r [&::-moz-range-thumb]:from-blue-500 
              [&::-moz-range-thumb]:to-purple-500 [&::-moz-range-thumb]:cursor-pointer 
              [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
            style={{
              background: `linear-gradient(to right, 
                #10b981 0%, 
                #3b82f6 40%, 
                #eab308 70%, 
                #a855f7 100%)`
            }}
          />
        </div>
        <div className="flex justify-between px-1 text-xs">
          <span className="text-green-400">Beginner</span>
          <span className="text-blue-400">Intermediate</span>
          <span className="text-purple-400">Advanced</span>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="neumorphic-button px-6 py-3 text-[#BDBDBD] rounded-xl"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-3 rounded-xl bg-[#BB86FC] hover:bg-[#A374E8] 
                   transition-colors text-white font-medium"
        >
          Next →
        </button>
      </div>
    </div>
  );
} 
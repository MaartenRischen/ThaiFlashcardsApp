import React from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Target, Palette, Hash } from 'lucide-react';
import { SetWizardState } from './SetWizardModal';

interface ReviewStepProps {
  state: SetWizardState;
  onConfirm: () => void;
  onBack: () => void;
  onCardCountChange: (count: number) => void;
}

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
    case 10: return 'Here&apos;s what we&apos;ll create for you';
    default: return 'Textbook realism';
  }
};

export function ReviewStep({ state, onConfirm, onBack, onCardCountChange }: ReviewStepProps) {
  const summaryItems = [
    {
      icon: <Check className="w-4 h-4" />,
      label: 'Level',
      value: state.proficiency.levelEstimate,
      color: 'text-green-400'
    },
    {
      icon: <Target className="w-4 h-4" />,
      label: 'Topic',
      value: state.selectedTopic?.title || 'Not selected',
      color: 'text-blue-400'
    },
    {
      icon: <Palette className="w-4 h-4" />,
      label: 'Tone',
      value: getToneLevelLabel(state.tone),
      color: 'text-purple-400'
    },
    {
      icon: <Hash className="w-4 h-4" />,
      label: 'Cards',
      value: `${state.cardCount} cards`,
      color: 'text-yellow-400'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-[#E0E0E0]">
          Review Your Set
        </h3>
        <p className="text-sm text-gray-400">
          Everything look good? Let's create your personalized flashcards!
        </p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-3">
        {summaryItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="neumorphic p-4 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className={`${item.color}`}>
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400">{item.label}</p>
                <p className="text-sm font-medium text-[#E0E0E0]">{item.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Card Count Adjustment */}
      <div className="neumorphic p-4 rounded-xl space-y-3">
        <label className="text-sm font-medium text-blue-400">
          Number of Cards
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onCardCountChange(Math.max(5, state.cardCount - 5))}
            className="neumorphic-button text-gray-400 px-3 py-1 text-sm"
          >
            -5
          </button>
          <div className="flex-1 text-center">
            <span className="text-2xl font-bold text-[#E0E0E0]">{state.cardCount}</span>
          </div>
          <button
            onClick={() => onCardCountChange(Math.min(30, state.cardCount + 5))}
            className="neumorphic-button text-gray-400 px-3 py-1 text-sm"
          >
            +5
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center">
          Recommended: 10-20 cards for optimal learning
        </p>
      </div>

      {/* Additional Context */}
      {state.additionalContext && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neumorphic p-4 rounded-xl"
        >
          <p className="text-xs text-gray-400 mb-2">Additional Context</p>
          <p className="text-sm text-[#E0E0E0]">{state.additionalContext}</p>
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="neumorphic-button text-gray-400"
        >
          Back
        </button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onConfirm}
          className="neumorphic-button text-blue-400 font-medium px-6 py-3
            bg-gradient-to-r from-blue-500/10 to-purple-500/10
            hover:from-blue-500/20 hover:to-purple-500/20
            transition-all duration-200"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Create My Set</span>
          </div>
        </motion.button>
      </div>
    </div>
  );
} 
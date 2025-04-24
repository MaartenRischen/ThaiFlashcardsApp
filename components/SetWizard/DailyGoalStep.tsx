import React, { useState } from 'react';
import { Slider } from '../ui/slider';

export interface DailyGoal {
  value: number;
  type: 'cards' | 'minutes';
}

export function DailyGoalStep({ value, onNext, onBack }: { 
  value?: DailyGoal, 
  onNext: (goal?: DailyGoal) => void,
  onBack: () => void
}) {
  const [goalType, setGoalType] = useState<'cards' | 'minutes'>(value?.type || 'cards');
  const [goalValue, setGoalValue] = useState(value?.value || 10);

  const handleNext = () => {
    onNext({ type: goalType, value: goalValue });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">
          🎯 Set Your Daily Learning Goal
        </h3>
        <p className="text-gray-400">
          Choose how you want to track your progress each day.
        </p>
      </div>

      <div className="space-y-8">
        <div className="flex gap-4">
          <button
            onClick={() => setGoalType('cards')}
            className={`
              flex-1 neumorphic-button px-6 py-4 transition-all
              ${goalType === 'cards'
                ? 'bg-blue-600 text-white'
                : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
              }
            `}
          >
            <div className="text-2xl mb-2">🎴</div>
            <div className="font-medium">Cards per Day</div>
          </button>

          <button
            onClick={() => setGoalType('minutes')}
            className={`
              flex-1 neumorphic-button px-6 py-4 transition-all
              ${goalType === 'minutes'
                ? 'bg-blue-600 text-white'
                : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
              }
            `}
          >
            <div className="text-2xl mb-2">⏱️</div>
            <div className="font-medium">Minutes per Day</div>
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Goal: {goalValue} {goalType}/day</span>
              <span>{goalType === 'cards' ? '(5-50 cards)' : '(5-60 minutes)'}</span>
            </div>
            <Slider
              value={[goalValue]}
              onValueChange={([value]) => setGoalValue(value)}
              min={5}
              max={goalType === 'cards' ? 50 : 60}
              step={goalType === 'cards' ? 5 : 5}
              className="w-full"
            />
          </div>

          <div className="neumorphic p-6">
            <div className="text-sm text-gray-400 mb-2">Estimated Progress</div>
            <div className="text-2xl font-semibold text-white">
              {goalType === 'cards' 
                ? `${goalValue * 7} cards per week`
                : `${goalValue * 7} minutes per week`
              }
            </div>
            <div className="text-gray-500 text-sm mt-2">
              {goalType === 'cards'
                ? 'A steady pace to build your vocabulary'
                : 'Consistent practice for better retention'
              }
            </div>
          </div>
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
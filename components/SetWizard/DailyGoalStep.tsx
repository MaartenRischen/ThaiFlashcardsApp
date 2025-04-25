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
    <div className="space-y-5 px-2">
      <div className="space-y-2.5">
        <h3 className="text-base font-medium text-white">
          Set Your Daily Learning Goal
        </h3>
        <p className="text-xs text-gray-400">
          Choose how you want to track your progress each day.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex gap-3">
          <button
            onClick={() => setGoalType('cards')}
            onTouchStart={(e) => {
              e.preventDefault();
              setGoalType('cards');
            }}
            className={`
              flex-1 rounded-xl px-4 py-3 transition-all text-center
              ${goalType === 'cards'
                ? 'bg-blue-600/90 text-white'
                : 'bg-[#1e1e1e] text-gray-400 hover:bg-[#2a2a2a]'
              }
              touch-none select-none
            `}
          >
            <div className="text-center mb-1">
              <svg className="w-5 h-5 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </div>
            <div className="font-medium text-xs">Cards per Day</div>
          </button>

          <button
            onClick={() => setGoalType('minutes')}
            onTouchStart={(e) => {
              e.preventDefault();
              setGoalType('minutes');
            }}
            className={`
              flex-1 rounded-xl px-4 py-3 transition-all text-center
              ${goalType === 'minutes'
                ? 'bg-blue-600/90 text-white'
                : 'bg-[#1e1e1e] text-gray-400 hover:bg-[#2a2a2a]'
              }
              touch-none select-none
            `}
          >
            <div className="text-center mb-1">
              <svg className="w-5 h-5 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="font-medium text-xs">Minutes per Day</div>
          </button>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
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

          <div className="bg-[#1e1e1e] rounded-lg p-4 space-y-2">
            <div className="text-xs text-gray-400">Estimated Progress</div>
            <div className="text-base font-medium text-white">
              {goalType === 'cards' 
                ? `${goalValue * 7} cards per week`
                : `${goalValue * 7} minutes per week`
              }
            </div>
            <div className="text-gray-500 text-xs">
              {goalType === 'cards'
                ? 'A steady pace to build your vocabulary'
                : 'Consistent practice for better retention'
              }
            </div>
          </div>
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
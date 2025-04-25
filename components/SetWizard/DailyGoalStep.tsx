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
  // Always use 'cards' as the type now
  const [goalType] = useState<'cards' | 'minutes'>('cards');
  const [goalValue, setGoalValue] = useState(value?.value || 10);

  const handleNext = () => {
    onNext({ type: goalType, value: goalValue });
  };

  return (
    <div className="space-y-5 px-2">
      <div className="space-y-2.5 text-center">
        <h3 className="text-base font-medium text-white">
          Set Your Daily Learning Goal
        </h3>
        <p className="text-xs text-gray-400">
          Choose how you want to track your progress each day.
        </p>
      </div>

      <div className="space-y-6 max-w-md mx-auto">
        <div className="space-y-4 mt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400 text-center">
              <span>Goal: {goalValue} cards/day</span>
              <span>(5-50 cards total)</span>
            </div>
            <Slider
              value={[goalValue]}
              onValueChange={([value]) => setGoalValue(value)}
              min={5}
              max={50}
              step={5}
              className="w-full"
            />
          </div>
        </div>
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
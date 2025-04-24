import React from 'react';
import { SetWizardState } from './SetWizardModal';

export function ReviewStep({ state, onConfirm, onEdit, onBack }: {
  state: SetWizardState,
  onConfirm: () => void,
  onEdit: (step: number) => void,
  onBack: () => void,
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">
          🎉 Almost Ready!
        </h3>
        <p className="text-gray-400">
          Review your choices and make any final adjustments.
        </p>
      </div>

      <div className="space-y-4">
        <div className="neumorphic p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-white">Selected Scenarios</h4>
              <div className="text-gray-400 text-sm mt-1">What you'll learn</div>
            </div>
            <button 
              onClick={() => onEdit(1)}
              className="text-blue-400 hover:text-blue-300 text-sm underline"
            >
              Edit
            </button>
          </div>
          <div className="space-y-2">
            {state.scenarios.map(scenario => (
              <div key={scenario} className="text-gray-300 flex items-center gap-2">
                <span className="text-blue-400">•</span>
                {scenario}
              </div>
            ))}
            {state.customGoal && (
              <div className="text-gray-400 text-sm mt-2">
                Custom scenario: {state.customGoal}
              </div>
            )}
          </div>
        </div>

        <div className="neumorphic p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-white">Learning Style</h4>
              <div className="text-gray-400 text-sm mt-1">How you'll learn</div>
            </div>
            <button 
              onClick={() => onEdit(2)}
              className="text-blue-400 hover:text-blue-300 text-sm underline"
            >
              Edit
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-2 flex-1 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500"
                style={{ width: `${state.tone}%` }}
              />
            </div>
            <span className="text-gray-300 text-sm w-24">
              {state.tone <= 30 ? 'Serious' : state.tone >= 70 ? 'Playful' : 'Balanced'}
            </span>
          </div>
        </div>

        <div className="neumorphic p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-white">Daily Goal</h4>
              <div className="text-gray-400 text-sm mt-1">Your commitment</div>
            </div>
            <button 
              onClick={() => onEdit(3)}
              className="text-blue-400 hover:text-blue-300 text-sm underline"
            >
              Edit
            </button>
          </div>
          <div className="text-gray-300">
            {state.dailyGoal 
              ? `${state.dailyGoal.value} ${state.dailyGoal.type}/day`
              : 'No daily goal set'
            }
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          className="neumorphic-button bg-[#2a2a2a] hover:bg-[#333333] text-gray-300 px-8 py-3"
          onClick={onBack}
        >
          Back
        </button>
        <button
          className="neumorphic-button bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
          onClick={onConfirm}
        >
          Create My Set
        </button>
      </div>
    </div>
  );
} 
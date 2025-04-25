import React from 'react';
import { SetWizardState } from './SetWizardModal';

export function ReviewStep({ state, onConfirm, onEdit, onBack }: {
  state: SetWizardState,
  onConfirm: () => void,
  onEdit: (step: number) => void,
  onBack: () => void,
}) {
  return (
    <div className="space-y-5 px-2">
      <div className="space-y-2.5">
        <h3 className="text-base font-medium text-white">
          Almost Ready!
        </h3>
        <p className="text-xs text-gray-400">
          Review your selections before we generate your custom set. You&apos;ve almost done!
        </p>
      </div>

      <div className="space-y-3">
        <div className="bg-[#1e1e1e] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-white">Selected Scenarios</h4>
              <div className="text-gray-400 text-xs mt-0.5">What you&apos;ll learn</div>
            </div>
            <button 
              onClick={() => onEdit(1)}
              className="text-blue-400 hover:text-blue-300 text-xs"
            >
              Edit
            </button>
          </div>
          <div className="space-y-1.5">
            {state.scenarios.map(scenario => (
              <div key={scenario} className="text-gray-300 text-xs flex items-center gap-1.5">
                <span className="text-blue-400 text-xs">•</span>
                {scenario}
              </div>
            ))}
            {state.customGoal && (
              <div className="text-gray-400 text-xs mt-1">
                Custom scenario: {state.customGoal}
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#1e1e1e] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-white">Learning Style</h4>
              <div className="text-gray-400 text-xs mt-0.5">How you&apos;ll learn</div>
            </div>
            <button 
              onClick={() => onEdit(2)}
              className="text-blue-400 hover:text-blue-300 text-xs"
            >
              Edit
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600/90"
                style={{ width: `${state.tone}%` }}
              />
            </div>
            <span className="text-gray-300 text-xs w-16">
              {state.tone <= 30 ? 'Serious' : state.tone >= 70 ? 'Playful' : 'Balanced'}
            </span>
          </div>
        </div>

        <div className="bg-[#1e1e1e] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-white">Daily Goal</h4>
              <div className="text-gray-400 text-xs mt-0.5">Your commitment</div>
            </div>
            <button 
              onClick={() => onEdit(3)}
              className="text-blue-400 hover:text-blue-300 text-xs"
            >
              Edit
            </button>
          </div>
          <div className="text-gray-300 text-xs">
            {state.dailyGoal 
              ? `${state.dailyGoal.value} ${state.dailyGoal.type}/day`
              : 'No daily goal set'
            }
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-3">
        <button
          className="rounded-full bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-400 px-4 py-1.5 text-xs"
          onClick={onBack}
        >
          Back
        </button>
        <button
          className="rounded-full bg-blue-600/90 hover:bg-blue-600 text-white px-5 py-1.5 text-xs flex-1"
          onClick={onConfirm}
        >
          Create My Set
        </button>
      </div>
    </div>
  );
} 
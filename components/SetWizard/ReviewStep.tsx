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
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-white">
          Almost Ready!
        </h3>
        <p className="text-sm text-gray-400">
          Here&apos;s your personalized learning plan.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-[#1e1e1e]/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm text-white">Selected Scenarios</h4>
              <span className="text-xs text-gray-500">What you&apos;ll learn</span>
            </div>
            <button 
              onClick={() => onEdit(1)}
              className="text-blue-400 hover:text-blue-300 text-xs hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="space-y-2">
            {state.scenarios.map(scenario => (
              <div key={scenario} className="text-gray-300 text-sm flex items-center gap-2">
                <span className="text-blue-400/80">•</span>
                {scenario}
              </div>
            ))}
            {state.customGoal && (
              <div className="text-gray-400 text-sm pl-4">
                + {state.customGoal}
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#1e1e1e]/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm text-white">Learning Style</h4>
              <span className="text-xs text-gray-500">How you&apos;ll learn</span>
            </div>
            <button 
              onClick={() => onEdit(2)}
              className="text-blue-400 hover:text-blue-300 text-xs hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1 flex-1 bg-[#2a2a2a] rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500/80"
                style={{ width: `${state.tone}%` }}
              />
            </div>
            <span className="text-gray-300 text-sm min-w-[4rem]">
              {state.tone <= 30 ? 'Serious' : state.tone >= 70 ? 'Playful' : 'Balanced'}
            </span>
          </div>
        </div>

        <div className="bg-[#1e1e1e]/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm text-white">Daily Goal</h4>
              <span className="text-xs text-gray-500">Your commitment</span>
            </div>
            <button 
              onClick={() => onEdit(3)}
              className="text-blue-400 hover:text-blue-300 text-xs hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="text-gray-300 text-sm">
            {state.dailyGoal 
              ? `${state.dailyGoal.value} ${state.dailyGoal.type}/day`
              : 'No daily goal set'
            }
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          className="rounded-full bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-400 px-4 py-2 text-sm"
          onClick={onBack}
        >
          Back
        </button>
        <button
          className="rounded-full bg-blue-500/90 hover:bg-blue-500 text-white px-6 py-2 text-sm flex-1"
          onClick={onConfirm}
        >
          Create My Set
        </button>
      </div>
    </div>
  );
} 
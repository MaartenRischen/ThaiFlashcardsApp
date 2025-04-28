import React from 'react';
import { SetWizardState } from './SetWizardModal';

export function ReviewStep({ state, onConfirm, onBack }: {
  state: SetWizardState,
  onConfirm: () => void,
  onBack: () => void,
}) {
  return (
    <div className="space-y-3 px-2">
      <div className="space-y-1 text-center mb-4">
        <h3 className="text-lg font-medium text-white">
          Almost Ready!
        </h3>
      </div>

      <div className="space-y-3">
        {/* Proficiency Level Section */}
        <div className="bg-[#1e1e1e]/50 rounded-lg p-3">
          <div className="flex justify-center items-baseline gap-2 mb-1">
            <h4 className="text-sm font-medium text-white">Proficiency Level</h4>
            <span className="text-xs text-gray-500">Your current skill</span>
          </div>
          <div className="text-gray-300 text-sm font-medium text-center">{state.proficiency.levelEstimate}</div>
        </div>

        {/* Selected Scenarios Section */}
        <div className="bg-[#1e1e1e]/50 rounded-lg p-3">
          <div className="flex justify-center items-baseline gap-2 mb-1">
            <h4 className="text-sm font-medium text-white">Selected Scenarios</h4>
            <span className="text-xs text-gray-500">What you&apos;ll learn</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            {state.scenarios.map((scenario, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8AB4F8]"></span>
                <span className="text-gray-300 text-sm">{scenario}</span>
              </div>
            ))}
            {state.customGoal && (
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8AB4F8]"></span>
                <span className="text-gray-300 text-sm">{state.customGoal}</span>
              </div>
            )}
          </div>
        </div>

        {/* Learning Style Section */}
        <div className="bg-[#1e1e1e]/50 rounded-lg p-3">
          <div className="flex justify-center items-baseline gap-2 mb-1">
            <h4 className="text-sm font-medium text-white">Learning Style</h4>
            <span className="text-xs text-gray-500">How you&apos;ll learn</span>
          </div>
          <div className="text-gray-300 text-sm font-medium text-center">
            Ridiculousness Level: {state.tone}/10
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-3">
        <button
          onClick={onBack}
          className="text-[#8AB4F8] neumorphic-button"
        >
          Back
        </button>
        <button
          onClick={onConfirm}
          className="text-[#8AB4F8] neumorphic-button"
        >
          Create My Set
        </button>
      </div>
    </div>
  );
} 
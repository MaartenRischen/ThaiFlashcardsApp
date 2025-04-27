import React from 'react';
import { SetWizardState } from './SetWizardModal';

export function ReviewStep({ state, onConfirm, onBack }: {
  state: SetWizardState,
  onConfirm: () => void,
  onBack: () => void,
}) {
  const getLearningStyleName = () => {
    if (state.tone <= 3) return "Serious";
    if (state.tone >= 8) return "Ridiculous";
    return "Balanced";
  };

  return (
    <div className="space-y-3 px-2">
      <div className="space-y-1 text-center mb-4">
        <h3 className="text-lg font-medium text-white">
          Almost Ready!
        </h3>
        <p className="text-sm text-gray-400">
          Here&apos;s your personalized learning plan.
        </p>
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
        <div className="bg-[#2C2C2C] rounded-lg p-3">
          <div className="flex justify-center items-baseline gap-2 mb-1">
            <h4 className="text-sm font-medium text-[#E0E0E0]">Selected Scenarios</h4>
            <span className="text-xs text-[#BDBDBD]">What you&apos;ll learn</span>
          </div>
          <div className="flex flex-col items-center space-y-1 text-center">
            {state.scenarios.map(scenario => (
              <div key={scenario} className="text-[#E0E0E0] text-sm flex items-center gap-2 justify-center">
                <span className="text-[#BB86FC]">•</span>
                {scenario}
              </div>
            ))}
            {state.customGoal && (
              <div className="text-[#BDBDBD] text-sm mt-1 italic">
                + {state.customGoal}
              </div>
            )}
            {!state.customGoal && state.scenarios.length === 0 && (
              <div className="text-[#BDBDBD] text-sm italic">(Using custom instructions)</div>
            )}
          </div>
        </div>

        {/* Learning Style Section */}
        <div className="bg-[#2C2C2C] rounded-lg p-3">
          <div className="flex justify-center items-baseline gap-2 mb-1">
            <h4 className="text-sm font-medium text-[#E0E0E0]">Learning Style</h4>
            <span className="text-xs text-[#BDBDBD]">How you&apos;ll learn</span>
          </div>
          <div className="text-[#E0E0E0] text-sm font-medium text-center">
            {getLearningStyleName()}
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-3 pt-3">
        <button
          className="neumorphic-button text-[#BB86FC]"
          onClick={onBack}
        >
          Back
        </button>
        <button
          className="neumorphic-button text-[#BB86FC]"
          onClick={onConfirm}
        >
          Create My Set
        </button>
      </div>
    </div>
  );
} 
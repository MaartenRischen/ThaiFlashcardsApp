import React from 'react';
import { SetWizardState } from './SetWizardModal';
// import Image from 'next/image'; // REMOVE unused import

export function ReviewStep({ state, onConfirm, /* onEdit, */ onBack }: { // REMOVE unused onEdit prop
  state: SetWizardState,
  onConfirm: () => void,
  // onEdit: (step: number) => void, // REMOVE unused onEdit prop type
  onBack: () => void,
}) {
  // REMOVE unused getProficiencyIndex function
  // const getProficiencyIndex = () => {
  //   const levelMap = {
  //     'Complete Beginner': 0,
  //     'Basic Understanding': 1,
  //     'Intermediate': 2,
  //     'Advanced': 3,
  //     'Native/Fluent': 4,
  //     'God Mode': 5,
  //   };
  //   return levelMap[state.proficiency.levelEstimate as keyof typeof levelMap] ?? 0;
  // };

  // REMOVE unused getLearningStyleImage function
  // const getLearningStyleImage = () => {
  //   // Use string comparison instead of numeric
  //   if (state.tone === 'serious') return "A"; 
  //   if (state.tone === 'absolutely ridiculous') return "C";
  //   return "B"; // Default to Balanced
  // };

  // Get the learning style name
  const getLearningStyleName = () => {
    // Use string comparison instead of numeric
    if (state.tone === 'serious') return "Serious";
    if (state.tone === 'absolutely ridiculous') return "Ridiculous";
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
        <div className="bg-[#1e1e1e]/50 rounded-lg p-3">
          <div className="flex justify-center items-baseline gap-2 mb-1">
            <h4 className="text-sm font-medium text-white">Selected Scenarios</h4>
            <span className="text-xs text-gray-500">What you&apos;ll learn</span>
          </div>
          <div className="flex flex-col items-center space-y-1 text-center">
            {state.scenarios.map(scenario => (
              <div key={scenario} className="text-gray-300 text-sm flex items-center gap-2 justify-center">
                <span className="text-blue-400/80">•</span>
                {scenario}
              </div>
            ))}
            {state.customGoal && (
              <div className="text-gray-400 text-sm mt-1 italic">
                + {state.customGoal}
              </div>
            )}
            {!state.customGoal && state.scenarios.length === 0 && (
              <div className="text-gray-500 text-sm italic">(Using custom instructions)</div>
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
            {getLearningStyleName()}
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-3 pt-3">
        <button
          className="neumorphic-button text-blue-400"
          onClick={onBack}
        >
          Back
        </button>
        <button
          className="neumorphic-button text-blue-400"
          onClick={onConfirm}
        >
          Create My Set
        </button>
      </div>
    </div>
  );
} 
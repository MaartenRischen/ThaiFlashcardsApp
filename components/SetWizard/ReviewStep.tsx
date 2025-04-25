import React from 'react';
import { SetWizardState } from './SetWizardModal';
import Image from 'next/image';

export function ReviewStep({ state, onConfirm, onEdit, onBack }: {
  state: SetWizardState,
  onConfirm: () => void,
  onEdit: (step: number) => void,
  onBack: () => void,
}) {
  // Get the proficiency level index (0-4) for image selection
  const getProficiencyIndex = () => {
    const levelMap = {
      'Complete Beginner': 0,
      'Basic Understanding': 1,
      'Intermediate': 2,
      'Advanced': 3,
      'Native/Fluent': 4
    };
    return levelMap[state.proficiency.levelEstimate as keyof typeof levelMap] || 0;
  };

  // Get the learning style image based on tone value
  const getLearningStyleImage = () => {
    if (state.tone <= 30) return "A"; // Serious
    if (state.tone >= 70) return "C"; // Playful/Ridiculous
    return "B"; // Balanced
  };

  // Get the learning style name
  const getLearningStyleName = () => {
    if (state.tone <= 30) return "Serious";
    if (state.tone >= 70) return "Ridiculous";
    return "Balanced";
  };

  return (
    <div className="space-y-5 px-2">
      <div className="space-y-2 text-center">
        <h3 className="text-lg font-medium text-white">
          Almost Ready!
        </h3>
        <p className="text-sm text-gray-400">
          Here&apos;s your personalized learning plan.
        </p>
      </div>

      <div className="space-y-4">
        {/* Proficiency Level Section */}
        <div className="bg-[#1e1e1e]/50 rounded-xl p-4">
          <div className="flex flex-col items-center mb-3">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm text-white">Proficiency Level</h4>
              <span className="text-xs text-gray-500">Your current skill</span>
            </div>
            <button 
              onClick={() => onEdit(1)}
              className="neumorphic-button text-blue-400 text-xs py-1 px-3 mt-1"
            >
              Edit
            </button>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative w-[240px] h-[160px] rounded-lg overflow-hidden border border-blue-900/30 mb-3">
              <Image
                src={`/images/level/${getProficiencyIndex() + 1}.png`}
                alt={`${state.proficiency.levelEstimate} level illustration`}
                width={240}
                height={160}
                className="object-cover"
              />
            </div>
            <div className="text-gray-300 text-sm font-medium">{state.proficiency.levelEstimate}</div>
          </div>
        </div>

        {/* Selected Scenarios Section */}
        <div className="bg-[#1e1e1e]/50 rounded-xl p-4">
          <div className="flex flex-col items-center mb-3">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm text-white">Selected Scenarios</h4>
              <span className="text-xs text-gray-500">What you&apos;ll learn</span>
            </div>
            <button 
              onClick={() => onEdit(2)}
              className="neumorphic-button text-blue-400 text-xs py-1 px-3 mt-1"
            >
              Edit
            </button>
          </div>
          <div className="flex flex-col items-center space-y-2">
            {state.scenarios.map(scenario => (
              <div key={scenario} className="text-gray-300 text-sm flex items-center gap-2">
                <span className="text-blue-400/80">•</span>
                {scenario}
              </div>
            ))}
            {state.customGoal && (
              <div className="text-gray-400 text-sm">
                + {state.customGoal}
              </div>
            )}
          </div>
        </div>

        {/* Learning Style Section */}
        <div className="bg-[#1e1e1e]/50 rounded-xl p-4">
          <div className="flex flex-col items-center mb-3">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm text-white">Learning Style</h4>
              <span className="text-xs text-gray-500">How you&apos;ll learn</span>
            </div>
            <button 
              onClick={() => onEdit(3)}
              className="neumorphic-button text-blue-400 text-xs py-1 px-3 mt-1"
            >
              Edit
            </button>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative w-[240px] h-[160px] rounded-lg overflow-hidden border border-blue-900/30 mb-3">
              <Image
                src={`/images/serious/${getLearningStyleImage()}.png`}
                alt={`${getLearningStyleName()} learning style illustration`}
                width={240}
                height={160}
                className="object-cover"
              />
            </div>
            <div className="text-gray-300 text-sm font-medium">
              {getLearningStyleName()}
            </div>
          </div>
        </div>

        {/* Daily Goal Section */}
        <div className="bg-[#1e1e1e]/50 rounded-xl p-4">
          <div className="flex flex-col items-center mb-3">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm text-white">Daily Goal</h4>
              <span className="text-xs text-gray-500">Your commitment</span>
            </div>
            <button 
              onClick={() => onEdit(4)}
              className="neumorphic-button text-blue-400 text-xs py-1 px-3 mt-1"
            >
              Edit
            </button>
          </div>
          <div className="text-gray-300 text-sm text-center">
            {state.dailyGoal 
              ? `${state.dailyGoal.value} ${state.dailyGoal.type}/day`
              : 'No daily goal set'
            }
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-3 pt-4">
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
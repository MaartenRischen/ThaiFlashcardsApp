import React from 'react';
import { SetWizardState } from './SetWizardModal';
import { getToneLabel } from '@/app/lib/utils';

export function ReviewStep({ state, onConfirm, onBack, onCardCountChange }: {
  state: SetWizardState,
  onConfirm: () => void,
  onBack: () => void,
  onCardCountChange: (newCount: number) => void;
}) {
  const selectedTopicDisplay = state.selectedTopic 
    ? state.selectedTopic.value 
    : 'None Selected';

  const topicTypeDisplay = state.selectedTopic
    ? state.selectedTopic.type.charAt(0).toUpperCase() + state.selectedTopic.type.slice(1)
    : '';

  const cardOptions = [5, 10, 15, 20];

  return (
    <div className="space-y-6 px-2">
      <div className="text-center">
        <h3 className="text-2xl font-medium text-[#60A5FA]">
          Almost Ready!
        </h3>
      </div>

      <div className="space-y-4">
        {/* Proficiency Level Section */}
        <div className="bg-[#1e1e1e]/80 rounded-lg p-4 border border-[#2C2C2C]">
          <div className="flex justify-between items-baseline mb-2">
            <h4 className="text-sm font-medium text-white">Proficiency Level</h4>
            <span className="text-xs text-gray-500">Your current skill</span>
          </div>
          <div className="text-gray-300 text-sm font-medium">{state.proficiency.levelEstimate}</div>
        </div>

        {/* Selected Topic Section */}
        <div className="bg-[#1e1e1e]/80 rounded-lg p-4 border border-[#2C2C2C]">
          <div className="flex justify-between items-baseline mb-2">
            <h4 className="text-sm font-medium text-white">Selected Topic</h4>
            <span className="text-xs text-gray-500">What you&apos;ll learn</span>
          </div>
            {state.selectedTopic ? (
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${state.selectedTopic.type === 'weird' ? 'bg-purple-400' : 'bg-blue-400'}`}></span>
                <span className="text-gray-300 text-sm">{selectedTopicDisplay}</span> 
                <span className="text-xs text-gray-500">({topicTypeDisplay})</span>
              </div>
            ) : (
              <span className="text-gray-400 text-sm italic">No topic selected</span>
            )}
        </div>
        
        {/* Card Count Dropdown Section */}
        <div className="bg-[#1e1e1e]/80 rounded-lg p-4 border border-[#2C2C2C]">
          <div className="flex justify-between items-baseline mb-2">
            <h4 className="text-sm font-medium text-white">Set Size</h4>
             <span className="text-xs text-gray-500">Number of cards</span>
          </div>
            <select
              value={state.cardCount} 
              onChange={(e) => onCardCountChange(parseInt(e.target.value, 10))}
            className="w-full bg-[#2C2C2C] border border-[#404040] text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
            >
              {cardOptions.map(count => (
                <option key={count} value={count}>
                  {count} Cards
                </option>
              ))}
            </select>
        </div>

        {/* Learning Style Section */}
        <div className="bg-[#1e1e1e]/80 rounded-lg p-4 border border-[#2C2C2C]">
          <div className="flex justify-between items-baseline mb-2">
            <h4 className="text-sm font-medium text-white">Learning Style</h4>
            <span className="text-xs text-gray-500">How you&apos;ll learn</span>
          </div>
          <div className="text-gray-300 text-sm font-medium">
            {getToneLabel(state.tone)}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-6 py-2 rounded-lg bg-[#2C2C2C] hover:bg-[#363636] text-[#60A5FA] font-medium transition-colors"
        >
          Back
        </button>
        <button
          onClick={onConfirm}
          className="px-6 py-2 rounded-lg bg-[#60A5FA] hover:bg-[#60A5FA]/90 text-[#1F1F1F] font-medium transition-colors"
        >
          Create My Set
        </button>
      </div>
    </div>
  );
} 
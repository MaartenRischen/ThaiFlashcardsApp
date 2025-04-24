import React from 'react';

interface SetWizardState {
  proficiency: {
    canDoSelections: string[];
    levelEstimate: string;
  };
  goals: {
    scenarios: string[];
    customGoal?: string;
  };
  topics: string[];
  tone: number;
  dailyGoal?: {
    type: 'cards' | 'minutes';
    value: number;
  };
}

export function ReviewStep({ state, onConfirm, onEdit, onBack }: {
  state: SetWizardState,
  onConfirm: () => void,
  onEdit: (step: number) => void,
  onBack: () => void,
}) {
  return (
    <div className="space-y-6 p-4">
      <div className="text-lg font-semibold text-blue-700 mb-2">✅ Review your choices</div>
      <div className="space-y-3">
        <div className="bg-gray-50 p-3 rounded flex justify-between items-center">
          <div>
            <div className="font-bold text-gray-900">Proficiency</div>
            <div className="text-gray-900">{state.proficiency.canDoSelections.length > 0 ? state.proficiency.canDoSelections.join(', ') : 'Skipped'}</div>
            <div className="text-sm text-gray-500">Level: {state.proficiency.levelEstimate || 'unknown'}</div>
          </div>
          <button className="text-blue-600 underline text-sm" onClick={() => onEdit(1)}>Edit</button>
        </div>
        <div className="bg-gray-50 p-3 rounded flex justify-between items-center">
          <div>
            <div className="font-bold text-gray-900">Scenarios</div>
            <div className="text-gray-900">{state.goals.scenarios.join(', ') || 'None'}</div>
            {state.goals.customGoal && <div className="text-sm text-gray-500">Custom: {state.goals.customGoal}</div>}
          </div>
          <button className="text-blue-600 underline text-sm" onClick={() => onEdit(2)}>Edit</button>
        </div>
        <div className="bg-gray-50 p-3 rounded flex justify-between items-center">
          <div>
            <div className="font-bold text-gray-900">Topics</div>
            <div className="text-gray-900">{state.topics.length > 0 ? state.topics.join(', ') : 'None'}</div>
          </div>
          <button className="text-blue-600 underline text-sm" onClick={() => onEdit(3)}>Edit</button>
        </div>
        <div className="bg-gray-50 p-3 rounded flex justify-between items-center">
          <div>
            <div className="font-bold text-gray-900">Tone</div>
            <div className="text-gray-900">{state.tone <= 30 ? 'Serious/Practical' : state.tone >= 70 ? 'Ridiculous/Comedic' : 'Balanced'} ({state.tone})</div>
          </div>
          <button className="text-blue-600 underline text-sm" onClick={() => onEdit(4)}>Edit</button>
        </div>
        <div className="bg-gray-50 p-3 rounded flex justify-between items-center">
          <div>
            <div className="font-bold text-gray-900">Daily Goal</div>
            <div className="text-gray-900">{state.dailyGoal ? `${state.dailyGoal.value} ${state.dailyGoal.type === 'cards' ? 'cards/day' : 'min/day'}` : 'None'}</div>
          </div>
          <button className="text-blue-600 underline text-sm" onClick={() => onEdit(5)}>Edit</button>
        </div>
      </div>
      <div className="flex gap-4 mt-6">
        <button
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded shadow hover:bg-gray-300"
          onClick={onBack}
        >
          Back
        </button>
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700"
          onClick={onConfirm}
        >
          Create My Set
        </button>
      </div>
    </div>
  );
} 
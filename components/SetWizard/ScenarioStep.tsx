import React, { useState } from 'react';

const scenarios = [
  'Ordering Food & Drinks',
  'Travel & Directions',
  'Shopping',
  'Making Small Talk',
  'Business Meetings',
  'Daily Routines',
  'Emergencies',
  'Custom Scenario',
];

export function ScenarioStep({ value, onNext, onBack }: { 
  value: { scenarios: string[]; customGoal?: string }, 
  onNext: (data: { scenarios: string[]; customGoal?: string }) => void,
  onBack: () => void
}) {
  const [selected, setSelected] = useState<string[]>(value?.scenarios || []);
  const [custom, setCustom] = useState(value?.customGoal || "");

  const handleToggle = (scenario: string) => {
    setSelected(sel =>
      sel.includes(scenario)
        ? sel.filter(s => s !== scenario)
        : [...sel, scenario]
    );
  };

  const handleNext = () => {
    onNext({ scenarios: selected, customGoal: selected.includes('Custom Scenario') ? custom : undefined });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">
          🎯 What do you want to be able to do in Thai?
        </h3>
        <p className="text-gray-400">Choose one or more scenarios that interest you.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {scenarios.map(scenario => (
          <button
            key={scenario}
            onClick={() => handleToggle(scenario)}
            className={`
              neumorphic-button text-left px-4 py-3 transition-all
              ${selected.includes(scenario) ? 'selected' : ''}
            `}
          >
            {scenario}
          </button>
        ))}
      </div>

      {selected.includes('Custom Scenario') && (
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Describe your custom scenario:</label>
          <input
            type="text"
            className="neumorphic-input w-full"
            placeholder="E.g., Talking about hobbies..."
            value={custom}
            onChange={e => setCustom(e.target.value)}
          />
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="neumorphic-button bg-[#2a2a2a] hover:bg-[#333333] text-white px-8 py-3"
        >
          Back
        </button>
        <button
          className="neumorphic-button bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
          onClick={handleNext}
          disabled={selected.length === 0}
        >
          Next
        </button>
      </div>
    </div>
  );
} 
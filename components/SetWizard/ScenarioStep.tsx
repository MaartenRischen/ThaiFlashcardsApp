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
    <div className="space-y-5 px-2">
      <div className="space-y-2.5">
        <h3 className="text-base font-medium text-white">
          What do you want to be able to do in Thai?
        </h3>
        <p className="text-xs text-gray-400">Choose one or more scenarios that interest you.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {scenarios.map(scenario => (
          <button
            key={scenario}
            onClick={() => handleToggle(scenario)}
            onTouchStart={(e) => {
              e.preventDefault();
              handleToggle(scenario);
            }}
            className={`
              text-left px-3 py-2 rounded-full text-xs transition-all
              ${selected.includes(scenario)
                ? 'bg-blue-600/90 text-white shadow-sm'
                : 'bg-[#1e1e1e] text-gray-300 hover:bg-[#2a2a2a]'}
              active:bg-blue-600/90 active:text-white
              touch-none select-none
            `}
          >
            {scenario}
          </button>
        ))}
      </div>

      {selected.includes('Custom Scenario') && (
        <div className="space-y-2">
          <label className="text-xs text-gray-400">Describe your custom scenario:</label>
          <input
            type="text"
            className="w-full bg-[#1e1e1e] border border-gray-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="E.g., Talking about hobbies..."
            value={custom}
            onChange={e => setCustom(e.target.value)}
          />
        </div>
      )}

      <div className="flex justify-between pt-3">
        <button
          onClick={onBack}
          className="rounded-full bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-400 px-4 py-1.5 text-xs"
        >
          Back
        </button>
        <button
          className={`rounded-full ${selected.length === 0 ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600/90 hover:bg-blue-600'} text-white px-4 py-1.5 text-xs`}
          onClick={handleNext}
          disabled={selected.length === 0}
        >
          Next
        </button>
      </div>
    </div>
  );
} 
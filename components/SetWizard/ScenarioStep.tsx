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

export function ScenarioStep({ value, onNext }: { value: { scenarios: string[]; customGoal?: string }, onNext: (data: { scenarios: string[], customGoal?: string }) => void }) {
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
    <div className="space-y-6 p-4">
      <div className="text-lg font-semibold text-blue-700 mb-2">🎯 What do you want to be able to do in Thai? Choose one or more scenarios.</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {scenarios.map(scenario => (
          <button
            key={scenario}
            className={`border rounded-lg px-4 py-3 text-left shadow transition ${selected.includes(scenario) ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-300 hover:border-blue-400'}`}
            onClick={() => handleToggle(scenario)}
            type="button"
          >
            {scenario}
          </button>
        ))}
      </div>
      {selected.includes('Custom Scenario') && (
        <input
          type="text"
          className="mt-3 w-full border rounded px-3 py-2"
          placeholder="Describe your custom scenario"
          value={custom}
          onChange={e => setCustom(e.target.value)}
        />
      )}
      <div className="flex gap-4 mt-6">
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50"
          disabled={selected.length === 0}
          onClick={handleNext}
        >
          Next
        </button>
      </div>
    </div>
  );
} 
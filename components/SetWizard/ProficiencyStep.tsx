import React, { useState } from 'react';

const canDoGroups = [
  {
    level: 'Novice Low',
    statements: [
      'I can say hello and goodbye.',
      'I can introduce myself.',
    ],
  },
  {
    level: 'Novice Mid',
    statements: [
      'I can order food and drinks.',
      'I can ask for directions.',
    ],
  },
  {
    level: 'Novice High',
    statements: [
      'I can describe my daily routine.',
      'I can ask and answer simple questions about familiar topics.',
    ],
  },
  {
    level: 'Intermediate Low',
    statements: [
      'I can participate in simple conversations on familiar topics.',
      'I can understand the main idea of short announcements or messages.',
    ],
  },
];

function estimateLevel(selected: string[]): string {
  for (let i = canDoGroups.length - 1; i >= 0; i--) {
    if (canDoGroups[i].statements.some(s => selected.includes(s))) {
      return canDoGroups[i].level;
    }
  }
  return 'unknown';
}

export function ProficiencyStep({ value, onNext }: { value: { canDoSelections: string[]; levelEstimate: string }, onNext: (data: { canDoSelections: string[], levelEstimate: string }) => void }) {
  const [selected, setSelected] = useState<string[]>(value?.canDoSelections || []);
  const [skipped, setSkipped] = useState(false);

  const handleToggle = (statement: string) => {
    setSelected(sel =>
      sel.includes(statement)
        ? sel.filter(s => s !== statement)
        : [...sel, statement]
    );
    setSkipped(false);
  };

  const handleSkip = () => {
    setSkipped(true);
    setSelected([]);
    onNext({ canDoSelections: [], levelEstimate: 'unknown' });
  };

  const handleNext = () => {
    onNext({ canDoSelections: selected, levelEstimate: estimateLevel(selected) });
  };

  return (
    <div className="space-y-6 p-4">
      <div className="text-lg font-semibold text-blue-700 mb-2">🗣️ Let's see what you can already do in Thai! Select all that apply.</div>
      {canDoGroups.map(group => (
        <div key={group.level} className="mb-4">
          <div className="font-bold text-gray-700 mb-1">{group.level}</div>
          <div className="flex flex-col gap-2">
            {group.statements.map(statement => (
              <label key={statement} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(statement)}
                  onChange={() => handleToggle(statement)}
                  className="accent-blue-600"
                />
                <span>{statement}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      <div className="flex gap-4 mt-6">
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50"
          disabled={selected.length === 0 && !skipped}
          onClick={handleNext}
        >
          Next
        </button>
        <button
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded shadow hover:bg-gray-300"
          onClick={handleSkip}
        >
          I'm not sure / Skip
        </button>
      </div>
    </div>
  );
} 
import React, { useState } from 'react';

const cardOptions = [5, 10, 20];
const minuteOptions = [5, 10, 20];

export function DailyGoalStep({ value, onNext }: { value?: { type: 'cards' | 'minutes'; value: number }, onNext: (goal?: { type: 'cards' | 'minutes'; value: number }) => void }) {
  const [goal, setGoal] = useState<{ type: 'cards' | 'minutes'; value: number } | undefined>(value);

  return (
    <div className="space-y-6 p-4">
      <div className="text-lg font-semibold text-blue-700 mb-2">⏰ Want to set a daily study goal? (Optional)</div>
      <div className="flex flex-col gap-4">
        <div>
          <div className="font-bold mb-1">Cards per day</div>
          <div className="flex gap-2">
            {cardOptions.map((count) => (
              <button
                key={count}
                className={`px-4 py-2 rounded border transition ${goal?.type === 'cards' && goal.value === count ? 'bg-blue-200 border-blue-500 text-blue-900' : 'bg-white border-gray-300 hover:border-blue-400 text-gray-900'}`}
                onClick={() => setGoal({ type: 'cards', value: count })}
                type="button"
              >
                {count} cards
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="font-bold mb-1">Minutes per day</div>
          <div className="flex gap-2">
            {minuteOptions.map((option) => (
              <button
                key={option}
                className={`px-4 py-2 rounded border transition ${goal?.type === 'minutes' && goal.value === option ? 'bg-blue-200 border-blue-500 text-blue-900' : 'bg-white border-gray-300 hover:border-blue-400 text-gray-900'}`}
                onClick={() => setGoal({ type: 'minutes', value: option })}
                type="button"
              >
                {option} min
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-4 mt-6">
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700"
          onClick={() => onNext(goal)}
        >
          Next
        </button>
        <button
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded shadow hover:bg-gray-300"
          onClick={() => onNext(undefined)}
        >
          Skip for Now
        </button>
      </div>
    </div>
  );
} 
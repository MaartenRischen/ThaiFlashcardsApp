import React, { useState } from 'react';

const subtopicSuggestions: Record<string, string[]> = {
  'Ordering Food & Drinks': ['vegetarian food', 'street food', 'ingredients', 'paying the bill'],
  'Travel & Directions': ['public transport', 'taxi', 'asking for help'],
  'Shopping': ['bargaining', 'clothing', 'souvenirs'],
  'Making Small Talk': ['weather', 'hobbies', 'family'],
  'Business Meetings': ['introductions', 'presentations', 'emails'],
  'Daily Routines': ['morning', 'evening', 'weekends'],
  'Emergencies': ['medical', 'police', 'lost items'],
};

function uniq(arr: string[]) {
  return Array.from(new Set(arr));
}

export function TopicStep({ value, onNext, scenarios }: { value: string[], onNext: (topics: string[]) => void, scenarios: string[] }) {
  const [topics, setTopics] = useState<string[]>(value || []);
  const [custom, setCustom] = useState('');

  // Aggregate suggestions for selected scenarios
  const suggestions = uniq(scenarios.flatMap(s => subtopicSuggestions[s] || []));

  const handleChip = (topic: string) => {
    setTopics(ts =>
      ts.includes(topic)
        ? ts.filter(t => t !== topic)
        : [...ts, topic]
    );
  };

  const handleAddCustom = () => {
    if (custom.trim() && !topics.includes(custom.trim())) {
      setTopics(ts => [...ts, custom.trim()]);
      setCustom('');
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="text-lg font-semibold text-blue-700 mb-2">🔎 Want to focus on something specific? (Optional)</div>
      <div className="flex flex-wrap gap-2 mb-4">
        {suggestions.map(topic => (
          <button
            key={topic}
            className={`px-3 py-1 rounded-full border text-sm transition ${topics.includes(topic) ? 'bg-blue-200 border-blue-500' : 'bg-white border-gray-300 hover:border-blue-400'}`}
            onClick={() => handleChip(topic)}
            type="button"
          >
            {topic}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2"
          placeholder="Add a custom topic"
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAddCustom(); }}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          onClick={handleAddCustom}
          type="button"
        >
          Add
        </button>
      </div>
      <div className="flex gap-4 mt-6">
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700"
          onClick={() => onNext(topics)}
        >
          Next
        </button>
      </div>
    </div>
  );
} 
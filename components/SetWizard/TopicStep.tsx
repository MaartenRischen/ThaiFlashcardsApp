import React, { useState } from 'react';

type ScenarioKey = 
  | 'Ordering Food & Drinks'
  | 'Travel & Directions'
  | 'Shopping'
  | 'Making Small Talk'
  | 'Business Meetings'
  | 'Daily Routines'
  | 'Emergencies';

const defaultTopics: Record<ScenarioKey, string[]> = {
  'Ordering Food & Drinks': [
    'Restaurant Basics',
    'Drinks & Beverages',
    'Thai Dishes',
    'Dietary Preferences',
    'Street Food'
  ],
  'Travel & Directions': [
    'Transportation',
    'Locations & Places',
    'Asking for Directions',
    'Tourist Attractions',
    'Accommodation'
  ],
  'Shopping': [
    'Numbers & Prices',
    'Clothing & Sizes',
    'Bargaining',
    'Shopping Venues',
    'Products & Items'
  ],
  'Making Small Talk': [
    'Greetings & Farewells',
    'Weather',
    'Hobbies & Interests',
    'Family',
    'Work & Study'
  ],
  'Business Meetings': [
    'Formal Greetings',
    'Scheduling',
    'Presentations',
    'Business Terms',
    'Office Environment'
  ],
  'Daily Routines': [
    'Time & Schedule',
    'Activities',
    'Household',
    'Health & Wellness',
    'Social Life'
  ],
  'Emergencies': [
    'Medical Terms',
    'Emergency Services',
    'Health Issues',
    'Safety & Security',
    'Asking for Help'
  ]
};

export function TopicStep({ value, scenarios, onNext, onBack }: { 
  value: string[], 
  scenarios: string[],
  onNext: (topics: string[]) => void,
  onBack: () => void
}) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>(value || []);
  const [customTopic, setCustomTopic] = useState('');

  const relevantTopics = scenarios.reduce((acc, scenario) => {
    if (scenario in defaultTopics) {
      acc.push(...defaultTopics[scenario as ScenarioKey]);
    }
    return acc;
  }, [] as string[]);

  const uniqueTopics = Array.from(new Set(relevantTopics));

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const addCustomTopic = () => {
    if (customTopic.trim() && !selectedTopics.includes(customTopic.trim())) {
      setSelectedTopics(prev => [...prev, customTopic.trim()]);
      setCustomTopic('');
    }
  };

  const handleNext = () => {
    onNext(selectedTopics);
  };

  return (
    <div className="space-y-5 px-2">
      <div className="space-y-2.5">
        <h3 className="text-base font-medium text-white">
          Choose Your Learning Topics
        </h3>
        <p className="text-xs text-gray-400">
          Select specific topics you&apos;d like to focus on within your chosen scenarios.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {[...uniqueTopics, ...selectedTopics.filter(topic => !uniqueTopics.includes(topic))].map(topic => (
          <button
            key={topic}
            onClick={() => toggleTopic(topic)}
            onTouchStart={(e) => {
              e.preventDefault();
              toggleTopic(topic);
            }}
            className={`
              text-left px-3 py-2 rounded-full text-xs transition-all
              ${selectedTopics.includes(topic)
                ? 'bg-blue-600/90 text-white shadow-sm'
                : 'bg-[#1e1e1e] text-gray-300 hover:bg-[#2a2a2a]'}
              active:bg-blue-600/90 active:text-white
              touch-none select-none
            `}
          >
            {topic}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        <h4 className="text-sm font-medium text-white">
          Add Custom Topic
        </h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder="Enter a custom topic..."
            className="flex-1 bg-[#1e1e1e] border border-gray-800 rounded-full px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={addCustomTopic}
            disabled={!customTopic.trim()}
            className={`rounded-full ${!customTopic.trim() ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600/90 hover:bg-blue-600'} text-white px-3 py-1.5 text-xs`}
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex justify-between pt-3">
        <button
          onClick={onBack}
          className="rounded-full bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-400 px-4 py-1.5 text-xs"
        >
          Back
        </button>
        <button
          className={`rounded-full ${selectedTopics.length === 0 ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600/90 hover:bg-blue-600'} text-white px-4 py-1.5 text-xs`}
          onClick={handleNext}
          disabled={selectedTopics.length === 0}
        >
          Next
        </button>
      </div>
    </div>
  );
} 
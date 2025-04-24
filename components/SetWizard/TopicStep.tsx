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
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">
          Choose Your Learning Topics
        </h3>
        <p className="text-gray-400">
          Select specific topics you&apos;d like to focus on within your chosen scenarios.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[...uniqueTopics, ...selectedTopics.filter(topic => !uniqueTopics.includes(topic))].map(topic => (
          <button
            key={topic}
            onClick={() => toggleTopic(topic)}
            className={`
              neumorphic-button text-left px-4 py-3 transition-all
              ${selectedTopics.includes(topic)
                ? 'bg-blue-600 text-white border-blue-500 shadow-blue-900/20'
                : 'bg-[#2a2a2a] text-gray-300 hover:text-white'}
            `}
          >
            {topic}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">
          Add Custom Topic
        </h4>
        <div className="flex gap-3">
          <input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder="Enter a custom topic..."
            className="neumorphic-input flex-1"
          />
          <button
            onClick={addCustomTopic}
            disabled={!customTopic.trim()}
            className="neumorphic-button bg-blue-600 hover:bg-blue-700 text-white px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>

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
          disabled={selectedTopics.length === 0}
        >
          Next
        </button>
      </div>
    </div>
  );
} 
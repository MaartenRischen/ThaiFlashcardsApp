import React, { useState } from 'react';

// Reduced list of pre-made scenarios
const scenarios = [
  'Ordering Food & Drinks',
  'Travel & Directions',
  'Shopping',
  'Making Small Talk',
  'Business Meetings',
  'Daily Routines',
  'Emergencies',
  'Dating & Romance',
  'Surviving a Zombie Apocalypse',
  'Convincing Elephants to Dance',
];

const CUSTOM_SCENARIO = 'Tell Us! (recommended)';

export function ScenarioStep({ value, onNext, onBack }: { 
  value: { scenarios: string[]; customGoal?: string }, 
  onNext: (data: { scenarios: string[]; customGoal?: string }) => void,
  onBack: () => void
}) {
  // Map old 'Custom Scenario' to new name for backward compatibility
  const initialScenarios = value?.scenarios?.map(s => 
    s === 'Custom Scenario' ? CUSTOM_SCENARIO : s
  ) || [];
  
  const [selected, setSelected] = useState<string[]>(initialScenarios);
  const [custom, setCustom] = useState(value?.customGoal || "");
  const [customTags, setCustomTags] = useState<string[]>([]);

  const handleToggle = (scenario: string) => {
    setSelected(sel =>
      sel.includes(scenario)
        ? sel.filter(s => s !== scenario)
        : [...sel, scenario]
    );
  };

  const handleRemoveCustomTag = (tag: string) => {
    // Remove from customTags
    setCustomTags(prev => prev.filter(t => t !== tag));
    // Also remove from selected
    setSelected(prev => prev.filter(s => s !== tag));
  };

  const handleAddCustomTag = () => {
    if (custom.trim()) {
      // Add as a custom tag
      const newTag = custom.trim();
      if (!customTags.includes(newTag)) {
        setCustomTags(prev => [...prev, newTag]);
        
        // Also select it
        if (!selected.includes(newTag)) {
          setSelected(prev => [...prev, newTag]);
        }
      }
      
      // Also make sure the "Tell Us" option is selected
      if (!selected.includes(CUSTOM_SCENARIO)) {
        setSelected(prev => [...prev, CUSTOM_SCENARIO]);
      }
      
      // Clear the input field after adding
      setCustom("");
    }
  };

  const handleCustomKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomTag();
    }
  };

  const handleNext = () => {
    // Map back to 'Custom Scenario' for compatibility with rest of app
    const mappedScenarios = selected.map(s => 
      s === CUSTOM_SCENARIO ? 'Custom Scenario' : s
    );
    
    // If custom tags are selected, filter them out before sending to next step
    // as they'll be included in the customGoal
    const filteredScenarios = mappedScenarios.filter(s => 
      !customTags.includes(s)
    );
    
    // Include custom tags in the customGoal string if they exist
    let customGoalText = custom;
    if (selected.includes(CUSTOM_SCENARIO) && customTags.length > 0) {
      // Combine the original custom text with tags if both exist
      const customText = custom.trim() ? `${custom.trim()}. ` : '';
      const tagsText = `Selected topics: ${customTags.join(', ')}`;
      customGoalText = customText + tagsText;
    }
    
    onNext({ 
      scenarios: filteredScenarios, 
      customGoal: selected.includes(CUSTOM_SCENARIO) ? customGoalText : undefined 
    });
  };

  return (
    <div className="space-y-5 px-2">
      <div className="space-y-2.5 text-center">
        <h3 className="text-base font-medium text-white">
          What do you want to be able to do in Thai?
        </h3>
        <p className="text-xs text-gray-400">Choose one or more scenarios that interest you.</p>
      </div>

      {/* Recommended option - highlighted */}
      <div className="mb-5">
        <button
          onClick={() => handleToggle(CUSTOM_SCENARIO)}
          onTouchStart={(e) => {
            e.preventDefault();
            handleToggle(CUSTOM_SCENARIO);
          }}
          className={`
            w-full text-left px-4 py-3 rounded-lg text-sm transition-all
            ${selected.includes(CUSTOM_SCENARIO)
              ? 'bg-blue-600/90 text-white shadow-md border-2 border-blue-500'
              : 'bg-blue-900/30 text-blue-300 hover:bg-blue-800/40 border border-blue-600/30'}
            active:bg-blue-600/90 active:text-white
            touch-none select-none font-medium relative overflow-hidden
          `}
        >
          <span className="absolute top-0 right-0 bg-blue-500 text-[10px] px-2 py-0.5 rounded-bl-md font-medium">
            RECOMMENDED
          </span>
          <div className="mt-1 text-center">{CUSTOM_SCENARIO}</div>
          <div className="text-[10px] mt-1 opacity-80 text-center">
            Get a personalized set tailored exactly to your needs
          </div>
        </button>

        {selected.includes(CUSTOM_SCENARIO) && (
          <div className="mt-3">
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-[#1e1e1e] border border-gray-800 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="E.g., Talking to locals at the beach, ordering street food..."
                value={custom}
                onChange={e => setCustom(e.target.value)}
                onKeyPress={handleCustomKeyPress}
              />
              <button
                onClick={handleAddCustomTag}
                className="bg-blue-600/70 hover:bg-blue-600/90 text-white px-3 rounded-md text-xs font-medium"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Display custom tags first */}
        {customTags.length > 0 && (
          <div className="col-span-2 mb-3">
            <div className="opacity-80 text-xs text-gray-400 pb-2 text-center">Your custom scenarios:</div>
            {customTags.map((tag, index) => (
              <div 
                key={`custom-${index}`}
                className={`
                  relative flex items-center justify-between px-3 py-2 mb-1 rounded-lg text-xs
                  ${selected.includes(tag)
                    ? 'bg-green-600/90 text-white shadow-sm'
                    : 'bg-green-900/30 text-green-300 hover:bg-green-800/40'}
                  transition-all
                `}
              >
                <span className="pr-6">{tag}</span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleToggle(tag)}
                    className={`px-2 py-0.5 rounded-full text-[10px] ${selected.includes(tag) ? 'bg-green-700 text-white' : 'bg-green-800/50 text-green-200'}`}
                  >
                    {selected.includes(tag) ? '✓ Selected' : 'Select'}
                  </button>
                  <button
                    onClick={() => handleRemoveCustomTag(tag)}
                    className="h-5 w-5 flex items-center justify-center rounded-full bg-green-700/50 hover:bg-red-600/70 text-white"
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="col-span-2 opacity-80 text-xs text-gray-400 pt-1 pb-2 text-center">
          {customTags.length > 0 ? 'Or choose from our pre-made scenarios:' : 'Choose from our pre-made scenarios:'}
        </div>

        {/* Pre-made scenarios */}
        {scenarios.map(scenario => (
          <div
            key={scenario}
            className={`
              relative flex items-center text-left px-3 py-2 rounded-full text-xs transition-all
              ${selected.includes(scenario)
                ? 'bg-blue-600/90 text-white shadow-sm'
                : 'bg-[#1e1e1e] text-gray-300 hover:bg-[#2a2a2a]'}
              active:bg-blue-600/90 active:text-white
              touch-none select-none overflow-hidden
            `}
          >
            <button
              onClick={() => handleToggle(scenario)}
              onTouchStart={(e) => {
                e.preventDefault();
                handleToggle(scenario);
              }}
              className="flex-1 text-left overflow-hidden overflow-ellipsis whitespace-nowrap pr-2"
            >
              {scenario}
            </button>
            {selected.includes(scenario) && (
              <span className="bg-blue-700 text-[10px] px-2 py-0.5 rounded-full text-white flex items-center">
                <span className="mr-0.5">✓</span> Selected
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4">
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
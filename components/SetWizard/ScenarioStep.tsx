import React, { useState, useEffect } from 'react';

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
];

// Pool of truly bizarre, surreal, and unexpected scenarios
const weirdScenariosPool = [
  'Convincing a cloud to pay its taxes',
  'Negotiating a peace treaty between socks and shoes',
  'Explaining existential dread to a potato',
  'Hosting a cooking show for invisible guests',
  'Arguing with your own shadow about quantum mechanics',
  'Teaching a goldfish to use a smartphone',
  'Applying for a job as a professional echo',
  'Debating the ethics of time travel with a traffic cone',
  'Translating whale song for a committee of bees',
  'Filing a noise complaint against the concept of silence',
  'Hosting a podcast for ghosts who refuse to speak',
  'Convincing a mirror it\'s not real',
  'Running a marathon on a Möbius strip',
  'Selling insurance to a tornado',
  'Writing a love letter to gravity',
  'Convincing a vending machine to give you emotional support',
  'Explaining recursion to a hall of mirrors',
  'Hosting a silent disco for telepathic plants',
  'Filing a lawsuit against déjà vu',
  'Interviewing Schrödinger\'s cat for a reality show',
  'Negotiating rent with a family of dust bunnies',
  'Teaching algebra to a deck of playing cards',
  'Running a lemonade stand on the moon',
  'Filing taxes for a parallel universe',
  'Explaining sarcasm to a robot vacuum',
  'Hosting a spelling bee for numbers',
  'Debating the color of Tuesday with a calendar',
  'Applying for a passport from the concept of infinity',
  'Convincing a refrigerator to keep secrets',
  'Writing a breakup letter to entropy',
  'Convincing a rainbow to pick a favorite color',
  'Teaching calculus to a loaf of bread',
  'Hosting a staring contest with a clock',
  'Filing a missing persons report for your shadow',
  'Debating the meaning of life with a doorknob',
  'Applying for a loan from a cactus',
  'Explaining déjà vu to a goldfish',
  'Running a book club for blank books',
  'Convincing a sneeze to wait until after the meeting',
  'Hosting a spelling bee for smells',
  'Negotiating a ceasefire between left and right socks',
  'Filing a patent for a square circle',
  'Teaching a spider to knit sweaters',
  'Convincing a puddle to stay put',
  'Interviewing a sneeze for a weather forecast',
  'Hosting a talent show for invisible friends',
  'Explaining gravity to a helium balloon',
  'Running a marathon in a dream you can\'t wake up from',
  'Debating the ethics of eating time',
  'Convincing a shadow to take a day off',
  'Hosting a chess tournament for mirrors',
  'Filing a complaint about the speed of light',
  'Teaching a rock to meditate',
  'Convincing a sneeze to use a handkerchief',
  'Explaining the internet to a candle',
  'Hosting a masquerade ball for numbers',
  'Debating the flavor of silence',
  'Convincing a rainbow to appear at night',
  'Filing a lawsuit against boredom',
  'Teaching a tornado to waltz',
  'Convincing a puddle to reflect on its life choices',
  'Hosting a debate between left and right shoes',
  'Explaining the concept of "now" to a calendar',
  'Convincing a clock to take a nap',
  'Hosting a karaoke night for whispers',
  'Filing a missing persons report for yesterday',
  'Teaching a shadow to dance',
  'Convincing a sneeze to be polite',
  'Hosting a spelling bee for colors',
  'Debating the temperature of blue',
  'Convincing a mirror to show its true self',
  'Filing a complaint about the taste of water',
  'Teaching a cloud to draw',
  'Convincing a rainbow to bend the other way',
  'Hosting a silent auction for thoughts',
  'Explaining the rules of chess to a pancake',
  'Convincing a puddle to dry itself',
  'Hosting a marathon for snails',
  'Debating the shape of happiness',
  'Convincing a shadow to lead the way',
  'Filing a complaint about the smell of time',
  'Teaching a sneeze to whisper',
  'Convincing a clock to run backwards',
  'Hosting a tea party for ghosts',
  'Explaining the concept of "left" to a circle',
  'Convincing a rainbow to wear stripes',
  'Hosting a spelling bee for dreams',
  'Debating the color of laughter',
  'Convincing a puddle to freeze in summer',
  'Hosting a parade for lost thoughts',
  'Explaining the taste of music to a wall',
  'Convincing a sneeze to rhyme',
  'Hosting a talent show for shadows',
  'Debating the weight of a sigh',
  'Convincing a clock to tick in Morse code',
  'Hosting a picnic for invisible ants',
  'Explaining the sound of silence to a bell',
  'Convincing a rainbow to sing',
  'Hosting a spelling bee for echoes',
  'Debating the flavor of a memory',
  'Convincing a puddle to jump',
  'Hosting a chess match between dreams and reality',
  'Explaining the meaning of "why" to a rock',
  'Convincing a sneeze to apologize',
  'Hosting a masquerade for forgotten names',
  'Debating the color of a whisper',
  'Convincing a clock to skip a second',
  'Hosting a dance for falling leaves in July',
  'Explaining the shape of a question to a cloud',
  'Convincing a rainbow to hide',
  'Hosting a spelling bee for shadows',
  'Debating the taste of a shadow',
  'Convincing a puddle to become a cloud',
  'Hosting a parade for lost socks',
  'Explaining the sound of a color to a fish',
  'Convincing a sneeze to be on time',
  'Hosting a chess game for yawns',
  'Debating the flavor of a shadow',
  'Convincing a clock to tell jokes',
  'Hosting a spelling bee for sneezes',
];

const CUSTOM_SCENARIO = 'Tell Us!';

function getRandomWeirdScenarios(count: number, exclude: string[] = []) {
  const pool = weirdScenariosPool.filter(s => !exclude.includes(s));
  const selected: string[] = [];
  while (selected.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    selected.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return selected;
}

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
  // Store the two weird scenarios for this session
  const [weirdScenarios, setWeirdScenarios] = useState<string[]>([]);

  useEffect(() => {
    // Only pick new weird scenarios if not already set
    if (weirdScenarios.length === 0) {
      const picked = getRandomWeirdScenarios(2, scenarios);
      setWeirdScenarios(picked);
    }
    // eslint-disable-next-line
  }, []);

  const handleToggle = (scenario: string) => {
    setSelected(sel =>
      sel.includes(scenario)
        ? sel.filter(s => s !== scenario)
        : [...sel, scenario]
    );
  };

  const handleRemoveCustomTag = (tag: string) => {
    setCustomTags(prev => prev.filter(t => t !== tag));
    setSelected(prev => prev.filter(s => s !== tag));
  };

  const handleAddCustomTag = () => {
    if (custom.trim()) {
      const newTag = custom.trim();
      if (!customTags.includes(newTag)) {
        setCustomTags(prev => [...prev, newTag]);
        if (!selected.includes(newTag)) {
          setSelected(prev => [...prev, newTag]);
        }
      }
      if (!selected.includes(CUSTOM_SCENARIO)) {
        setSelected(prev => [...prev, CUSTOM_SCENARIO]);
      }
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
    const mappedScenarios = selected.map(s => 
      s === CUSTOM_SCENARIO ? 'Custom Scenario' : s
    );
    const filteredScenarios = mappedScenarios.filter(s => 
      !customTags.includes(s)
    );
    let customGoalText = custom;
    if (selected.includes(CUSTOM_SCENARIO) && customTags.length > 0) {
      const customText = custom.trim() ? `${custom.trim()}. ` : '';
      const tagsText = `Selected topics: ${customTags.join(', ')}`;
      customGoalText = customText + tagsText;
    }
    onNext({ 
      scenarios: filteredScenarios, 
      customGoal: selected.includes(CUSTOM_SCENARIO) ? customGoalText : undefined 
    });
  };

  // --- UI ---
  return (
    <div className="space-y-6 px-2">
      <div className="space-y-2.5 text-center">
        <h3 className="text-base font-medium text-white">
          What do you want to be able to do in Thai?
        </h3>
        <p className="text-xs text-gray-400">Choose one or more scenarios that interest you.</p>
      </div>

      {/* Selected tags/chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mb-2">
          {selected.filter(s => s !== CUSTOM_SCENARIO && ![...scenarios, ...weirdScenarios].includes(s)).map((tag) => (
            <span key={tag} className="flex items-center bg-green-700/80 text-white text-xs rounded-full px-3 py-1">
              {tag}
              <button
                onClick={() => handleRemoveCustomTag(tag)}
                className="ml-2 text-white hover:text-red-300 focus:outline-none"
                aria-label="Remove"
              >
                ×
              </button>
            </span>
          ))}
          {selected.filter(s => [...scenarios, ...weirdScenarios].includes(s)).map((tag) => (
            <span key={tag} className="flex items-center bg-blue-700/80 text-white text-xs rounded-full px-3 py-1">
              {tag}
              <button
                onClick={() => handleToggle(tag)}
                className="ml-2 text-white hover:text-red-300 focus:outline-none"
                aria-label="Remove"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Recommended option - highlighted */}
      <div className="mb-3">
        <button
          onClick={() => handleToggle(CUSTOM_SCENARIO)}
          className={`w-full text-left px-4 py-4 rounded-lg text-base font-semibold transition-all border-2 relative
            ${selected.includes(CUSTOM_SCENARIO)
              ? 'bg-blue-600/90 text-white border-blue-500 shadow-md'
              : 'bg-blue-900/30 text-blue-300 border-blue-600/30 hover:bg-blue-800/40'}
          `}
        >
          <span className="absolute top-0 right-0 bg-blue-500 text-[10px] px-2 py-0.5 rounded-bl-md font-medium">
            RECOMMENDED
          </span>
          <div className="mt-1 text-center">{CUSTOM_SCENARIO}</div>
          <div className="text-xs mt-1 opacity-80 text-center font-normal">
            Get a personalized set tailored exactly to your needs
          </div>
          {selected.includes(CUSTOM_SCENARIO) && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 bg-white text-blue-600 rounded-full w-6 h-6 flex items-center justify-center font-bold shadow">✓</span>
          )}
        </button>
        {selected.includes(CUSTOM_SCENARIO) && (
          <div className="mt-3 flex gap-2">
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
        )}
      </div>

      <div>
        <div className="text-xs text-gray-400 pb-2 text-center font-medium">
          Or choose from our pre-made scenarios:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...scenarios, ...weirdScenarios].map(scenario => (
            <button
              key={scenario}
              type="button"
              onClick={() => handleToggle(scenario)}
              className={`flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium transition-all border-2
                ${selected.includes(scenario)
                  ? 'bg-blue-600/90 text-white border-blue-500 shadow-md'
                  : 'bg-[#1e1e1e] text-gray-200 border-blue-900/30 hover:bg-blue-900/30'}
              `}
            >
              <span>{scenario}</span>
              {selected.includes(scenario) && (
                <span className="bg-white text-blue-600 rounded-full w-6 h-6 flex items-center justify-center font-bold shadow ml-2">✓</span>
              )}
            </button>
          ))}
        </div>
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
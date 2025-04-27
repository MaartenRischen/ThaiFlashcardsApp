import React, { useState, useEffect, useMemo } from 'react';

// --- Data Structure for Scenarios by Level --- (Sentence Case)
const scenariosByLevel: Record<string, string[]> = {
  "Complete Beginner": [
    "Essential greetings & leave-takings (polite)",
    "Introducing yourself (simple)",
    "Basic numbers (1-100 & zero)",
    "Identifying common objects (classroom/home)",
    "Basic question words & simple answers",
    "Saying \"Thank You\" & \"Sorry/Excuse Me\" (polite)",
    "Basic colors",
    "Simple commands & requests (polite)",
  ],
  "Basic Understanding": [
    "Asking for & giving personal information",
    "Basic shopping & prices",
    "Telling time & dates",
    "Simple directions & locations",
    "Ordering simple food & drinks",
    "Talking about daily routines (simple present)",
    "Describing people & things (simple adjectives)",
    "Expressing likes & dislikes (simple)",
  ],
  "Intermediate": [
    "Making travel arrangements",
    "Discussing hobbies & interests",
    "Narrating past events (simple past)",
    "Giving & understanding more complex directions",
    "Ordering a full meal & making specific requests",
    "Talking about work & study",
    "Expressing opinions & feelings (simple)",
    "Understanding basic cultural norms",
  ],
  "Advanced": [
    "Discussing current events & news",
    "Explaining problems & solutions",
    "Talking about Thai culture in depth",
    "Workplace communication",
    "Discussing films, books, or music",
    "Giving advice & making recommendations",
    "Understanding different registers",
    "Narrating complex experiences",
  ],
  "Native/Fluent": [
    "Analyzing social & political issues in Thailand",
    "Understanding Thai literature & arts",
    "Advanced workplace & business communication",
    "Exploring Thai history & belief systems",
    "Understanding idioms & colloquialisms",
    "Discussing hypothetical situations & speculation",
    "Debating & persuasion",
    "Understanding regional dialects & variations (awareness)",
  ],
  "God Mode": [
    "Specialized academic/professional fields",
    "Classical Thai literature & poetry",
    "Advanced linguistic analysis of Thai",
    "Thai media analysis & critique",
    "Translating & interpreting nuances",
    "Mastering Thai humor & wordplay",
    "Royal Thai language (ราชาศัพท์ - Rachasap)",
    "Contemporary Thai sociolinguistics",
  ]
};

// Mapping from proficiency estimate string to the keys used in scenariosByLevel
const proficiencyLevelMap: Record<string, string> = {
  'complete beginner': "Complete Beginner",
  'basic understanding': "Basic Understanding",
  'intermediate': "Intermediate",
  'advanced': "Advanced",
  'native/fluent': "Native/Fluent",
  'god mode': "God Mode",
};
// --- End Data Structure ---

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

// --- Update Props Interface ---
interface ScenarioStepProps {
  selectedScenarios: string[];
  customGoal?: string;
  proficiencyLevelEstimate: string; // Added prop
  onNext: (data: { scenarios: string[]; customGoal?: string }) => void;
  onBack: () => void;
}
// --- End Update Props Interface ---

export function ScenarioStep({ selectedScenarios: initialSelectedScenarios, customGoal: initialCustomGoal, proficiencyLevelEstimate, onNext, onBack }: ScenarioStepProps) { // Destructure new props
  
  // --- Get Level-Appropriate Scenarios ---
  const levelKey = proficiencyLevelMap[proficiencyLevelEstimate?.toLowerCase()] || "Complete Beginner";
  const levelScenarios = useMemo(() => scenariosByLevel[levelKey] || scenariosByLevel["Complete Beginner"], [levelKey]);
  // --- End Get Level-Appropriate Scenarios ---

  // Map old 'Custom Scenario' to new name for backward compatibility in initial state
  const initialScenarios = initialSelectedScenarios?.map(s => 
    s === 'Custom Scenario' ? CUSTOM_SCENARIO : s
  ) || [];
  
  const [selected, setSelected] = useState<string[]>(initialScenarios);
  const [custom, setCustom] = useState(initialCustomGoal || ""); // Use initialCustomGoal
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [weirdScenarios, setWeirdScenarios] = useState<string[]>([]);

  useEffect(() => {
    // Only pick new weird scenarios if not already set
    if (weirdScenarios.length === 0) {
      // Exclude level scenarios as well when picking weird ones
      const picked = getRandomWeirdScenarios(2, levelScenarios); 
      setWeirdScenarios(picked);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelScenarios]); // Depend on levelScenarios so weird ones change if level changes back/forth

  // Combine level scenarios and weird scenarios for display
  const allDisplayScenarios = useMemo(() => [...levelScenarios, ...weirdScenarios], [levelScenarios, weirdScenarios]);

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
      // Automatically select "Tell Us!" if a custom tag is added
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
    // Map "Tell Us!" back to "Custom Scenario" for internal logic if needed,
    // but filter it out if no custom tags were actually added.
    // Also filter out any of the bizarre scenarios from the final list sent onwards.
    const finalSelectedScenarios = selected.filter(s => 
        s !== CUSTOM_SCENARIO && 
        !weirdScenarios.includes(s) && 
        !customTags.includes(s) // Don't send custom tags as scenarios
    );

    let finalCustomGoal: string | undefined = undefined;
    if (selected.includes(CUSTOM_SCENARIO) && (custom.trim() || customTags.length > 0)) {
        const customText = custom.trim() ? `${custom.trim()}. ` : '';
        const tagsText = customTags.length > 0 ? `Selected topics: ${customTags.join(', ')}` : '';
        finalCustomGoal = (customText + tagsText).trim() || undefined; // Ensure it's not empty string
    }
    
    onNext({ 
      scenarios: finalSelectedScenarios, 
      customGoal: finalCustomGoal // Use the potentially combined custom goal text
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

      {/* "Tell Us!" Button */}
      <button
        onClick={() => handleToggle(CUSTOM_SCENARIO)}
        className={`w-full rounded-lg p-3 text-left transition-all border-2 ${
          selected.includes(CUSTOM_SCENARIO)
            ? 'bg-blue-600/90 text-white border-blue-500 shadow-md'
            : 'bg-blue-900/30 text-blue-300 border-blue-600/30 hover:bg-blue-800/40'
        }`}
      >
        <div className="flex justify-between items-center">
          <div>
            <div className="font-semibold text-sm">{CUSTOM_SCENARIO}</div>
            <div className="text-xs mt-1">Get a personalized set tailored exactly to your needs</div>
          </div>
          <span className="text-xs font-semibold bg-blue-500/80 text-white px-2 py-0.5 rounded-full">RECOMMENDED</span>
        </div>
      </button>

      {/* Custom Goal Input Area (only shows if "Tell Us!" is selected) */}
      {selected.includes(CUSTOM_SCENARIO) && (
        <div className="bg-[#1e1e1e]/50 rounded-xl p-4 space-y-3">
          <label htmlFor="customGoal" className="block text-sm font-medium text-gray-300">
            Tell us what you want to learn (optional focus)
          </label>
          <input
            id="customGoal"
            type="text"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyPress={handleCustomKeyPress}
            placeholder="e.g., focus on street food vendors"
            className="w-full bg-gray-900/50 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
           <button 
            onClick={handleAddCustomTag}
            className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded-full ml-2"
          >
            Add as Topic
          </button>
          <p className="text-xs text-gray-400">
            Optionally add specific topics you want included (press Enter or click Add). We&apos;ll use these to refine your set.
          </p>
          {/* Display added custom tags */}
          {customTags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {customTags.map(tag => (
                 <span key={tag} className="flex items-center bg-green-700/80 text-white text-xs rounded-full px-2 py-0.5">
                  {tag}
                  <button onClick={() => handleRemoveCustomTag(tag)} className="ml-1.5 text-green-200 hover:text-red-300"> &times;</button>
                 </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="text-center text-sm text-gray-400 pt-2">Or choose from our pre-made scenarios:</div>

      {/* Pre-made Scenario Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {allDisplayScenarios.map(scenario => ( // Use the combined list
          <button
            key={scenario}
            onClick={() => handleToggle(scenario)}
            className={`rounded-lg p-3 text-left transition-all border-2 text-sm ${
              selected.includes(scenario)
                ? 'bg-blue-600/90 text-white border-blue-500 shadow-md'
                : 'bg-blue-900/30 text-blue-300 border-blue-600/30 hover:bg-blue-800/40'
            }`}
            // Disable selecting pre-made if "Tell Us!" is selected
            disabled={selected.includes(CUSTOM_SCENARIO) && scenario !== CUSTOM_SCENARIO && !weirdScenarios.includes(scenario)}
          >
            {scenario}
          </button>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-3">
        <button
          onClick={onBack}
          className="neumorphic-button text-blue-400"
        >
          Back
        </button>
        <button
          className="neumorphic-button text-blue-400"
          onClick={handleNext}
        >
          Next
        </button>
      </div>
    </div>
  );
} 
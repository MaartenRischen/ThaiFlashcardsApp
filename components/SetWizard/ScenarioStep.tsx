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
  // Adding 100 more scenarios
  'Teaching philosophy to a traffic light',
  'Organizing a protest for neglected semicolons',
  'Filing a warranty claim on a broken promise',
  'Conducting an orchestra of falling leaves',
  'Negotiating peace between hot and cold water',
  'Writing an autobiography of tomorrow',
  'Teaching meditation to a caffeine molecule',
  'Hosting a retirement party for a young star',
  'Explaining WiFi to a carrier pigeon',
  'Running a dating service for odd numbers',
  'Convincing sunshine to work night shifts',
  'Filing a noise complaint against silent letters',
  'Teaching origami to a waterfall',
  'Hosting a debate between past and future',
  'Explaining smartphones to ancient philosophers',
  'Running a marathon through a dictionary',
  'Convincing winter to take a summer vacation',
  'Filing an insurance claim for lost inspiration',
  'Teaching juggling to a centipede',
  'Hosting a birthday party for imaginary numbers',
  'Explaining social media to a hermit crab',
  'Running a taxi service for daydreams',
  'Convincing mountains to try yoga',
  'Filing a missing person report for motivation',
  'Teaching parkour to a sloth',
  'Hosting a fashion show for invisible clothes',
  'Explaining memes to Renaissance painters',
  'Running a hotel for passing thoughts',
  'Convincing clouds to form book clubs',
  'Filing a lawsuit against writer\'s block',
  'Teaching breakdancing to a cactus',
  'Hosting a comedy show for serious thoughts',
  'Explaining emojis to Shakespeare',
  'Running a delivery service for wishes',
  'Convincing stairs to become an elevator',
  'Filing a complaint about Monday\'s attitude',
  'Teaching photography to a mirror',
  'Hosting a concert for silent films',
  'Explaining blockchain to a piggy bank',
  'Running a library for unwritten books',
  'Convincing a black hole to be more optimistic',
  'Filing taxes for imaginary income',
  'Teaching diplomacy to a thunder storm',
  'Hosting a wedding for parallel lines',
  'Explaining social distancing to magnets',
  'Running a recycling plant for bad ideas',
  'Convincing algorithms to be more spontaneous',
  'Filing for custody of lost arguments',
  'Teaching stand-up comedy to statues',
  'Hosting a surprise party for psychics',
  'Explaining vegetarianism to a venus flytrap',
  'Running a lost and found for forgotten dreams',
  'Convincing echoes to be more original',
  'Filing a patent for bottled motivation',
  'Teaching mindfulness to a hurricane',
  'Hosting a retirement party for old habits',
  'Explaining modern art to classical statues',
  'Running a repair shop for broken hearts',
  'Convincing waterfalls to flow upwards',
  'Filing a complaint about gravity\'s consistency',
  'Teaching ballet to earthquakes',
  'Hosting a reunion for parallel universes',
  'Explaining Netflix to a sundial',
  'Running a daycare for adult responsibilities',
  'Convincing volcanoes to chill out',
  'Filing an eviction notice for negative thoughts',
  'Teaching poetry to binary code',
  'Hosting a meditation retreat for caffeine',
  'Explaining Instagram filters to Renaissance artists',
  'Running a witness protection program for spoilers',
  'Convincing fog to be more transparent',
  'Filing a restraining order against procrastination',
  'Teaching synchronized swimming to clouds',
  'Hosting a retirement party for outdated memes',
  'Explaining TikTok to Victorian time travelers',
  'Running an adoption center for stray thoughts',
  'Convincing glaciers to speed up',
  'Filing a divorce from bad decisions',
  'Teaching anger management to volcanoes',
  'Hosting a graduation ceremony for life lessons',
  'Explaining selfies to self-portraits',
  'Running a spa for stressed-out deadlines',
  'Convincing black holes to be less clingy',
  'Filing a class action lawsuit against Mondays',
  'Teaching mindfulness to a tornado',
  'Hosting a support group for lonely integers',
  'Explaining viral marketing to actual viruses',
  'Running a witness protection program for typos',
  'Convincing the moon to work day shifts',
  'Filing bankruptcy for emotional debt',
  'Teaching yoga to buildings',
  'Hosting an intervention for workaholic ants',
  'Explaining remote work to a boomerang',
  'Running a dating app for incompatible elements',
  'Convincing stars to form better constellations',
  'Filing a discrimination complaint for silent letters',
  'Teaching improv to a script',
  'Hosting a farewell party for expired passwords',
  'Explaining streaming services to a river',
  'Running a therapy session for confused algorithms',
  'Convincing time zones to synchronize',
  'Filing for divorce from your comfort zone',
  'Teaching parkour to mountains',
  'Hosting a welcome party for future regrets',
  'Explaining cloud storage to actual clouds',
  'Running a lost and found for missing contexts',
  'Convincing seasons to be more flexible',
  'Filing an insurance claim for broken fourth walls',
  'Teaching mindfulness to deadlines',
  'Hosting a retirement party for old passwords'
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
    // Include both pre-made scenarios and custom tags, but filter out only the CUSTOM_SCENARIO marker
    const finalSelectedScenarios = Array.from(new Set(selected.filter(s => s !== CUSTOM_SCENARIO)));

    let finalCustomGoal: string | undefined = undefined;
    if (selected.includes(CUSTOM_SCENARIO)) {
        // Always include the custom input if it exists
        const customText = custom.trim();
        
        // Combine custom text and tags into a single custom goal
        const customParts = [
            customText,
            ...customTags
        ].filter(Boolean);
        
        finalCustomGoal = customParts.length > 0 ? Array.from(new Set(customParts)).join(', ') : undefined;
        
        // Remove any custom tags from scenarios since they'll be in the custom goal
        finalSelectedScenarios.splice(0, finalSelectedScenarios.length, 
            ...finalSelectedScenarios.filter(s => !customTags.includes(s))
        );
    }
    
    onNext({ 
        scenarios: finalSelectedScenarios.filter(Boolean), 
        customGoal: finalCustomGoal
    });
  };

  // --- UI ---
  return (
    <div className="space-y-6 px-2">
      <div className="space-y-2.5 text-center">
        <h3 className="text-base font-medium text-white">
          What do you want to be able to do in Thai?
        </h3>
        {/* <p className="text-xs text-gray-400">Choose one or more scenarios that interest you.</p> */}
      </div>

      {/* "Tell Us!" Button - Added Glow */}
      <button
        onClick={() => handleToggle(CUSTOM_SCENARIO)}
        className={`w-full rounded-lg p-3 text-left transition-all border-2 ${
          selected.includes(CUSTOM_SCENARIO)
            ? 'bg-blue-600/90 text-white border-blue-500 shadow-lg shadow-blue-500/50 ring-1 ring-blue-500/30'
            : 'bg-blue-900/30 text-blue-300 border-blue-600/30 hover:bg-blue-800/40 shadow-lg shadow-blue-500/30'
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
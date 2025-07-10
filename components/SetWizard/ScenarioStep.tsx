import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Target, Sparkles, Zap } from 'lucide-react';
import { formatSetTitle } from '@/app/lib/utils';

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

// Restore the function definition
function getRandomWeirdScenarios(count: number, exclude: string[] = []) {
  const pool = weirdScenariosPool.filter(s => !exclude.includes(s));
  const selected: string[] = [];
  while (selected.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    selected.push(pool[idx]);
    pool.splice(idx, 1); // Remove selected item from pool
  }
  return selected;
}

// Define the type for the single selected topic
interface SelectedTopic {
  type: 'scenario' | 'goal' | 'weird';
  value: string;
}

// --- Update Props Interface ---
interface _ScenarioStepProps {
  selectedTopic: SelectedTopic | null; // Use the new type
  proficiencyLevelEstimate: string;
  onNext: (data: { selectedTopic: SelectedTopic | null }) => void; // Update onNext prop type
  onBack: () => void;
}

// --- Update Component Signature & State ---
export function ScenarioStep({ 
  selectedTopic, 
  proficiencyLevelEstimate, 
  onNext, 
  onBack 
}: { 
  selectedTopic: SelectedTopic | null,
  proficiencyLevelEstimate: string,
  onNext: (data: { selectedTopic: SelectedTopic | null }) => void,
  onBack: () => void
}) {
  const [selected, setSelected] = useState<SelectedTopic | null>(selectedTopic);
  const [customInput, setCustomInput] = useState(
    selectedTopic?.type === 'goal' ? selectedTopic.value : ''
  );

  // Get Level-Appropriate Scenarios
  const levelKey = proficiencyLevelMap[proficiencyLevelEstimate?.toLowerCase()] || "Complete Beginner";
  const levelScenarios = scenariosByLevel[levelKey] || scenariosByLevel["Complete Beginner"];

  const [weirdScenarios, setWeirdScenarios] = useState<string[]>([]);

  useEffect(() => {
    if (weirdScenarios.length === 0) {
      const picked = getRandomWeirdScenarios(2, levelScenarios); 
      setWeirdScenarios(picked);
    }
  }, [levelScenarios, weirdScenarios.length]);

  const handleSelect = (type: 'scenario' | 'weird', value: string) => {
    if (selected && selected.type === type && selected.value === value) {
      setSelected(null);
    } else {
      setSelected({ type, value });
      setCustomInput('');
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomInput(value);
    if (value.trim()) {
      setSelected({ type: 'goal', value: value.trim() });
    } else if (selected?.type === 'goal') {
      setSelected(null);
    }
  };

  const handleNext = () => {
    if (selected) {
      const formattedValue = formatSetTitle(selected.value);
      onNext({ selectedTopic: { ...selected, value: formattedValue } });
    } else {
      onNext({ selectedTopic: null });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-[#E0E0E0]">
          What would you like to learn?
        </h3>
        <p className="text-sm text-gray-400">
          Choose a topic that interests you
        </p>
      </div>

      {/* Custom Goal Input */}
      <div className="neumorphic p-4 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-400" />
          <label htmlFor="custom-goal" className="text-sm font-medium text-blue-400">
            Define Your Own Goal (Recommended!)
          </label>
        </div>
        <input
          id="custom-goal"
          type="text"
          value={customInput}
          onChange={handleCustomInputChange}
          placeholder="e.g., Talk about my holiday plans"
          className={`neumorphic-input w-full ${
            selected?.type === 'goal' ? 'ring-2 ring-blue-500' : ''
          }`}
        />
        <p className="text-xs text-gray-400">
          Enter your specific learning goal for a personalized experience
        </p>
      </div>

      {/* Level-Appropriate Scenarios */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <h4 className="text-sm font-medium text-blue-400">
            Or Choose a Scenario
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {levelScenarios.map((scenario, index) => (
            <motion.button
              key={scenario}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleSelect('scenario', scenario)}
              className={`
                relative p-3 rounded-xl text-left transition-all duration-200
                ${selected?.type === 'scenario' && selected.value === scenario
                  ? 'neumorphic-card-active border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                  : 'neumorphic-card-static hover:scale-[1.02]'
                }
              `}
            >
              <span className={`text-sm ${
                selected?.type === 'scenario' && selected.value === scenario
                  ? 'text-blue-400' : 'text-[#E0E0E0]'
              }`}>
                {scenario}
              </span>
              {selected?.type === 'scenario' && selected.value === scenario && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Weird Scenarios */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-400" />
          <h4 className="text-sm font-medium text-purple-400">
            Or Be Weird
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {weirdScenarios.map((scenario, index) => (
            <motion.button
              key={scenario}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              onClick={() => handleSelect('weird', scenario)}
              className={`
                relative p-3 rounded-xl text-left transition-all duration-200
                ${selected?.type === 'weird' && selected.value === scenario
                  ? 'neumorphic-card-active border-2 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]' 
                  : 'neumorphic-card-static hover:scale-[1.02]'
                }
              `}
            >
              <span className={`text-sm ${
                selected?.type === 'weird' && selected.value === scenario
                  ? 'text-purple-400' : 'text-[#E0E0E0]'
              }`}>
                {scenario}
              </span>
              {selected?.type === 'weird' && selected.value === scenario && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="neumorphic-button text-gray-400"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!selected}
          className={`neumorphic-button ${selected ? 'text-blue-400' : 'text-gray-600 opacity-50'}`}
        >
          Next
        </button>
      </div>
    </div>
  );
} 
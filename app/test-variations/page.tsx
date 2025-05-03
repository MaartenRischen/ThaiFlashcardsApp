'use client';

import React, { useState, useMemo } from 'react';
import { GeneratePromptOptions, Phrase } from '../lib/set-generator';

// Define all possible proficiency levels
const PROFICIENCY_LEVELS = [
  'Complete Beginner',
  'Basic Understanding',
  'Intermediate',
  'Advanced',
  'Native/Fluent',
  'God Mode'
] as const;

// Add proficiency level order mapping
const PROFICIENCY_LEVEL_ORDER: Record<string, number> = {
  'Complete Beginner': 0,
  'Basic Understanding': 1,
  'Intermediate': 2,
  'Advanced': 3,
  'Native/Fluent': 4,
  'God Mode': 5
};

// Define tone levels (1-10)
const TONE_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Define available LLM models
const LLM_MODELS = [
  'google/gemini-2.5-flash-preview',
  'google/gemini-2.5-pro-preview-03-25',
  'openai/gpt-4',
  'openai/gpt-3.5-turbo',
  'anthropic/claude-3-opus',
  'mistralai/mixtral-8x7b'
] as const;

interface TestCard extends Phrase {
  settings: {
    proficiency: string;
    tone: number;
    llmBrand?: string;
    llmModel?: string;
    topic: string;
    generationTime?: number;
    temperature?: number;
  };
}

type SortKey = keyof TestCard | `settings.${keyof TestCard['settings']}`;

type FilterState = {
  proficiency: string; // 'any' or a specific level
  tone: string;        // 'any' or a specific tone number as string
  llmModel: string;    // 'any' or a specific model name
  topic: string;       // 'any' or a specific topic string
};

// NEW: Define an interface for the generation task parameters
interface GenerationTask {
  level: GeneratePromptOptions['level'];
  toneLevel: number;
  count?: number; // Add back count for single task mode
}

export default function TestVariations() {
  const [cards, setCards] = useState<TestCard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentProficiency, setCurrentProficiency] = useState(0);
  const [currentTone, setCurrentTone] = useState(0);
  const [currentModel, setCurrentModel] = useState(0);
  const [topic, setTopic] = useState("giving directions");
  const [cardCount, setCardCount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('english');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<FilterState>({
    proficiency: 'any',
    tone: 'any',
    llmModel: 'any',
    topic: 'any',
  });
  const [generateAllLevels, setGenerateAllLevels] = useState(false);
  const [generateAllTones, setGenerateAllTones] = useState(false);

  // State for toggling element visibility
  const [showEnglish, setShowEnglish] = useState(true);
  const [showThai, setShowThai] = useState(true);
  const [showPronunciation, setShowPronunciation] = useState(true);
  const [showMnemonic, setShowMnemonic] = useState(true);
  const [showContext, setShowContext] = useState(true);
  const [showSettings, setShowSettings] = useState(true);

  // Calculate the number of cards to be generated based on selections
  const numCardsToGenerate = useMemo(() => {
    if (generateAllLevels && generateAllTones) {
      return PROFICIENCY_LEVELS.length * TONE_LEVELS.length; // 6 * 10 = 60
    } else if (generateAllLevels) {
      return PROFICIENCY_LEVELS.length; // 6
    } else if (generateAllTones) {
      return TONE_LEVELS.length; // 10
    } else {
      return cardCount; // User-specified count
    }
  }, [generateAllLevels, generateAllTones, cardCount]);

  const generateCard = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setError(null);

    const selectedModel = LLM_MODELS[currentModel];

    // Determine generation tasks based on checkboxes
    const tasks: GenerationTask[] = [];
    if (generateAllLevels && generateAllTones) {
      // All combinations (60 tasks)
      PROFICIENCY_LEVELS.forEach((level, _levelIndex) => {
        TONE_LEVELS.forEach((tone, _toneIndex) => {
          tasks.push({ level, toneLevel: tone });
        });
      });
    } else if (generateAllLevels) {
      // All levels, selected tone (6 tasks)
      PROFICIENCY_LEVELS.forEach((level, _levelIndex) => {
        tasks.push({ level, toneLevel: TONE_LEVELS[currentTone] });
      });
    } else if (generateAllTones) {
      // Selected level, all tones (10 tasks)
      TONE_LEVELS.forEach((tone, _toneIndex) => {
        tasks.push({ level: PROFICIENCY_LEVELS[currentProficiency], toneLevel: tone });
      });
    } else {
      // Specific selection (1 task, potentially multiple cards)
      tasks.push({ 
        level: PROFICIENCY_LEVELS[currentProficiency], 
        toneLevel: TONE_LEVELS[currentTone],
        count: cardCount 
      });
    }

    console.log(`Starting sequential generation for ${tasks.length} tasks...`);

    try {
      const newCardsBatch: TestCard[] = [];

      // Process tasks sequentially
      for (const task of tasks) {
        try {
          const preferences: Omit<GeneratePromptOptions, 'count' | 'existingPhrases'> = {
            level: task.level,
            specificTopics: undefined,
            toneLevel: task.toneLevel,
            topicsToDiscuss: topic,
          };

          const response = await fetch('/api/generate-set', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              preferences,
              totalCount: task.count || 1, // Default to 1 for batch modes
              isTestRequest: true,
              forcedModel: selectedModel
            }),
            credentials: 'include',
          });

          const apiResult = await response.json();

          if (!response.ok) {
            throw new Error(apiResult.error || `Failed for Level: ${task.level}, Tone: ${task.toneLevel}`);
          }

          if (apiResult.phrases && apiResult.phrases.length > 0) {
            apiResult.phrases.forEach((phrase: Phrase) => {
              const newCard: TestCard = {
                ...phrase,
                settings: {
                  proficiency: task.level,
                  tone: task.toneLevel,
                  llmBrand: apiResult.llmBrand,
                  llmModel: apiResult.llmModel,
                  topic,
                  generationTime: apiResult.generationTime, // Use task-specific time
                  temperature: apiResult.temperature
                }
              };
              newCardsBatch.push(newCard);
            });
             console.log(`Task success: Level ${task.level}, Tone ${task.toneLevel}`);
          } else {
            console.warn('No phrases in response for task:', task, apiResult);
            setError(`No phrases returned for Level: ${task.level}, Tone: ${task.toneLevel}`);
          }
        } catch (taskError: unknown) { // Use unknown instead of any
          console.error(`API call failed for task: Level ${task.level}, Tone ${task.toneLevel}`, taskError);
          // Type check before accessing message
          const errorMessage = taskError instanceof Error ? taskError.message : String(taskError);
          setError(`API Error for Level: ${task.level}, Tone: ${task.toneLevel}: ${errorMessage}`);
        }
      } // End of sequential loop

      // Update state after all tasks are processed
      if (newCardsBatch.length > 0) {
        setCards(prev => [...prev, ...newCardsBatch]);
        console.log(`Added ${newCardsBatch.length} new cards in total sequentially.`);
      }

    } catch (err) {
        // Catch unexpected errors during the overall process
        console.error("Overall generation process error:", err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const cleanup = async () => {
    setIsCleaning(true);
    try {
      const response = await fetch('/api/cleanup-test-sets', {
        method: 'POST',
        credentials: 'include',
      });
      const result = await response.json();
      if (response.ok) {
        setCards([]);
        setError(null);
        alert(`Cleaned up ${result.count} test sets`);
      } else {
        throw new Error(result.error || 'Failed to clean up test sets');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clean up test sets');
    } finally {
      setIsCleaning(false);
    }
  };

  const getToneDescription = (tone: number) => {
    switch (tone) {
      case 1: return 'Most Serious & Practical';
      case 2: return 'Very Serious';
      case 3: return 'Serious with hints of joy';
      case 4: return 'Playful';
      case 5: return 'Balanced, more leaning into jokes than realism';
      case 6: return 'Getting Silly';
      case 7: return 'Pretty Ridiculous';
      case 8: return 'Very Ridiculous';
      case 9: return 'Extremely Ridiculous';
      case 10: return 'Maximum Chaos & Hilarity';
      default: return '';
    }
  };

  // Filter and Sort Logic
  const filteredAndSortedCards = useMemo(() => {
    // 1. Filtering
    const filtered = cards.filter(card => {
      const matchesProficiency = filters.proficiency === 'any' || card.settings.proficiency === filters.proficiency;
      const matchesTone = filters.tone === 'any' || card.settings.tone.toString() === filters.tone;
      const matchesModel = filters.llmModel === 'any' || card.settings.llmModel === filters.llmModel;
      const matchesTopic = filters.topic === 'any' || card.settings.topic === filters.topic;
      return matchesProficiency && matchesTone && matchesModel && matchesTopic;
    });

    // 2. Sorting (applied to the filtered list)
    const sorted = [...filtered].sort((a, b) => {
      let valA: unknown;
      let valB: unknown;

      if (sortKey === 'settings.proficiency') {
        // Special handling for proficiency levels
        valA = PROFICIENCY_LEVEL_ORDER[a.settings.proficiency] ?? -1;
        valB = PROFICIENCY_LEVEL_ORDER[b.settings.proficiency] ?? -1;
      } else if (sortKey.startsWith('settings.')) {
        const settingKey = sortKey.split('.')[1] as keyof TestCard['settings'];
        valA = a.settings[settingKey];
        valB = b.settings[settingKey];
      } else {
        valA = a[sortKey as keyof TestCard];
        valB = b[sortKey as keyof TestCard];
      }

      // Handle undefined values
      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.localeCompare(valB);
      } else {
        // Fallback for mixed types or other types
        comparison = String(valA).localeCompare(String(valB));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [cards, sortKey, sortDirection, filters]);

  const handleSortKeyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortKey(event.target.value as SortKey);
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleFilterChange = (
    filterKey: keyof FilterState,
    value: string
  ) => {
    setFilters(prev => ({ ...prev, [filterKey]: value }));
  };

  // Dynamic options for filters
  const uniqueModels = useMemo(() => [
    'any', 
    ...Array.from(new Set(cards.map(c => c.settings.llmModel).filter(Boolean) as string[]))
  ], [cards]);
  
  const uniqueTopics = useMemo(() => [
    'any', 
    ...Array.from(new Set(cards.map(c => c.settings.topic).filter(Boolean)))
  ], [cards]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-8">
      <div className="flex flex-col space-y-6 mb-8">
        <h1 className="text-2xl text-blue-400">Test Card Generation</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-2">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-[#2a2a2a] text-white rounded-md px-3 py-2 border border-gray-700"
                placeholder="Enter topic..."
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Number of Cards</label>
              <input
                type="number"
                min="1"
                max="10"
                value={cardCount}
                onChange={(e) => setCardCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="w-full bg-[#2a2a2a] text-white rounded-md px-3 py-2 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={generateAllLevels || generateAllTones}
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Proficiency Level</label>
              <select 
                value={currentProficiency}
                onChange={(e) => setCurrentProficiency(parseInt(e.target.value))}
                className="w-full bg-[#2a2a2a] text-white rounded-md px-3 py-2 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={generateAllLevels}
              >
                {PROFICIENCY_LEVELS.map((level, _levelIndex) => (
                  <option key={level} value={_levelIndex}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Tone Level</label>
              <select
                value={currentTone}
                onChange={(e) => setCurrentTone(parseInt(e.target.value))}
                className="w-full bg-[#2a2a2a] text-white rounded-md px-3 py-2 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={generateAllTones}
              >
                {TONE_LEVELS.map((tone, _toneIndex) => (
                  <option key={tone} value={_toneIndex}>Tone {tone}: {getToneDescription(tone)}</option>
                ))}
              </select>
            </div>

            {/* Checkboxes for batch generation */}
            <div className="flex items-center space-x-6 mt-4 col-span-1 md:col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="generate-all-levels"
                  checked={generateAllLevels}
                  onChange={(e) => setGenerateAllLevels(e.target.checked)}
                  className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="generate-all-levels" className="ml-2 text-sm font-medium text-gray-300">All Proficiency Levels</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="generate-all-tones"
                  checked={generateAllTones}
                  onChange={(e) => setGenerateAllTones(e.target.checked)}
                  className="h-4 w-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="generate-all-tones" className="ml-2 text-sm font-medium text-gray-300">All Tone Levels</label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-2">LLM Model</label>
              <select
                value={currentModel}
                onChange={(e) => setCurrentModel(parseInt(e.target.value))}
                className="w-full bg-[#2a2a2a] text-white rounded-md px-3 py-2 border border-gray-700"
              >
                {LLM_MODELS.map((model, _modelIndex) => (
                  <option key={model} value={_modelIndex}>{model}</option>
                ))}
              </select>
            </div>

            <div className="flex space-x-4 pt-8">
              <button
                onClick={generateCard}
                disabled={isGenerating}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-900 text-white rounded-md"
              >
                {isGenerating 
                    ? 'Generating...' 
                    : `Generate ${numCardsToGenerate} Card${numCardsToGenerate !== 1 ? 's' : ''}`
                }
              </button>
              <button
                onClick={cleanup}
                disabled={isCleaning}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-900 text-white rounded-md"
              >
                {isCleaning ? 'Cleaning up...' : 'Clean up test sets'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-900/20 border border-red-700/30 rounded-md p-4 mb-8">
          <h2 className="text-xl text-red-400 mb-2">Error</h2>
          <div className="text-red-500">{error}</div>
        </div>
      )}
      
      {/* Controls Container */}
      {cards.length > 0 && (
        <div className="mb-6 p-4 bg-[#2a2a2a]/50 rounded-lg border border-gray-700/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sorting Controls */}
            <div className="flex items-center space-x-2">
              <label htmlFor="sort-select" className="text-gray-400 text-sm whitespace-nowrap">Sort by:</label>
              <select
                id="sort-select"
                value={sortKey}
                onChange={handleSortKeyChange}
                className="flex-grow bg-[#2a2a2a] text-white rounded-md px-2 py-1 border border-gray-700 text-sm"
              >
                <option value="english">English</option>
                <option value="thai">Thai</option>
                <option value="pronunciation">Pronunciation</option>
                <option value="settings.proficiency">Proficiency</option>
                <option value="settings.tone">Tone</option>
                <option value="settings.llmModel">Model</option>
                <option value="settings.topic">Topic</option>
                <option value="settings.generationTime">Time</option>
              </select>
              <button
                onClick={toggleSortDirection}
                className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm whitespace-nowrap"
              >
                {sortDirection === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
            </div>

            {/* Filter Controls - Row 1 */}
            <div className="flex items-center space-x-2">
               <label htmlFor="filter-proficiency" className="text-gray-400 text-sm whitespace-nowrap">Proficiency:</label>
               <select
                 id="filter-proficiency"
                 value={filters.proficiency}
                 onChange={(e) => handleFilterChange('proficiency', e.target.value)}
                 className="flex-grow bg-[#2a2a2a] text-white rounded-md px-2 py-1 border border-gray-700 text-sm"
               >
                 <option value="any">Any</option>
                 {PROFICIENCY_LEVELS.map((level, _levelIndex) => (
                   <option key={level} value={level}>{level}</option>
                 ))}
               </select>
            
               <label htmlFor="filter-tone" className="text-gray-400 text-sm whitespace-nowrap">Tone:</label>
               <select
                 id="filter-tone"
                 value={filters.tone}
                 onChange={(e) => handleFilterChange('tone', e.target.value)}
                 className="flex-grow bg-[#2a2a2a] text-white rounded-md px-2 py-1 border border-gray-700 text-sm"
               >
                 <option value="any">Any</option>
                 {TONE_LEVELS.map((tone, _toneIndex) => (
                   <option key={tone} value={_toneIndex.toString()}>{tone}</option>
                 ))}
               </select>
             </div>

            {/* Filter Controls - Row 2 */}
             <div className="flex items-center space-x-2">
               <label htmlFor="filter-model" className="text-gray-400 text-sm whitespace-nowrap">Model:</label>
               <select
                 id="filter-model"
                 value={filters.llmModel}
                 onChange={(e) => handleFilterChange('llmModel', e.target.value)}
                 className="flex-grow bg-[#2a2a2a] text-white rounded-md px-2 py-1 border border-gray-700 text-sm"
               >
                 {uniqueModels.map((model, _modelIndex) => (
                   <option key={model} value={model}>{model === 'any' ? 'Any' : model}</option>
                 ))}
               </select>
            
               <label htmlFor="filter-topic" className="text-gray-400 text-sm whitespace-nowrap">Topic:</label>
               <select
                 id="filter-topic"
                 value={filters.topic}
                 onChange={(e) => handleFilterChange('topic', e.target.value)}
                 className="flex-grow bg-[#2a2a2a] text-white rounded-md px-2 py-1 border border-gray-700 text-sm"
               >
                 {uniqueTopics.map((topic, _topicIndex) => (
                   <option key={topic} value={topic}>{topic === 'any' ? 'Any' : topic}</option>
                 ))}
               </select>
            </div>
          </div>
        </div>
      )}

      {/* Visibility Toggles */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg mb-4">
        <h3 className="text-lg font-medium mb-3 text-gray-300">Show/Hide Card Elements:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[ 
            { label: 'English', state: showEnglish, setter: setShowEnglish },
            { label: 'Thai', state: showThai, setter: setShowThai },
            { label: 'Pronunciation', state: showPronunciation, setter: setShowPronunciation },
            { label: 'Mnemonic', state: showMnemonic, setter: setShowMnemonic },
            { label: 'Context', state: showContext, setter: setShowContext },
            { label: 'Settings', state: showSettings, setter: setShowSettings },
          ].map(({ label, state, setter }) => (
            <label key={label} className="flex items-center space-x-2 text-sm text-gray-200 cursor-pointer">
              <input
                type="checkbox"
                checked={state}
                onChange={(e) => setter(e.target.checked)}
                className="accent-blue-500"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAndSortedCards.map((card, index) => (
          <div key={index} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="space-y-1">
              {showThai && <p className="text-base text-white">{card.thai}</p>}
              {showEnglish && <p className="text-sm text-gray-400">{card.english}</p>}
              {showPronunciation && <p className="text-xs text-gray-300 italic">{card.pronunciation}</p>}
              {showMnemonic && card.mnemonic && (
                <p className="text-xs text-yellow-500/70 italic mt-1">
                  Mnemonic: {card.mnemonic}
                </p>
              )}
            </div>
            {showContext && card.examples && card.examples.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-700 space-y-1 text-xs">
                <p className="text-gray-400 font-medium">Context (Example 1):</p>
                <p className="text-white">{card.examples[0].thai}</p>
                <p className="text-gray-300 italic">{card.examples[0].pronunciation}</p>
                <p className="text-gray-400">({card.examples[0].translation})</p>
              </div>
            )}
            {showSettings && (
              <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500 space-y-1">
                <p><span className="font-medium text-gray-400">Proficiency:</span> {card.settings.proficiency}</p>
                <p><span className="font-medium text-gray-400">Tone:</span> {card.settings.tone} ({getToneDescription(card.settings.tone)})</p>
                <p><span className="font-medium text-gray-400">Topic:</span> {card.settings.topic}</p>
                <p><span className="font-medium text-gray-400">Model:</span> {card.settings.llmModel || 'N/A'}</p>
                <p><span className="font-medium text-gray-400">Temp:</span> {card.settings.temperature?.toFixed(2) || 'N/A'}</p>
                <p><span className="font-medium text-gray-400">Time:</span> {card.settings.generationTime ? `${(card.settings.generationTime / 1000).toFixed(2)}s` : 'N/A'}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 
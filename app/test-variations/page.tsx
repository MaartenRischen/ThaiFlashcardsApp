'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GeneratePromptOptions, Phrase } from '../lib/set-generator';
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
  // ... Add more weird scenarios as needed
];

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
    let tasks: GenerationTask[] = [];
    if (generateAllLevels && generateAllTones) {
      // All combinations (60 tasks)
      PROFICIENCY_LEVELS.forEach((level, levelIndex) => {
        TONE_LEVELS.forEach((tone, toneIndex) => {
          tasks.push({ level, toneLevel: tone });
        });
      });
    } else if (generateAllLevels) {
      // All levels, selected tone (6 tasks)
      PROFICIENCY_LEVELS.forEach((level, levelIndex) => {
        tasks.push({ level, toneLevel: TONE_LEVELS[currentTone] });
      });
    } else if (generateAllTones) {
      // Selected level, all tones (10 tasks)
      TONE_LEVELS.forEach((tone, toneIndex) => {
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

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
                {PROFICIENCY_LEVELS.map((level, index) => (
                  <option key={level} value={index}>{level}</option>
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
                {TONE_LEVELS.map((tone, index) => (
                  <option key={tone} value={index}>Tone {tone}: {getToneDescription(tone)}</option>
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
                {LLM_MODELS.map((model, index) => (
                  <option key={model} value={index}>{model}</option>
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
                 {PROFICIENCY_LEVELS.map(level => (
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
                 {TONE_LEVELS.map(tone => (
                   <option key={tone} value={tone.toString()}>{tone}</option>
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
                 {uniqueModels.map(model => (
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
                 {uniqueTopics.map(topic => (
                   <option key={topic} value={topic}>{topic === 'any' ? 'Any' : topic}</option>
                 ))}
               </select>
            </div>
          </div>
        </div>
      )}

      {/* Table of generated cards */}
      {filteredAndSortedCards.length > 0 && (
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full text-sm text-left text-gray-300 border border-gray-700">
            <thead className="bg-[#232323]">
              <tr>
                <th className="px-2 py-1 border-b border-gray-700">English</th>
                <th className="px-2 py-1 border-b border-gray-700">Thai</th>
                <th className="px-2 py-1 border-b border-gray-700">Pronunciation</th>
                <th className="px-2 py-1 border-b border-gray-700">Mnemonic</th>
                <th className="px-2 py-1 border-b border-gray-700">Proficiency</th>
                <th className="px-2 py-1 border-b border-gray-700">Tone</th>
                <th className="px-2 py-1 border-b border-gray-700">Temp.</th>
                <th className="px-2 py-1 border-b border-gray-700">LLM Model</th>
                <th className="px-2 py-1 border-b border-gray-700">Topic</th>
                <th className="px-2 py-1 border-b border-gray-700">Gen Time</th>
                <th className="px-2 py-1 border-b border-gray-700">Examples</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedCards.map((card, idx) => (
                <tr key={idx} className="border-b border-gray-700">
                  <td className="px-2 py-1">{card.english}</td>
                  <td className="px-2 py-1">{card.thai}</td>
                  <td className="px-2 py-1">{card.pronunciation}</td>
                  <td className="px-2 py-1">{card.mnemonic || '-'}</td>
                  <td className="px-2 py-1">{card.settings.proficiency}</td>
                  <td className="px-2 py-1">{card.settings.tone} ({getToneDescription(card.settings.tone)})</td>
                  <td className="px-2 py-1">{card.settings.temperature !== undefined ? card.settings.temperature.toFixed(2) : 'N/A'}</td>
                  <td className="px-2 py-1">{card.settings.llmModel || '-'}</td>
                  <td className="px-2 py-1">{card.settings.topic}</td>
                  <td className="px-2 py-1">{card.settings.generationTime ? formatTime(card.settings.generationTime) : '-'}</td>
                  <td className="px-2 py-1">
                    {card.examples.map((ex, exIdx) => (
                      <div key={exIdx}>{ex.thai} ({ex.translation})</div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAndSortedCards.map((card, index) => (
          <div 
            key={index}
            className="bg-[#2a2a2a] rounded-lg p-3 border border-gray-700 space-y-2 flex flex-col justify-between"
          >
            <div className="space-y-1">
              <p className="text-base text-white">{card.thai}</p>
              <p className="text-sm text-gray-400">{card.english}</p>
              <p className="text-xs text-gray-300 italic">{card.pronunciation}</p>
              {card.mnemonic && (
                <p className="text-xs text-yellow-500/70 italic mt-1">
                  Mnemonic: {card.mnemonic}
                </p>
              )}
            </div>

            <div className="mt-2 text-xs space-y-1">
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                <span className="text-blue-400">L: {card.settings.proficiency}</span>
                <span className="text-purple-400">T: {card.settings.tone} ({getToneDescription(card.settings.tone)})</span>
                <span className="text-yellow-400">Topic: {card.settings.topic}</span>
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                 <span className="text-green-400">M: {card.settings.llmModel}</span>
                 <span className="text-orange-400">Time: {formatTime(card.settings.generationTime || 0)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
'use client';

import React, { useState, useEffect } from 'react';

interface Phrase {
  meaning: string;
  thai: string;
  pronunciation: string;  // This will be used for official phonetics
  mnemonic: string;
}

interface Review {
  date: string;
  difficulty: 'hard' | 'good' | 'easy';
  interval: number;
  easeFactor: number;
  repetitions: number;
}

interface CardProgress {
  [key: number]: {
    reviews: Review[];
    nextReviewDate: string;
  };
}

interface Stats {
  totalCards: number;
  newCards: number;
  dueCards: number;
  learnedCards: number;
  successRate: number;
  averageInterval: number;
  totalReviews: number;
  reviewsToday: number;
  streak: number;
  newCardsToday: number;
  maxNewCardsPerSession: number;
}

// Update MnemonicEdits interface to include pronunciation
interface MnemonicEdits {
  [key: number]: {
    text: string;
    pronunciation: string;
  };
}

// Add level-related interfaces
interface LevelProgress {
  currentLevel: number;
  currentBatch: number[];  // Current 5 cards being learned
  masteredCards: number[]; // All mastered cards
}

// Common Thai words and phrases to combine with the main phrase
const commonPhrases = {
  greetings: ['ครับ', 'ค่ะ', 'ครับ/ค่ะ', 'ค่ะ/ครับ'],
  timeOfDay: ['ตอนเช้า', 'ตอนบ่าย', 'ตอนเย็น', 'ตอนกลางคืน'],
  questions: ['ครับ/ค่ะ?', 'ค่ะ/ครับ?', 'ครับ?', 'ค่ะ?'],
  responses: ['ครับ/ค่ะ', 'ค่ะ/ครับ', 'ครับ', 'ค่ะ'],
  sentenceStarters: [
    { thai: 'ฉันชอบ', pronunciation: 'chan chop', meaning: 'I like' },
    { thai: 'นี่คือ', pronunciation: 'nee keu', meaning: 'This is' },
    { thai: 'ฉันต้องการ', pronunciation: 'chan tong karn', meaning: 'I want' },
    { thai: 'เขาชอบ', pronunciation: 'kao chop', meaning: 'He/she likes' },
    { thai: 'ฉันมี', pronunciation: 'chan mee', meaning: 'I have' }
  ],
  sentenceEndings: [
    { thai: 'มาก', pronunciation: 'mak', meaning: 'a lot' },
    { thai: 'เล็กน้อย', pronunciation: 'lek noi', meaning: 'a little' },
    { thai: 'ทุกวัน', pronunciation: 'took wan', meaning: 'every day' },
    { thai: 'ตอนนี้', pronunciation: 'ton nee', meaning: 'right now' },
    { thai: 'แล้ว', pronunciation: 'laew', meaning: 'already' }
  ]
};

// Anki SRS constants
const INITIAL_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;
const INITIAL_INTERVAL = 1; // 1 day
const HARD_INTERVAL_MULTIPLIER = 1.2;
const EASY_INTERVAL_MULTIPLIER = 2.5;

// Add these constants at the top with other constants
const MAX_NEW_CARDS_PER_DAY = 20;
const MIN_INTERVAL = 1; // Minimum interval in days
const MAX_INTERVAL = 36500; // Maximum interval in days (100 years)

// Add these constants for Anki's exact timing
const LEARNING_STEPS = [1, 10]; // Initial learning steps in minutes
const GRADUATING_INTERVAL = 1; // First interval after learning in days
const EASY_INTERVAL = 4; // Interval when rating Easy on new card
const NEW_CARDS_PER_DAY = 20;

// Add a new interface for the random sentence
interface RandomSentence {
  thai: string;
  pronunciation: string;
  translation: string;
}

const DEFAULT_PHRASES: Phrase[] = [
  {
    meaning: "Hello",
    thai: "สวัสดี",
    pronunciation: "sa-wat-dee",
    mnemonic: "Think: 'Swadee' - like saying 'sweet day' quickly"
  },
  {
    meaning: "Thank you",
    thai: "ขอบคุณ",
    pronunciation: "khop-khun",
    mnemonic: "Think: 'Cope-Kun' - you cope with kindness"
  },
  {
    meaning: "Yes",
    thai: "ใช่",
    pronunciation: "chai",
    mnemonic: "Think: 'Chai' - like the tea, say 'yes' to chai"
  },
  {
    meaning: "No",
    thai: "ไม่",
    pronunciation: "mai",
    mnemonic: "Think: 'My' - 'My answer is no'"
  },
  {
    meaning: "How are you?",
    thai: "สบายดีไหม",
    pronunciation: "sa-bai-dee-mai",
    mnemonic: "Think: 'So bye, did I?' - asking about their well-being"
  }
];

// Add the VERSION_INFO constant at the top of the file
const VERSION_INFO = {
  lastUpdated: new Date().toISOString(),
  version: "1.0.2",
  changes: "Added Random Phrase contextual sentences and fixed button styling"
};

export default function ThaiFlashcards() {
  const [phrases] = useState<Phrase[]>(DEFAULT_PHRASES);
  const [index, setIndex] = useState<number>(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [localMnemonics, setLocalMnemonics] = useState<MnemonicEdits>(() => {
    try {
      const saved = localStorage.getItem('mnemonicEdits');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [cardProgress, setCardProgress] = useState<CardProgress>(() => {
    try {
      const saved = localStorage.getItem('cardProgress');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showVocabulary, setShowVocabulary] = useState(false);
  const [autoplay, setAutoplay] = useState<boolean>(false);
  const [levelProgress, setLevelProgress] = useState<LevelProgress>(() => {
    try {
      const saved = localStorage.getItem('levelProgress');
      return saved ? JSON.parse(saved) : {
        currentLevel: 1,
        currentBatch: [0, 1, 2, 3, 4],
        masteredCards: []
      };
    } catch {
      return {
        currentLevel: 1,
        currentBatch: [0, 1, 2, 3, 4],
        masteredCards: []
      };
    }
  });
  const [randomSentence, setRandomSentence] = useState<RandomSentence | null>(null);

  useEffect(() => {
    localStorage.setItem('cardProgress', JSON.stringify(cardProgress));
  }, [cardProgress]);

  useEffect(() => {
    localStorage.setItem('mnemonicEdits', JSON.stringify(localMnemonics));
  }, [localMnemonics]);

  useEffect(() => {
    localStorage.setItem('autoplay', JSON.stringify(autoplay));
  }, [autoplay]);

  useEffect(() => {
    localStorage.setItem('levelProgress', JSON.stringify(levelProgress));
  }, [levelProgress]);

  const handlePhoneticChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalMnemonics(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        pronunciation: e.target.value
      }
    }));
  };

  const handleMnemonicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalMnemonics(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        text: e.target.value
      }
    }));
  };

  const speak = async (text: string) => {
    setIsPlaying(true);
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH';
      utterance.onend = () => setIsPlaying(false);
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Speech synthesis error:', error);
      setIsPlaying(false);
    }
  };

  const handleCardAction = (difficulty: 'hard' | 'good' | 'easy') => {
    setIndex((prevIndex) => (prevIndex + 1) % phrases.length);
    setShowAnswer(false);
    setRandomSentence(null);
  };

  const handleResetAll = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Create a sentence using the current word and random elements from common phrases
  const generateRandomPhrase = () => {
    const currentPhrase = phrases[index];
    
    // Generate components for a random sentence
    const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
    
    // Create different sentence patterns
    const sentencePatterns = [
      // Pattern 1: current word + greeting
      () => {
        const greeting = getRandom(commonPhrases.greetings);
        return {
          thai: `${currentPhrase.thai}${greeting}`,
          pronunciation: `${currentPhrase.pronunciation} ${greeting === 'ครับ' ? 'krap' : 'ka'}`,
          translation: `${currentPhrase.meaning} (polite particle)`
        };
      },
      
      // Pattern 2: current word + time of day
      () => {
        const timeOfDay = getRandom(commonPhrases.timeOfDay);
        return {
          thai: `${currentPhrase.thai}${timeOfDay}`,
          pronunciation: `${currentPhrase.pronunciation} ${timeOfDay === 'ตอนเช้า' ? 'ton chao' : 
                         timeOfDay === 'ตอนบ่าย' ? 'ton bai' : 
                         timeOfDay === 'ตอนเย็น' ? 'ton yen' : 'ton klang keun'}`,
          translation: `${currentPhrase.meaning} ${timeOfDay === 'ตอนเช้า' ? 'in the morning' : 
                        timeOfDay === 'ตอนบ่าย' ? 'in the afternoon' : 
                        timeOfDay === 'ตอนเย็น' ? 'in the evening' : 'at night'}`
        };
      },
      
      // Pattern 3: current word as a question
      () => {
        const question = getRandom(commonPhrases.questions);
        return {
          thai: `${currentPhrase.thai}${question}`,
          pronunciation: `${currentPhrase.pronunciation} ${question.includes('ครับ') ? 'krap?' : 'ka?'}`,
          translation: `${currentPhrase.meaning}? (question form)`
        };
      },
      
      // Pattern 4: Sentence starter + current word
      () => {
        const starter = getRandom(commonPhrases.sentenceStarters);
        return {
          thai: `${starter.thai}${currentPhrase.thai}`,
          pronunciation: `${starter.pronunciation} ${currentPhrase.pronunciation}`,
          translation: `${starter.meaning} ${currentPhrase.meaning.toLowerCase()}`
        };
      },
      
      // Pattern 5: Sentence starter + current word + ending
      () => {
        const starter = getRandom(commonPhrases.sentenceStarters);
        const ending = getRandom(commonPhrases.sentenceEndings);
        return {
          thai: `${starter.thai}${currentPhrase.thai}${ending.thai}`,
          pronunciation: `${starter.pronunciation} ${currentPhrase.pronunciation} ${ending.pronunciation}`,
          translation: `${starter.meaning} ${currentPhrase.meaning.toLowerCase()} ${ending.meaning}`
        };
      },
      
      // Pattern 6: Time of day + current word
      () => {
        const timeOfDay = getRandom(commonPhrases.timeOfDay);
        const timeMap: {[key: string]: {pronunciation: string, translation: string}} = {
          'ตอนเช้า': {pronunciation: 'ton chao', translation: 'In the morning'},
          'ตอนบ่าย': {pronunciation: 'ton bai', translation: 'In the afternoon'},
          'ตอนเย็น': {pronunciation: 'ton yen', translation: 'In the evening'},
          'ตอนกลางคืน': {pronunciation: 'ton klang keun', translation: 'At night'}
        };
        
        return {
          thai: `${timeOfDay}${currentPhrase.thai}`,
          pronunciation: `${timeMap[timeOfDay].pronunciation} ${currentPhrase.pronunciation}`,
          translation: `${timeMap[timeOfDay].translation}, ${currentPhrase.meaning.toLowerCase()}`
        };
      }
    ];
    
    // Pick a random sentence pattern
    const patternIndex = Math.floor(Math.random() * sentencePatterns.length);
    const newSentence = sentencePatterns[patternIndex]();
    
    // Update the state with the new random sentence
    setRandomSentence(newSentence);
    
    // Return the Thai text for speech
    return newSentence.thai;
  };

  return (
    <main className="min-h-screen bg-[#1a1a1a]">
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Top Navigation */}
        <div className="flex justify-between items-center">
          <label className="flex items-center space-x-2 text-gray-400">
            <input
              type="checkbox"
              checked={autoplay}
              onChange={(e) => setAutoplay(e.target.checked)}
              className="form-checkbox h-4 w-4"
            />
            <span>Autoplay</span>
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowHowItWorks(!showHowItWorks)}
              className="neumorphic-button"
            >
              How It Works
            </button>
            <button
              onClick={() => setShowVocabulary(!showVocabulary)}
              className="neumorphic-button"
            >
              Vocabulary
            </button>
          </div>
        </div>

        {/* Card Status */}
        <div className="flex justify-between items-center text-sm text-gray-400">
          <div>Card {index + 1} of {phrases.length}</div>
          <div>Level {levelProgress.currentLevel}</div>
        </div>

        {/* Main Card */}
        <div className="neumorphic p-6 space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">
              {phrases[index].meaning}
            </h2>
          </div>

          {/* Display random sentence if available */}
          {randomSentence && (
            <div className="p-4 space-y-2 rounded-xl bg-[#222] border border-[#333] neumorphic">
              <h3 className="text-sm text-blue-400 uppercase tracking-wider mb-1">In Context</h3>
              <p className="text-base text-white font-medium">{randomSentence.thai}</p>
              <p className="text-sm text-gray-400 italic">{randomSentence.pronunciation}</p>
              <p className="text-sm text-gray-300 mt-2">{randomSentence.translation}</p>
            </div>
          )}

          {showAnswer ? (
            <div className="space-y-4">
              <div>
                <p className="text-lg">Thai: <span className="text-white">{phrases[index].thai}</span></p>
              </div>

              <div>
                <p className="text-gray-400">
                  Official phonetics: <span className="text-gray-300">{phrases[index].pronunciation}</span>
                </p>
              </div>

              <div>
                <p className="text-gray-400 mb-2">Personal phonetics:</p>
                <input
                  type="text"
                  value={localMnemonics[index]?.pronunciation || phrases[index].pronunciation}
                  onChange={handlePhoneticChange}
                  className="neumorphic-input"
                  placeholder="Add your own phonetic spelling..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => speak(phrases[index].thai)}
                  disabled={isPlaying}
                  className="neumorphic-button flex-1"
                >
                  {isPlaying ? 'Playing...' : 'Play'}
                </button>
                <button
                  onClick={() => {
                    const phrase = generateRandomPhrase();
                    speak(phrase);
                  }}
                  disabled={isPlaying}
                  className="neumorphic-button flex-1"
                >
                  Random Phrase
                </button>
              </div>

              <div>
                <p className="text-gray-400 mb-2">Mnemonic:</p>
                <input
                  type="text"
                  value={localMnemonics[index]?.text || phrases[index].mnemonic}
                  onChange={handleMnemonicChange}
                  className="neumorphic-input"
                  placeholder="Add your own mnemonic..."
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => handleCardAction('hard')} 
                  className="neumorphic-button text-red-500"
                >
                  Wrong
                </button>
                <button 
                  onClick={() => handleCardAction('good')} 
                  className="neumorphic-button text-yellow-500"
                >
                  Correct
                </button>
                <button 
                  onClick={() => handleCardAction('easy')} 
                  className="neumorphic-button text-green-500"
                >
                  Easy
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setShowAnswer(true)}
                className="w-full neumorphic-button"
              >
                Show Answer
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => speak(phrases[index].thai)}
                  disabled={isPlaying}
                  className="neumorphic-button flex-1"
                >
                  {isPlaying ? 'Playing...' : 'Play'}
                </button>
                <button
                  onClick={() => {
                    const phrase = generateRandomPhrase();
                    speak(phrase);
                  }}
                  disabled={isPlaying}
                  className="neumorphic-button flex-1"
                >
                  Random Phrase
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reset Button */}
        <div>
          <button
            onClick={handleResetAll}
            className="neumorphic-button text-red-500"
          >
            Reset All
          </button>
        </div>
      </div>

      {/* Settings Button */}
      <div className="fixed bottom-16 right-4 z-20">
        <button
          onClick={() => setShowStats(!showStats)}
          className="settings-button"
        >
          ⚙️
        </button>
      </div>

      {/* Modals */}
      {showStats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="neumorphic max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Statistics</h2>
              <button
                onClick={() => setShowStats(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            {/* Add statistics content here */}
          </div>
        </div>
      )}

      {showHowItWorks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="neumorphic max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">How It Works</h2>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            {/* Add how it works content here */}
          </div>
        </div>
      )}

      {showVocabulary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="neumorphic max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Vocabulary List</h2>
              <button
                onClick={() => setShowVocabulary(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            {/* Add vocabulary list content here */}
          </div>
        </div>
      )}

      {/* Version indicator at the bottom */}
      <div className="w-full py-3 px-4 text-center text-xs border-t border-gray-800 bg-[#222] sticky bottom-0 z-10">
        <p className="text-blue-400 font-bold">v{VERSION_INFO.version} | {new Date(VERSION_INFO.lastUpdated).toLocaleDateString()} {new Date(VERSION_INFO.lastUpdated).toLocaleTimeString()}</p>
        <p className="text-gray-400 mt-1">{VERSION_INFO.changes}</p>
      </div>
    </main>
  );
} 
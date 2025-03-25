'use client';

import React, { useState, useEffect } from 'react';
import { exportLocalStorage, importLocalStorage } from './backup';

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
  responses: ['ครับ/ค่ะ', 'ค่ะ/ครับ', 'ครับ', 'ค่ะ']
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

// Default phrases
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

export default function ThaiFlashcards() {
  const [phrases] = useState<Phrase[]>(DEFAULT_PHRASES);
  const [index, setIndex] = useState<number>(0);
  const [showAnswer, setShowAnswer] = useState(true);
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

  // Save progress to localStorage whenever it changes
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

  const generateRandomPhrase = () => {
    const randomGreeting = commonPhrases.greetings[Math.floor(Math.random() * commonPhrases.greetings.length)];
    const randomTimeOfDay = commonPhrases.timeOfDay[Math.floor(Math.random() * commonPhrases.timeOfDay.length)];
    return `${phrases[index].thai} ${randomGreeting} ${randomTimeOfDay}`;
  };

  const handleCardAction = (difficulty: 'hard' | 'good' | 'easy') => {
    // Update card progress...
    setIndex((prevIndex) => (prevIndex + 1) % phrases.length);
  };

  const handleResetAll = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <main className="min-h-screen bg-black">
      {/* Top Navigation Bar */}
      <nav className="nav-bar">
        <div className="nav-content">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-gray-400">
              <input
                type="checkbox"
                checked={autoplay}
                onChange={(e) => setAutoplay(e.target.checked)}
                className="form-checkbox h-4 w-4"
              />
              <span>Autoplay</span>
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowHowItWorks(!showHowItWorks)}
              className="button"
            >
              How It Works
            </button>
            <button
              onClick={() => setShowStats(!showStats)}
              className="button"
            >
              Show Stats
            </button>
            <button
              onClick={() => setShowVocabulary(!showVocabulary)}
              className="button"
            >
              Learned Phrases
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20 pb-8 px-4">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Card Status & Level */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="status-new">
                New
              </span>
              <span className="text-gray-400">
                Card {index + 1} of 5
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="status-mastered">
                Level {levelProgress.currentLevel}
              </span>
              <span className="text-gray-400">
                {levelProgress.masteredCards.length} / 5 Mastered
              </span>
            </div>
          </div>

          {/* Main Card */}
          <div className="card space-y-6">
            {/* Meaning */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white">
                {phrases[index].meaning}
              </h2>
            </div>

            {/* Thai Text */}
            <div>
              <p className="text-lg">Thai: <span className="text-white">{phrases[index].thai}</span></p>
            </div>

            {/* Official Phonetics */}
            <div>
              <p className="text-gray-400">
                Official phonetics: <span className="text-gray-300">{phrases[index].pronunciation}</span>
              </p>
            </div>

            {/* Personal Phonetics */}
            <div>
              <p className="text-gray-400 mb-2">Personal phonetics:</p>
              <input
                type="text"
                value={localMnemonics[index]?.pronunciation || phrases[index].pronunciation}
                onChange={handlePhoneticChange}
                className="input"
                placeholder="Add your own phonetic spelling..."
              />
            </div>

            {/* Audio Controls */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => speak(phrases[index].thai)}
                disabled={isPlaying}
                className="button"
              >
                Play
              </button>
              <button
                onClick={() => speak(generateRandomPhrase())}
                disabled={isPlaying}
                className="button"
              >
                Random Phrase
              </button>
            </div>

            {/* Mnemonic */}
            <div>
              <p className="text-gray-400 mb-2">Mnemonic:</p>
              <input
                type="text"
                value={localMnemonics[index]?.text || phrases[index].mnemonic}
                onChange={handleMnemonicChange}
                className="input"
                placeholder="Add your own mnemonic..."
              />
            </div>

            {/* Rating Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => handleCardAction('hard')} 
                className="button text-red-500"
              >
                Wrong
              </button>
              <button 
                onClick={() => handleCardAction('good')} 
                className="button text-yellow-500"
              >
                Correct
              </button>
              <button 
                onClick={() => handleCardAction('easy')} 
                className="button text-green-500"
              >
                Easy
              </button>
            </div>
          </div>

          {/* Reset Button */}
          <div>
            <button
              onClick={handleResetAll}
              className="button text-red-500"
            >
              Reset All
            </button>
          </div>
        </div>
      </div>

      {/* Settings Button */}
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => setShowStats(!showStats)}
          className="settings-button"
        >
          ⚙️
        </button>
      </div>

      {/* Modals */}
      {showStats && (
        <div className="modal">
          <div className="modal-content">
            {/* ... stats modal content ... */}
          </div>
        </div>
      )}

      {showHowItWorks && (
        <div className="modal">
          <div className="modal-content">
            {/* ... how it works modal content ... */}
          </div>
        </div>
      )}

      {showVocabulary && (
        <div className="modal">
          <div className="modal-content">
            {/* ... vocabulary modal content ... */}
          </div>
        </div>
      )}
    </main>
  );
} 
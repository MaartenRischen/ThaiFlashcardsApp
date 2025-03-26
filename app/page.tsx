'use client';

import React, { useState, useEffect } from 'react';
import { exportLocalStorage, importLocalStorage } from './backup';
import SettingsMenu from './components/SettingsMenu';
import { loadUserData, saveMnemonic, savePhoneticNote, updateProgress } from './utils/storage';
import { ErrorBoundary } from './components/ErrorBoundary';

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

// Update UserData interface to match the storage utility
interface UserData {
  mnemonics?: { [phraseId: string]: string };
  [key: string]: any;
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

// Add default phrases directly in the code
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

function ThaiFlashcardsInner() {
  const [phrases, setPhrases] = useState<Phrase[]>(DEFAULT_PHRASES);
  const [index, setIndex] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [localMnemonics, setLocalMnemonics] = useState<MnemonicEdits>(() => {
    const saved = loadUserData() as unknown as UserData;
    const mnemonics = saved?.mnemonics || {};
    // Convert string-based mnemonics to the new format
    return Object.entries(mnemonics).reduce((acc, [key, value]) => {
      const numKey = parseInt(key, 10);
      if (!isNaN(numKey)) {
        acc[numKey] = {
          text: value,
          pronunciation: phrases[numKey]?.pronunciation || ''
        };
      }
      return acc;
    }, {} as MnemonicEdits);
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
  const [randomPhrase, setRandomPhrase] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [newCardsToday, setNewCardsToday] = useState(() => {
    try {
      const saved = localStorage.getItem('newCardsToday');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [showHowItWorks, setShowHowItWorks] = useState(false);
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

  // Add state for cartoon loading
  const [isGeneratingCartoon, setIsGeneratingCartoon] = useState(false);

  // Add autoplay state
  const [autoplay, setAutoplay] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('autoplay');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Add vocabulary state
  const [showVocabulary, setShowVocabulary] = useState(false);

  const userData = loadUserData();

  const [isInitialized, setIsInitialized] = useState(true);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cardProgress', JSON.stringify(cardProgress));
  }, [cardProgress]);

  useEffect(() => {
    localStorage.setItem('newCardsToday', newCardsToday.toString());
  }, [newCardsToday]);

  // Reset new cards counter at midnight
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    const resetNewCardsCount = () => {
      setNewCardsToday(0);
    };

    const timer = setTimeout(resetNewCardsCount, timeUntilMidnight);
    return () => clearTimeout(timer);
  }, []);

  // Add useEffect to save mnemonic edits
  useEffect(() => {
    localStorage.setItem('mnemonicEdits', JSON.stringify(localMnemonics));
  }, [localMnemonics]);

  // Add useEffect to save autoplay preference
  useEffect(() => {
    localStorage.setItem('autoplay', JSON.stringify(autoplay));
  }, [autoplay]);

  // Replace the useEffect for fetching phrases with a simpler one
  useEffect(() => {
    const loadAdditionalPhrases = async () => {
      try {
        // Start with default phrases
        setPhrases(DEFAULT_PHRASES);
        setIndex(0);

        // Try to load additional phrases
        const response = await fetch('/phrases.json');
        if (!response.ok) return;
        
        const data = await response.json();
        if (!Array.isArray(data)) {
          console.error('Loaded data is not an array:', data);
          return;
        }

        // Validate the data structure
        const isValidData = data.every(phrase => 
          phrase &&
          typeof phrase === 'object' &&
          typeof phrase.meaning === 'string' &&
          typeof phrase.thai === 'string' &&
          typeof phrase.pronunciation === 'string' &&
          typeof phrase.mnemonic === 'string'
        );

        if (!isValidData) {
          console.error('Invalid phrase data structure:', data);
          return;
        }

        // Only update if we have valid data
        if (data.length > 0) {
          setPhrases(data);
          setIndex(0);
        }
      } catch (error) {
        console.error('Error loading additional phrases:', error);
        // Continue with default phrases if there's an error
      }
    };

    // Try to load additional phrases, but don't block on it
    loadAdditionalPhrases();
  }, []);

  const speak = (text: string, rate: number = 0.8) => {
    if (typeof window === 'undefined') {
      console.warn('Speech synthesis not available (server-side)');
      return;
    }

    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not supported in this browser');
      return;
    }

    // Function to get available voices
    const getVoices = (): Promise<SpeechSynthesisVoice[]> => {
      return new Promise((resolve) => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          resolve(voices);
        } else {
          // Wait for voices to be loaded
          window.speechSynthesis.onvoiceschanged = () => {
            const loadedVoices = window.speechSynthesis.getVoices();
            resolve(loadedVoices);
          };
        }
      });
    };

    // Function to find the best available voice
    const findBestVoice = async () => {
      try {
        const voices = await getVoices();
        
        // Try to find a Thai voice
        const thaiVoice = voices.find(voice => voice.lang.includes('th'));
        if (thaiVoice) return thaiVoice;
        
        // Try to find any Asian language voice
        const asianVoice = voices.find(voice => 
          voice.lang.includes('zh') || 
          voice.lang.includes('ja') || 
          voice.lang.includes('ko')
        );
        if (asianVoice) return asianVoice;
        
        // Try to find any non-English voice
        const nonEnglishVoice = voices.find(voice => !voice.lang.includes('en'));
        if (nonEnglishVoice) return nonEnglishVoice;
        
        // Fallback to any available voice
        return voices[0];
      } catch (error) {
        console.error('Error finding voice:', error);
        return null;
      }
    };

    // Create and configure the utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH';
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Set up event handlers
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
    };

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Find and set the best available voice
    findBestVoice().then(voice => {
      if (voice) {
        utterance.voice = voice;
      }
      
      // Attempt to speak
      try {
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Failed to start speech:', error);
        setIsPlaying(false);
      }
    }).catch(error => {
      console.error('Error finding voice:', error);
      setIsPlaying(false);
    });
  };

  const generateRandomPhrase = () => {
    if (index === null) return;
    const currentPhrase = phrases[index];
    const otherPhrases = phrases.filter((_, i) => i !== index);
    const randomIndex = Math.floor(Math.random() * otherPhrases.length);
    const randomPhrase = otherPhrases[randomIndex];
    setRandomPhrase(`${randomPhrase.thai} (${randomPhrase.pronunciation})`);
    return randomPhrase.thai; // Return the Thai text for speaking
  };

  const calculateNextReview = (difficulty: Review['difficulty'], currentProgress: CardProgress[number] | undefined) => {
    const now = new Date();
    let interval: number;
    let easeFactor: number;
    let repetitions: number;

    if (!currentProgress || !currentProgress.reviews.length) {
      // First review of a new card
      switch (difficulty) {
        case 'hard':
          interval = GRADUATING_INTERVAL;
          easeFactor = Math.max(1.3, INITIAL_EASE_FACTOR - 0.15);
          repetitions = 1;
          break;
        case 'good':
          interval = GRADUATING_INTERVAL;
          easeFactor = INITIAL_EASE_FACTOR;
          repetitions = 1;
          break;
        case 'easy':
          interval = EASY_INTERVAL;
          easeFactor = INITIAL_EASE_FACTOR + 0.15;
          repetitions = 2;
          break;
      }
    } else {
      const lastReview = currentProgress.reviews[currentProgress.reviews.length - 1];
      interval = lastReview.interval;
      easeFactor = lastReview.easeFactor;
      repetitions = lastReview.repetitions;

      // Card in learning/relearning
      if (interval < GRADUATING_INTERVAL) {
        switch (difficulty) {
          case 'hard':
            interval = GRADUATING_INTERVAL;
            easeFactor = Math.max(1.3, easeFactor - 0.15);
            repetitions = 1;
            break;
          case 'good':
            interval = GRADUATING_INTERVAL;
            easeFactor = easeFactor;
            repetitions = 1;
            break;
          case 'easy':
            interval = EASY_INTERVAL;
            easeFactor = easeFactor + 0.15;
            repetitions = 2;
            break;
        }
      } else {
        // Review card
        switch (difficulty) {
          case 'hard':
            interval = Math.max(1, Math.round(interval * 1.2));
            easeFactor = Math.max(1.3, easeFactor - 0.15);
            repetitions++;
            break;
          case 'good':
            interval = Math.round(interval * easeFactor);
            repetitions++;
            break;
          case 'easy':
            interval = Math.round(interval * easeFactor * EASY_INTERVAL_MULTIPLIER);
            easeFactor = easeFactor + 0.15;
            repetitions++;
            break;
        }
      }
    }

    // Cap the interval
    interval = Math.min(interval, MAX_INTERVAL);

    // For learning steps, we use minutes instead of days
    const nextReviewDate = interval < 1 
      ? new Date(now.getTime() + interval * 24 * 60 * 60 * 1000) // Convert days to milliseconds
      : new Date(now.getTime() + Math.round(interval) * 24 * 60 * 60 * 1000);

    return {
      interval,
      easeFactor,
      repetitions,
      nextReviewDate: nextReviewDate.toISOString()
    };
  };

  // Add useEffect to save level progress
  useEffect(() => {
    localStorage.setItem('levelProgress', JSON.stringify(levelProgress));
  }, [levelProgress]);

  // Add useEffect to initialize first level cards
  useEffect(() => {
    if (phrases.length > 0 && levelProgress.currentBatch.length === 0) {
      // Initialize first 5 cards for level 1
      setLevelProgress(prev => ({
        ...prev,
        currentBatch: [0, 1, 2, 3, 4]
      }));
    }
  }, [phrases]);

  // Add function to check if a card is mastered
  const isCardMastered = (cardIndex: number) => {
    return levelProgress.masteredCards.includes(cardIndex);
  };

  // Add function to get current level cards
  const getCurrentLevelCards = () => {
    const totalCardsForCurrentLevel = levelProgress.currentLevel * 5;
    return phrases.slice(0, totalCardsForCurrentLevel);
  };

  // Modify getDueCards to strictly enforce current batch
  const getDueCards = (): number[] => {
    return Object.entries(cardProgress)
      .filter(([_, progress]) => new Date(progress.nextReviewDate) <= new Date())
      .map(([index]) => parseInt(index, 10));
  };

  // Modify getNextCard to only show current batch cards
  const getNextCard = (): number => {
    const dueCards = getDueCards();
    if (dueCards.length === 0) return 0;
    return dueCards[0];
  };

  // Modify handleCardAction to ensure levelProgress is valid
  const handleCardAction = (difficulty: Review['difficulty']) => {
    if (index === null || !currentPhrase) return;
    
    const currentProgress = cardProgress[index] || { reviews: [], nextReviewDate: new Date().toISOString() };
    const nextReview: Review = {
      date: new Date().toISOString(),
      difficulty,
      ...calculateNextReview(difficulty, currentProgress)
    };
    
    setCardProgress(prev => ({
      ...prev,
      [index]: {
        ...currentProgress,
        reviews: [...currentProgress.reviews, nextReview],
        nextReviewDate: new Date(Date.now() + nextReview.interval * 24 * 60 * 60 * 1000).toISOString()
      }
    }));
    
    setShowAnswer(false);
    const nextIndex = getNextCard();
    setIndex(nextIndex);
  };

  // Add useEffect to set initial card and handle card changes
  useEffect(() => {
    if (phrases.length > 0) {
      const nextIndex = getNextCard();
      setIndex(nextIndex);
    }
  }, [phrases.length, cardProgress, newCardsToday]);

  const resetProgress = () => {
    if (window.confirm('Are you sure you want to reset all progress?')) {
      setIndex(null);
      setShowAnswer(false);
      setCardProgress({});
      setLocalMnemonics({});
      setIsPlaying(false);
      setRandomPhrase('');
      setNewCardsToday(0);
      setLevelProgress({
        currentLevel: 1,
        currentBatch: [0, 1, 2, 3, 4],
        masteredCards: []
      });
      localStorage.removeItem('newCardsToday');
      localStorage.removeItem('levelProgress');
    }
  };

  // Add handler for personal phonetics
  const handlePhoneticChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (index === null || !currentPhrase) return;
    
    const newPhonetic = e.target.value;
    setLocalMnemonics({ 
      ...localMnemonics, 
      [index]: {
        text: localMnemonics[index]?.text || currentPhrase.mnemonic,
        pronunciation: newPhonetic
      }
    });
  };

  const handleMnemonicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (index === null || !currentPhrase) return;
    
    const newText = e.target.value;
    setLocalMnemonics({ 
      ...localMnemonics, 
      [index]: {
        text: newText,
        pronunciation: localMnemonics[index]?.pronunciation || currentPhrase.pronunciation
      }
    });
  };

  // Update revertMnemonic to handle the new structure
  const revertMnemonic = (cardIndex: number) => {
    if (cardIndex === null) return;
    const updatedMnemonics = { ...localMnemonics };
    delete updatedMnemonics[cardIndex];
    setLocalMnemonics(updatedMnemonics);
  };

  // Modify getNextReviewDate to handle null index
  const getNextReviewDate = (cardIndex: number | null): string => {
    if (cardIndex === null) return '';
    const progress = cardProgress[cardIndex];
    return progress?.nextReviewDate || new Date().toISOString();
  };

  // Modify isCardDue to handle null index
  const isCardDue = (cardIndex: number | null): boolean => {
    if (cardIndex === null) return false;
    const progress = cardProgress[cardIndex];
    if (!progress) return true;
    return new Date(progress.nextReviewDate) <= new Date();
  };

  // Modify getCardType to consider cards as new until they get a Good or Easy rating
  const getCardType = (cardIndex: number | null): 'new' | 'learning' | 'review' | null => {
    if (cardIndex === null) return null;
    const progress = cardProgress[cardIndex];
    if (!progress) return 'new';
    if (progress.reviews.length < 5) return 'learning';
    return 'review';
  };

  // Add function to get card status text
  const getCardStatus = (cardIndex: number | null): string => {
    if (cardIndex === null) return '';
    const progress = cardProgress[cardIndex];
    if (!progress) return 'New';
    if (progress.reviews.length < 5) return 'Learning';
    return 'Review';
  };

  // Modify calculateStats to count successful reviews
  const calculateStats = (): Stats => {
    const totalCards = phrases.length;
    const newCards = Object.keys(cardProgress).length;
    const dueCards = getDueCards().length;
    const learnedCards = Object.values(cardProgress).filter(p => p.reviews.length >= 5).length;
    const successRate = calculateSuccessRate();
    const averageInterval = calculateAverageInterval();
    const totalReviews = Object.values(cardProgress).reduce((sum, p) => sum + p.reviews.length, 0);
    const reviewsToday = Object.values(cardProgress).reduce((sum, p) => 
      sum + p.reviews.filter((r: Review) => new Date(r.date).toDateString() === new Date().toDateString()).length, 0);
    const streak = calculateStreak();
    const maxNewCardsPerSession = 5;

    return {
      totalCards,
      newCards,
      dueCards,
      learnedCards,
      successRate,
      averageInterval,
      totalReviews,
      reviewsToday,
      streak,
      newCardsToday,
      maxNewCardsPerSession
    };
  };

  const stats = calculateStats();

  // Get the current phrase safely
  const currentPhrase = index !== null ? phrases[index] : null;
  if (!currentPhrase || typeof currentPhrase !== 'object') {
    console.error('Invalid current phrase:', { index, currentPhrase, phrasesLength: phrases.length });
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">Something went wrong!</h1>
          <p className="text-gray-300 mb-6">Unable to load the current phrase. Please try refreshing the page.</p>
          <button
            onClick={() => {
              setPhrases(DEFAULT_PHRASES);
              setIndex(0);
              window.location.reload();
            }}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors duration-200"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Create a safe version of the current phrase with explicit type checking
  const safePhrase = {
    meaning: typeof currentPhrase.meaning === 'string' ? currentPhrase.meaning : '',
    thai: typeof currentPhrase.thai === 'string' ? currentPhrase.thai : '',
    pronunciation: typeof currentPhrase.pronunciation === 'string' ? currentPhrase.pronunciation : '',
    mnemonic: typeof currentPhrase.mnemonic === 'string' ? currentPhrase.mnemonic : ''
  };

  const nextReview = getNextReviewDate(index);
  const isDue = isCardDue(index);

  const calculateSuccessRate = (): number => {
    let totalReviews = 0;
    let successfulReviews = 0;

    Object.values(cardProgress).forEach(progress => {
      progress.reviews.forEach((review: Review) => {
        totalReviews++;
        if (review.difficulty === 'good' || review.difficulty === 'easy') {
          successfulReviews++;
        }
      });
    });

    return totalReviews > 0 ? (successfulReviews / totalReviews) * 100 : 0;
  };

  const calculateAverageInterval = (): number => {
    let totalIntervals = 0;
    let totalReviews = 0;

    Object.values(cardProgress).forEach(progress => {
      progress.reviews.forEach((review: Review) => {
        if (review.interval) {
          totalIntervals += review.interval;
        }
        totalReviews++;
      });
    });

    return totalReviews > 0 ? totalIntervals / totalReviews : 0;
  };

  const calculateStreak = (): number => {
    const reviewDates = Object.values(cardProgress)
      .flatMap(progress => progress.reviews.map((review: Review) => new Date(review.date)))
      .sort((a, b) => b.getTime() - a.getTime());

    if (reviewDates.length === 0) return 0;

    let currentStreak = 1;
    let currentDate = new Date(reviewDates[0]);
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 1; i < reviewDates.length; i++) {
      const reviewDate = new Date(reviewDates[i]);
      reviewDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((currentDate.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
      currentDate = reviewDate;
    }

    return currentStreak;
  };

  // Add useEffect for autoplay
  useEffect(() => {
    if (autoplay && showAnswer && !isPlaying && currentPhrase) {
      speak(currentPhrase.thai);
    }
  }, [showAnswer, autoplay, currentPhrase]);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-[#1a1a1a]">
      <div className="w-full max-w-md space-y-4">
        {/* Top buttons */}
        <div className="flex justify-between items-center space-x-2">
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={autoplay}
                onChange={(e) => setAutoplay(e.target.checked)}
                className="form-checkbox h-4 w-4 text-blue-400 rounded bg-gray-700 border-gray-600"
              />
              <span>Autoplay</span>
            </label>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowHowItWorks(!showHowItWorks)}
              className="neumorphic-button"
            >
              How It Works
            </button>
            <button
              onClick={() => setShowStats(!showStats)}
              className="neumorphic-button"
            >
              {showStats ? 'Hide Stats' : 'Show Stats'}
            </button>
            <button
              onClick={() => setShowVocabulary(!showVocabulary)}
              className="neumorphic-button"
            >
              Learned Phrases
            </button>
          </div>
        </div>

        {/* Main card */}
        <div className="neumorphic p-6 space-y-4">
          {/* Card status and info */}
          <div className="flex justify-between items-center mb-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded ${
                getCardType(index) === 'new' ? 'bg-blue-600' :
                getCardType(index) === 'learning' ? 'bg-yellow-600' :
                'bg-green-600'
              }`}>
                {getCardStatus(index)}
              </span>
              {nextReview && (
                <span className={`px-2 py-1 rounded ${
                  isDue ? 'bg-red-600' : 'bg-gray-600'
                }`}>
                  {isDue ? 'Due now' : `Due in ${Math.ceil((new Date(nextReview).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days`}
                </span>
              )}
            </div>
            <div className="text-gray-400">
              Card {index !== null ? index + 1 : 0} of {phrases.length}
            </div>
          </div>

          {/* Level progress */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-purple-600 rounded-lg font-bold">
                Level {levelProgress.currentLevel}
              </span>
              <span className="text-sm text-gray-400">
                {levelProgress.currentBatch.filter(i => levelProgress.masteredCards.includes(i)).length} / 5 Mastered
              </span>
            </div>
          </div>

          {/* Review info */}
          <div className="text-sm text-gray-400 mb-4">
            {index !== null && cardProgress[index]?.reviews.length > 0 && (
              <div>
                Last review: {new Date(cardProgress[index].reviews[cardProgress[index].reviews.length - 1].date).toLocaleDateString()}
                <br />
                Interval: {cardProgress[index].reviews[cardProgress[index].reviews.length - 1].interval} days
              </div>
            )}
          </div>

          {/* Current phrase */}
          <div className="text-2xl font-bold text-center mb-6">
            {safePhrase.meaning}
          </div>

          {/* Audio controls - moved outside showAnswer condition */}
          <div className="flex justify-center gap-2 mb-4">
            <button
              onClick={() => speak(safePhrase.thai)}
              disabled={isPlaying}
              className="neumorphic-button flex-1"
            >
              {isPlaying ? 'Playing...' : 'Play'}
            </button>
            <button
              onClick={() => {
                const phrase = generateRandomPhrase();
                if (phrase) speak(phrase);
              }}
              disabled={isPlaying}
              className="neumorphic-button flex-1"
            >
              Random Phrase
            </button>
          </div>

          {randomPhrase && (
            <p className="text-sm text-center text-gray-400 mb-4">
              {randomPhrase}
            </p>
          )}

          {showAnswer ? (
            <div className="space-y-4">
              <p className="text-lg mb-3">Thai: <span className="font-semibold">{safePhrase.thai}</span></p>
              <div className="space-y-2">
                <p className="mb-2">
                  Official phonetics: <span className="italic text-gray-400">{safePhrase.pronunciation}</span>
                </p>
                <div>
                  <div className="flex items-center justify-between text-sm italic text-gray-400 mb-1">
                    <span>Personal phonetics:</span>
                    {index !== null && localMnemonics[index]?.pronunciation !== undefined && (
                      <button
                        onClick={() => index !== null && revertMnemonic(index)}
                        className="neumorphic-button text-xs"
                        title="Revert to original"
                      >
                        Revert to Original
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={index !== null ? (localMnemonics[index]?.pronunciation || safePhrase.pronunciation) : safePhrase.pronunciation}
                    onChange={handlePhoneticChange}
                    placeholder="Add your own phonetic spelling..."
                    className="neumorphic-input"
                  />
                </div>
              </div>

              {/* Mnemonic section */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm italic text-gray-400 mb-1">
                  <span>Mnemonic:</span>
                  {index !== null && localMnemonics[index]?.text !== undefined && (
                    <button
                      onClick={() => index !== null && revertMnemonic(index)}
                      className="neumorphic-button text-xs"
                      title="Revert to original mnemonic"
                    >
                      Revert to Original
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={index !== null ? (localMnemonics[index]?.text || safePhrase.mnemonic) : safePhrase.mnemonic}
                  onChange={handleMnemonicChange}
                  placeholder="Add your own mnemonic..."
                  className="neumorphic-input"
                />
              </div>

              {/* Rating buttons */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <button 
                  onClick={() => handleCardAction('hard')} 
                  className="neumorphic-button text-red-400 hover:text-red-300"
                >
                  Wrong
                </button>
                <button 
                  onClick={() => handleCardAction('good')} 
                  className="neumorphic-button text-yellow-400 hover:text-yellow-300"
                >
                  Correct
                </button>
                <button 
                  onClick={() => handleCardAction('easy')} 
                  className="neumorphic-button text-green-400 hover:text-green-300"
                >
                  Easy
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowAnswer(!showAnswer)} 
              className="w-full neumorphic-button font-medium"
            >
              Show Answer
            </button>
          )}
        </div>

        {/* Stats panel */}
        {showStats && (
          <div className="neumorphic p-4 space-y-4">
            <h3 className="text-lg font-medium">Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Current Level:</span>
                <span className="text-purple-400">{levelProgress.currentLevel}</span>
              </div>
              <div className="flex justify-between">
                <span>Cards Mastered:</span>
                <span className="text-green-400">{levelProgress.masteredCards.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Cards:</span>
                <span>{stats.totalCards}</span>
              </div>
              <div className="flex justify-between">
                <span>New Cards:</span>
                <span className="text-blue-400">{stats.newCards}</span>
              </div>
              <div className="flex justify-between">
                <span>Due Cards:</span>
                <span className="text-red-400">{stats.dueCards}</span>
              </div>
              <div className="flex justify-between">
                <span>Learned Cards:</span>
                <span className="text-green-400">{stats.learnedCards}</span>
              </div>
              <div className="flex justify-between">
                <span>Success Rate:</span>
                <span>{stats.successRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Average Interval:</span>
                <span>{stats.averageInterval.toFixed(1)} days</span>
              </div>
              <div className="flex justify-between">
                <span>Total Reviews:</span>
                <span>{stats.totalReviews}</span>
              </div>
              <div className="flex justify-between">
                <span>Reviews Today:</span>
                <span>{stats.reviewsToday}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Streak:</span>
                <span className="text-yellow-400">{stats.streak} days</span>
              </div>
              <div className="flex justify-between">
                <span>New Cards Today:</span>
                <span className="text-blue-400">{stats.newCardsToday}</span>
              </div>
            </div>
          </div>
        )}

        {/* Settings buttons */}
        <div className="flex justify-between space-x-2">
          <button
            onClick={resetProgress}
            className="neumorphic-button text-red-400"
          >
            Reset All
          </button>
          <div className="flex space-x-2">
            <button
              onClick={() => exportLocalStorage()}
              className="neumorphic-button"
            >
              Backup Progress
            </button>
            <label className="neumorphic-button cursor-pointer">
              Import Progress
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const content = event.target?.result;
                      if (typeof content === 'string') {
                        if (window.confirm('Are you sure you want to import this progress data? This will overwrite your current progress.')) {
                          if (importLocalStorage(content)) {
                            window.location.reload();
                          } else {
                            alert('Failed to import progress data. Please check the file format.');
                          }
                        }
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* How It Works Modal */}
      {showHowItWorks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="neumorphic max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">How This App Works</h2>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <section>
                <h3 className="text-lg font-semibold text-green-400 mb-2">Learning Process</h3>
                <p>This app uses a spaced repetition system similar to Anki to help you efficiently learn Thai phrases. Here's how it works:</p>
                <ul className="list-disc ml-6 mt-2 space-y-2">
                  <li>When you see a new card, you'll rate how well you knew it: Again, Hard, Good, or Easy</li>
                  <li>Based on your rating, the card will reappear after increasingly longer intervals</li>
                  <li>Cards you find difficult will appear more frequently</li>
                  <li>Cards you know well will appear less frequently</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Card Types</h3>
                <ul className="space-y-2">
                  <li><span className="text-blue-400 font-semibold">New Cards (Blue):</span> Cards you haven't learned yet</li>
                  <li><span className="text-yellow-400 font-semibold">Learning (Yellow):</span> Cards in the initial learning phase</li>
                  <li><span className="text-green-400 font-semibold">Review (Green):</span> Cards you're reviewing at longer intervals</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">Button Meanings</h3>
                <ul className="space-y-2">
                  <li><span className="text-red-400 font-semibold">Wrong (Red):</span> "I didn't remember it well" - Shorter interval</li>
                  <li><span className="text-yellow-400 font-semibold">Correct (Yellow):</span> "I remembered it" - Normal interval increase</li>
                  <li><span className="text-green-400 font-semibold">Easy (Green):</span> "Very easy!" - Longer interval</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-purple-400 mb-2">Learning Tips</h3>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Use the speech buttons to hear correct pronunciation</li>
                  <li>Write your own mnemonics to help remember phrases</li>
                  <li>Practice with random phrase combinations</li>
                  <li>Review cards daily for the best results</li>
                  <li>Be honest with your ratings - it helps optimize your learning</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-red-400 mb-2">Important Notes</h3>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Your progress is saved automatically</li>
                  <li>The app focuses on cards that need more practice</li>
                  <li>You can reset your progress at any time</li>
                  <li>Check your stats to track your learning journey</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Vocabulary Modal */}
      {showVocabulary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="neumorphic max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Learned Words</h2>
              <button
                onClick={() => setShowVocabulary(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {phrases.map((phrase, idx) => {
                const cardType = getCardType(idx);
                let statusColor = 'bg-gray-600'; // Default color for new cards

                switch (cardType) {
                  case 'new':
                    statusColor = 'bg-gray-600';
                    break;
                  case 'learning':
                    statusColor = 'bg-yellow-400';
                    break;
                  case 'review':
                    statusColor = 'bg-green-600';
                    break;
                }

                // Override with red if the last review was 'hard'
                const progress = cardProgress[idx];
                if (progress?.reviews.length > 0) {
                  const lastReview = progress.reviews[progress.reviews.length - 1];
                  if (lastReview.difficulty === 'hard') {
                    statusColor = 'bg-red-400';
                  }
                }
                
                return (
                  <div 
                    key={idx}
                    className="neumorphic p-3 flex items-center justify-between cursor-pointer hover:bg-gray-800 transition-colors"
                    onClick={() => {
                      if (!isPlaying) {
                        speak(phrase.thai);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${statusColor}`} />
                      <span>{phrase.meaning}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>{phrase.thai}</span>
                      <button
                        className="neumorphic-circle opacity-75 hover:opacity-100 w-8 h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isPlaying) {
                            speak(phrase.thai);
                          }
                        }}
                      >
                        🔊
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <SettingsMenu />
    </main>
  );
}

// Export the wrapped component
export default function ThaiFlashcards() {
  return (
    <ErrorBoundary>
      <ThaiFlashcardsInner />
    </ErrorBoundary>
  );
} 
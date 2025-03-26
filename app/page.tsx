'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Switch } from "@/app/components/ui/switch";

interface ExampleSentence {
  thai: string;
  pronunciation: string;
  translation: string;
}

interface Phrase {
  thai: string;
  pronunciation: string;
  mnemonic: string;
  english: string;
  examples?: ExampleSentence[];
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

// Update MnemonicEdits interface to have a single text field
interface MnemonicEdits {
  [key: number]: {
    text: string;
  };
}

// Add level-related interfaces
interface LevelProgress {
  currentLevel: number;
  currentBatch: number[];  // Current 5 cards being learned
  masteredCards: number[]; // All mastered cards
}

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
  english: string;
}

// Replace the random phrases generator function with one that selects real examples
interface ExampleSentence {
  thai: string;
  pronunciation: string;
  translation: string;
}

// Update version info
const VERSION_INFO = {
  lastUpdated: new Date().toISOString(),
  version: "1.3.13",
  changes: "Improved mnemonic input field size and position"
};

const INITIAL_PHRASES: Phrase[] = [
  {
    thai: "ก",
    pronunciation: "gaw gai",
    mnemonic: "Looks like a chicken's head and neck",
    english: "Chicken consonant"
  },
  {
    thai: "ข",
    pronunciation: "kaw kai",
    mnemonic: "Like an oval egg with a line through it",
    english: "Egg consonant"
  },
  {
    thai: "ค",
    pronunciation: "kaw kwai",
    mnemonic: "Like horns of a water buffalo",
    english: "Buffalo consonant"
  },
  {
    thai: "ง",
    pronunciation: "ngaw nguu",
    mnemonic: "Like a snake ready to strike",
    english: "Snake consonant"
  },
  {
    thai: "จ",
    pronunciation: "jaw jaan",
    mnemonic: "Like a plate or dish on a table",
    english: "Plate consonant"
  },
  {
    thai: "ฉ",
    pronunciation: "chaw ching",
    mnemonic: "Like cymbals with a handle",
    english: "Cymbals consonant"
  },
  {
    thai: "ช",
    pronunciation: "chaw chaang",
    mnemonic: "Like an elephant's trunk and tusks",
    english: "Elephant consonant"
  },
  {
    thai: "ซ",
    pronunciation: "saw soe",
    mnemonic: "Like a chain link",
    english: "Chain consonant"
  },
  {
    thai: "ฌ",
    pronunciation: "chaw choe",
    mnemonic: "Like a tree with branches",
    english: "Tree consonant"
  },
  {
    thai: "ญ",
    pronunciation: "yaw ying",
    mnemonic: "Like a woman with a fancy hairstyle",
    english: "Woman consonant"
  }
];

export default function ThaiFlashcards() {
  const [phrases] = useState<Phrase[]>(INITIAL_PHRASES);
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
  const [autoplay, setAutoplay] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('autoplay');
      return saved ? JSON.parse(saved) === true : false;
    } catch {
      return false;
    }
  });
  const [activeCards, setActiveCards] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('activeCards');
      return saved ? JSON.parse(saved) : [0, 1, 2, 3, 4]; // Default first 5 cards
    } catch {
      return [0, 1, 2, 3, 4];
    }
  });
  const [randomSentence, setRandomSentence] = useState<RandomSentence | null>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Add ref to track previous showAnswer state
  const prevShowAnswerRef = React.useRef(false);

  // Load voices when component mounts
  useEffect(() => {
    function loadVoices() {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoicesLoaded(true);
        console.log('Voices loaded:', voices.length);
        console.log('Thai voices:', voices.filter(v => v.lang.includes('th')).length);
      }
    }

    // Load voices immediately if available
    loadVoices();

    // Also listen for voices changed event
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

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
    localStorage.setItem('activeCards', JSON.stringify(activeCards));
  }, [activeCards]);

  // Simplified speak function
  const speak = async (text: string) => {
    if (!voicesLoaded) {
      console.log('Voices not loaded yet');
      return;
    }

    setIsPlaying(true);
    
    try {
      // iOS requires cancelling any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH';
      
      // Get Thai voice if available
      const voices = window.speechSynthesis.getVoices();
      const thaiVoice = voices.find(voice => voice.lang.includes('th'));
      if (thaiVoice) {
        utterance.voice = thaiVoice;
      }

      // iOS Safari requires a slight delay after cancel
      await new Promise(resolve => setTimeout(resolve, 100));

      return new Promise<void>((resolve, reject) => {
        utterance.onend = () => {
          setIsPlaying(false);
          resolve();
        };
        
        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event.error);
          setIsPlaying(false);
          reject(event);
        };

        // iOS Safari sometimes needs a kick to start
        setTimeout(() => {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }
        }, 1000);

        window.speechSynthesis.speak(utterance);
      });
    } catch (error) {
      console.error('Speech playback error:', error);
      setIsPlaying(false);
      alert('Speech playback failed. Please try tapping the screen first.');
    }
  };

  // Auto-play when answer is shown
  useEffect(() => {
    if (autoplay && showAnswer && !prevShowAnswerRef.current && !isPlaying && voicesLoaded) {
      speak(phrases[index].thai);
    }
    prevShowAnswerRef.current = showAnswer;
  }, [showAnswer, autoplay, phrases, index, isPlaying, voicesLoaded]);

  // Add a new useEffect to update the active cards on component mount and when cardProgress changes
  useEffect(() => {
    updateActiveCards();
  }, [cardProgress]);

  // Function to update active cards based on review status
  const updateActiveCards = () => {
    // Get all cards that are due for review (either unseen, marked wrong, or due today)
    const today = new Date();
    
    // First collect all unseen cards
    const unseenCards = [];
    for (let i = 0; i < phrases.length; i++) {
      if (!cardProgress[i] || !cardProgress[i].reviews || cardProgress[i].reviews.length === 0) {
        unseenCards.push(i);
      }
    }
    
    // Then collect all cards marked "hard" (wrong) in their last review
    const wrongCards = [];
    for (let i = 0; i < phrases.length; i++) {
      if (cardProgress[i] && cardProgress[i].reviews && cardProgress[i].reviews.length > 0) {
        const lastReview = cardProgress[i].reviews[cardProgress[i].reviews.length - 1];
        if (lastReview.difficulty === 'hard') {
          wrongCards.push(i);
        }
      }
    }
    
    // Then collect all due cards (cards that were previously marked "good" or "easy" and are due today)
    const dueCards = [];
    for (let i = 0; i < phrases.length; i++) {
      if (cardProgress[i] && cardProgress[i].nextReviewDate) {
        const nextReviewDate = new Date(cardProgress[i].nextReviewDate);
        if (nextReviewDate <= today && !wrongCards.includes(i)) {
          // Get last review to check if it was marked good or easy
          const lastReview = cardProgress[i].reviews[cardProgress[i].reviews.length - 1];
          if (lastReview.difficulty === 'good' || lastReview.difficulty === 'easy') {
            dueCards.push(i);
          }
        }
      }
    }
    
    // Prioritize wrong cards, then unseen cards, then due cards to get 5 active cards
    let newActiveCards = [...wrongCards];
    
    // Add unseen cards until we reach 5 cards or run out
    let remainingSlots = 5 - newActiveCards.length;
    if (remainingSlots > 0 && unseenCards.length > 0) {
      // Sort unseen cards by index to start with earlier cards
      const sortedUnseenCards = [...unseenCards].sort((a, b) => a - b);
      newActiveCards = [...newActiveCards, ...sortedUnseenCards.slice(0, remainingSlots)];
    }
    
    // If we still have slots, add due cards
    remainingSlots = 5 - newActiveCards.length;
    if (remainingSlots > 0 && dueCards.length > 0) {
      // Sort due cards by next review date (earliest first)
      const sortedDueCards = [...dueCards].sort((a, b) => {
        const dateA = new Date(cardProgress[a].nextReviewDate);
        const dateB = new Date(cardProgress[b].nextReviewDate);
        return dateA.getTime() - dateB.getTime();
      });
      newActiveCards = [...newActiveCards, ...sortedDueCards.slice(0, remainingSlots)];
    }
    
    // If we still have fewer than 5 cards, add cards that haven't been seen in a while
    remainingSlots = 5 - newActiveCards.length;
    if (remainingSlots > 0) {
      // Get all cards that aren't already in newActiveCards
      const remainingCards = [];
      for (let i = 0; i < phrases.length; i++) {
        if (!newActiveCards.includes(i)) {
          remainingCards.push(i);
        }
      }
      
      // Sort by last review date (oldest first) or by index if never reviewed
      const sortedRemainingCards = remainingCards.sort((a, b) => {
        // If neither card has been reviewed, sort by index
        if ((!cardProgress[a] || !cardProgress[a].reviews || cardProgress[a].reviews.length === 0) &&
            (!cardProgress[b] || !cardProgress[b].reviews || cardProgress[b].reviews.length === 0)) {
          return a - b;
        }
        
        // If only a has been reviewed, b comes first
        if (!cardProgress[b] || !cardProgress[b].reviews || cardProgress[b].reviews.length === 0) {
          return 1;
        }
        
        // If only b has been reviewed, a comes first
        if (!cardProgress[a] || !cardProgress[a].reviews || cardProgress[a].reviews.length === 0) {
          return -1;
        }
        
        // Both have been reviewed, sort by last review date
        const lastReviewA = new Date(cardProgress[a].reviews[cardProgress[a].reviews.length - 1].date);
        const lastReviewB = new Date(cardProgress[b].reviews[cardProgress[b].reviews.length - 1].date);
        return lastReviewA.getTime() - lastReviewB.getTime();
      });
      
      newActiveCards = [...newActiveCards, ...sortedRemainingCards.slice(0, remainingSlots)];
    }
    
    // If newActiveCards is empty (should not happen), use the first 5 cards
    if (newActiveCards.length === 0) {
      newActiveCards = [0, 1, 2, 3, 4];
    }
    
    // Update active cards if they have changed
    if (JSON.stringify(newActiveCards) !== JSON.stringify(activeCards)) {
      setActiveCards(newActiveCards);
      
      // If current index is not in active cards, update it to the first active card
      if (!newActiveCards.includes(index)) {
        setIndex(newActiveCards[0]);
      }
    }
  };

  const handleMnemonicChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalMnemonics(prev => ({
      ...prev,
      [index]: {
        text: e.target.value
      }
    }));
  };

  const handleResetAll = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Function to generate a random sentence
  const generateRandomPhrase = () => {
    const currentWord = phrases[index].thai;
    const examples = phrases[index].examples || [];
    
    if (examples.length > 0) {
      const randomIndex = Math.floor(Math.random() * examples.length);
      const example = examples[randomIndex];
      setRandomSentence({
        thai: example.thai,
        english: example.translation
      });
      setDialogOpen(true);
      return example.thai;
    } else {
      setRandomSentence(null);
      setDialogOpen(true);
      return currentWord;
    }
  };

  // Add a function to calculate stats
  const calculateStats = () => {
    // Calculate total learned cards
    const learnedCards = Object.keys(cardProgress).length;
    
    // Calculate total reviews
    let totalReviews = 0;
    Object.values(cardProgress).forEach(card => {
      totalReviews += card.reviews.length;
    });
    
    // Count cards due today
    const today = new Date().toDateString();
    let dueCards = 0;
    Object.values(cardProgress).forEach(card => {
      const nextReviewDate = new Date(card.nextReviewDate).toDateString();
      if (nextReviewDate <= today) {
        dueCards++;
      }
    });
    
    return {
      totalCards: phrases.length,
      learnedCards,
      dueCards,
      totalReviews,
      remainingCards: phrases.length - learnedCards
    };
  };

  // Add a function to determine the status of a card
  const getCardStatus = (cardIndex: number) => {
    const card = cardProgress[cardIndex];
    
    // If no reviews, it's unseen
    if (!card || !card.reviews || card.reviews.length === 0) {
      return 'unseen';
    }
    
    // Get the last review
    const lastReview = card.reviews[card.reviews.length - 1];
    return lastReview.difficulty; // 'hard', 'good', or 'easy'
  };

  // Helper function to get status color and label
  const getStatusInfo = (status: string) => {
    switch(status) {
      case 'unseen':
        return { color: 'bg-gray-500', label: 'Unseen' };
      case 'hard':
        return { color: 'bg-red-500', label: 'Wrong' };
      case 'good':
        return { color: 'bg-yellow-500', label: 'Correct' };
      case 'easy':
        return { color: 'bg-green-500', label: 'Easy' };
      default:
        return { color: 'bg-gray-500', label: 'Unseen' };
    }
  };

  // Helper function to calculate next interval using Anki SM-2 algorithm
  const calculateNextReview = (difficulty: 'hard' | 'good' | 'easy', currentProgress: any) => {
    const easeFactor = currentProgress?.reviews?.length > 0 
      ? currentProgress.reviews[currentProgress.reviews.length - 1].easeFactor 
      : INITIAL_EASE_FACTOR;
    
    let newEaseFactor = easeFactor;
    let interval = currentProgress?.reviews?.length > 0 
      ? currentProgress.reviews[currentProgress.reviews.length - 1].interval 
      : INITIAL_INTERVAL;
    let repetitions = currentProgress?.reviews?.length > 0
      ? currentProgress.reviews[currentProgress.reviews.length - 1].repetitions
      : 0;
      
    // Adjust ease factor based on difficulty
    if (difficulty === 'hard') {
      newEaseFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.2);
      interval = Math.max(MIN_INTERVAL, Math.ceil(interval * HARD_INTERVAL_MULTIPLIER));
      repetitions = 0; // Reset repetitions on hard
    } else if (difficulty === 'good') {
      interval = Math.ceil(interval * easeFactor);
      repetitions += 1;
    } else if (difficulty === 'easy') {
      newEaseFactor = easeFactor + 0.1;
      interval = Math.ceil(interval * EASY_INTERVAL_MULTIPLIER);
      repetitions += 1;
    }
    
    // Cap interval at max
    interval = Math.min(interval, MAX_INTERVAL);
    
    return { interval, easeFactor: newEaseFactor, repetitions };
  };

  // Modify handleCardAction to use the active cards
  const handleCardAction = (difficulty: 'hard' | 'good' | 'easy') => {
    // Create or get the current card progress
    const currentProgress = cardProgress[index] || { reviews: [], nextReviewDate: new Date().toISOString() };
    
    // Calculate the next review data using the SM-2 algorithm
    const nextReviewData = calculateNextReview(difficulty, currentProgress);
    
    // Create the new review entry
    const newReview: Review = {
      date: new Date().toISOString(),
      difficulty,
      interval: nextReviewData.interval,
      easeFactor: nextReviewData.easeFactor,
      repetitions: nextReviewData.repetitions
    };
    
    // Calculate the next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + nextReviewData.interval);
    
    // Update the card progress
    setCardProgress(prev => ({
      ...prev,
      [index]: {
        ...currentProgress,
        reviews: [...currentProgress.reviews, newReview],
        nextReviewDate: nextReviewDate.toISOString()
      }
    }));
    
    // Move to the next card in the active cards list
    const currentActiveIndex = activeCards.indexOf(index);
    const nextActiveIndex = (currentActiveIndex + 1) % activeCards.length;
    setIndex(activeCards[nextActiveIndex]);
    setShowAnswer(false);
    setRandomSentence(null);
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-2">Thai Flashcards</h1>
            <p className="text-gray-400">v1.3.13 | {new Date().toLocaleString()}</p>
            <p className="text-blue-400">Latest: Improved mnemonic input field size and position</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setLocalMnemonics({})}
              className="px-4 py-2 bg-red-600/20 text-red-400 rounded-md hover:bg-red-600/30 transition-colors"
            >
              Reset All
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Autoplay</span>
              <Switch checked={autoplay} onCheckedChange={setAutoplay} />
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="flex justify-center items-center space-x-6 mb-8">
            <button
              onClick={() => setIndex(index - 1)}
              className="text-4xl text-gray-400 hover:text-white transition-colors"
              disabled={index === 0}
            >
              ←
            </button>
            <div className="text-center">
              <div className="text-6xl mb-4">{phrases[index].thai}</div>
              <div className="text-2xl text-gray-400">{phrases[index].pronunciation}</div>
              <div className="text-xl text-gray-500 mt-2">{phrases[index].english}</div>
            </div>
            <button
              onClick={() => setIndex(index + 1)}
              className="text-4xl text-gray-400 hover:text-white transition-colors"
              disabled={index === phrases.length - 1}
            >
              →
            </button>
          </div>

          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg text-gray-400">Mnemonic</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setLocalMnemonics(prev => ({
                      ...prev,
                      [index]: {
                        text: phrases[index].mnemonic
                      }
                    }));
                  }}
                  className="px-3 py-1.5 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(localMnemonics);
                    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                    const exportFileDefaultName = 'mnemonics.json';
                    const linkElement = document.createElement('a');
                    linkElement.setAttribute('href', dataUri);
                    linkElement.setAttribute('download', exportFileDefaultName);
                    linkElement.click();
                  }}
                  className="px-3 py-1.5 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700 transition-colors"
                >
                  Export All
                </button>
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          try {
                            const importedMnemonics = JSON.parse(event.target?.result as string);
                            setLocalMnemonics(importedMnemonics);
                          } catch (error) {
                            alert('Invalid file format');
                          }
                        };
                        reader.readAsText(file);
                      }
                    };
                    input.click();
                  }}
                  className="px-3 py-1.5 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700 transition-colors"
                >
                  Import All
                </button>
              </div>
            </div>
            <textarea
              value={localMnemonics[index]?.text || phrases[index].mnemonic}
              onChange={(e) => handleMnemonicChange(e)}
              className="w-full min-h-[120px] bg-gray-800/50 text-white resize-none p-4 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
              placeholder="Add your own way to remember this sound..."
            />
          </div>
        </div>
      </div>
    </div>
  );
} 
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Switch } from "@/app/components/ui/switch";
import { ttsService } from './lib/tts-service';
import AdminSettings from './components/AdminSettings';
import { INITIAL_PHRASES, type Phrase, type ExampleSentence } from './data/phrases';
import { SetSelector } from './components/SetSelector';
import { useSet } from './context/SetContext';
import { Phrase as GeneratorPhrase } from './lib/set-generator';
import { SetMetaData, SetProgress } from './lib/storage';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { FlashcardHeader } from './components/flashcard-page/FlashcardHeader';

// Define a simple CardStatus type locally for now
type CardStatus = 'unseen' | 'wrong' | 'due' | 'reviewed';

// Type for card progress data used locally (can be removed later)
// Define the CardProgressData type based on SetProgress
type CardProgressData = SetProgress[number];

// ClientOnly wrapper for client-side only rendering
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);
  
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  if (!hasMounted) {
    return null;
  }
  
  return <>{children}</>;
}

// Update version info
const VERSION_INFO = {
  lastUpdated: new Date().toISOString(),
  version: "1.3.53", // Incremented version
  changes: "Add show/hide mnemonic hint on card front."
};

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

// Correct getThaiWithGender to ONLY add particles based on isPoliteMode
const getThaiWithGender = (phrase: Phrase | ExampleSentence | null, isMale: boolean, isPoliteMode: boolean): string => {
  if (!phrase) return '';
  // ALWAYS start with the absolute base Thai
  const baseThai = phrase.thai; 

  // Do NOT use thaiMasculine/thaiFeminine here, as they pre-include particles
  /*
  if (isMale && phrase.thaiMasculine) baseThai = phrase.thaiMasculine;
  else if (!isMale && phrase.thaiFeminine) baseThai = phrase.thaiFeminine;
  */

  // If Polite Mode is OFF, return the absolute base
  if (!isPoliteMode) {
    return baseThai;
  }

  // Polite Mode is ON: Check endings and add particle if appropriate
  const politeEndingsToAvoid = ['ไหม', 'อะไร', 'ไหน', 'เท่าไหร่', 'เหรอ', 'หรือ', 'ใช่ไหม', 'เมื่อไหร่', 'ทำไม', 'อย่างไร', 'ที่ไหน', 'ครับ', 'ค่ะ'];
  const endsWithPoliteEnding = politeEndingsToAvoid.some(ending => baseThai.endsWith(ending));

  if (!endsWithPoliteEnding) {
    return isMale ? `${baseThai}ครับ` : `${baseThai}ค่ะ`;
  }
  
  // If Polite Mode is ON but ending is unsuitable, return the base
  return baseThai; 
};

// Correct getGenderedPronunciation (logic was likely already okay, but ensure consistency)
const getGenderedPronunciation = (phraseData: Phrase | ExampleSentence | null, isMale: boolean, isPoliteMode: boolean): string => {
  if (!phraseData) return '';
  let basePronunciation = phraseData.pronunciation;
  const baseThaiForEndingCheck = phraseData.thai; // Check ending on BASE Thai

  // Step 1: Handle gendered pronouns in pronunciation
  if (basePronunciation.includes('chan/phom')) basePronunciation = basePronunciation.replace('chan/phom', isMale ? 'phom' : 'chan');
  else if (basePronunciation.includes('phom/chan')) basePronunciation = basePronunciation.replace('phom/chan', isMale ? 'phom' : 'chan');

  // Step 2: Check Polite Mode for adding particles
  if (!isPoliteMode) {
    return basePronunciation; // Return pronoun-adjusted if mode is off
  }

  // Polite Mode ON: Check endings on BASE Thai and add particle if appropriate
  const politeEndingsToAvoid = ['ไหม', 'อะไร', 'ไหน', 'เท่าไหร่', 'เหรอ', 'หรือ', 'ใช่ไหม', 'เมื่อไหร่', 'ทำไม', 'อย่างไร', 'ที่ไหน', 'ครับ', 'ค่ะ'];
  const endsWithPoliteEnding = politeEndingsToAvoid.some(ending => baseThaiForEndingCheck.endsWith(ending));

  if (!endsWithPoliteEnding) {
    const endsWithKrapKa = basePronunciation.endsWith(' krap') || basePronunciation.endsWith(' ka');
    if (!endsWithKrapKa) return basePronunciation + (isMale ? " krap" : " ka");
  }
  
  // If Polite Mode is ON but ending is unsuitable, return pronoun-adjusted base
  return basePronunciation; 
};

// Anki SRS constants
const INITIAL_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;
const INITIAL_INTERVAL = 1; // 1 day
const HARD_INTERVAL_MULTIPLIER = 1.2;
const EASY_INTERVAL_MULTIPLIER = 2.5;
const MIN_INTERVAL = 1; // Minimum interval in days
const MAX_INTERVAL = 36500; // Maximum interval in days (100 years)

// --- Define MnemonicsListModal Component --- 
interface MnemonicsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  allPhrases: Phrase[];
  userMnemonics: { [key: number]: string };
  onReset: () => void;
}

const MnemonicsListModal: React.FC<MnemonicsListModalProps> = ({ 
  isOpen, 
  onClose, 
  allPhrases, 
  userMnemonics, 
  onReset 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="neumorphic max-w-xl w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-200">Create Your Custom Set</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        <div className="text-gray-300">
          <p>Welcome to the Set Wizard!</p>
          <p className="mt-4">This feature will guide you through creating a personalized vocabulary and mnemonic set based on your goals.</p>
          <p className="mt-2">(Wizard steps and logic will be implemented here.)</p>
          {/* Placeholder for future steps/content */}
        </div>
      </div>
    </div>
  );
};
// --- End of MnemonicsListModal Component Definition ---

// --- Define SetWizardModal Component --- 
interface SetWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SetWizardModal: React.FC<SetWizardModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [thaiLevel, setThaiLevel] = useState<string>('');
  const [learningGoals, setLearningGoals] = useState<string[]>([]);
  
  const totalSteps = 2; // Changed from 3 to 2 (Welcome, Level)
  
  if (!isOpen) return null;

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handler for goal checkboxes
  const toggleGoal = (goal: string) => {
    setLearningGoals(prev => 
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="neumorphic rounded-xl p-6 bg-gray-900 max-w-md w-full max-h-[90vh] overflow-auto flex flex-col"> {/* Added flex-col */}
        {/* Header */}
        <div className="flex justify-between items-center mb-4 flex-shrink-0"> {/* Prevent header shrinking */}
          <h2 className="text-xl font-semibold text-blue-400">Create Custom Set</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            &times;
          </button>
        </div>
        
        {/* Content Scrollable Area */}
        <div className="overflow-y-auto mb-4 flex-grow"> {/* Allow this to grow/scroll */}
          {currentStep === 1 && (
            <div>
              <p>Welcome to the Set Wizard!</p>
              <p className="mt-2">Let's start by understanding your current level and goals.</p>
            </div>
          )}
          
          {currentStep === 2 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-400">What is your current level of Thai?</h3>
              <div className="space-y-2">
                {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                  <label key={level} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-700">
                    <input 
                      type="radio" 
                      name="thaiLevel" 
                      value={level.toLowerCase()} 
                      checked={thaiLevel === level.toLowerCase()}
                      onChange={(e) => setThaiLevel(e.target.value)}
                      className="accent-blue-400 h-4 w-4 rounded"
                    />
                    <span>{level}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          {/* Step 3 (learning goals section) has been completely removed */}
          
          {/* Placeholder for future steps like phrase selection, mnemonic suggestions */}
        </div>

        {/* Navigation Footer (Fixed position) */}
        <div className="mt-6 pt-4 border-t border-gray-700 flex justify-between flex-shrink-0"> {/* Prevent footer shrinking */} 
          <button 
            onClick={handleBack} 
            disabled={currentStep === 1} 
            className="neumorphic-button text-xs text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          
          {/* Show Next or Generate button */} 
          {currentStep < totalSteps ? (
             <button 
               onClick={handleNext} 
               className="neumorphic-button text-xs text-blue-400"
             >
               Next
             </button>
          ) : (
             <button 
               onClick={() => {
                 // TODO: Add logic to generate the set based on selections
                 alert(`Generating Set...\nLevel: ${thaiLevel}\n(Generation logic not implemented yet)`);
                 onClose(); // Close modal for now
               }} 
               className="neumorphic-button text-xs text-green-400"
             >
               Generate Set
             </button>
          )}
        </div>
      </div>
    </div>
  );
};
// --- End of SetWizardModal Component Definition ---

// Helper function to shuffle an array (Fisher-Yates algorithm)
const shuffleArray = <T extends any>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function ThaiFlashcards() {
  // Replace phrases state with context
  const { 
    activeSetContent: phrases, 
    activeSetProgress,
    activeSetId,
    availableSets,
    updateSetProgress,
    addSet,
    isLoading,
    exportSet,
    switchSet,
    deleteSet,
    renameSet
  } = useSet();
  
  // Log activeSetProgress whenever the component renders
  console.log("ThaiFlashcards Rendering - ActiveSetProgress:", JSON.stringify(activeSetProgress));
  
  // Derive current set name from context instead of using state
  const currentSetName = useMemo(() => {
    const activeSet = availableSets.find(set => set.id === activeSetId);
    return activeSet?.cleverTitle || activeSet?.name || "Default Set";
  }, [availableSets, activeSetId]);
  
  const [index, setIndex] = useState<number>(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [localMnemonics, setLocalMnemonics] = useState<{[key: number]: string}>({});
  const [isPlayingWord, setIsPlayingWord] = useState(false);
  const [isPlayingContext, setIsPlayingContext] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showProgress, setShowProgress] = useState(false); // Renamed from showVocabulary
  const [autoplay, setAutoplay] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('autoplay');
      return saved ? JSON.parse(saved) === true : false;
    } catch {
      return false;
    }
  });
  const [isMale, setIsMale] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('isMale');
      return saved ? JSON.parse(saved) === true : true;
    } catch { return true; }
  });
  const [activeCards, setActiveCards] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('activeCards');
      return saved ? JSON.parse(saved) : [0, 1, 2, 3, 4]; // Default first 5 cards
    } catch {
      return [0, 1, 2, 3, 4];
    }
  });
  const [randomSentence, setRandomSentence] = useState<ExampleSentence | null>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [mnemonics, setMnemonics] = useState<{[key: number]: string}>({});
  const [isPoliteMode, setIsPoliteMode] = useState(true);
  const [activeCardsIndex, setActiveCardsIndex] = useState<number>(0);
  const [showMnemonicsModal, setShowMnemonicsModal] = useState(false);
  const [reviewsCompletedToday, setReviewsCompletedToday] = useState<number>(0);
  const [totalDueToday, setTotalDueToday] = useState<number>(0);
  const [isTesting, setIsTesting] = useState(false);
  const [showSetWizardModal, setShowSetWizardModal] = useState(false);
  // --- NEW: State for Set Management Modal ---
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [isAppOptionsMenuOpen, setIsAppOptionsMenuOpen] = useState(false); // Renamed
  const [isSetOptionsMenuOpen, setIsSetOptionsMenuOpen] = useState(false); // New state for Set Options
  const [tutorialStep, setTutorialStep] = useState<number>(0); 
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true); // Default to true (dark)
  const [showMnemonicHint, setShowMnemonicHint] = useState(false); // NEW: State for front hint

  // Add ref to track previous showAnswer state
  const prevShowAnswerRef = React.useRef(false);

  console.log("ThaiFlashcards: Component rendering/re-rendering. randomSentence:", randomSentence); // DEBUG

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
    localStorage.setItem('autoplay', JSON.stringify(autoplay));
  }, [autoplay]);

  useEffect(() => {
    localStorage.setItem('isMale', JSON.stringify(isMale));
  }, [isMale]);

  useEffect(() => {
    localStorage.setItem('activeCards', JSON.stringify(activeCards));
  }, [activeCards]);

  // Update the speak helper function definition in page.tsx
  const speak = async (text: string, isWord: boolean = true, isMale: boolean) => {
    if (isWord) setIsPlayingWord(true); else setIsPlayingContext(true);
    try {
      await ttsService.speak({
        text,
        genderValue: isMale,
        onStart: () => console.log('Speech started'),
        onEnd: () => { if (isWord) setIsPlayingWord(false); else setIsPlayingContext(false); console.log('Speech ended'); },
        onError: (error) => { if (isWord) setIsPlayingWord(false); else setIsPlayingContext(false); console.error('TTS error:', error); }
      });
    } catch (error) {
      console.error('Error calling ttsService.speak:', error);
      if (isWord) {
        setIsPlayingWord(false);
      } else {
        setIsPlayingContext(false);
      }
    }
  };

  // Auto-play useEffect - Restore call to getThaiWithGender with isPoliteMode
  useEffect(() => {
    if (autoplay && showAnswer && !prevShowAnswerRef.current && !isPlayingWord && !isPlayingContext && voicesLoaded) {
      speak(getThaiWithGender(phrases[index], isMale, isPoliteMode), true, isMale);
    }
    prevShowAnswerRef.current = showAnswer;
  }, [showAnswer, autoplay, phrases, index, isPlayingWord, isPlayingContext, voicesLoaded, isMale, isPoliteMode]);

  // Add a useEffect to initialize the random sentence when the answer is shown
  useEffect(() => {
    if (showAnswer && randomSentence === null) {
      // Initialize with the first example when card is revealed
      generateRandomPhrase();
    }
  }, [showAnswer, index]);

  // Add a useEffect to update active cards on component mount and when cardProgress changes
  useEffect(() => {
    updateActiveCards();
  }, [activeSetProgress, phrases]);

  // Function to update active cards based on review status
  const updateActiveCards = () => {
    // Get all cards that are due for review (either unseen, marked wrong, or due today)
    const today = new Date();
    
    // First collect all unseen cards
    const unseenCards = [];
    for (let i = 0; i < phrases.length; i++) {
      // Use activeSetProgress directly
      if (!activeSetProgress[i] || !activeSetProgress[i].lastReviewedDate) { // Check a defining progress field
        unseenCards.push(i);
      }
    }
    
    // Then collect all cards marked "hard" (wrong) in their last review
    const wrongCards = [];
    for (let i = 0; i < phrases.length; i++) {
      // Use activeSetProgress directly
      if (activeSetProgress[i] && activeSetProgress[i].difficulty === 'hard') {
        wrongCards.push(i);
      }
    }
    
    // Then collect all due cards (cards that were previously marked "good" or "easy" and are due today)
    const dueCards = [];
    for (let i = 0; i < phrases.length; i++) {
      // Use activeSetProgress directly
      if (activeSetProgress[i] && activeSetProgress[i].nextReviewDate) {
        const nextReviewDate = new Date(activeSetProgress[i].nextReviewDate);
        if (nextReviewDate <= today && !wrongCards.includes(i)) {
          // Get difficulty to check if it was marked good or easy
          const lastDifficulty = activeSetProgress[i].difficulty;
          if (lastDifficulty === 'good' || lastDifficulty === 'easy') {
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
        // Use activeSetProgress directly
        const dateA = new Date(activeSetProgress[a].nextReviewDate);
        const dateB = new Date(activeSetProgress[b].nextReviewDate);
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
      // Add remaining cards sorted by their index or last reviewed date (oldest first)
      const sortedRemainingCards = remainingCards.sort((a, b) => {
        // Use activeSetProgress directly
        const progressA = activeSetProgress[a];
        const progressB = activeSetProgress[b];
        // Handle potential undefined dates safely
        const dateA = progressA?.lastReviewedDate ? new Date(progressA.lastReviewedDate).getTime() : Infinity;
        const dateB = progressB?.lastReviewedDate ? new Date(progressB.lastReviewedDate).getTime() : Infinity;

        if (dateA !== Infinity && dateB !== Infinity) {
          return dateA - dateB; // Sort by actual date if both exist
        } else if (dateA !== Infinity) {
          return -1; // A reviewed, B not -> A comes first
        } else if (dateB !== Infinity) {
          return 1; // B reviewed, A not -> B comes first
        } else {
          return a - b; // Sort by index if neither reviewed
        }
      });
      newActiveCards = [...newActiveCards, ...sortedRemainingCards.slice(0, remainingSlots)];
    }
    
    // Shuffle the selected cards for variety
    newActiveCards = shuffleArray(newActiveCards);

    // Update the activeCards state
    setActiveCards(newActiveCards);

    // Calculate total due count based on activeSetProgress
    const dueCount = wrongCards.length + dueCards.length + unseenCards.length; // Consider unseen due as well?
    setTotalDueToday(dueCount);
    
    // Reset active card index if needed
    setActiveCardsIndex(0);
    if (newActiveCards.length > 0) {
      setIndex(newActiveCards[0]);
    } else {
      // Handle case where there are no cards to review
      setIndex(0);
    }
  };

  // Function to update mnemonics
  const updateMnemonics = (cardIndex: number, newMnemonic: string) => {
    const updated = { ...mnemonics, [cardIndex]: newMnemonic };
    setMnemonics(updated);
    // TODO: Decide if mnemonics should be per-set in storage/context
    localStorage.setItem('mnemonics', JSON.stringify(updated));
  };

  const resetCurrentMnemonic = () => {
    // TODO: Get default mnemonic from Phrase definition if available?
    const { [index]: _, ...rest } = mnemonics;
    setMnemonics(rest);
    localStorage.setItem('mnemonics', JSON.stringify(rest));
  };

  const handleMnemonicChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMnemonics(prev => ({ ...prev, [index]: e.target.value }));
  };

  // Function to reset all progress and mnemonics
  const resetAllProgress = () => {
    if (confirm('Are you sure you want to reset all progress AND mnemonics? This cannot be undone.')) {
      updateSetProgress({}); 
      setMnemonics({});
      localStorage.removeItem('mnemonics');
      setIndex(0);
      setShowAnswer(false);
      setRandomSentence(null);
      updateActiveCards();
    }
  };

  // Update generateRandomPhrase to ensure it just sets the ExampleSentence
  const generateRandomPhrase = (direction: 'next' | 'prev' | 'first' = 'first') => {
    try {
      const examples = phrases[index].examples || [];
      if (!examples || examples.length === 0) {
        setRandomSentence(null); return;
      }
      let nextExampleData: ExampleSentence;
      if (!randomSentence) {
        nextExampleData = examples[0];
      } else {
        let currentIndex = examples.findIndex(ex => ex.thai === randomSentence.thai);
        if (currentIndex === -1) currentIndex = 0;
        let nextIndex = (direction === 'next')
          ? (currentIndex + 1) % examples.length
          : (currentIndex - 1 + examples.length) % examples.length;
        nextExampleData = examples[nextIndex];
      }
      setRandomSentence(nextExampleData);
    } catch (error) {
      console.error('Error generating random phrase:', error);
      setRandomSentence(null);
    }
  };

  // Function to calculate statistics based on activeSetProgress
  const calculateStats = () => {
    const learnedCards = Object.keys(activeSetProgress).length;
    // Removed totalReviews calculation as 'reviews' history is not in SetProgress
    // let totalReviews = 0;
    // Object.values(activeSetProgress).forEach(card => {
    //   totalReviews += card.reviews.length; // Cannot access reviews
    // });

    const today = new Date().toDateString();
    let dueCards = 0;
    Object.values(activeSetProgress).forEach(card => {
      if (!card || !card.nextReviewDate) return; // Skip if no progress or next review date
      const nextReviewDate = new Date(card.nextReviewDate).toDateString();
      if (nextReviewDate <= today || card.difficulty === 'hard') { // Due if date is today/past OR marked hard
        dueCards++;
      }
    });

    const stats = {
      totalCards: phrases.length,
      learnedCards,
      dueCards,
      // totalReviews: totalReviews, // Removed
    };
    return stats;
  };

  // Helper function to get status color and label
  const getStatusInfo = (status: CardStatus): { color: string, label: string } => {
    console.log(`getStatusInfo called with status: ${status}`); // Log input status
    switch(status) {
      case 'unseen':
        return { color: 'bg-gray-700 text-gray-300', label: 'Unseen' };
      case 'wrong': // Changed from 'hard' to match getCardStatus output
        return { color: 'bg-red-600 text-white', label: 'Wrong' };
      case 'due': // Added case for 'due'
        return { color: 'bg-blue-500 text-white', label: 'Due' };
      case 'reviewed': // Changed from 'easy'/'good' to 'reviewed'
        return { color: 'bg-green-500 text-white', label: 'Learned' }; // Label it 'Learned' for simplicity
      default:
        console.warn(`getStatusInfo: Unknown status '${status}'`);
        return { color: 'bg-gray-700 text-gray-300', label: 'Unknown' }; // Default fallback
    }
  };

  // Function to calculate and update daily review stats
  useEffect(() => {
    let dueCount = 0;
    let completedCount = 0;
    const today = new Date().toDateString();

    for (let i = 0; i < phrases.length; i++) {
      const progress = activeSetProgress[i];
      if (!progress || !progress.lastReviewedDate || progress.lastReviewedDate === 'never') {
        dueCount++; // Unseen are due
        continue;
      }

      if (progress.difficulty === 'hard') {
        dueCount++; // Marked hard are due
      } else {
        // Check if next review date is today or earlier
        if (progress.nextReviewDate) {
          const nextReviewDate = new Date(progress.nextReviewDate);
          nextReviewDate.setHours(0, 0, 0, 0); // Start of review date
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          if (nextReviewDate <= todayStart) {
            dueCount++;
          }
        }
      }

      // Check if the last review was today
      const lastReviewDate = new Date(progress.lastReviewedDate).toDateString();
      if (lastReviewDate === today) {
        completedCount++;
      }
    }

    setTotalDueToday(dueCount);
    setReviewsCompletedToday(completedCount);
  }, [activeSetProgress, phrases]); // Depend on progress and phrases

  // Function to handle card review actions (difficulty buttons)
  // --- Simplified version without external sm2 function --- 
  const handleCardAction = (difficulty: 'easy' | 'good' | 'hard') => {
    const now = new Date();
    const currentProgress = activeSetProgress[index];
    
    // Simplified SRS logic placeholder:
    let daysToAdd = 1; // Default next review tomorrow
    if (difficulty === 'easy') daysToAdd = 7;
    if (difficulty === 'good') daysToAdd = 3;
    if (difficulty === 'hard') daysToAdd = 0; // Review again soon

    const nextReviewDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    const updatedCardProgressData: CardProgressData = {
      srsLevel: (currentProgress?.srsLevel || 0) + (difficulty !== 'hard' ? 1 : 0),
      nextReviewDate: nextReviewDate.toISOString(),
      lastReviewedDate: now.toISOString(),
      difficulty: difficulty,
      // Placeholder values for missing SRS fields
      repetitions: (currentProgress?.repetitions || 0) + 1,
      easeFactor: currentProgress?.easeFactor || 2.5 
    };

    // Update the context progress state
    const newProgressState = {
      ...activeSetProgress,
      [index]: updatedCardProgressData
    };
    console.log(`handleCardAction: Updating progress for index ${index} with:`, JSON.stringify(updatedCardProgressData)); // Log update data
    updateSetProgress(newProgressState);

    // --- Rest of handleCardAction logic (moving to next card) remains the same --- 
    const newActiveCardsIndex = activeCardsIndex + 1;
    setActiveCardsIndex(newActiveCardsIndex);

    const nextActiveIndex = (activeCardsIndex + 1) % activeCards.length;

    setRandomSentence(null);
    setShowAnswer(false);
    setShowMnemonicHint(false); // Hide hint
    if (activeCards.length > 0) {
      setIndex(activeCards[nextActiveIndex]);
    } else {
      setIndex(0); // Fallback if no active cards
    }
  };

  const prevCard = () => {
    if (index > 0) {
      setIndex(index - 1);
      setShowAnswer(false); // Reset answer state
      setRandomSentence(null); // Reset context sentence
      setShowMnemonicHint(false); // Hide hint
    }
  };

  const nextCard = () => {
    if (index < phrases.length - 1) {
      setIndex(index + 1);
      setShowAnswer(false); // Reset answer state
      setRandomSentence(null); // Reset context sentence
      setShowMnemonicHint(false); // Hide hint
    }
  };

  // Update handleStop function
  const handleStop = () => {
    console.log("Stop button clicked");
    ttsService.stop();
    setIsPlayingWord(false);
    setIsPlayingContext(false);
  };

  // Load mnemonics from localStorage
  useEffect(() => {
    const savedMnemonics = localStorage.getItem('mnemonics');
    if (savedMnemonics) {
      try {
        setMnemonics(JSON.parse(savedMnemonics));
      } catch (error) {
        console.error('Error loading mnemonics:', error);
      }
    }
  }, []);

  // Function to reset current card
  const resetCard = () => {
    // Remove card progress
    const newCardProgress = { ...activeSetProgress };
    delete newCardProgress[index];
    updateSetProgress(newCardProgress);
    
    // Clear mnemonic for this card
    const newMnemonics = { ...mnemonics };
    delete newMnemonics[index];
    setMnemonics(newMnemonics);
    localStorage.setItem('mnemonics', JSON.stringify(newMnemonics));
    
    // Reset the card
    setShowAnswer(false);
    setRandomSentence(null);
    setShowMnemonicHint(false); // Hide hint
    
    // Update active cards and reset progress
    updateActiveCards();
    setActiveCardsIndex(0);
  };

  // Rename and refactor Export function
  const exportPhraseData = () => {
    // Prepare data: Base phrases and current user mnemonics
    const dataToExport = {
      phrases: INITIAL_PHRASES, // Export the base phrases definition
      mnemonics: mnemonics // Export the current state of mnemonics
      // DO NOT include cardProgress
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2); // Pretty print JSON
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'thai-flashcards-phrases.json'; // New default name
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Updated exportCurrentSet function to use context
  const exportCurrentSet = () => {
    if (activeSetId) {
      exportSet(activeSetId);
    }
  };

  // Updated importSet function to use context
  const importSet = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const importedData = JSON.parse(event.target?.result as string);
            
            // Validate imported data structure
            if (!Array.isArray(importedData.phrases)) {
              throw new Error('Invalid file structure. Expected phrases array in the imported set.');
            }

            // Prepare metadata for the set
            const setData = {
              name: importedData.name || file.name.replace(/\.[^/.]+$/, ""),
              level: importedData.level || 'beginner',
              goals: importedData.goals || [],
              specificTopics: importedData.specificTopics,
              source: 'import' as const
            };
            
            // Add the set using context
            const newSetId = await addSet(setData, importedData.phrases as GeneratorPhrase[]);
            
            // Reset UI State
            setIndex(0); 
            setActiveCardsIndex(0);
            setShowAnswer(false);
            setRandomSentence(null);
            setShowMnemonicHint(false); // Hide hint
            
            alert(`Successfully imported "${setData.name}" with ${importedData.phrases.length} phrases.`);
          } catch (error: any) {
            alert(`Import failed: ${error.message}`);
            console.error("Import error:", error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Helper function to get card status based on activeSetProgress
  const getCardStatus = (cardIndex: number): CardStatus => {
    // Use activeSetProgress directly
    const progress = activeSetProgress[cardIndex];
    console.log(`getCardStatus(${cardIndex}): Progress =`, JSON.stringify(progress)); // Log progress being read
    
    let status: CardStatus = 'unseen'; // Default status
    if (!progress || !progress.lastReviewedDate || progress.lastReviewedDate === 'never') {
      status = 'unseen';
    } else if (progress.difficulty === 'hard') {
      status = 'wrong'; 
    } else {
      try {
        const nextReviewDate = new Date(progress.nextReviewDate);
        if (nextReviewDate <= new Date()) {
          status = 'due';
        } else {
          status = 'reviewed';
        }
      } catch (e) {
        console.error(`Error parsing nextReviewDate for card ${cardIndex}:`, progress.nextReviewDate, e);
        status = 'unseen'; // Fallback if date is invalid
      }
    }
    
    console.log(`getCardStatus(${cardIndex}): Returning Status =`, status); // Log calculated status
    return status;
  };

  // --- NEW: useEffect to reset state when the active set changes --- 
  useEffect(() => {
    console.log(`Active set changed to: ${activeSetId}. Resetting component state.`);
    // Reset card index and UI state
    setIndex(0);
    setActiveCardsIndex(0);
    setShowAnswer(false);
    setRandomSentence(null);
    setShowMnemonicHint(false); // Hide hint
    
    // Recalculate active cards for the new set
    // Note: updateActiveCards depends on activeSetProgress and phrases, 
    // which should be updated by the context before this effect runs.
    updateActiveCards(); 
    
  }, [activeSetId]); // Re-run this effect only when activeSetId changes

  // Function to handle starting the rename edit
  const handleStartRename = (set: SetMetaData) => {
    setEditingSetId(set.id);
    setEditingTitle(set.cleverTitle || set.name);
  };

  // Function to handle saving the rename
  const handleSaveRename = async () => {
    if (editingSetId && editingTitle.trim()) {
      await renameSet(editingSetId, editingTitle.trim());
      setEditingSetId(null); // Exit edit mode
    }
  };

  // Function to cancel rename
  const handleCancelRename = () => {
    setEditingSetId(null);
    setEditingTitle("");
  };

  // Tutorial Setup Effect
  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenTutorial_v1');
    if (!hasSeen) {
      console.log("Starting tutorial...");
      setTutorialStep(1); // Start tutorial
    }
  }, []);

  // Tutorial Handlers
  const handleTutorialNext = () => {
    console.log(`Tutorial: Advancing from step ${tutorialStep}`);
    setTutorialStep(prev => prev + 1);
  };

  const handleTutorialSkip = () => {
    console.log("Tutorial: Skipping");
    localStorage.setItem('hasSeenTutorial_v1', 'true');
    setTutorialStep(0); // End tutorial
  };

  const handleTutorialFinish = () => {
    console.log("Tutorial: Finishing");
    localStorage.setItem('hasSeenTutorial_v1', 'true');
    setTutorialStep(0); // End tutorial
  };

  // Modified handleShowAnswer for tutorial trigger
  const handleShowAnswer = () => {
    setShowAnswer(true);
    // Trigger next step specifically when moving from step 2 (Show Answer explanation)
    if (tutorialStep === 2) { 
      console.log("Tutorial: Triggering step 3 via Show Answer");
      handleTutorialNext(); // Advance to the step explaining the back (e.g., difficulty buttons)
    }
  };

  // Dark Mode Effect - Adjusted for dark default
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    const initialMode = savedMode ? savedMode === 'true' : true; // Default true if no setting
    setIsDarkMode(initialMode);
    if (initialMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []); 

  // Handler to toggle dark mode and save preference - Adjusted logic
  const toggleDarkMode = (checked: boolean) => {
    setIsDarkMode(checked); 
    localStorage.setItem('darkMode', checked.toString());
    if (checked) { // isDarkMode is true, add dark class
      document.documentElement.classList.add('dark');
    } else { // isDarkMode is false, remove dark class
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <main className="min-h-screen bg-[#1a1a1a] flex flex-col">
      {/* Render the new FlashcardHeader component - Pass setShowProgress */}
      <FlashcardHeader
        setShowHowItWorks={setShowHowItWorks}
        setIsSetOptionsMenuOpen={setIsSetOptionsMenuOpen}
        setIsAppOptionsMenuOpen={setIsAppOptionsMenuOpen}
        setShowProgress={setShowProgress} // Added this prop
      />

      {/* Main Content - Centered Flashcard */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Remove perspective */} 
        <div className="w-full max-w-md">
          {/* Card Container: Reverted to simple structure */} 
          <div className="neumorphic rounded-xl flex flex-col"> 
            {/* Card Front: Displayed when showAnswer is false */} 
            {!showAnswer && (
              <div className="p-6 flex flex-col items-center justify-center min-h-[20rem]"> {/* Ensure min height */} 
                <div className="text-2xl font-bold mb-4 text-center">{phrases[index]?.english ?? ''}</div>
                
                {/* NEW: Mnemonic Hint Section */}
                <div className="text-center mb-4 w-full px-4">
                  <button 
                    onClick={() => {
                      console.log('Toggling showMnemonicHint from:', showMnemonicHint);
                      setShowMnemonicHint(!showMnemonicHint);
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 underline mb-2"
                  >
                    {showMnemonicHint ? 'Hide Hint' : 'Show Hint'}
                  </button>
                  {showMnemonicHint && (
                    <div className="text-sm text-gray-400 p-2 border border-gray-600 rounded bg-gray-800 max-h-24 overflow-y-auto">
                      {((): React.ReactNode => { // Immediately invoked function expression (IIFE) to allow logging
                        const userMnemonic = mnemonics[index];
                        const defaultMnemonic = phrases[index]?.mnemonic;
                        const hintToShow = userMnemonic ?? defaultMnemonic ?? 'No hint available';
                        console.log(`Rendering hint: user='${userMnemonic}', default='${defaultMnemonic}', showing='${hintToShow}'`);
                        return hintToShow;
                      })()}
                    </div>
                  )}
                </div>
                {/* END NEW: Mnemonic Hint Section */}

                {/* Show Answer Button - Wrapped in Popover (Step 2) */} 
                <Popover open={tutorialStep === 2}>
                  <PopoverTrigger asChild>
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={handleShowAnswer} // Use the modified handler
                        className="neumorphic-button text-blue-400 px-6 py-2"
                      >
                        Show Answer
                      </button>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 bg-gray-800 text-white border-gray-700" side="bottom">
                    <div className="grid gap-4 p-4">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none text-blue-400">2. Reveal the Answer</h4>
                        <p className="text-sm text-gray-300">
                          Click here to flip the card and see the Thai translation, pronunciation, and examples.
                        </p>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <button onClick={handleTutorialSkip} className="text-xs text-red-400 hover:underline">Skip Tutorial</button>
                        {/* No 'Next' button here, progress happens on click */} 
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Card Back: Displayed when showAnswer is true */} 
            {showAnswer && (
              <div className="border-t border-[#333] p-6 flex flex-col min-h-[20rem] overflow-y-auto"> {/* Ensure min height */} 
                {/* Main Phrase Section - Centered */} 
                <div className="flex flex-col items-center justify-center mb-4">
                  <div className="text-center">
                    {/* Thai word with pronunciation */}
                    <div className="text-4xl md:text-5xl font-bold mb-4 text-gray-700">
                      {getThaiWithGender(phrases[index], isMale, isPoliteMode)}
                    </div>
                    <div className="text-sm text-gray-400 italic mb-3">
                      ({getGenderedPronunciation(phrases[index], isMale, isPoliteMode)})
                    </div>
                    {/* Play Word Button */}
                    <div className="flex justify-center mb-4">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          const textToSpeak = getThaiWithGender(phrases[index], isMale, isPoliteMode);
                          console.log("Play Word - Text to Speak:", textToSpeak);
                          speak(textToSpeak, true, isMale);
                        }}
                        disabled={isPlayingWord || isPlayingContext}
                        className="neumorphic-button text-blue-400"
                      >
                        {isPlayingWord ? 'Playing...' : 'Play Word'}
                      </button>
                    </div>

                    {/* Difficulty Buttons - Wrapped in Popover (Step 3) */} 
                    <Popover open={tutorialStep === 3}>
                      <PopoverTrigger asChild>
                        <div className="flex justify-center space-x-2 mb-4">
                          <button onClick={() => handleCardAction('hard')} className="neumorphic-button text-red-400">Wrong</button>
                          <button onClick={() => handleCardAction('good')} className="neumorphic-button text-yellow-400">Correct</button>
                          <button onClick={() => handleCardAction('easy')} className="neumorphic-button text-green-400">Easy</button>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 bg-gray-800 text-white border-gray-700" side="top" align="center">
                        <div className="grid gap-4 p-4">
                          <div className="space-y-2">
                            <h4 className="font-medium leading-none text-blue-400">3. Rate Your Recall (SRS)</h4>
                            <p className="text-sm text-gray-300">
                              Use these buttons to tell the Spaced Repetition System how well you knew the answer. This schedules the card for future review.
                            </p>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <button onClick={handleTutorialSkip} className="text-xs text-red-400 hover:underline">Skip Tutorial</button>
                            <button onClick={handleTutorialNext} className="text-sm neumorphic-button px-3 py-1">Next →</button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div> 
                
                {/* === Gender Slider and Polite Mode Toggle Section - MOVED HERE === */} 
                <div className="flex items-center justify-center space-x-4 mb-6">
                  {/* Gender Toggle */} 
                  <label htmlFor="gender-toggle" className="flex items-center cursor-pointer">
                    <span className="mr-2 text-sm font-medium text-gray-400">Female (Ka)</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="gender-toggle"
                        className="sr-only"
                        checked={isMale}
                        onChange={() => setIsMale(!isMale)}
                      />
                      <div className="block bg-gray-600 w-10 h-6 rounded-full"></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${isMale ? 'translate-x-full bg-blue-400' : 'bg-pink-400'}`}></div>
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-400">Male (Krap)</span>
                  </label>

                  {/* Polite Mode Toggle */} 
                  <label htmlFor="polite-toggle" className="flex items-center cursor-pointer">
                    <span className="mr-2 text-sm font-medium text-gray-400">Casual</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="polite-toggle"
                        className="sr-only"
                        checked={isPoliteMode}
                        onChange={() => setIsPoliteMode(!isPoliteMode)}
                      />
                      <div className="block bg-gray-600 w-10 h-6 rounded-full"></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${isPoliteMode ? 'translate-x-full bg-green-400' : 'bg-gray-400'}`}></div>
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-400">Polite</span>
                  </label>
                </div> {/* End Toggle Section */} 

                {/* Mnemonic Section */} 
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-400">Mnemonic</label>
                    <button onClick={resetCurrentMnemonic} className="text-xs text-blue-400 hover:text-blue-300">Reset</button>
                  </div>
                  
                  {/* Pronunciation displayed above the mnemonic */}
                  {phrases[index]?.pronunciation && (
                    <div className="mb-2 p-2 bg-gray-800 rounded text-gray-300 font-medium">
                      <span className="text-blue-400">Pronunciation:</span> {phrases[index].pronunciation}
                    </div>
                  )}
                  
                  <textarea
                    value={mnemonics[index] ?? phrases[index]?.mnemonic ?? ''}
                    onChange={handleMnemonicChange}
                    onBlur={() => updateMnemonics(index, mnemonics[index] ?? phrases[index]?.mnemonic ?? '')}
                    placeholder="Create a memory aid to help remember this word..."
                    className="neumorphic-input w-full h-24 resize-none rounded-lg"
                  />
                </div>

                {/* === Context section === */}
                <div className="p-4 space-y-2 rounded-xl bg-[#222] border border-[#333] neumorphic mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm text-blue-400 uppercase tracking-wider">In Context</h3>
                  </div>
                  <ClientOnly>
                    <p className="text-base text-white font-medium">
                      {randomSentence ? getThaiWithGender(randomSentence, isMale, isPoliteMode) : "(No example available)"}
                    </p>
                    <p className="text-sm text-gray-300 italic">
                      {randomSentence ? getGenderedPronunciation(randomSentence, isMale, isPoliteMode) : ""}
                    </p>
                    <p className="text-sm text-gray-400 italic">{randomSentence?.translation || ""}</p>
                  </ClientOnly>
                  <div className="flex items-center justify-between mt-2">
                    <button 
                          onClick={() => generateRandomPhrase('prev')}
                          className="neumorphic-button text-blue-400 px-4"
                          aria-label="Previous example"
                    >
                          ←
                    </button>
                    <button 
                          onClick={(event) => {
                            event.stopPropagation();
                            if (randomSentence) {
                              const textToSpeak = getThaiWithGender(randomSentence, isMale, isPoliteMode);
                              console.log("Play Context - Text to Speak:", textToSpeak);
                              speak(textToSpeak, false, isMale);
                            }
                          }}
                          disabled={isPlayingWord || isPlayingContext || !randomSentence}
                          className="neumorphic-button text-blue-400"
                    >
                          {isPlayingContext ? 'Playing...' : 'Play Context'}
                    </button>
                    <button 
                          onClick={() => generateRandomPhrase('next')}
                          className="neumorphic-button text-blue-400 px-4"
                          aria-label="Next example"
                    >
                          →
                    </button>
                  </div>
                </div> {/* End Context Section */} 
                
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Button, Modals, Admin Button, Version Indicator */}
      <div className="fixed bottom-16 right-4 z-20">
        <button
          onClick={() => setShowStats(!showStats)}
          className="settings-button"
        >
          ⚙️
        </button>
      </div>
      
      <div className="fixed bottom-4 right-4 z-20">
          <button
          onClick={() => setShowAdminSettings(true)}
          className="text-xs text-gray-600 hover:text-gray-400"
          >
          Admin
          </button>
      </div>

      {/* Settings Modal (controlled by showStats) - Autoplay removed */} 
      {showStats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowStats(false)}>
          <div className="neumorphic max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-200">Statistics & Data</h2> {/* Renamed slightly */} 
              <button
                  onClick={() => setShowStats(false)}
                  className="text-gray-400 hover:text-white text-2xl"
              >
                  ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Statistics Section (Placeholder) */}
              <div className="py-2 border-b border-gray-700">
                 <h3 className="text-lg font-semibold text-gray-200 mb-2">Progress Stats</h3>
                 {/* TODO: Display actual stats calculated by calculateStats() ? */}
                 <p className="text-sm text-gray-400">Total Due Today: {totalDueToday}</p>
                 <p className="text-sm text-gray-400">Reviews Completed Today: {reviewsCompletedToday}</p>
              </div>
              
              {/* Data Management Buttons */}
              <div className="pt-4 space-y-3">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Data Management</h3>
                {/* Keep Export/Import/Reset here as they are more disruptive */}
                <button 
                  onClick={exportPhraseData} 
                  className="neumorphic-button w-full text-blue-400"
                >
                  Export Base Phrase Data
                </button>
                <button 
                  onClick={importSet} 
                  className="neumorphic-button w-full text-blue-400"
                >
                  Import Set File (.json)
                </button>
                <button 
                  onClick={resetAllProgress} 
                  className="neumorphic-button w-full text-red-400"
                >
                  Reset All Progress & Mnemonics
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How It Works Modal - Updated Content */} 
      {showHowItWorks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto" onClick={() => setShowHowItWorks(false)}>
          <div className="neumorphic max-w-lg w-full p-6 bg-[#1f1f1f]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-400">How DonkeyBridge Works</h2>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-gray-300 text-sm max-h-[70vh] overflow-y-auto pr-2">
              <p><strong>Flashcard Learning:</strong> Review flashcards one by one. Click "Show Answer" to reveal the Thai translation, pronunciation, and other details.</p>
              <p><strong>Spaced Repetition (SRS):</strong> Use the "Wrong", "Correct", and "Easy" buttons after revealing the answer. This tells the app how well you know the card. Cards marked "Wrong" will reappear soon, while "Easy" cards will be scheduled further out, optimizing your study time.</p>
              <p><strong>Mnemonics:</strong> Create your own memory aids in the text box to help remember the phrase. Your mnemonics are saved automatically.</p>
              <p><strong>Context Examples:</strong> See the phrase used in different example sentences. Use the ← and → buttons to cycle through examples. Click "Play Context" to hear the example sentence spoken.</p>
              <p><strong>Audio Playback:</strong> Click "Play Word" or "Play Context" to hear the Thai audio. Ensure your device's sound is on.</p>
              <p><strong>Gender & Politeness Toggles:</strong> 
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Use the "Female (Ka) / Male (Krap)" toggle to switch the polite particle added to the end of phrases and pronunciations.</li>
                  <li>Use the "Casual / Polite" toggle to control whether these polite particles (ครับ/ค่ะ) are added at all.</li>
                </ul>
              </p>
              <p><strong>Set Management (Menu &gt; Set Manager):</strong> 
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Switch between different flashcard sets.</li>
                  <li>Rename your custom sets.</li>
                  <li>Export sets to back them up or share them.</li>
                  <li>Import sets shared by others or previously exported.</li>
                  <li>Delete sets you no longer need.</li>
                  <li>Reset progress for the current set.</li>
                </ul>
              </p>
              <p><strong>Make Your Own Set! (AI Wizard):</strong> Click the green button in the header (or in the menu on smaller screens) to launch the AI Set Wizard. Answer a few questions, and the AI will generate a custom flashcard set tailored to your level and interests.</p>
             
            </div>
          </div>
        </div>
      )}

      {/* Renamed Vocabulary Modal to Progress Modal */}
      {showProgress && ( // Use showProgress state
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto" onClick={() => setShowProgress(false)}> {/* Use setShowProgress */}
          <div className="neumorphic max-w-md w-full p-6 max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-[#1a1a1a] py-2">
              <h2 className="text-xl font-bold">Set Progress</h2> {/* Updated Title */}
              <button
                onClick={() => setShowProgress(false)} // Use setShowProgress
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {phrases.map((phrase, i) => {
                console.log(`Vocabulary List: Rendering item ${i}`); // Log inside map
                // Get the status of the card
                const status = getCardStatus(i);
                const { color, label } = getStatusInfo(status);
                
                return (
                  <div key={i} className={`p-3 border-b border-[#333] flex justify-between ${index === i ? 'bg-opacity-20 bg-blue-900' : ''}`}>
                    <div>
                      <p className="text-white">{phrase.thai}</p>
                      <p className="text-gray-400 text-sm">{phrase?.english}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded text-xs font-medium ${color}`}>
                        {label}
                      </span>
                      <button
                        onClick={() => {
                          setIndex(i);
                          setShowProgress(false); // Use setShowProgress
                          setShowAnswer(true);
                          setRandomSentence(null);
                        }}
                        className={`px-3 py-1 rounded text-blue-400 text-sm ${status === 'unseen' ? 'bg-blue-900 bg-opacity-20 font-medium' : ''}`}
                      >
                        Study
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Admin Settings Modal */}
      <AdminSettings
        isOpen={showAdminSettings}
        onClose={() => setShowAdminSettings(false)}
      />

      {/* Render the Modal */}
      <MnemonicsListModal 
        isOpen={showMnemonicsModal}
        onClose={() => setShowMnemonicsModal(false)}
        allPhrases={phrases}
        userMnemonics={mnemonics}
        onReset={resetAllProgress}
      />

      {/* Render the Set Wizard Modal */}
      <SetWizardModal 
        isOpen={showSetWizardModal}
        onClose={() => setShowSetWizardModal(false)}
      />

      {/* --- NEW: Moved Set Management Modal --- */}
      {isManagementModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setIsManagementModalOpen(false)}>
          <div className="neumorphic max-2xl w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-200">Set Manager</h2>
              <button
                onClick={() => setIsManagementModalOpen(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Current Set Info */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-blue-400 font-medium mb-2">Current Set:</h3>
                <div className="text-lg text-white font-bold">
                  {/* Display cleverTitle if available, otherwise fall back to name */}
                  {availableSets.find(set => set.id === activeSetId)?.cleverTitle || currentSetName}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {phrases.length} cards 
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => activeSetId && exportSet(activeSetId)}
                    className="neumorphic-button text-xs text-green-400 mr-2"
                    disabled={!activeSetId || isLoading}
                  >
                    Export Current Set
                  </button>
                </div>
              </div>

              {/* Available Sets List */}
              <div>
                <h3 className="text-white font-medium mb-3">Available Sets:</h3>
                
                {availableSets.filter(set => set.id !== 'default').length === 0 ? (
                  <div className="text-gray-400 text-center py-6">
                    <p>No custom sets available.</p>
                    <p className="text-sm mt-2">Create a set using the "Make Your Own Set!" button or import one below.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {availableSets.filter(set => set.id !== 'default').map(set => (
                      <div key={set.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                        {editingSetId === set.id ? (
                          // --- Edit Mode --- 
                          <div className="flex-1 flex items-center gap-2">
                             <input 
                               type="text"
                               value={editingTitle}
                               onChange={(e) => setEditingTitle(e.target.value)}
                               className="flex-1 bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm"
                               autoFocus
                               onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRename(); if (e.key === 'Escape') handleCancelRename(); }}
                             />
                             <button onClick={handleSaveRename} className="neumorphic-button text-xs text-green-400">Save</button>
                             <button onClick={handleCancelRename} className="neumorphic-button text-xs text-gray-400">Cancel</button>
                          </div>
                        ) : (
                          // --- Display Mode --- 
                          <div className="flex-1 flex items-center justify-between">
                            <div>
                              <div className="font-medium text-white">{set.cleverTitle || set.name}</div>
                              <div className="text-xs text-gray-400">
                                {set.phraseCount} cards • Created {new Date(set.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex space-x-2 items-center">
                              <button 
                                onClick={() => handleStartRename(set)}
                                className="text-blue-400 hover:text-blue-300 p-1" 
                                title="Rename Set"
                              >
                                {/* Edit Icon (example using heroicons) */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => switchSet(set.id)}
                                className="neumorphic-button text-xs text-blue-400"
                                disabled={activeSetId === set.id || isLoading}
                              >
                                {activeSetId === set.id ? 'Active' : 'Switch'}
                              </button>
                              <button
                                onClick={() => exportSet(set.id)}
                                className="neumorphic-button text-xs text-green-400"
                                disabled={isLoading}
                              >
                                Export
                              </button>
                              <button
                                onClick={() => deleteSet(set.id)}
                                className="neumorphic-button text-xs text-red-400"
                                disabled={isLoading}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Import Set Section - Use the main importSet function */}
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-white font-medium mb-3">Import Set:</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={importSet} // Use the importSet defined in this component
                    className="neumorphic-button text-blue-400 text-sm"
                    disabled={isLoading}
                  >
                    Import Set File (.json)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- NEW: App Options Modal --- */}
      {isAppOptionsMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setIsAppOptionsMenuOpen(false)}>
          <div className="neumorphic max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-200">App Options</h2>
              <button onClick={() => setIsAppOptionsMenuOpen(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="space-y-6">
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between">
                <label htmlFor="darkModeToggleApp" className="text-gray-300">Dark Mode</label>
                <Switch
                  id="darkModeToggleApp"
                  checked={isDarkMode}
                  onCheckedChange={toggleDarkMode}
                />
              </div>
              {/* Gender Toggle */}
              <div className="flex items-center justify-between">
                 <label htmlFor="genderToggleApp" className="text-gray-300">Voice Gender (Krap/Ka)</label>
                 <div className="flex items-center">
                   <span className="mr-2 text-sm font-medium text-gray-400">Female</span>
                    <Switch
                      id="genderToggleApp"
                      checked={isMale}
                      onCheckedChange={setIsMale} // Directly use the state setter
                    />
                   <span className="ml-2 text-sm font-medium text-gray-400">Male</span>
                 </div>
              </div>
              {/* Polite Mode Toggle */}
              <div className="flex items-center justify-between">
                 <label htmlFor="politeToggleApp" className="text-gray-300">Polite Mode (Add ครับ/ค่ะ)</label>
                 <div className="flex items-center">
                    <span className="mr-2 text-sm font-medium text-gray-400">Casual</span>
                     <Switch
                       id="politeToggleApp"
                       checked={isPoliteMode}
                       onCheckedChange={setIsPoliteMode} // Directly use the state setter
                     />
                    <span className="ml-2 text-sm font-medium text-gray-400">Polite</span>
                 </div>
              </div>
               {/* Autoplay Toggle */}
              <div className="flex items-center justify-between">
                <label htmlFor="autoplayToggleApp" className="text-gray-300">Autoplay Audio on Reveal</label>
                <Switch
                  id="autoplayToggleApp"
                  checked={autoplay}
                  onCheckedChange={setAutoplay}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- NEW: Set Options Modal --- */}
      {isSetOptionsMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setIsSetOptionsMenuOpen(false)}>
          <div className="neumorphic max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-200">Current Set Options</h2>
              <button onClick={() => setIsSetOptionsMenuOpen(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
               <div className="bg-gray-800 p-4 rounded-lg text-center">
                 <p className="text-sm text-gray-400 mb-1">Current Set:</p>
                 <p className="text-lg text-white font-semibold">
                    {availableSets.find(set => set.id === activeSetId)?.cleverTitle || currentSetName}
                 </p>
               </div>
               <button
                 onClick={() => {
                   setIsSetOptionsMenuOpen(false); // Close this modal
                   setIsManagementModalOpen(true); // Open the Set Manager
                 }}
                 className="neumorphic-button w-full text-blue-400"
               >
                 Open Full Set Manager...
               </button>
               <button
                 onClick={() => activeSetId && exportSet(activeSetId)}
                 className="neumorphic-button w-full text-green-400"
                 disabled={!activeSetId || isLoading || activeSetId === 'default'} // Disable for default set
               >
                 Export This Set
               </button>
               <button
                 onClick={() => {
                    if (activeSetId && activeSetId !== 'default') {
                       if (confirm(`Are you sure you want to reset all progress for the set "${availableSets.find(set => set.id === activeSetId)?.cleverTitle || currentSetName}"? This cannot be undone.`)) {
                          // TODO: Implement function to reset progress *only* for the active set
                          console.warn("Reset progress for specific set not yet implemented.");
                          // Placeholder: Currently resets ALL progress. Need refined logic.
                          // resetCurrentSetProgress(); // This function needs to be created
                          alert("Resetting progress for specific sets is not yet fully implemented. Use 'Reset All' in Stats/Data for now.");
                       }
                    } else {
                       alert("Cannot reset progress for the default set.");
                    }
                 }}
                 className="neumorphic-button w-full text-yellow-400"
                 disabled={!activeSetId || isLoading || activeSetId === 'default'}
               >
                 Reset Progress for This Set
               </button>
                 <button
                   onClick={() => {
                      if (activeSetId && activeSetId !== 'default') {
                         const setToDelete = availableSets.find(set => set.id === activeSetId);
                         if (setToDelete && confirm(`Are you sure you want to delete the set "${setToDelete.cleverTitle || setToDelete.name}"? This cannot be undone.`)) {
                            deleteSet(activeSetId);
                            setIsSetOptionsMenuOpen(false); // Close modal after deletion
                         }
                      } else {
                         alert("Cannot delete the default set.");
                      }
                   }}
                   className="neumorphic-button w-full text-red-400"
                   disabled={!activeSetId || isLoading || activeSetId === 'default'}
                 >
                   Delete This Set
                 </button>
            </div>
          </div>
        </div>
      )}

      {/* Version indicator at the bottom - shows changes and timestamp in Amsterdam timezone */}
      <div className="text-center p-2 text-xs text-gray-600">
        <span>v{VERSION_INFO.version} - {VERSION_INFO.changes}</span>
      </div>

      {/* STAGING ENVIRONMENT INDICATOR */}
      <div className="fixed bottom-1 right-1 bg-yellow-300 text-black text-xs px-2 py-1 rounded-full">
        STAGING
      </div>
    </main>
  );
} 
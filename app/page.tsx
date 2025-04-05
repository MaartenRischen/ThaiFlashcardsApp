'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Switch } from "@/app/components/ui/switch";
import { ttsService } from './lib/tts-service';
import AdminSettings from './components/AdminSettings';
import { INITIAL_PHRASES, type Phrase, type ExampleSentence } from './data/phrases';

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
  version: "1.3.52",
  changes: "Dynamically add krap/ka to pronunciation based on gender switch and phrase type"
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
  // Add state for wizard steps and user input
  const [currentStep, setCurrentStep] = useState(1);
  const [thaiLevel, setThaiLevel] = useState<string>(''); 
  const [learningGoals, setLearningGoals] = useState<string[]>([]); 

  const totalSteps = 3; // Example total steps (Welcome, Level, Goals)

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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="neumorphic max-w-xl w-full p-6 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}> {/* Added flex-col, max-h */} 
        <div className="flex justify-between items-center mb-4 flex-shrink-0"> {/* Prevent header shrinking */} 
          <h2 className="text-xl font-bold text-gray-200">Create Your Custom Set (Step {currentStep}/{totalSteps})</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        
        {/* Wizard Content Area (Scrollable) */}
        <div className="text-gray-300 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"> 
          {currentStep === 1 && (
            <div>
              <p>Welcome to the Set Wizard!</p>
              <p className="mt-4">This will guide you through creating a personalized vocabulary and mnemonic set.</p>
              <p className="mt-2">Let's start by understanding your current level and goals.</p>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-400">What is your current Thai level?</h3>
              <div className="space-y-2">
                {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                  <label key={level} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-700">
                    <input 
                      type="radio" 
                      name="thaiLevel" 
                      value={level.toLowerCase()} 
                      checked={thaiLevel === level.toLowerCase()}
                      onChange={(e) => setThaiLevel(e.target.value)}
                      className="accent-blue-400 h-4 w-4"
                    />
                    <span>{level}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-400">What are your learning goals? (Select all that apply)</h3>
              <div className="space-y-2">
                {['Travel Basics', 'Everyday Conversation', 'Reading/Writing', 'Business Thai', 'Specific Topics (Specify below)'].map(goal => {
                  const goalValue = goal.toLowerCase().split(' ')[0].replace(/\/|\(/g, ''); // Simpler value
                  return (
                    <label key={goal} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-700">
                      <input 
                        type="checkbox" 
                        value={goalValue} 
                        checked={learningGoals.includes(goalValue)}
                        onChange={() => toggleGoal(goalValue)}
                        className="accent-green-400 h-4 w-4 rounded"
                      />
                      <span>{goal}</span>
                    </label>
                  );
                })}
                 {/* Text input for 'Specific Topics' */}
                 {learningGoals.includes('specific') && (
                    <textarea 
                        placeholder="Specify topics (e.g., food ingredients, medical terms, IT vocabulary)... Separate by commas."
                        className="neumorphic-input w-full mt-2 text-sm h-20 resize-none"
                        // Add state and handler for this input if needed for generation
                    />
                 )}
              </div>
            </div>
          )}
          
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
                 alert(`Generating Set...\nLevel: ${thaiLevel}\nGoals: ${learningGoals.join(', ')}\n(Generation logic not implemented yet)`);
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

export default function ThaiFlashcards() {
  const [phrases, setPhrases] = useState<Phrase[]>(INITIAL_PHRASES);
  const [currentSetName, setCurrentSetName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('currentSetName');
      return saved || "Default Set";
    } catch {
      return "Default Set";
    }
  });
  const [index, setIndex] = useState<number>(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [localMnemonics, setLocalMnemonics] = useState<{[key: number]: string}>({});
  const [cardProgress, setCardProgress] = useState<CardProgress>(() => {
    try {
      const saved = localStorage.getItem('cardProgress');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [isPlayingWord, setIsPlayingWord] = useState(false);
  const [isPlayingContext, setIsPlayingContext] = useState(false);
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
    localStorage.setItem('cardProgress', JSON.stringify(cardProgress));
  }, [cardProgress]);

  useEffect(() => {
    localStorage.setItem('mnemonicEdits', JSON.stringify(localMnemonics));
  }, [localMnemonics]);

  useEffect(() => {
    localStorage.setItem('autoplay', JSON.stringify(autoplay));
  }, [autoplay]);

  useEffect(() => {
    localStorage.setItem('isMale', JSON.stringify(isMale));
  }, [isMale]);

  useEffect(() => {
    localStorage.setItem('activeCards', JSON.stringify(activeCards));
  }, [activeCards]);

  // Save current set name whenever it changes
  useEffect(() => {
    localStorage.setItem('currentSetName', currentSetName);
  }, [currentSetName]);

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

      // Reset the active cards index when we update active cards
      setActiveCardsIndex(0);
    }
  };

  // Update mnemonic state locally on change
  const handleMnemonicChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMnemonics(prev => ({ ...prev, [index]: e.target.value }));
  };

  // Persist mnemonic change (e.g., on blur or explicit save)
  const updateMnemonics = (cardIndex: number, text: string) => {
    // The state is already updated by handleMnemonicChange, just save to localStorage
    localStorage.setItem('mnemonics', JSON.stringify(mnemonics)); 
    console.log(`Mnemonic for card ${cardIndex} saved.`);
  };

  // Function to reset only the mnemonic for the current card
  const resetCurrentMnemonic = () => {
    const newMnemonics = { ...mnemonics };
    if (newMnemonics.hasOwnProperty(index)) { // Check if a custom mnemonic exists
      delete newMnemonics[index]; // Remove the custom mnemonic for the current index
      setMnemonics(newMnemonics); // Update state (triggers localStorage save via useEffect)
      console.log(`Mnemonic for card ${index} reset to default.`);
    } else {
      console.log(`No custom mnemonic to reset for card ${index}.`);
    }
  };

  // Original Reset All (keeps card progress reset too)
  const resetAllProgress = () => {
    if (confirm('Are you sure you want to reset all progress AND mnemonics? This cannot be undone.')) { // Clarify confirmation
      setCardProgress({});
      setMnemonics({});
      localStorage.removeItem('cardProgress');
      localStorage.removeItem('mnemonics');
      setIndex(0);
      setShowAnswer(false);
      setRandomSentence(null);
      setActiveCardsIndex(0);
      updateActiveCards();
      alert('All progress and mnemonics have been reset');
    }
  };

  // --- NEW: Function to reset only mnemonics --- 
  const resetAllMnemonics = () => {
    setMnemonics({}); // Clear custom mnemonics state (useEffect handles localStorage)
    console.log('All custom mnemonics reset to default.');
    alert('All custom mnemonics have been reset to their defaults.');
  };
  // --- End of new function ---

  // Update generateRandomPhrase to ensure it just sets the ExampleSentence
  const generateRandomPhrase = (direction: 'next' | 'prev' = 'next') => {
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
        return { color: 'bg-gray-700 text-gray-300', label: 'Unseen' };
      case 'hard':
        return { color: 'bg-red-600 text-white', label: 'Wrong' };
      case 'good':
        return { color: 'bg-yellow-500 text-black', label: 'Correct' };
      case 'easy':
        return { color: 'bg-green-500 text-white', label: 'Easy' };
      default:
        return { color: 'bg-gray-700 text-gray-300', label: 'Unseen' };
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

  // Function to count cards due today based on SRS schedule
  const countCardsDueToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    let dueCount = 0;
    
    // Count unseen cards (always due)
    for (let i = 0; i < phrases.length; i++) {
      if (!cardProgress[i] || !cardProgress[i].reviews || cardProgress[i].reviews.length === 0) {
        dueCount++;
        continue;
      }
      
      // Count cards marked as "hard" in their last review (always due)
      const lastReview = cardProgress[i].reviews[cardProgress[i].reviews.length - 1];
      if (lastReview.difficulty === 'hard') {
        dueCount++;
        continue;
      }
      
      // Count cards whose next review date is today or earlier
      if (cardProgress[i].nextReviewDate) {
        const nextReviewDate = new Date(cardProgress[i].nextReviewDate);
        nextReviewDate.setHours(0, 0, 0, 0); // Start of review date
        
        if (nextReviewDate <= today) {
          dueCount++;
        }
      }
    }
    
    return dueCount;
  };

  // Function to check for reviews completed today
  const countReviewsCompletedToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    let completedCount = 0;
    
    // Count reviews that happened today
    Object.values(cardProgress).forEach(card => {
      card.reviews.forEach((review: Review) => {
        const reviewDate = new Date(review.date);
        reviewDate.setHours(0, 0, 0, 0); // Start of review date
        
        if (reviewDate.getTime() === today.getTime()) {
          completedCount++;
        }
      });
    });
    
    return completedCount;
  };

  // Add a useEffect to update due counts when component mounts or cardProgress changes
  useEffect(() => {
    const dueCount = countCardsDueToday();
    const completedCount = countReviewsCompletedToday();
    
    setTotalDueToday(dueCount);
    setReviewsCompletedToday(completedCount);
  }, [cardProgress]);

  // Modify handleCardAction to increment reviewsCompletedToday
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
    
    // Increment the completed cards counter
    const newActiveCardsIndex = activeCardsIndex + 1;
    setActiveCardsIndex(newActiveCardsIndex);
    
    // Move to the next card in the active cards list
    const nextActiveIndex = (activeCardsIndex + 1) % activeCards.length;
    
    // Clear the random sentence first, then update the index
    setRandomSentence(null);
    setShowAnswer(false);
    setIndex(activeCards[nextActiveIndex]);

    // Increment completed reviews counter
    setReviewsCompletedToday(prev => prev + 1);
    
    // After marking a card as reviewed, it's no longer due today,
    // so we should update the total due count
    // If difficulty is 'hard', the card remains due
    if (difficulty !== 'hard') {
      setTotalDueToday(prev => Math.max(0, prev - 1));
    }
  };

  const prevCard = () => {
    if (index > 0) {
      setIndex(index - 1);
    }
  };

  const nextCard = () => {
    if (index < phrases.length - 1) {
      setIndex(index + 1);
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
    const newCardProgress = { ...cardProgress };
    delete newCardProgress[index];
    setCardProgress(newCardProgress);
    localStorage.setItem('cardProgress', JSON.stringify(newCardProgress));
    
    // Clear mnemonic for this card
    const newMnemonics = { ...mnemonics };
    delete newMnemonics[index];
    setMnemonics(newMnemonics);
    localStorage.setItem('mnemonics', JSON.stringify(newMnemonics));
    
    // Reset the card
    setShowAnswer(false);
    setRandomSentence(null);
    
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

  // Rename and refactor Import function
  const importPhraseData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const importedData = JSON.parse(event.target?.result as string);
            
            // Validate imported data structure (basic check)
            if (!Array.isArray(importedData.phrases)) {
              throw new Error('Invalid file structure. Expected phrases array in the imported set.');
            }

            // --- Apply Imported Data --- 
            // 1. Replace Phrases
            setPhrases(importedData.phrases);
            
            // 2. Replace Mnemonics if they exist
            if (importedData.mnemonics) {
              setMnemonics(importedData.mnemonics);
              localStorage.setItem('mnemonics', JSON.stringify(importedData.mnemonics));
            }
            
            // 3. Set the name if it exists, otherwise use the file name
            if (importedData.name) {
              setCurrentSetName(importedData.name);
            } else {
              // Extract name from filename (remove extension)
              const fileName = file.name.replace(/\.[^/.]+$/, "");
              setCurrentSetName(fileName);
            }
            
            // 4. Reset Learning Progress
            setCardProgress({});
            localStorage.removeItem('cardProgress');
            console.log("Learning progress reset due to new set import.");
            
            // 5. Reset UI State
            setIndex(0); 
            setActiveCardsIndex(0);
            setShowAnswer(false);
            setRandomSentence(null);
            
            // 6. Reset active cards
            const initialActive = Array.from({ length: Math.min(5, importedData.phrases.length) }, (_, i) => i);
            setActiveCards(initialActive);
            localStorage.setItem('activeCards', JSON.stringify(initialActive));
            
            alert(`Successfully imported "${currentSetName}" with ${importedData.phrases.length} phrases.`);

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

  // Rename and refactor Export function
  const exportCurrentSet = () => {
    // Prepare data: Base phrases and current user mnemonics
    const dataToExport = {
      phrases: phrases, // Export the current state of phrases
      mnemonics: mnemonics // Export the current state of mnemonics
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2); // Pretty print JSON
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'thai-flashcards-set.json'; // New default name
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Rename and refactor Import function
  const importSet = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const importedData = JSON.parse(event.target?.result as string);
            
            // Validate imported data structure (basic check)
            if (!Array.isArray(importedData.phrases)) {
              throw new Error('Invalid file structure. Expected phrases array in the imported set.');
            }

            // --- Apply Imported Data --- 
            // 1. Replace Phrases
            setPhrases(importedData.phrases);
            
            // 2. Replace Mnemonics if they exist
            if (importedData.mnemonics) {
              setMnemonics(importedData.mnemonics);
              localStorage.setItem('mnemonics', JSON.stringify(importedData.mnemonics));
            }
            
            // 3. Set the name if it exists, otherwise use the file name
            if (importedData.name) {
              setCurrentSetName(importedData.name);
            } else {
              // Extract name from filename (remove extension)
              const fileName = file.name.replace(/\.[^/.]+$/, "");
              setCurrentSetName(fileName);
            }
            
            // 4. Reset Learning Progress
            setCardProgress({});
            localStorage.removeItem('cardProgress');
            console.log("Learning progress reset due to new set import.");
            
            // 5. Reset UI State
            setIndex(0); 
            setActiveCardsIndex(0);
            setShowAnswer(false);
            setRandomSentence(null);
            
            // 6. Reset active cards
            const initialActive = Array.from({ length: Math.min(5, importedData.phrases.length) }, (_, i) => i);
            setActiveCards(initialActive);
            localStorage.setItem('activeCards', JSON.stringify(initialActive));
            
            alert(`Successfully imported "${currentSetName}" with ${importedData.phrases.length} phrases.`);

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

  return (
    <main className="min-h-screen bg-[#1a1a1a] flex flex-col">
      {/* Header with app logo and navigation buttons */}
      <div className="p-4 bg-[#111] border-b border-[#333] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <img src="/images/donkey-bridge-logo.png" alt="Donkey Bridge Logo" className="h-48 w-auto" />
          <div className="flex flex-col">
            <div className="text-xl text-white font-semibold">Thai Flashcards</div>
            <div className="text-sm text-gray-400">Current Set: <span className="text-blue-400 font-medium">{currentSetName}</span></div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowHowItWorks(true)} className="neumorphic-button text-xs text-blue-400">How It Works</button>
          <button onClick={() => setShowVocabulary(true)} className="neumorphic-button text-xs text-blue-400">
            {currentSetName === "Default Set" ? "Vocabulary" : `${currentSetName} Cards`}
          </button>
          <button 
            onClick={() => setShowMnemonicsModal(true)} 
            className="neumorphic-button text-xs text-blue-400"
          >
            {currentSetName === "Default Set" ? "Mnemonics" : `${currentSetName} Mnemonics`}
          </button>
          <button 
            onClick={() => window.open('/set-wizard', '_blank')} 
            className="neumorphic-button text-xs text-green-400 border-green-500"
          >
            Make Your Own Set!
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="neumorphic rounded-xl flex flex-col">
            {/* Card Front */}
            <div className="p-6">
              <div className="text-2xl font-bold mb-2 text-center">{phrases[index].english}</div>
              
              {!showAnswer && (
                <div className="flex justify-center mt-4">
            <button
                    onClick={() => setShowAnswer(true)}
                    className="neumorphic-button text-blue-400 px-6 py-2"
                  >
                    Show Answer
            </button>
          </div>
              )}
          </div>

            {/* Card Back */}
            {showAnswer && (
              <div className="border-t border-[#333] p-6">
                {/* Main Phrase Section */} 
                <div className="flex items-center justify-center mb-4">
                  <div className="text-center">
                    {/* Thai word with pronunciation - Use restored helper */}
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

                    {/* Difficulty Buttons (Restored Here) */} 
                    <div className="flex justify-center space-x-2 mb-4">
                      <button
                        onClick={() => handleCardAction('hard')}
                        className="neumorphic-button text-red-400"
                      >
                        Wrong
                      </button>
                      <button
                        onClick={() => handleCardAction('good')}
                        className="neumorphic-button text-yellow-400"
                      >
                        Correct
                      </button>
                      <button
                        onClick={() => handleCardAction('easy')}
                        className="neumorphic-button text-green-400"
                      >
                        Easy
                      </button>
                    </div>

                  </div>
                </div> {/* <<< End Main Phrase Section div */} 

                {/* === Mnemonic Section (Restored Here) === */} 
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-400">Mnemonic</label>
                    <button onClick={resetCurrentMnemonic} className="text-xs text-blue-400 hover:text-blue-300">Reset</button>
                  </div>
                  <textarea
                    value={mnemonics[index] ?? phrases[index].mnemonic ?? ''}
                    onChange={handleMnemonicChange}
                    onBlur={() => updateMnemonics(index, mnemonics[index] ?? phrases[index].mnemonic ?? '')}
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

                {/* === Gender Slider and Polite Mode Toggle Section === */} 
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

      {/* Settings Modal (controlled by showStats) */}
      {showStats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowStats(false)}>
          <div className="neumorphic max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-200">Settings</h2>
              <button
                  onClick={() => setShowStats(false)}
                  className="text-gray-400 hover:text-white text-2xl"
              >
                  ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Set Management Section */}
              <div className="py-2 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-gray-200 mb-2">Set Management</h3>
                <div className="text-sm text-gray-400 mb-3">
                  Currently using: <span className="text-blue-400 font-medium">{currentSetName}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={exportCurrentSet} 
                    className="neumorphic-button text-xs text-green-400"
                  >
                    Export Set
                  </button>
                  <button 
                    onClick={importSet} 
                    className="neumorphic-button text-xs text-blue-400"
                  >
                    Import Set
                  </button>
                  {currentSetName !== "Default Set" && (
                    <button 
                      onClick={() => {
                        if (confirm(`Reset to Default Set? Your current set "${currentSetName}" will remain saved.`)) {
                          setPhrases(INITIAL_PHRASES);
                          setCurrentSetName("Default Set");
                          setIndex(0);
                          setShowAnswer(false);
                          setRandomSentence(null);
                          updateActiveCards();
                        }
                      }} 
                      className="neumorphic-button text-xs text-yellow-400"
                    >
                      Switch to Default Set
                    </button>
                  )}
                </div>
              </div>

              {/* Autoplay Toggle */}
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <span className="text-gray-300">Auto-play audio on reveal</span>
                <Switch checked={autoplay} onCheckedChange={setAutoplay} />
              </div>
              
              {/* Data Management Buttons - Added */}
              <div className="pt-4 space-y-3">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Data Management</h3>
                <button 
                  onClick={exportPhraseData} 
                  className="neumorphic-button w-full text-blue-400"
                >
                  Export Set
                </button>
                <button 
                  onClick={importPhraseData} 
                  className="neumorphic-button w-full text-blue-400"
                >
                  Import Set
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

      {showHowItWorks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
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

            <div className="space-y-4 text-gray-300">
              <p><strong>Spaced Repetition:</strong> This app uses the SM-2 algorithm to optimize your learning. Cards you find difficult will appear more frequently.</p>
              <p><strong>Gender Toggle:</strong> Switch between masculine (ครับ) and feminine (ค่ะ) endings.</p>
              <p><strong>Mnemonics:</strong> Create memory aids to help remember words.</p>
              <p><strong>Context Examples:</strong> See how words are used in sentences.</p>
              <p><strong>Progress:</strong> Your progress is automatically saved in your browser.</p>
              <p><strong>Audio:</strong> Hear the correct pronunciation with text-to-speech.</p>
              <p><strong>Offline Use:</strong> This app works offline once loaded.</p>
            </div>
          </div>
        </div>
      )}

      {showVocabulary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="neumorphic max-w-md w-full p-6 max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-[#1a1a1a] py-2">
              <h2 className="text-xl font-bold">Vocabulary List</h2>
              <button
                onClick={() => setShowVocabulary(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {phrases.map((phrase, i) => {
                // Get the status of the card
                const status = getCardStatus(i);
                const { color, label } = getStatusInfo(status);
                
                return (
                  <div key={i} className={`p-3 border-b border-[#333] flex justify-between ${index === i ? 'bg-opacity-20 bg-blue-900' : ''}`}>
                    <div>
                      <p className="text-white">{phrase.thai}</p>
                      <p className="text-gray-400 text-sm">{phrase.english}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded text-xs font-medium ${color}`}>
                        {label}
                      </span>
                      <button
                        onClick={() => {
                          setIndex(i);
                          setShowVocabulary(false);
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
        onReset={resetAllMnemonics}
      />

      {/* Render the Set Wizard Modal */}
      <SetWizardModal 
        isOpen={showSetWizardModal}
        onClose={() => setShowSetWizardModal(false)}
      />

      {/* Version indicator at the bottom - shows changes and timestamp in Amsterdam timezone */}
      <div className="text-center p-2 text-xs text-gray-600">
        <span>v{VERSION_INFO.version} - {VERSION_INFO.changes}</span>
      </div>
    </main>
  );
} 
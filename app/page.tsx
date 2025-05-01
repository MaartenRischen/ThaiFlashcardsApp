/* eslint-disable */
'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { ttsService } from './lib/tts-service';
import AdminSettings from './components/AdminSettings';
import { INITIAL_PHRASES, type Phrase, type ExampleSentence } from './data/phrases';
import { useSet } from './context/SetContext';
import { Phrase as GeneratorPhrase, GeneratePromptOptions } from './lib/set-generator';
import { SetMetaData, SetProgress } from './lib/storage';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { FlashcardHeader } from './components/flashcard-page/FlashcardHeader';
import { SettingsModal, SetManagerModal } from './components/CombinedOptionsModal';
import { calculateNextReview } from './lib/srs';
import { Volume2 } from 'lucide-react';
import { SetWizardModal, SetWizardState } from '../components/SetWizard/SetWizardModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/dialog';
import { X, ChevronRight, ChevronLeft, CheckCircle, Info, Bookmark, PlayCircle, Grid, Layers, Plus, Settings, HelpCircle, GalleryHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Utility function to detect mobile devices
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || (window.innerWidth <= 768);
};

// Define a simple CardStatus type locally for now
type CardStatus = 'unseen' | 'wrong' | 'due' | 'reviewed';

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

interface Review {
  date: string;
  difficulty: 'hard' | 'good' | 'easy';
  interval: number;
  easeFactor: number;
  repetitions: number;
}

// Correct getThaiWithGender to use gendered fields if present
const getThaiWithGender = (phrase: Phrase | ExampleSentence | null, isMale: boolean, isPoliteMode: boolean): string => {
  if (!phrase) return '';
  // Use gendered fields if present
  let baseThai = phrase.thai;
  if (isMale && phrase.thaiMasculine) baseThai = phrase.thaiMasculine;
  else if (!isMale && phrase.thaiFeminine) baseThai = phrase.thaiFeminine;

  // If Polite Mode is OFF, remove polite particles if present
  if (!isPoliteMode) {
    return baseThai.replace(/(ครับ|ค่ะ)$/g, '');
  }

  // Polite Mode is ON: Check endings and add particle if appropriate
  const politeEndingsToAvoid = ['ไหม', 'อะไร', 'ไหน', 'เท่าไหร่', 'เหรอ', 'หรือ', 'ใช่ไหม', 'เมื่อไหร่', 'ทำไม', 'อย่างไร', 'ที่ไหน', 'ครับ', 'ค่ะ'];
  const endsWithPoliteEnding = politeEndingsToAvoid.some(ending => baseThai.endsWith(ending));

  if (!endsWithPoliteEnding) {
    return isMale ? `${baseThai}ครับ` : `${baseThai}ค่ะ`;
  }
  return baseThai;
};

// Correct getGenderedPronunciation to robustly handle gendered pronouns and polite particles
const getGenderedPronunciation = (phraseData: Phrase | ExampleSentence | null, isMale: boolean, isPoliteMode: boolean): string => {
  if (!phraseData) return '';
  let basePronunciation = phraseData.pronunciation;
  // Replace ambiguous pronouns with gendered ones
  basePronunciation = basePronunciation.replace(/phom\/chan|chan\/phom|phom\/chan|chan\/phom/g, isMale ? 'phom' : 'chan');

  // If Polite Mode is OFF, remove polite particles if present
  if (!isPoliteMode) {
    return basePronunciation.replace(/( krap| ka)$/g, '');
  }

  // Polite Mode ON: Add polite particle if not present and not ending with one
  const politeEndingsToAvoid = ['ไหม', 'อะไร', 'ไหน', 'เท่าไหร่', 'เหรอ', 'หรือ', 'ใช่ไหม', 'เมื่อไหร่', 'ทำไม', 'อย่างไร', 'ที่ไหน', 'krap', 'ka'];
  const endsWithPoliteEnding = politeEndingsToAvoid.some(ending => basePronunciation.endsWith(ending));

  if (!endsWithPoliteEnding) {
    return basePronunciation + (isMale ? ' krap' : ' ka');
  }
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

// Helper function to shuffle an array (Fisher-Yates algorithm)
// Force rebuild trigger comment
const shuffleArray = <T extends unknown>(array: T[]): T[] => {
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
    exportSet,
    switchSet,
    renameSet,
    refreshSets,
    setAvailableSets
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
  const [isPlayingWord, setIsPlayingWord] = useState(false);
  const [isPlayingContext, setIsPlayingContext] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showProgress, setShowProgress] = useState(false); // Renamed from showVocabulary
  const [autoplay, setAutoplay] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('autoplay');
      if (saved !== null) return JSON.parse(saved) === true;
      localStorage.setItem('autoplay', 'true');
      return true;
    } catch {
      return true;
    }
  });
  const [isMale, setIsMale] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('isMale');
      if (saved !== null) return JSON.parse(saved) === true;
      localStorage.setItem('isMale', 'false');
      return false;
    } catch { return false; }
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
  const [isPoliteMode, setIsPoliteMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('isPoliteMode');
      if (saved !== null) return JSON.parse(saved) === true;
      localStorage.setItem('isPoliteMode', 'false');
      return false;
    } catch { return false; }
  });
  const [activeCardsIndex, setActiveCardsIndex] = useState<number>(0);
  const [showMnemonicsModal, setShowMnemonicsModal] = useState(false);
  const [showMnemonicHint, setShowMnemonicHint] = useState(false); // NEW: State for front hint
  const [showCardsModal, setShowCardsModal] = useState(false);

  // === Reintroduced state variables to fix missing identifier errors ===
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showSetWizardModal, setShowSetWizardModal] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState<boolean>(false);
  const [tutorialStep, setTutorialStep] = useState<number>(0);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [totalDueToday, setTotalDueToday] = useState<number>(0);
  const [reviewsCompletedToday, setReviewsCompletedToday] = useState<number>(0);
  // === End reintroduced state variables ===

  // --- NEW: Ref for dark mode timeout ---
  const darkModeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add ref to track previous showAnswer state - RESTORED
  const prevShowAnswerRef = React.useRef(false);
  // Add a ref for the card back
  const cardBackRef = useRef<HTMLDivElement>(null);

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
    localStorage.setItem('isPoliteMode', JSON.stringify(isPoliteMode));
  }, [isPoliteMode]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

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

  // Mobile optimization: Add resize event listener to handle proper card positioning
  useEffect(() => {
    const handleResize = () => {
      if (showAnswer && cardBackRef.current && isMobileDevice()) {
        setTimeout(() => {
          cardBackRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start'
          });
        }, 150);
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Call once on initial render if showing answer
    if (showAnswer) {
      handleResize();
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [showAnswer]);

  // Trigger autoplay when gender or politeness is toggled (if card back is showing)
  useEffect(() => {
    if (showAnswer && voicesLoaded && !isPlayingWord && !isPlayingContext) {
      speak(getThaiWithGender(phrases[index], isMale, isPoliteMode), true, isMale);
    }
  }, [isMale, isPoliteMode]);

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

  // Add this function before generateRandomPhrase
  const isDialogueExample = (example: ExampleSentence): boolean => {
    const translation = example.translation.toLowerCase();
    // Check for common dialogue indicators
    if (translation.includes('?') || 
        translation.includes('!') ||
        translation.includes('please') ||
        translation.includes('thank you') ||
        translation.includes('excuse me') ||
        translation.includes('sorry') ||
        translation.includes('may i') ||
        translation.includes('can you') ||
        translation.includes('do you') ||
        translation.includes('what') ||
        translation.includes('where') ||
        translation.includes('when') ||
        translation.includes('why') ||
        translation.includes('how')) {
      return true;
    }
    return false;
  };

  // Update generateRandomPhrase to filter out dialogues
  const generateRandomPhrase = (direction: 'next' | 'prev' | 'first' = 'first') => {
    try {
      const examples = phrases[index]?.examples?.filter(ex => !isDialogueExample(ex)) || [];
      if (!examples || examples.length === 0) {
        setRandomSentence(null); 
        return;
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
    const updated = calculateNextReview(activeSetProgress[index], difficulty);
    updateSetProgress({
      ...activeSetProgress,
      [index]: updated,
    });

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
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            alert(`Import failed: ${message}`);
            console.error('Import error:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Helper function to get card status based on activeSetProgress
  const getCardStatus = (cardIndex: number): string => {
    const progress = activeSetProgress[cardIndex];
    if (!progress || !progress.difficulty) return 'unseen';
    if (progress.difficulty === 'hard') return 'wrong';
    if (progress.difficulty === 'good') return 'correct';
    if (progress.difficulty === 'easy') return 'easy';
    return 'unseen';
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
    
    // Scroll the card back into view after a small delay to allow rendering
    setTimeout(() => {
      if (cardBackRef.current) {
        const isMobile = isMobileDevice();
        
        // First try to use scrollIntoView with different behavior for mobile
        cardBackRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: isMobile ? 'start' : 'nearest'
        });
        
        // For mobile devices, add an additional window scroll
        if (isMobile) {
          const rect = cardBackRef.current.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          // On mobile, position the element a bit higher from the top for better visibility
          const targetPosition = scrollTop + rect.top - 20; // 20px offset from top
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
          
          // For iOS specifically, sometimes need an extra nudge
          if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
            setTimeout(() => {
              window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
              });
            }, 100);
          }
        }
      }
    }, 150); // Ensure DOM has updated
    
    // Trigger next step specifically when moving from step 2 (Show Answer explanation)
    if (tutorialStep === 2) { 
      console.log("Tutorial: Triggering step 3 via Show Answer");
      handleTutorialNext(); // Advance to the step explaining the back (e.g., difficulty buttons)
    }
  };

  // Dark Mode Effect - REVISED TO ALWAYS START IN NORMAL MODE
  useEffect(() => {
    // // Remove reading from localStorage
    // const savedMode = localStorage.getItem('darkMode');
    // const initialModeIsFakeDark = savedMode === 'true';
    
    // Always start with fake dark mode OFF
    setIsDarkMode(false); 

    // Always remove fake dark mode class on load
    document.documentElement.classList.remove('fake-dark-mode-active');
    
    // Ensure regular dark mode class is also removed on load
    document.documentElement.classList.remove('dark'); 

  }, []); // Empty array ensures this runs only once on mount

  // Handler to toggle dark mode and save preference - REVISED FOR FAKE DARK MODE JOKE
  const toggleDarkMode = (checked: boolean) => {
    // Clear any existing timeout if the user toggles rapidly
    if (darkModeTimeoutRef.current) {
      clearTimeout(darkModeTimeoutRef.current);
      darkModeTimeoutRef.current = null;
    }

    setIsDarkMode(checked); // Update state immediately for toggle visual

    if (checked) {
      // Activate fake dark mode
      document.documentElement.classList.add('fake-dark-mode-active');
      document.documentElement.classList.remove('dark'); // Ensure regular dark mode is off
      localStorage.setItem('darkMode', 'true'); // Save preference (even though it reverts)

      // Set a timeout to revert after 1 second
      darkModeTimeoutRef.current = setTimeout(() => {
        console.log("Reverting fake dark mode automatically.");
        setIsDarkMode(false); // Set state back to false
        document.documentElement.classList.remove('fake-dark-mode-active');
        localStorage.setItem('darkMode', 'false'); // Update storage
        darkModeTimeoutRef.current = null; // Clear the ref
      }, 1000); // 1000 milliseconds = 1 second

    } else {
      // Deactivate fake dark mode (if manually turned off before timeout)
      document.documentElement.classList.remove('fake-dark-mode-active');
      localStorage.setItem('darkMode', 'false');
      // Ensure regular dark mode class is also removed
      document.documentElement.classList.remove('dark');
    }
  };

  // Gendered name lists for context replacement
  const maleNames = ["Nattapong", "Somchai", "Anan", "Kittisak", "Chaiwat", "Prasert", "Somsak", "Wichai", "Sakda", "Manop"];
  const femaleNames = ["Suda", "Nid", "Malee", "Somsri", "Pim", "Nok", "Kanya", "Sunee", "Wilai", "Amporn"];

  // Helper to pick a random name from a list
  function getRandomName(names: string[]) {
    return names[Math.floor(Math.random() * names.length)];
  }

  // State to store the current context name
  const [contextName, setContextName] = useState<string>("");

  // Effect to update contextName when randomSentence or gender changes
  useEffect(() => {
    if (!randomSentence) return;
    // Find if the context sentence contains a known name
    const allNames = [...maleNames, ...femaleNames];
    const foundName = allNames.find(name =>
      randomSentence.thai.includes(name) ||
      (randomSentence.pronunciation && randomSentence.pronunciation.includes(name)) ||
      (randomSentence.translation && randomSentence.translation.includes(name))
    );
    // If found, replace with a random gender-appropriate name
    if (foundName) {
      const newName = isMale ? getRandomName(maleNames) : getRandomName(femaleNames);
      setContextName(newName);
    } else {
      setContextName("");
    }
  }, [randomSentence, isMale]);

  // Helper to replace name in a string
  function replaceName(str: string, name: string) {
    if (!name) return str;
    const allNames = [...maleNames, ...femaleNames];
    let result = str;
    allNames.forEach(n => {
      // Replace with word boundaries to avoid partial matches
      result = result.replace(new RegExp(`\\b${n}\\b`, 'g'), name);
    });
    return result;
  }

  // NEW: Test generation function and state
  const [testGenResult, setTestGenResult] = useState<unknown>(null); // Changed any to unknown
  
  // Use isLoading and switchSet from context
  // REMOVED: const { isLoading, switchSet } = useSet(); // This was redundant

  const handleTestGenerationCallback = React.useCallback(async () => {
    setTestGenResult(null); // Clear previous results
    alert("Starting test generation... this might take a minute."); // User feedback

    // Prepare data for the API call
    const totalCount = 10; // Hardcoded for now, get from wizardState later
    
    // Create simple preferences object for test generation
    const preferences: Omit<GeneratePromptOptions, 'count' | 'existingPhrases'> = {
      level: 'intermediate' as 'Complete Beginner' | 'Basic Understanding' | 'Intermediate' | 'Advanced' | 'Native/Fluent' | 'God Mode',
      specificTopics: undefined,
      toneLevel: 5, // Default to balanced (5)
      topicsToDiscuss: undefined,
    };
    
    console.log('handleTestGeneration: Calling API route /api/generate-set');

    try {
      const response = await fetch('/api/generate-set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences, totalCount }),
        credentials: 'include',
      });

      const result = await response.json();

      // Add logging here:
      console.log("[page.tsx onComplete] Full result from /api/generate-set:", JSON.stringify(result, null, 2));
      console.log("[page.tsx onComplete] result.phrases:", JSON.stringify(result.phrases?.slice(0,2), null, 2)); // Log first 2

      if (!response.ok) {
        // Log the detailed error from the API response
        console.error("API Error Response:", result);
        throw new Error(result.error || `API request failed with status ${response.status}`);
      }

      if (result.newSetMetaData && result.newSetMetaData.id) {
        console.log('handleTestGeneration: API route returned newSetId:', result.newSetMetaData.id);
        // Refresh sets in context
        await refreshSets();
        await switchSet(result.newSetMetaData.id);
        console.log('handleTestGeneration: Successfully requested switch to new set', result.newSetMetaData.id);
        alert('Test set generated and saved successfully!'); 
      } else {
        throw new Error('API route did not return a newSetId.');
      }

    } catch (error: unknown) {
      let errorMessage = 'An unknown error occurred';
      if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      console.error('handleTestGeneration: Error calling API route:', error);
      setTestGenResult({ error: errorMessage }); // Display error if needed
      alert(`Error generating test set: ${errorMessage}`);
    } 
  }, [addSet, refreshSets, switchSet]); // Added addSet to dependencies

  return (
    <main className="min-h-screen bg-[#1a1a1a] flex flex-col">
      {/* Render the new FlashcardHeader component - Removed setShowProgress & showAnswer */}
      <FlashcardHeader
        setShowHowItWorks={setShowHowItWorks}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenCards={() => setShowCardsModal(true)}
        onOpenSetManager={() => setIsManagementModalOpen(true)}
        onOpenSetWizard={() => setShowSetWizardModal(true)}
      />

      {/* Show testGenResult for debugging - Refined conditional and type guards */}
      {typeof testGenResult === 'object' && testGenResult !== null && (
        <div className="max-w-2xl mx-auto bg-gray-900 text-gray-200 p-4 mt-4 rounded shadow overflow-x-auto text-xs">
          <pre>{JSON.stringify(testGenResult, null, 2)}</pre>
          {/* Safely access phrases with type guards */}
          {'phrases' in testGenResult && Array.isArray(testGenResult.phrases) &&
            testGenResult.phrases.map((phrase: unknown, idx: number) => {
              // Type guard for phrase structure needed for image rendering
              if (typeof phrase === 'object' && phrase !== null && 'imageUrl' in phrase && typeof phrase.imageUrl === 'string' && 'english' in phrase) {
                const imageUrl = phrase.imageUrl; // Extract to satisfy TS
                const englishText = (phrase as { english?: unknown }).english;
                const altText = typeof englishText === 'string' ? englishText : 'Generated image';

                return (
                  <div key={idx} className="my-2">
                    <div className="font-bold text-blue-300">{typeof englishText === 'string' ? englishText : 'N/A'}</div>
                    {/* Use Next/Image */}
                    <div style={{ position: 'relative', width: '100%', maxWidth: '200px', height: '200px' }}> {/* Example wrapper */}
                      <Image
                        src={imageUrl} // Use extracted variable
                        alt={altText} // Use calculated alt text
                        fill // Use fill and let the container control size
                        style={{ objectFit: 'contain' }} // Adjust objectFit as needed
                        className="rounded shadow"
                      />
                    </div>
                  </div>
                );
              }
              return null; // Don't render if phrase structure is wrong
            })}
        </div>
      )}

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
              <div 
                ref={cardBackRef} 
                className="border-t border-[#333] p-6 flex flex-col min-h-[20rem] overflow-y-auto card-back-container"
              > 
                {/* Main Phrase Section - Centered */}
                <div className="flex flex-col items-center justify-center mb-4">
                  <div className="text-center">
                    {/* Thai word */}
                    <div className="text-3xl md:text-4xl font-extrabold mb-2 text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
                      {getThaiWithGender(phrases[index], isMale, isPoliteMode)}
                    </div>
                    {/* Pronunciation button */}
                    <div className="flex justify-center mb-4">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          const textToSpeak = getThaiWithGender(phrases[index], isMale, isPoliteMode);
                          speak(textToSpeak, true, isMale);
                        }}
                        disabled={isPlayingWord || isPlayingContext}
                        className="neumorphic-button text-blue-400 flex items-center gap-2 px-4 py-2"
                      >
                        <Volume2 className="w-5 h-5" />
                        {isPlayingWord ? 'Playing...' : `"${getGenderedPronunciation(phrases[index], isMale, isPoliteMode) || ''}"`}
                      </button>
                    </div>
                    {/* English translation in blue, in parentheses */}
                    {phrases[index]?.english && (
                      <div className="text-base md:text-lg font-medium mb-2 text-blue-300 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
                        ({phrases[index].english})
                      </div>
                    )}
                    {/* Difficulty Buttons - Wrapped in Popover (Step 3) */}
                    <Popover open={tutorialStep === 3}>
                      <PopoverTrigger asChild>
                        <div className="flex justify-center space-x-2 mb-6">
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
                </div> 

                {/* Mnemonic Section */} 
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-400">Mnemonic (editable)</label>
                    <button onClick={resetCurrentMnemonic} className="text-xs text-blue-400 hover:text-blue-300">Reset</button>
                  </div>
                  
                  {/* Pronunciation displayed above the mnemonic */}
                  {phrases[index]?.pronunciation && (
                    <div className="mb-2 p-2 bg-gray-800 rounded text-gray-300 font-medium text-center">
                      <span className="text-blue-400">Pronunciation:</span> {getGenderedPronunciation(phrases[index], isMale, isPoliteMode)}
                    </div>
                  )}
                  
                  <textarea
                    value={(() => {
                      const rawMnemonic = mnemonics[index] ?? phrases[index]?.mnemonic ?? '';
                      // Replace Phom/Chan or Chan/Phom with correct gendered pronoun
                      return rawMnemonic.replace(/Phom\/Chan|Chan\/Phom/gi, isMale ? 'Phom' : 'Chan');
                    })()}
                    onChange={handleMnemonicChange}
                    onBlur={() => updateMnemonics(index, mnemonics[index] ?? phrases[index]?.mnemonic ?? '')}
                    placeholder="Create a memory aid to help remember this word..."
                    className="neumorphic-input w-full h-24 resize-none rounded-lg"
                  />
                </div>

                {/* === Context section === */}
                <div className="p-4 space-y-2 rounded-xl bg-[#222] border border-[#333] neumorphic mb-4 text-center">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm text-blue-400 uppercase tracking-wider w-full text-center">In Context</h3>
                  </div>
                  <ClientOnly>
                    <p className="text-base text-white font-medium">
                      {randomSentence ? replaceName(getThaiWithGender(randomSentence, isMale, isPoliteMode), contextName) : "(No example available)"}
                    </p>
                    <p className="text-sm text-gray-300 italic">
                      {randomSentence ? replaceName(getGenderedPronunciation(randomSentence, isMale, isPoliteMode), contextName) : ""}
                    </p>
                    <p className="text-sm text-gray-400 italic">{randomSentence?.translation ? replaceName(randomSentence.translation, contextName) : ""}</p>
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
              </div> // This closing div might be the issue or misplaced
            )}
          </div>
        </div>
      </div>

      {/* Settings Button, Modals, Admin Button, Version Indicator */}

      {/* How It Works Modal - Updated Content */}
      {showHowItWorks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto" onClick={() => setShowHowItWorks(false)}>
          <div className="neumorphic max-w-lg w-full p-6 bg-[#1f1f1f]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#A9C4FC]">How Donkey Bridge Works</h2>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-2 text-gray-300 text-sm max-h-[70vh] overflow-y-auto pr-2">
              {/* Core Flashcard System */}
              <AccordionItem value="item-1" className="border-[#333]">
                <AccordionTrigger className="text-lg font-semibold text-[#A9C4FC] hover:no-underline py-3">
                  Flashcard System & SRS
                </AccordionTrigger>
                <AccordionContent className="pb-4 space-y-2 text-gray-300 text-sm">
                  <p>Donkey Bridge uses a Spaced Repetition System (SRS) to optimize your learning:</p>
                  <ul className="space-y-1 pl-4">
                    <li className="flex items-center gap-2"><span className="text-red-400">●</span> Wrong cards reappear quickly for immediate reinforcement</li>
                    <li className="flex items-center gap-2"><span className="text-yellow-400">●</span> Correct cards return after a moderate delay</li>
                    <li className="flex items-center gap-2"><span className="text-green-400">●</span> Easy cards are scheduled further in the future</li>
                    <li className="flex items-center gap-2"><span className="text-blue-400">●</span> The scheduling interval increases automatically the more often you get a card right</li>
                    <li className="flex items-center gap-2"><span className="text-blue-400">●</span> Each day, the system selects cards that are due for review, prioritizing difficult ones</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              {/* Card Study Features */}
              <AccordionItem value="item-2" className="border-[#333]">
                <AccordionTrigger className="text-lg font-semibold text-[#A9C4FC] hover:no-underline py-3">
                  Card Study Features
                </AccordionTrigger>
                <AccordionContent className="pb-4 space-y-3 text-gray-300 text-sm">
                  <p>Each flashcard includes multiple tools to enhance learning:</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[#A9C4FC] font-semibold min-w-[100px]">'Show Answer'</span>
                      <span className="bg-[#252525] text-blue-400 px-3 py-1 rounded text-xs">Show Answer</span>
                      <span className="text-gray-300">reveals the Thai translation, pronunciation, and examples</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#A9C4FC] font-semibold min-w-[100px]">'Show Hint'</span>
                      <span className="bg-[#252525] text-blue-400 px-3 py-1 rounded text-xs">Show Hint</span>
                      <span className="text-gray-300">displays a mnemonic aid before revealing the answer</span>
                    </div>
                    <ul className="pl-4 space-y-1 list-disc list-inside">
                      <li>Text-to-speech buttons let you hear proper Thai pronunciation</li>
                      <li>Example sentences demonstrate the vocabulary in context</li>
                      <li>Create or edit your own mnemonics to personalize your learning</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              {/* Customization Options */}
              <AccordionItem value="item-3" className="border-[#333]">
                <AccordionTrigger className="text-lg font-semibold text-[#A9C4FC] hover:no-underline py-3">
                  Customization Options
                </AccordionTrigger>
                <AccordionContent className="pb-4 space-y-3 text-gray-300 text-sm">
                  <p>Tailor the app to your preferences:</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[#A9C4FC] font-semibold min-w-[100px]">Gender Toggle</span>
                      <div className="flex items-center gap-2 bg-[#252525] px-3 py-1 rounded">
                        <span className="text-gray-400 text-xs">Female</span>
                        <div className="relative w-8 h-4 bg-gray-600 rounded-full">
                          <div className="absolute left-1 top-1 w-2 h-2 bg-pink-400 rounded-full"></div>
                        </div>
                        <span className="text-gray-400 text-xs">Male</span>
                      </div>
                      <span className="text-gray-300">Switch between male (krap) and female (ka) speech patterns</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#A9C4FC] font-semibold min-w-[100px]">Polite Mode</span>
                      <div className="flex items-center gap-2 bg-[#252525] px-3 py-1 rounded">
                        <span className="text-gray-400 text-xs">Casual</span>
                        <div className="relative w-8 h-4 bg-gray-600 rounded-full">
                          <div className="absolute left-1 top-1 w-2 h-2 bg-gray-400 rounded-full"></div>
                        </div>
                        <span className="text-gray-400 text-xs">Polite</span>
                      </div>
                      <span className="text-gray-300">Add formal particles (ครับ/ค่ะ) to phrases</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#A9C4FC] font-semibold min-w-[100px]">'Autoplay'</span>
                      <div className="flex items-center gap-2 bg-[#252525] px-3 py-1 rounded">
                        <div className="relative w-8 h-4 bg-gray-600 rounded-full">
                          <div className="absolute right-1 top-1 w-2 h-2 bg-blue-400 rounded-full"></div>
                        </div>
                        <span className="text-gray-400 text-xs">Autoplay</span>
                      </div>
                      <span className="text-gray-300">Automatically play audio when revealing answers</span>
                    </div>
                    <ul className="pl-4 space-y-1 list-disc list-inside">
                      <li>Personalize mnemonics to create your own memory aids</li>
                      <li>View your progress to track learning across all cards</li>
                      <li>Reset progress for individual cards or entire sets when needed</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              {/* Progress Tracking */}
              <AccordionItem value="item-4" className="border-[#333]">
                <AccordionTrigger className="text-lg font-semibold text-[#A9C4FC] hover:no-underline py-3">
                  Progress Tracking
                </AccordionTrigger>
                <AccordionContent className="pb-4 space-y-2 text-gray-300 text-sm">
                  <p>Monitor your learning journey:</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span>The</span>
                      <span className="text-[#A9C4FC] font-semibold">'Cards'</span>
                      <span className="inline-flex items-center justify-center bg-[#3C3C3C] p-1 rounded-xl text-[#2563EB]"><Layers className="w-4 h-4" /></span>
                      <span>view shows the status of each card</span>
                    </div>
                    <ul className="pl-4 space-y-1 list-disc list-inside">
                      <li>Cards are color-coded by status: Unseen, Wrong, Correct, or Easy</li>
                      <li>Progress bars indicate how much of a set you've learned</li>
                      <li>The system automatically prioritizes cards needing review</li>
                      <li>Your learning data is saved automatically between sessions</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              {/* Tips & Tricks */}
              <AccordionItem value="item-5" className="border-[#333]">
                <AccordionTrigger className="text-lg font-semibold text-[#A9C4FC] hover:no-underline py-3">
                  Tips for Effective Learning
                </AccordionTrigger>
                <AccordionContent className="pb-4 space-y-2 text-gray-300 text-sm">
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Study regularly - short daily sessions are better than cramming</li>
                    <li>Create personal mnemonics that are vivid and memorable</li>
                    <li>Use the context examples to understand how words are used naturally</li>
                    <li>Speak aloud with the audio to practice pronunciation</li>
                    <li>Be honest with the difficulty buttons - they optimize your learning schedule</li>
                    <li>Generate specialized sets for situations you'll actually encounter</li>
                  </ul>
                  <div className="flex items-center gap-2">
                    <span>Review previously learned cards periodically through the</span>
                    <span className="text-[#A9C4FC] font-semibold">'Cards'</span>
                    <span className="inline-flex items-center justify-center bg-[#3C3C3C] p-1 rounded-xl text-[#2563EB]"><Layers className="w-4 h-4" /></span>
                    <span>view</span>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <div className="pt-4 text-center">
                <button onClick={() => setShowHowItWorks(false)} className="neumorphic-button py-2 px-8 text-[#A9C4FC]">Got It!</button>
              </div>
            </Accordion>
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
                const { color, label } = getStatusInfo(status as CardStatus);
                
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
      {showSetWizardModal && (
        <SetWizardModal 
          onClose={() => setShowSetWizardModal(false)}
          onComplete={async (wizardState: SetWizardState) => {
            console.log('SetWizardModal onComplete fired', wizardState);
            setShowSetWizardModal(false);
            
            // Show initial toast
            toast.loading('Creating your custom set... (About 2 minutes)', {
              duration: Infinity,
              id: 'set-generation',
            });
            
            // Calculate total cards based on number of topics
            const totalTopics = [
              ...wizardState.topics,
              ...wizardState.scenarios,
              ...(wizardState.customGoal ? [wizardState.customGoal] : [])
            ].filter(Boolean).length;
            
            // Calculate cards per topic, ensuring total doesn't exceed 50
            const totalCount = Math.min(
              totalTopics === 0 ? 10 : totalTopics * 10, // 10 cards per topic, minimum 10
              50 // Maximum 50 cards total
            );
            
            // If we have more than 5 topics, reduce cards per topic to stay under 50
            const cardsPerTopic = totalTopics > 5 ? Math.floor(50 / totalTopics) : 10;
            
            console.log(`Generating set with ${totalCount} cards (${totalTopics} topics, ${cardsPerTopic} cards per topic)`);
            
            // Create preferences object for test generation
            const preferences: Omit<GeneratePromptOptions, 'count' | 'existingPhrases'> = {
              level: wizardState.proficiency.levelEstimate, // Correctly access the nested property
              specificTopics: wizardState.topics.length > 0 ? wizardState.topics.join(', ') : undefined, // Join topics array
              toneLevel: wizardState.tone,
              topicsToDiscuss: wizardState.scenarios.length > 0 ? wizardState.scenarios.join(', ') : undefined, // Join scenarios
            };
            
            console.log('SetWizard Completion: Calling /api/generate-set with preferences:', preferences, 'count:', totalCount);

            try {
              const response = await fetch('/api/generate-set', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ preferences, totalCount }),
                credentials: 'include',
              });
              const result = await response.json();
              
              console.log("[page.tsx onComplete] Full result from /api/generate-set:", JSON.stringify(result, null, 2));

              if (!response.ok) {
                throw new Error(result.error || `API request failed with status ${response.status}`);
              }

              if (result.newSetMetaData && result.newSetMetaData.id) {
                console.log("Set generated by backend with ID:", result.newSetMetaData.id);
                // Add the new set to availableSets but don't switch to it
                setAvailableSets(prev => [...prev, result.newSetMetaData]);
                
                // Update the toast to success
                toast.success('Your custom set is ready!', {
                  id: 'set-generation',
                  description: 'You can find it in "My Sets"',
                  duration: 5000,
                });
              } else {
                throw new Error('API route did not return a set ID in newSetMetaData.');
              }
            } catch (err: unknown) {
              let errorMessage = 'An unknown error occurred';
              if (typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string') {
                errorMessage = err.message;
              } else if (typeof err === 'string') {
                errorMessage = err;
              }
              console.error('Error calling API route /api/generate-set:', err);
              
              // Update the toast to error
              toast.error('Failed to generate your custom set', {
                id: 'set-generation',
                description: errorMessage,
                duration: 5000,
              });
            }
          }}
        />
      )}

      {/* --- NEW Combined Settings Modal --- */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        isMale={isMale}
        setIsMale={setIsMale}
        isPoliteMode={isPoliteMode}
        setIsPoliteMode={setIsPoliteMode}
        autoplay={autoplay}
        setAutoplay={setAutoplay}
      />
      <SetManagerModal
        isOpen={isManagementModalOpen}
        onClose={() => setIsManagementModalOpen(false)}
      />
      {/* --- End of Combined Settings Modal --- */}

      {/* Cards Modal */}
      {showCardsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={() => setShowCardsModal(false)}>
          <div className="bg-gray-900 rounded-xl p-4 max-w-md w-full max-h-[80vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl" onClick={() => setShowCardsModal(false)}>&times;</button>
            <h3 className="text-lg font-bold text-blue-300 mb-3">Cards in Set</h3>
            <div className="bg-[#1a1b26] rounded-lg overflow-hidden">
              {phrases.map((phrase, idx) => {
                const status = getCardStatus(idx);
                let color = '#6b7280';
                let label = 'Unseen';
                if (status === 'easy') { color = '#22c55e'; label = 'Easy'; }
                else if (status === 'correct') { color = '#3b82f6'; label = 'Correct'; }
                else if (status === 'wrong') { color = '#ef4444'; label = 'Wrong'; }
                else if (status === 'unseen') { color = '#6b7280'; label = 'Unseen'; }
                return (
                  <div
                    key={idx}
                    className="cursor-pointer border-b border-gray-700/50 last:border-b-0 hover:bg-[#1f2937]"
                    onClick={() => { setIndex(idx); setShowCardsModal(false); }}
                  >
                    <div className="flex p-4 items-center gap-3">
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-[15px] text-white break-words" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          wordBreak: 'break-word',
                          lineHeight: '1.4'
                        }}>
                          {phrase.english}
                        </p>
                        <p className="text-[13px] text-gray-400 mt-1 truncate">
                          {phrase.thai}
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        <div
                          className="px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap text-center"
                          style={{
                            backgroundColor: color,
                            minWidth: '80px'
                          }}
                        >
                          {label}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </main>
  );
} 
/* eslint-disable */
'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { SettingsModal } from './components/CombinedOptionsModal';
import { FolderViewEnhanced } from './components/FolderViewEnhanced';
import { calculateNextReview } from './lib/srs';
import { Volume2 } from 'lucide-react';
import { SetWizardModal } from '../components/SetWizard/SetWizardModal';
import { SetWizardState } from '../components/SetWizard/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/dialog';
import { X, ChevronRight, ChevronLeft, CheckCircle, Info, Bookmark, PlayCircle, Grid, Layers, Plus, Settings, HelpCircle, GalleryHorizontal, Lightbulb, RotateCcw, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getToneLabel } from '@/app/lib/utils'; // Import getToneLabel
import { HowItWorksModal } from './components/modals/HowItWorksModal';
import TipJar from './components/TipJar';
// PassiveLearning removed per request
import { ProgressModal } from './components/modals/ProgressModal';
import { CardsListModal } from './components/modals/CardsListModal';
import { BreakdownModal } from './components/modals/BreakdownModal';
import { useAuth } from '@clerk/nextjs';
import { PhraseBreakdown, getCachedBreakdown, setCachedBreakdown } from './lib/word-breakdown';
import Confetti from './components/Confetti';
import { useSetCompletion } from './hooks/useSetCompletion';
import { useAudioGeneration } from './context/AudioGenerationContext';
import { AudioReadyModal } from './components/AudioReadyModal';
import { GuidedTour, shouldAutoStartTour, markTourSeen } from './components/GuidedTour';
import { usePreloader } from './context/PreloaderContext';

// Type for phrases with literal translation
interface PhraseWithLiteral extends Phrase {
  literal?: string;
}

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
  // Replace ambiguous pronouns with gendered ones - handle all variations
  basePronunciation = basePronunciation.replace(/phom\/chan|chan\/phom/gi, isMale ? 'phom' : 'chan');
  basePronunciation = basePronunciation.replace(/pǒm\/chǎn|chǎn\/pǒm/gi, isMale ? 'pǒm' : 'chǎn');
  basePronunciation = basePronunciation.replace(/pom\/chan|chan\/pom/gi, isMale ? 'pom' : 'chan');

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
  userMnemonics: {[setId: string]: {[phraseId: string]: string}};
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
          <h2 className="text-2xl font-bold text-[#E0E0E0]">Create Your Custom Set</h2>
          <button
            onClick={onClose}
            className="text-[#BDBDBD] hover:text-[#E0E0E0] text-2xl leading-none"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        <div className="text-[#E0E0E0]">
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
    setAvailableSets,
  } = useSet();
  
  const audioGeneration = useAudioGeneration();
  const { isLoading } = usePreloader();
  
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
  const [showBreakdown, setShowBreakdown] = useState(false); // Changed back to false for modal
  const [wordBreakdowns, setWordBreakdowns] = useState<Record<string, PhraseBreakdown>>({});
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [loadingNewMnemonic, setLoadingNewMnemonic] = useState(false);
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
  // Change mnemonic state to be per-set
  const [mnemonics, setMnemonics] = useState<{[setId: string]: {[phraseId: string]: string}}>({});
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
  const [isTourOpen, setIsTourOpen] = useState(false);

  // === Reintroduced state variables to fix missing identifier errors ===
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showSetWizardModal, setShowSetWizardModal] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState<boolean>(false);
  const [targetFolderName, setTargetFolderName] = useState<string | undefined>(undefined);
  const [tutorialStep, setTutorialStep] = useState<number>(0);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [totalDueToday, setTotalDueToday] = useState<number>(0);
  const [reviewsCompletedToday, setReviewsCompletedToday] = useState<number>(0);
  const [highlightSetId, setHighlightSetId] = useState<string | null>(null);
  // === End reintroduced state variables ===

  // Check for folder to open from localStorage (for imports)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const openFolder = localStorage.getItem('openFolder');
      const highlightSetIdFromStorage = localStorage.getItem('highlightSetId');
      
      if (openFolder) {
        setTargetFolderName(openFolder);
        setIsManagementModalOpen(true);
        localStorage.removeItem('openFolder');
      }
      
      if (highlightSetIdFromStorage) {
        setHighlightSetId(highlightSetIdFromStorage);
        localStorage.removeItem('highlightSetId');
      }
    }
  }, []);

  // --- NEW: Ref for dark mode timeout ---
  const darkModeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add ref to track previous showAnswer state - RESTORED
  const prevShowAnswerRef = React.useRef(false);
  // Add refs to track previous gender and politeness values
  const prevIsMaleRef = React.useRef(isMale);
  const prevIsPoliteRef = React.useRef(isPoliteMode);
  // Add a ref for the card back
  const cardBackRef = useRef<HTMLDivElement>(null);
  
  // Confetti and completion state
  const [showConfetti, setShowConfetti] = useState(false);
  const { isSetCompleted } = useSetCompletion(phrases, activeSetProgress);

  console.log("ThaiFlashcards: Component rendering/re-rendering. randomSentence:", randomSentence); // DEBUG

  // Load voices when component mounts
  useEffect(() => {
    // Auto-start tour for new/non-logged users, but only after loading is complete
    if (isLoading) return; // Don't start tour while loading
    
    const id = setTimeout(() => {
      try {
        if (shouldAutoStartTour()) {
          setIsTourOpen(true);
          markTourSeen();
        }
      } catch {}
    }, 300); // slight delay to ensure DOM is ready
    return () => clearTimeout(id);
  }, [isLoading]); // Add isLoading as dependency

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
  const speak = useCallback(async (text: string, isWord: boolean = true, isMale: boolean, rate?: number) => {
    if (isWord) setIsPlayingWord(true); else setIsPlayingContext(true);
    try {
      await ttsService.speak({
        text,
        genderValue: isMale,
        rate,
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
  }, [setIsPlayingWord, setIsPlayingContext]); // Dependencies for useCallback

  // Auto-play useEffect - handles both initial card flip and gender/politeness changes
  useEffect(() => {
    // Only play if card is showing and audio is not already playing
    if (showAnswer && voicesLoaded && !isPlayingWord && !isPlayingContext && phrases[index]) {
      // Check if this is initial card flip (autoplay enabled)
      const isInitialFlip = autoplay && !prevShowAnswerRef.current;
      
      // Check if this is a gender or politeness change (card was already showing AND values changed)
      const isGenderChange = prevShowAnswerRef.current && prevIsMaleRef.current !== isMale;
      const isPolitenessChange = prevShowAnswerRef.current && prevIsPoliteRef.current !== isPoliteMode;
      const isGenderOrPolitenessChange = isGenderChange || isPolitenessChange;
      
      if (isInitialFlip || isGenderOrPolitenessChange) {
        speak(getThaiWithGender(phrases[index], isMale, isPoliteMode), true, isMale);
      }
    }
    
    // Update refs
    prevShowAnswerRef.current = showAnswer;
    prevIsMaleRef.current = isMale;
    prevIsPoliteRef.current = isPoliteMode;
  }, [showAnswer, autoplay, phrases, index, isPlayingWord, isPlayingContext, voicesLoaded, isMale, isPoliteMode]);

  // Respond to tour step events to flip demo card
  useEffect(() => {
    const toBack = () => setShowAnswer(true);
    const toFront = () => setShowAnswer(false);
    window.addEventListener('db_tour_show_back', toBack);
    window.addEventListener('db_tour_show_front', toFront);
    return () => {
      window.removeEventListener('db_tour_show_back', toBack);
      window.removeEventListener('db_tour_show_front', toFront);
    };
  }, []);

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
  
  // Auto-load breakdown when card is shown
  useEffect(() => {
    if (showAnswer && phrases[index]) {
      const thai = getThaiWithGender(phrases[index], isMale, isPoliteMode);
      const pronunciation = getGenderedPronunciation(phrases[index], isMale, isPoliteMode);
      const cacheKey = `${thai}_${pronunciation}`;
      
      // Only fetch if not already cached
      if (!wordBreakdowns[cacheKey]) {
        fetchWordBreakdown(phrases[index]);
      }
    }
  }, [showAnswer, index, phrases, isMale, isPoliteMode]);
  


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

  // Add auth hook
  const { userId } = useAuth();

  // Update mnemonic loading to use API for logged-in users
  useEffect(() => {
    const loadMnemonics = async () => {
      if (userId) {
        // Load from database for logged-in users
        try {
          const response = await fetch('/api/user-mnemonics', {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            setMnemonics(data);
          }
        } catch (error) {
          console.error('Error loading mnemonics from API:', error);
        }
      } else {
        // Load from localStorage for guests
        const savedMnemonics = localStorage.getItem('mnemonics-v2');
        if (savedMnemonics) {
          try {
            setMnemonics(JSON.parse(savedMnemonics));
          } catch (error) {
            console.error('Error loading mnemonics:', error);
          }
        }
      }
    };

    loadMnemonics();
  }, [userId]);

  // Clear bad "check bin" mnemonics after loading
  useEffect(() => {
    if (Object.keys(mnemonics).length > 0) {
      let modified = false;
      const cleaned = { ...mnemonics };
      
      // Check all default sets
      Object.keys(cleaned).forEach(setId => {
        if (setId.startsWith('default-') && cleaned[setId]) {
          Object.keys(cleaned[setId]).forEach(phraseIndex => {
            if (cleaned[setId][phraseIndex]?.includes('check bin')) {
              delete cleaned[setId][phraseIndex];
              modified = true;
              console.log(`Clearing bad "check bin" mnemonic for set ${setId}, phrase ${phraseIndex}`);
            }
          });
        }
      });
      
      if (modified) {
        setMnemonics(cleaned);
        
        // Also update localStorage if not logged in
        if (!userId) {
          localStorage.setItem('mnemonics-v2', JSON.stringify(cleaned));
        }
        
        // Call API to clear from database if logged in
        if (userId) {
          fetch('/api/clear-bad-mnemonic', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
              if (data.deletedCount > 0) {
                console.log(`Cleared ${data.deletedCount} bad mnemonics from database`);
              }
            })
            .catch(err => console.error('Error calling clear API:', err));
        }
      }
    }
  }, [mnemonics, userId]);

  // Force reset the bill set if it contains old data
  useEffect(() => {
    if (activeSetId === 'default-common-sentences-2' && phrases.length > 0) {
      // Check if we have the old "check bin" mnemonic in the current data
      const billPhrase = phrases.find(p => p.english === "Can I have the bill?");
      console.log('Bill phrase check:', {
        found: !!billPhrase,
        mnemonic: billPhrase?.mnemonic,
        hasCheckBin: billPhrase?.mnemonic?.includes('check bin')
      });
      
      if (billPhrase && billPhrase.mnemonic?.includes('check bin')) {
        console.log('Detected old cached data for bill set - forcing reset');
        
        // First debug what's happening
        fetch('/api/debug-bill-set')
          .then(res => res.json())
          .then(debug => {
            console.log('Debug info:', debug);
          });
        
        // Call API to force reset
        fetch('/api/force-reset-bill-set', { method: 'POST' })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              console.log('Force reset successful - reloading set');
              console.log('Fresh content from API:', data.freshContent?.find((p: any) => p.english === "Can I have the bill?"));
              // Force reload the set
              refreshSets().then(() => {
                switchSet('default-common-sentences-2');
              });
            }
          })
          .catch(err => console.error('Error forcing reset:', err));
      }
    }
  }, [activeSetId, phrases, refreshSets, switchSet]);

  // Function to update mnemonics - now syncs to database for logged-in users
  const updateMnemonics = async (phraseIndex: number, newMnemonic: string) => {
    if (!activeSetId || phraseIndex === undefined) return;
    
    const phraseKey = `${phraseIndex}`;
    const updated = {
      ...mnemonics,
      [activeSetId]: {
        ...(mnemonics[activeSetId] || {}),
        [phraseKey]: newMnemonic
      }
    };
    setMnemonics(updated);
    
    if (userId) {
      // Save to database for logged-in users
      try {
        await fetch('/api/user-mnemonics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            setId: activeSetId,
            phraseIndex: phraseIndex,
            mnemonic: newMnemonic
          }),
          credentials: 'include'
        });
      } catch (error) {
        console.error('Error saving mnemonic to API:', error);
      }
    } else {
      // Save to localStorage for guests
      localStorage.setItem('mnemonics-v2', JSON.stringify(updated));
    }
  };

  const resetCurrentMnemonic = async () => {
    if (!activeSetId) return;
    
    const phraseKey = `${index}`;
    const updated = { ...mnemonics };
    if (updated[activeSetId]) {
      delete updated[activeSetId][phraseKey];
      if (Object.keys(updated[activeSetId]).length === 0) {
        delete updated[activeSetId];
      }
    }
    setMnemonics(updated);
    
    if (userId) {
      // Delete from database for logged-in users
      try {
        await fetch(`/api/user-mnemonics?setId=${activeSetId}&phraseIndex=${index}`, {
          method: 'DELETE',
          credentials: 'include'
        });
      } catch (error) {
        console.error('Error deleting mnemonic from API:', error);
      }
    } else {
      // Save to localStorage for guests
      localStorage.setItem('mnemonics-v2', JSON.stringify(updated));
    }
  };

  const handleMnemonicChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!activeSetId) return;
    
    const phraseKey = `${index}`;
    setMnemonics(prev => ({
      ...prev,
      [activeSetId]: {
        ...(prev[activeSetId] || {}),
        [phraseKey]: e.target.value
      }
    }));
  };

  // Function to reset all progress and mnemonics
  const resetAllProgress = async () => {
    if (confirm('Are you sure you want to reset all progress AND mnemonics? This cannot be undone.')) {
      updateSetProgress({}); 
      setMnemonics({});
      
      if (userId && activeSetId) {
        // Delete all mnemonics for this set from database
        try {
          await fetch(`/api/user-mnemonics?setId=${activeSetId}`, {
            method: 'DELETE',
            credentials: 'include'
          });
        } catch (error) {
          console.error('Error deleting all mnemonics from API:', error);
        }
      } else {
        // Remove from localStorage for guests
        localStorage.removeItem('mnemonics-v2');
      }
      
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
        return { color: 'bg-[#3C3C3C] text-[#BDBDBD]', label: 'Unseen' };
      case 'wrong': // Changed from 'hard' to match getCardStatus output
        return { color: 'bg-red-600 text-white', label: 'Wrong' };
      case 'due': // Added case for 'due'
        return { color: 'bg-blue-500 text-white', label: 'Due' };
      case 'reviewed': // Changed from 'easy'/'good' to 'reviewed'
        return { color: 'bg-green-500 text-white', label: 'Learned' }; // Label it 'Learned' for simplicity
      default:
        console.warn(`getStatusInfo: Unknown status '${status}'`);
        return { color: 'bg-[#3C3C3C] text-[#BDBDBD]', label: 'Unknown' }; // Default fallback
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

  // Function to fetch word breakdown
  const fetchWordBreakdown = async (phrase: Phrase) => {
    const thai = getThaiWithGender(phrase, isMale, isPoliteMode);
    const pronunciation = getGenderedPronunciation(phrase, isMale, isPoliteMode);
    const cacheKey = `${thai}_${pronunciation}`;
    
    // Check cache first
    const cached = wordBreakdowns[cacheKey] || getCachedBreakdown(thai);
    if (cached) {
      setWordBreakdowns(prev => ({ ...prev, [cacheKey]: cached }));
      return;
    }
    
    setLoadingBreakdown(true);
    try {
      const response = await fetch('/api/word-breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thai,
          pronunciation,
          english: phrase.english
        })
      });
      
      if (response.ok) {
        const { breakdown } = await response.json();
        setWordBreakdowns(prev => ({ ...prev, [cacheKey]: breakdown }));
        setCachedBreakdown(thai, breakdown);
      }
    } catch (error) {
      console.error('Failed to fetch word breakdown:', error);
    }
    setLoadingBreakdown(false);
  };
  
  // Function to handle card review actions (difficulty buttons)
  // --- Simplified version without external sm2 function --- 
  const handleCardAction = (difficulty: 'easy' | 'good' | 'hard') => {
    const updated = calculateNextReview(activeSetProgress[index], difficulty);
    const newProgress = {
      ...activeSetProgress,
      [index]: updated,
    };
    
    // Update progress first
    updateSetProgress(newProgress);
    
    // Check if set just became completed
    if (difficulty === 'easy') {
      // Check if all cards are now easy
      let allEasy = true;
      for (let i = 0; i < phrases.length; i++) {
        const progress = i === index ? updated : newProgress[i];
        if (!progress || progress.difficulty !== 'easy') {
          allEasy = false;
          break;
        }
      }
      if (allEasy) {
        console.log('🎉 Set completed! All cards marked as easy');
        // Delay confetti slightly to ensure state update
        setTimeout(() => {
          setShowConfetti(true);
        }, 100);
      }
    }

    // Move to next card
    const nextActiveIndex = (activeCardsIndex + 1) % activeCards.length;
    setActiveCardsIndex(nextActiveIndex);
    if (activeCards.length > 0) {
      setIndex(activeCards[nextActiveIndex]);
    } else {
      setIndex(0); // Fallback
    }

    // Go back to the front of the next card
    handleHideAnswer();
  };

  // Load mnemonics from localStorage
  // useEffect(() => {
  //   const savedMnemonics = localStorage.getItem('mnemonics');
  //   if (savedMnemonics) {
  //     try {
  //       setMnemonics(JSON.parse(savedMnemonics));
  //     } catch (error) {
  //       console.error('Error loading mnemonics:', error);
  //     }
  //   }
  // }, []);

  // Function to generate a new mnemonic for the current card
  const generateNewMnemonic = async () => {
    if (!phrases[index]) return;
    
    setLoadingNewMnemonic(true);
    try {
      const currentPhrase = phrases[index];
      const response = await fetch('/api/generate-mnemonic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          english: currentPhrase.english,
          thai: currentPhrase.thai,
          pronunciation: currentPhrase.pronunciation
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to generate new mnemonic');
      }

      const data = await response.json();
      const newMnemonic = data.mnemonic;

      // Update the mnemonic in state
      const newMnemonics = { ...mnemonics };
      if (!newMnemonics[activeSetId || 'default']) {
        newMnemonics[activeSetId || 'default'] = {};
      }
      newMnemonics[activeSetId || 'default'][`${index}`] = newMnemonic;
      setMnemonics(newMnemonics);

      // Save to database or localStorage
      if (userId && activeSetId) {
        try {
          await fetch('/api/user-mnemonics', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              setId: activeSetId,
              phraseIndex: index,
              mnemonic: newMnemonic
            }),
            credentials: 'include'
          });
        } catch (error) {
          console.error('Error saving mnemonic to API:', error);
        }
      } else {
        localStorage.setItem('mnemonics-v2', JSON.stringify(newMnemonics));
      }

      toast.success('New mnemonic generated!');
    } catch (error) {
      console.error('Error generating new mnemonic:', error);
      toast.error('Failed to generate new mnemonic. The service may be temporarily unavailable - please try again in a moment.');
    } finally {
      setLoadingNewMnemonic(false);
    }
  };

  // Function to reset current card
  const resetCard = async () => {
    // Remove card progress
    const newCardProgress = { ...activeSetProgress };
    delete newCardProgress[index];
    updateSetProgress(newCardProgress);
    
    // Clear mnemonic for this card
    const newMnemonics = { ...mnemonics };
    if (activeSetId && newMnemonics[activeSetId]) {
      delete newMnemonics[activeSetId][`${index}`];
      if (Object.keys(newMnemonics[activeSetId]).length === 0) {
        delete newMnemonics[activeSetId];
      }
    }
    setMnemonics(newMnemonics);
    
    if (userId && activeSetId) {
      // Delete from database for logged-in users
      try {
        await fetch(`/api/user-mnemonics?setId=${activeSetId}&phraseIndex=${index}`, {
          method: 'DELETE',
          credentials: 'include'
        });
      } catch (error) {
        console.error('Error deleting mnemonic from API:', error);
      }
    } else {
      // Save to localStorage for guests
      localStorage.setItem('mnemonics-v2', JSON.stringify(newMnemonics));
    }
    
    // Reset the card
    setShowAnswer(false);
    setRandomSentence(null);
    setShowMnemonicHint(false); // Hide hint
    setShowBreakdown(false); // Hide word breakdown
    
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
              source: 'import' as const,
              seriousnessLevel: importedData.seriousnessLevel ?? null, // Add default
              toneLevel: importedData.seriousnessLevel !== null && importedData.seriousnessLevel !== undefined ? getToneLabel(importedData.seriousnessLevel) : null // Add derived default
            };
            
            // Add the set using context
            const newSetId = await addSet(setData, importedData.phrases as GeneratorPhrase[]);
            
            // Reset UI State
            setIndex(0); 
            setActiveCardsIndex(0);
            setShowAnswer(false);
            setRandomSentence(null);
            setShowMnemonicHint(false); // Hide hint
            
            toast.success(`Successfully imported "${setData.name}" with ${importedData.phrases.length} phrases.`, {
              duration: 5000
            });
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error(`Import failed: ${message}`, {
              duration: 5000
            });
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

  // When new set content is available, check if a specific card was requested via Preview
  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('activeCardIndex') : null;
      if (stored !== null) {
        const raw = parseInt(stored, 10);
        const maxIndex = Math.max(0, (phrases?.length || 1) - 1);
        const target = Number.isFinite(raw) ? Math.min(Math.max(0, raw), maxIndex) : 0;
        setIndex(target);
        setShowAnswer(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('activeCardIndex');
        }
      }
    } catch {
      // ignore
    }
  }, [phrases, activeSetId]);

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
    setRandomSentence(null); // Reset example sentence

    // Scroll the card back into view
    setTimeout(() => {
      cardBackRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' // Changed from 'center' to 'start' for better positioning
      });
    }, 150); // Delay slightly for rendering
    if (tutorialStep === 2) {
      handleTutorialNext();
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
    toast(`Starting test generation... this might take a minute.`, {
      duration: 10000 // Show for 10 seconds
    }); // User feedback

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
        toast.success('Test set generated and saved successfully!', {
          duration: 5000
        });
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
      toast.error(`Error generating test set: ${errorMessage}`, {
        duration: 5000
      });
    } 
  }, [addSet, refreshSets, switchSet]); // Added addSet to dependencies

  // Need a handler for when going back to the front
  const handleHideAnswer = () => {
    setShowAnswer(false);
    setShowMnemonicHint(false); // Hide mnemonic hint on front
    setShowBreakdown(false); // Hide word breakdown
    // Optionally scroll to top or card top if needed
    // window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <main className="min-h-screen bg-[#1a1a1a] flex flex-col">
      {/* Guided Tour */}
      <GuidedTour isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
      {/* Render the new FlashcardHeader component - Removed setShowProgress & showAnswer */}
      <FlashcardHeader
        setShowHowItWorks={setShowHowItWorks}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenCards={() => setShowCardsModal(true)}
        onOpenSetManager={() => setIsManagementModalOpen(true)}
        onOpenSetWizard={() => {
          try {
            // If Clerk is available, require sign-in; otherwise fallback to showing and backend will 401
            // We import useAuth above. We'll check last known state via localStorage token presence as lightweight guard.
            const hasClerkSession = typeof window !== 'undefined' && !!document.cookie.match(/__session=/);
            if (!hasClerkSession) {
              toast.error('Please sign in to create a custom set.');
              return;
            }
          } catch {}
          setShowSetWizardModal(true)
        }}
      />

      {/* Show testGenResult for debugging - Refined conditional and type guards */}
      {typeof testGenResult === 'object' && testGenResult !== null && (
        <div className="max-w-2xl mx-auto bg-[#2C2C2C] text-[#E0E0E0] p-4 mt-4 rounded shadow overflow-x-auto text-xs">
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
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
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
              <div className="p-6 flex flex-col items-center justify-center min-h-[20rem]" data-tour="card-front"> {/* Ensure min height */} 
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
                    <div className="text-sm text-[#BDBDBD] p-2 border border-[#404040] rounded bg-[#2C2C2C] max-h-24 overflow-y-auto">
                      {((): React.ReactNode => { // Immediately invoked function expression (IIFE) to allow logging
                        const userMnemonic = activeSetId ? mnemonics[activeSetId]?.[`${index}`] : undefined;
                        const defaultMnemonic = phrases[index]?.mnemonic;
                        const hintToShow = userMnemonic ?? defaultMnemonic ?? 'No hint available';
                        console.log(`Hint computation: userMnemonic="${userMnemonic}", defaultMnemonic="${defaultMnemonic}", hintToShow="${hintToShow}"`);
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
                  <PopoverContent className="w-80 bg-[#2C2C2C] text-white border-[#404040]" side="bottom">
                    <div className="grid gap-4 p-4">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none text-blue-400">2. Reveal the Answer</h4>
                        <p className="text-sm text-[#BDBDBD]">
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
                data-tour="card-back"
              > 
                {/* Main Phrase Section - Centered */}
                <div className="flex flex-col items-center justify-center mb-4">
                  <div className="text-center">
                    {/* Thai word */}
                    <div data-tour="back-thai" className="text-3xl md:text-4xl font-extrabold mb-2 text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
                      {getThaiWithGender(phrases[index], isMale, isPoliteMode)}
                    </div>
                    {/* Pronunciation text display (framed and prominent) */}
                    <div data-tour="back-pronunciation" className="text-center mb-3">
                      <div className="text-xl md:text-2xl font-semibold text-[#E0E0E0] px-4 py-2 bg-[#0f172a] rounded-lg inline-block">
                        {getGenderedPronunciation(phrases[index], isMale, isPoliteMode) || ''}
                      </div>
                    </div>
                    {/* Pronunciation buttons - Normal and Slow speed UNDER pronunciation */}
                    <div data-tour="back-audio" className="flex justify-center gap-4 mb-6">
                      {/* Normal speed button */}
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          const textToSpeak = getThaiWithGender(phrases[index], isMale, isPoliteMode);
                          speak(textToSpeak, true, isMale);
                        }}
                        disabled={isPlayingWord || isPlayingContext}
                        className="neumorphic-button text-blue-400 flex items-center gap-2 px-4 py-2 min-w-[100px]"
                        title="Play at normal speed"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Normal</span>
                      </button>
                      
                      {/* Slow speed button */}
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          const textToSpeak = getThaiWithGender(phrases[index], isMale, isPoliteMode);
                          speak(textToSpeak, true, isMale, -30); // 30% slower
                        }}
                        disabled={isPlayingWord || isPlayingContext}
                        className="neumorphic-button text-green-400 flex items-center gap-2 px-4 py-2 min-w-[100px]"
                        title="Play at slow speed"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Slow</span>
                      </button>
                    </div>
                    
                    
                    {/* English translation in blue, in parentheses */}
                    {phrases[index] && (
                      <div data-tour="back-translation" className="text-base md:text-lg font-medium mb-2 text-blue-300 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
                        ({phrases[index]?.english ?? ''})
                      </div>
                    )}
                    
                    {/* Literal/Breakdown Button */}
                    <div className="mb-4">
                      <button
                        onClick={() => setShowBreakdownModal(true)}
                        className="text-xs text-[#BDBDBD] hover:text-[#E0E0E0] underline"
                        data-tour="back-literal"
                      >
                        Literal / breakdown
                      </button>
                    </div>
                    
                    {/* Difficulty Buttons - Wrapped in Popover (Step 3) */}
                    <Popover open={tutorialStep === 3}>
                      <PopoverTrigger asChild>
                        <div data-tour="back-srs" className="flex flex-col items-center mb-8">
                          <div className="flex justify-center gap-4">
                            <button onClick={() => handleCardAction('easy')} className="neumorphic-button text-green-400 px-6 py-3 text-sm font-medium min-w-[80px]">Easy</button>
                            <button onClick={() => handleCardAction('good')} className="neumorphic-button text-yellow-400 px-6 py-3 text-sm font-medium min-w-[80px]">Correct</button>
                            <button onClick={() => handleCardAction('hard')} className="neumorphic-button text-red-400 px-6 py-3 text-sm font-medium min-w-[80px]">Wrong</button>
                          </div>
                          <div className="text-xs text-[#BDBDBD] mt-3">Hit one of the buttons to proceed.</div>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 bg-[#2C2C2C] text-white border-[#404040]" side="top" align="center">
                        <div className="grid gap-4 p-4">
                          <div className="space-y-2">
                            <h4 className="font-medium leading-none text-blue-400">3. Rate Your Recall (SRS)</h4>
                            <p className="text-sm text-[#BDBDBD]">
                              Use these buttons to tell the Spaced Repetition System how well you knew the answer. This schedules the card for future review.
                            </p>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <button onClick={handleTutorialSkip} className="text-xs text-red-400 hover:underline">Skip Tutorial</button>
                            <button onClick={handleTutorialNext} className="text-sm neumorphic-button px-3 py-1">Next</button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div> 
                
                {/* === Gender Slider and Polite Mode Toggle Section - MOVED HERE === */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-8 px-4" data-tour="back-gender">
                  {/* Gender Toggle */} 
                  <label htmlFor="gender-toggle" className="flex items-center cursor-pointer">
                    <span className="mr-3 text-sm font-medium text-[#BDBDBD]">Female (Ka)</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="gender-toggle"
                        className="sr-only"
                        checked={isMale}
                        onChange={() => setIsMale(!isMale)}
                      />
                      <div className="block bg-[#3C3C3C] w-12 h-6 rounded-full"></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${isMale ? 'translate-x-6 bg-blue-400' : 'bg-pink-400'}`}></div>
                    </div>
                    <span className="ml-3 text-sm font-medium text-[#BDBDBD]">Male (Krap)</span>
                  </label>

                  {/* Polite Mode Toggle */} 
                  <label htmlFor="polite-toggle" className="flex items-center cursor-pointer" data-tour="back-polite">
                    <span className="mr-3 text-sm font-medium text-[#BDBDBD]">Casual</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="polite-toggle"
                        className="sr-only"
                        checked={isPoliteMode}
                        onChange={() => setIsPoliteMode(!isPoliteMode)}
                      />
                      <div className="block bg-[#3C3C3C] w-12 h-6 rounded-full"></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${isPoliteMode ? 'translate-x-6 bg-green-400' : 'bg-[#BDBDBD]'}`}></div>
                    </div>
                    <span className="ml-3 text-sm font-medium text-[#BDBDBD]">Polite</span>
                  </label>
                </div> 

                {/* Mnemonic Section */} 
                <div className="mt-6" data-tour="back-mnemonic">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                    <label className="text-sm text-[#E0E0E0] font-medium flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-400" /> 
                      Mnemonic (editable)
                    </label>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={generateNewMnemonic} 
                        disabled={loadingNewMnemonic}
                        className="text-xs text-green-400 hover:text-green-300 disabled:text-[#BDBDBD] disabled:cursor-not-allowed flex items-center gap-1 px-2 py-1 rounded"
                      >
                        {loadingNewMnemonic ? (
                          <>
                            <div className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" /> Get New
                          </>
                        )}
                      </button>
                      <button 
                        onClick={resetCurrentMnemonic} 
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 px-2 py-1 rounded"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                    </div>
                  </div>
                  
                  {/* Secondary pronunciation removed; rely on main line above */}
                  
                  <textarea
                    value={(() => {
                      let rawMnemonic = activeSetId ? (mnemonics[activeSetId]?.[`${index}`] ?? phrases[index]?.mnemonic ?? '') : (phrases[index]?.mnemonic ?? '');
                      
                      // Check if this is an old word breakdown mnemonic (contains + or =) or the known bad "check bin" mnemonic
                      if (activeSetId?.startsWith('default-') && 
                          (rawMnemonic.includes(' + ') || 
                           rawMnemonic.includes(' = ') ||
                           rawMnemonic.includes('check bin'))) {
                        // Use the updated default mnemonic instead
                        rawMnemonic = phrases[index]?.mnemonic ?? '';
                      }
                      
                      // Replace Phom/Chan or Chan/Phom with correct gendered pronoun
                      return rawMnemonic.replace(/Phom\/Chan|Chan\/Phom/gi, isMale ? 'Phom' : 'Chan');
                    })()}
                    onChange={handleMnemonicChange}
                    onBlur={() => {
                      let rawMnemonic = activeSetId ? (mnemonics[activeSetId]?.[`${index}`] ?? phrases[index]?.mnemonic ?? '') : (phrases[index]?.mnemonic ?? '');
                      
                      // Check if this is an old word breakdown mnemonic (contains + or =) or the known bad "check bin" mnemonic
                      if (activeSetId?.startsWith('default-') && 
                          (rawMnemonic.includes(' + ') || 
                           rawMnemonic.includes(' = ') ||
                           rawMnemonic.includes('check bin'))) {
                        // Use the updated default mnemonic instead
                        rawMnemonic = phrases[index]?.mnemonic ?? '';
                      }
                      
                      updateMnemonics(index, rawMnemonic);
                    }}
                    placeholder="Create a memory aid to help remember this word..."
                    className="neumorphic-input w-full h-24 resize-none rounded-lg"
                  />
                </div>

                {/* === Context section (Speech bubble) === */}
                <div className="relative p-4 space-y-2 rounded-2xl bg-[#222] border border-[#333] neumorphic mb-6 text-center" data-tour="back-context">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm text-blue-400 uppercase tracking-wider w-full text-center">In Context</h3>
                  </div>
                  <ClientOnly>
                    <p className="text-base text-white font-medium">
                      {randomSentence ? replaceName(getThaiWithGender(randomSentence, isMale, isPoliteMode), contextName) : "(No example available)"}
                    </p>
                    <p className="text-base text-[#BDBDBD] italic">
                      {randomSentence ? replaceName(getGenderedPronunciation(randomSentence, isMale, isPoliteMode), contextName) : ""}
                    </p>
                    <p className="text-sm text-[#BDBDBD] italic">{randomSentence?.translation ? replaceName(randomSentence.translation, contextName) : ""}</p>
                  </ClientOnly>
                  {/* Speech bubble tail */}
                  <div className="absolute left-8 -bottom-3 w-0 h-0" style={{ borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '10px solid #222' }} />
                  <div className="flex items-center justify-center gap-3 mt-4" data-tour="back-context-controls">
                    <button 
                          onClick={() => generateRandomPhrase('prev')}
                          className="neumorphic-button text-blue-400 px-4 py-2 min-w-[70px]"
                          aria-label="Previous example"
                    >
                          Prev
                    </button>
                    <button 
                          onClick={(event) => {
                            event.stopPropagation();
                            if (randomSentence) {
                              const textToSpeak = getThaiWithGender(randomSentence, isMale, isPoliteMode);
                              console.log("Play Context - Text to Speak:", textToSpeak);
                              speak(textToSpeak, false, isMale); // Normal speed for context
                            }
                          }}
                          disabled={isPlayingWord || isPlayingContext || !randomSentence}
                          className="neumorphic-button text-blue-400 px-4 py-2 min-w-[120px]"
                    >
                          {isPlayingContext ? 'Playing...' : 'Play Context'}
                    </button>
                    <button 
                          onClick={() => generateRandomPhrase('next')}
                          className="neumorphic-button text-blue-400 px-4 py-2 min-w-[70px]"
                          aria-label="Next example"
                    >
                          Next
                    </button>
                  </div>
                </div> {/* End Context Section */}
                

              </div>
            )}
          </div>
        </div>
      </div>



      {/* Settings Button, Modals, Admin Button, Version Indicator */}

      {/* How It Works Modal - Updated Content */}
      <HowItWorksModal 
        isOpen={showHowItWorks} 
        onClose={() => setShowHowItWorks(false)} 
      />

      {/* Passive Learning removed per request */}
      <ProgressModal 
        isOpen={showProgress}
        onClose={() => setShowProgress(false)}
        phrases={phrases}
        activeSetProgress={activeSetProgress}
        currentIndex={index}
        onSelectCard={(i) => {
          setIndex(i);
          setShowProgress(false);
          setShowAnswer(true);
          setRandomSentence(null);
        }}
        getCardStatus={getCardStatus}
        getStatusInfo={getStatusInfo}
      />

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
          isOpen={showSetWizardModal}
          onClose={() => setShowSetWizardModal(false)}
          onComplete={async (newSetId: string) => {
            console.log('SetWizardModal onComplete fired, new set:', newSetId);
            if (newSetId) {
              setHighlightSetId(newSetId);
              
              // Determine the folder based on the set
              const set = availableSets.find(s => s.id === newSetId);
              if (set) {
                if (set.source === 'manual') {
                  setTargetFolderName('My Manual Sets');
                } else if (set.source === 'generated' || set.source === 'auto') {
                  setTargetFolderName('My Automatic Sets');
                }
              }
              
              // Open My Sets modal to show the new set
              setIsManagementModalOpen(true);
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
      <FolderViewEnhanced
        isOpen={isManagementModalOpen}
        onClose={() => {
          setIsManagementModalOpen(false);
          setHighlightSetId(null); // Clear highlight when closing
          setTargetFolderName(undefined);
        }}
        highlightSetId={highlightSetId}
        initialFolderName={targetFolderName}
      />
      {/* --- End of Combined Settings Modal --- */}

      {/* Cards Modal */}
      <CardsListModal 
        isOpen={showCardsModal}
        onClose={() => setShowCardsModal(false)}
        phrases={phrases}
        onSelectCard={(idx) => {
          setIndex(idx);
          setShowAnswer(false); // Ensure the selected card shows the front
          setRandomSentence(null); // Clear any back-side context state
          setShowCardsModal(false); // Close the modal immediately
        }}
        getCardStatus={getCardStatus}
        isMale={isMale}
      />

      {/* Tip Jar moved to header - removed bottom section */}

      {/* Confetti celebration */}
      <Confetti 
        trigger={showConfetti} 
        onComplete={() => setShowConfetti(false)}
      />
      
      {/* Breakdown Modal */}
      <BreakdownModal
        isOpen={showBreakdownModal}
        onClose={() => setShowBreakdownModal(false)}
        breakdown={(() => {
          if (!phrases[index]) return null;
          const thai = getThaiWithGender(phrases[index], isMale, isPoliteMode);
          const pronunciation = getGenderedPronunciation(phrases[index], isMale, isPoliteMode);
          const cacheKey = `${thai}_${pronunciation}`;
          return wordBreakdowns[cacheKey] || null;
        })()}
        literal={(phrases[index] as PhraseWithLiteral)?.literal || null}
        isLoading={loadingBreakdown}
      />
      
      {/* Audio Ready Modal */}
      <AudioReadyModal
        isOpen={audioGeneration.state.audioUrl !== null && !audioGeneration.state.isGenerating}
        onClose={() => audioGeneration.clearAudio()}
      />
    </main>
  );
} 
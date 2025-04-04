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

// Restore getThaiWithGender to handle both gender (slider value) and politeness
const getThaiWithGender = (phrase: Phrase | ExampleSentence | null, genderValue: number, isPoliteMode: boolean): string => {
  if (!phrase) return '';
  const isTextMale = genderValue >= 50; // Determine text gender based on slider midpoint

  // Step 1: Select the correct base phrase including gender-specific pronouns if available
  let baseThai = phrase.thai; // Default to base
  if (isTextMale && phrase.thaiMasculine) {
      baseThai = phrase.thaiMasculine;
  } else if (!isTextMale && phrase.thaiFeminine) {
      baseThai = phrase.thaiFeminine;
  }

  // Step 2: Apply politeness particle logic based on toggle
  if (!isPoliteMode) {
    return baseThai; // Return potentially gendered base if polite mode off
  }

  // Polite Mode ON: Check if adding krap/ka is appropriate
  const politeEndingsToAvoid = [
    'ไหม', 'อะไร', 'ไหน', 'เท่าไหร่', 'เหรอ',
    'หรือ', 'ใช่ไหม', 'เมื่อไหร่', 'ทำไม', 'อย่างไร',
    'ที่ไหน', 'ครับ', 'ค่ะ'
  ];

  const endsWithPoliteEnding = politeEndingsToAvoid.some(ending => baseThai.endsWith(ending));

  if (!endsWithPoliteEnding) {
    return isTextMale ? `${baseThai}ครับ` : `${baseThai}ค่ะ`; // Use isTextMale for particle
  }

  return baseThai; // Return base (potentially gendered) if polite mode ON but ending found
};

// Restore getGenderedPronunciation to handle both gender (slider value) and politeness
const getGenderedPronunciation = (
  phraseData: Phrase | ExampleSentence | null,
  genderValue: number,
  isPoliteMode: boolean
): string => {
  if (!phraseData) return '';
  const isTextMale = genderValue >= 50; // Determine text gender based on slider midpoint

  let basePronunciation = phraseData.pronunciation;
  const baseThaiForEndingCheck = phraseData.thai; // Use original thai for ending check

  // Step 1: Replace gender placeholders in pronunciation
  if (basePronunciation.includes('chan/phom')) {
    basePronunciation = basePronunciation.replace('chan/phom', isTextMale ? 'phom' : 'chan');
  } else if (basePronunciation.includes('phom/chan')) {
    basePronunciation = basePronunciation.replace('phom/chan', isTextMale ? 'phom' : 'chan');
  }

  // Step 2: Apply politeness particle logic
  if (!isPoliteMode) {
    return basePronunciation;
  }

  // Polite Mode ON: Check if adding krap/ka is appropriate (based on original Thai ending)
  const politeEndingsToAvoid = [
    'ไหม', 'อะไร', 'ไหน', 'เท่าไหร่', 'เหรอ',
    'หรือ', 'ใช่ไหม', 'เมื่อไหร่', 'ทำไม', 'อย่างไร',
    'ที่ไหน', 'ครับ', 'ค่ะ'
  ];

  const endsWithPoliteEnding = politeEndingsToAvoid.some(ending => baseThaiForEndingCheck.endsWith(ending));

  if (!endsWithPoliteEnding) {
    const endsWithKrapKa = basePronunciation.endsWith(' krap') || basePronunciation.endsWith(' ka');
    if (!endsWithKrapKa) {
      return basePronunciation + (isTextMale ? " krap" : " ka"); // Use isTextMale for particle
    }
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

export default function ThaiFlashcards() {
  const [phrases] = useState<Phrase[]>(INITIAL_PHRASES);
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
  const [genderValue, setGenderValue] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('genderValue');
      // Default to 100 (Male) if not saved or invalid
      const num = saved ? parseInt(saved, 10) : 100;
      return !isNaN(num) && num >= 0 && num <= 100 ? num : 100;
    } catch {
      return 100; 
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
  const [randomSentence, setRandomSentence] = useState<ExampleSentence | null>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [mnemonics, setMnemonics] = useState<{[key: number]: string}>({});
  const [isPoliteMode, setIsPoliteMode] = useState(true);

  // Add ref to track previous showAnswer state
  const prevShowAnswerRef = React.useRef(false);

  // Track active cards position
  const [activeCardsIndex, setActiveCardsIndex] = useState<number>(0);

  // Track how many reviews completed today
  const [reviewsCompletedToday, setReviewsCompletedToday] = useState<number>(0);
  const [totalDueToday, setTotalDueToday] = useState<number>(0);

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
    localStorage.setItem('genderValue', genderValue.toString());
  }, [genderValue]);

  useEffect(() => {
    localStorage.setItem('activeCards', JSON.stringify(activeCards));
  }, [activeCards]);

  // Update the speak helper function definition in page.tsx
  const speak = async (text: string, isWord: boolean = true, genderValue: number) => {
    // Set the appropriate playing state
    if (isWord) {
      setIsPlayingWord(true);
    } else {
      setIsPlayingContext(true);
    }
    
    try {
      // Pass genderValue within the object to ttsService.speak
      await ttsService.speak({
        text,
        genderValue, // Pass it here
        onStart: () => console.log('Speech started'),
        onEnd: () => {
          console.log('Speech ended');
          if (isWord) {
            setIsPlayingWord(false);
          } else {
            setIsPlayingContext(false);
          }
        },
        onError: (error) => {
          console.error('TTS error:', error);
          if (isWord) {
            setIsPlayingWord(false);
          } else {
            setIsPlayingContext(false);
          }
        }
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
      speak(getThaiWithGender(phrases[index], genderValue, isPoliteMode), true, genderValue);
    }
    prevShowAnswerRef.current = showAnswer;
  }, [showAnswer, autoplay, phrases, index, isPlayingWord, isPlayingContext, voicesLoaded, genderValue, isPoliteMode]); // Use genderValue dependency

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

  const handleResetAll = () => {
    localStorage.clear();
    window.location.reload();
  };

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

  // Export card progress to JSON file
  const exportCardProgress = () => {
    const data = {
      cardProgress,
      mnemonics
    };
    
    const dataStr = JSON.stringify(data);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'thai-flashcards-data.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Import card progress from JSON file
  const importCardProgress = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            if (data.cardProgress) {
              setCardProgress(data.cardProgress);
              localStorage.setItem('cardProgress', JSON.stringify(data.cardProgress));
            }
            if (data.mnemonics) {
              setMnemonics(data.mnemonics);
              localStorage.setItem('mnemonics', JSON.stringify(data.mnemonics));
            }
            alert('Data imported successfully');
            // Update active cards
            updateActiveCards();
          } catch (error) {
            alert('Invalid file format');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Reset all progress
  const resetAllProgress = () => {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      setCardProgress({});
      setMnemonics({});
      localStorage.removeItem('cardProgress');
      localStorage.removeItem('mnemonics');
              setIndex(0);
      setShowAnswer(false);
      setRandomSentence(null);
      setActiveCardsIndex(0);
      updateActiveCards();
      
      alert('All progress has been reset');
    }
  };

    return (
    <main className="min-h-screen bg-[#1a1a1a] flex flex-col">
      {/* Header with app logo and navigation buttons */}
      <div className="p-4 bg-[#111] border-b border-[#333] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <img src="/images/donkey-bridge-logo.png" alt="Donkey Bridge Logo" className="h-48 w-auto" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowHowItWorks(true)} className="neumorphic-button text-xs text-blue-400">How It Works</button>
          <button onClick={() => setShowVocabulary(true)} className="neumorphic-button text-xs text-blue-400">Vocabulary</button>
          <div className="relative inline-block text-left group">
            <button className="neumorphic-button text-xs text-blue-400">Mnemonics</button>
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-[#2a2a2a] ring-1 ring-black ring-opacity-5 hidden group-hover:block">
              <div className="py-1" role="menu">
                <button onClick={() => exportCardProgress()} className="block w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-[#333]">Export All</button>
                <button onClick={() => importCardProgress()} className="block w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-[#333]">Import All</button>
                <button onClick={() => resetAllProgress()} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#333]">Reset All</button>
              </div>
            </div>
          </div>
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
                      {getThaiWithGender(phrases[index], genderValue, isPoliteMode)}
                    </div>
                    <div className="text-sm text-gray-400 italic mb-3">
                      ({getGenderedPronunciation(phrases[index], genderValue, isPoliteMode)})
                    </div>
                    {/* Play Word Button */} 
                    <div className="flex justify-center mb-4">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          const textToSpeak = getThaiWithGender(phrases[index], genderValue, isPoliteMode);
                          console.log("Play Word - Text to Speak:", textToSpeak);
                          speak(textToSpeak, true, genderValue);
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
                    <button onClick={() => resetCard()} className="text-xs text-blue-400 hover:text-blue-300">Reset</button>
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
                      {randomSentence ? getThaiWithGender(randomSentence, genderValue, isPoliteMode) : "(No example available)"}
                    </p>
                    <p className="text-sm text-gray-300 italic">
                      {randomSentence ? getGenderedPronunciation(randomSentence, genderValue, isPoliteMode) : ""}
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
                              const textToSpeak = getThaiWithGender(randomSentence, genderValue, isPoliteMode);
                              console.log("Play Context - Text to Speak:", textToSpeak);
                              speak(textToSpeak, false, genderValue);
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
                  {/* Gender Slider */} 
                  <div className="flex items-center space-x-2 w-full max-w-xs">
                    <span className="text-sm font-medium text-gray-400">Female</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={genderValue}
                      onChange={(e) => setGenderValue(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg dark:bg-gray-700"
                      style={{
                        // Calculate hue based on genderValue (0=320, 100=220)
                        accentColor: `hsl(${320 - (1.0 * genderValue)}, 80%, 60%)` 
                      }}
                      id="gender-slider"
                    />
                    <span className="text-sm font-medium text-gray-400">Male</span>
                  </div>

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

      {showStats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="neumorphic max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Settings</h2>
            <button
                onClick={() => setShowStats(false)}
                className="text-gray-400 hover:text-white"
            >
                ✕
            </button>
          </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Auto-play on reveal</span>
                <Switch checked={autoplay} onCheckedChange={setAutoplay} />
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

      {/* Version indicator at the bottom - shows changes and timestamp in Amsterdam timezone */}
      <div className="text-center p-2 text-xs text-gray-600">
        <span>v{VERSION_INFO.version} - {VERSION_INFO.changes}</span>
      </div>
    </main>
  );
} 
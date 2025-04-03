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

interface RandomSentence {
  thai: string;
  pronunciation: string;
  english: string;
}

// Get Thai word with appropriate gender marker
function getThaiWithGender(phrase: Phrase, isMale: boolean): string {
  if (isMale && phrase.thaiMasculine) {
    return phrase.thaiMasculine;
  } else if (!isMale && phrase.thaiFeminine) {
    return phrase.thaiFeminine;
  }
  return phrase.thai; // Fallback to neutral form
}

// Add helper function for gendered pronunciation
// Check if the main phrase definition includes gendered forms to decide if particle is needed
function getGenderedPronunciation(
  phraseData: Phrase | ExampleSentence | null, 
  isMale: boolean,
  mainPhraseDefinition?: Phrase // Pass the main phrase def to check its type
): string {
  if (!phraseData) return ''; // Handle null case (e.g., randomSentence initially)
  
  const basePronunciation = phraseData.pronunciation;
  
  // Determine if the *type* of phrase generally needs a particle
  // Use the main phrase definition if provided (for examples), otherwise use phraseData itself.
  const definitionToCheck = mainPhraseDefinition || (phraseData as Phrase); 
  const needsParticle = !!definitionToCheck?.thaiMasculine || !!definitionToCheck?.thaiFeminine;

  if (needsParticle) {
    // Append the correct particle if the phrase type requires it
    return basePronunciation + (isMale ? " krap" : " ka");
  } else {
    // Return only the base pronunciation if the phrase type doesn't use particles
    return basePronunciation;
  }
}

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
  const [isMale, setIsMale] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('isMale');
      return saved ? JSON.parse(saved) === true : true; // Default to male
    } catch {
      return true;
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
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [mnemonics, setMnemonics] = useState<{[key: number]: string}>({});

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
    localStorage.setItem('isMale', JSON.stringify(isMale));
  }, [isMale]);

  useEffect(() => {
    localStorage.setItem('activeCards', JSON.stringify(activeCards));
  }, [activeCards]);

  // Initialize TTS Service on component mount
  useEffect(() => {
    ttsService.initialize();
  }, []);

  // Replace the speak function with our new service
  const speak = async (text: string) => {
    setIsPlaying(true);
    
    try {
      await ttsService.speak({
        text,
        isMale,
        onStart: () => console.log('Speech started'),
        onEnd: () => {
          console.log('Speech ended');
          setIsPlaying(false);
        },
        onError: (error) => {
          console.error('TTS error:', error);
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Error calling ttsService.speak:', error);
      setIsPlaying(false);
    }
  };

  // Auto-play when answer is shown
  useEffect(() => {
    if (autoplay && showAnswer && !prevShowAnswerRef.current && !isPlaying && voicesLoaded) {
      speak(getThaiWithGender(phrases[index], isMale));
    }
    prevShowAnswerRef.current = showAnswer;
  }, [showAnswer, autoplay, phrases, index, isPlaying, voicesLoaded, isMale]);

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

  const handleMnemonicChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalMnemonics(prev => ({
        ...prev,
      [index]: e.target.value
    }));
  };

  const handleResetAll = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Add a useEffect to update random sentence when gender changes
  useEffect(() => {
    if (randomSentence) {
      // Regenerate the random sentence when gender changes
      const examples = phrases[index].examples || [];
      if (examples.length > 0) {
        // Find the example that matches the current randomSentence
        // This ensures we keep the same example but update the gender
        const currentExample = examples.find(ex => 
          ex.thai === randomSentence.thai || 
          ex.thaiMasculine === randomSentence.thai || 
          ex.thaiFeminine === randomSentence.thai
        );
        
        if (currentExample) {
          const thaiText = isMale
            ? (currentExample.thaiMasculine || currentExample.thai)
            : (currentExample.thaiFeminine || currentExample.thai);
          
          setRandomSentence({
            thai: thaiText,
            pronunciation: currentExample.pronunciation,
            english: currentExample.translation
          });
        }
      }
    }
  // Remove randomSentence from the dependency array to avoid infinite loops
  }, [isMale, phrases, index]);

  // Function to generate a random sentence
  const generateRandomPhrase = (direction: 'next' | 'prev' = 'next') => {
    try {
      const examples = phrases[index].examples || [];
      
      // If no examples, set a default sentence using the main phrase
      if (!examples || examples.length === 0) {
        console.log("No examples found for phrase", index);
        setRandomSentence({
          thai: getThaiWithGender(phrases[index], isMale),
          pronunciation: phrases[index].pronunciation,
          english: phrases[index].english
        });
        return;
      }

      // If no current random sentence, always start with the first example
      if (!randomSentence) {
        console.log("Initializing with first example");
        const firstExample = examples[0];
        const thaiText = isMale 
          ? (firstExample.thaiMasculine || firstExample.thai) 
          : (firstExample.thaiFeminine || firstExample.thai);
        
        setRandomSentence({
          thai: thaiText,
          pronunciation: firstExample.pronunciation,
          english: firstExample.translation
        });
        return;
      }

      // Find current example index
      let currentIndex = examples.findIndex(ex => 
        ex.thai === randomSentence.thai || 
        (ex.thaiMasculine && ex.thaiMasculine === randomSentence.thai) || 
        (ex.thaiFeminine && ex.thaiFeminine === randomSentence.thai)
      );

      // If current example not found, start with first example
      if (currentIndex === -1) {
        console.log("Current example not found, resetting to first example");
        const firstExample = examples[0];
        const thaiText = isMale 
          ? (firstExample.thaiMasculine || firstExample.thai) 
          : (firstExample.thaiFeminine || firstExample.thai);
        
        setRandomSentence({
          thai: thaiText,
          pronunciation: firstExample.pronunciation,
          english: firstExample.translation
        });
        return;
      }

      // Calculate next index
      let nextIndex: number;
      if (direction === 'next') {
        nextIndex = (currentIndex + 1) % examples.length;
      } else {
        nextIndex = (currentIndex - 1 + examples.length) % examples.length;
      }

      // Get the next example
      const nextExample = examples[nextIndex];
      const thaiText = isMale 
        ? (nextExample.thaiMasculine || nextExample.thai) 
        : (nextExample.thaiFeminine || nextExample.thai);
      
      setRandomSentence({
        thai: thaiText,
        pronunciation: nextExample.pronunciation,
        english: nextExample.translation
      });
    } catch (error) {
      console.error('Error in generateRandomPhrase:', error);
      // Fallback to main phrase if there's an error
      setRandomSentence({
        thai: getThaiWithGender(phrases[index], isMale),
        pronunciation: phrases[index].pronunciation,
        english: phrases[index].english
      });
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

  // Add a cancel function to stop speech when needed
  const handleStop = () => {
    console.log("Stop button clicked");
    ttsService.stop();
    setIsPlaying(false);
  };

  // Function to update mnemonics
  const updateMnemonics = (cardIndex: number, text: string) => {
    setMnemonics(prev => ({
      ...prev,
      [cardIndex]: text
    }));
    // Save to local storage
    localStorage.setItem('mnemonics', JSON.stringify({
      ...mnemonics,
      [cardIndex]: text
    }));
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
                <div className="flex items-center justify-center mb-4">
                  {/* Thai word with pronunciation */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">
                      {getThaiWithGender(phrases[index], isMale)}
                    </div>
                    <div className="text-sm text-gray-400 italic mb-3">
                      {getGenderedPronunciation(phrases[index], isMale, phrases[index])}
                    </div>

                    {/* Play word button */}
                    <div className="flex justify-center mb-4">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          speak(getThaiWithGender(phrases[index], isMale));
                        }}
                        disabled={isPlaying}
                        className="neumorphic-button text-blue-400"
                      >
                        {isPlaying ? 'Playing...' : 'Play Word'}
                      </button>
                    </div>
              
                    {/* Difficulty buttons moved here */}
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
                </div>

                {/* Mnemonic */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-400">Mnemonic</label>
                    <button onClick={() => resetCard()} className="text-xs text-blue-400 hover:text-blue-300">Reset</button>
                  </div>
                  <textarea
                    value={localMnemonics[index] || ''}
                    onChange={handleMnemonicChange}
                    onBlur={() => updateMnemonics(index, localMnemonics[index] || '')}
                    placeholder="Create a memory aid to help remember this word..."
                    className="neumorphic-input w-full h-24 resize-none"
                  />
                </div>

                {/* Context section moved under mnemonic */}
                <div className="p-4 space-y-2 rounded-xl bg-[#222] border border-[#333] neumorphic mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm text-blue-400 uppercase tracking-wider">In Context</h3>
                  </div>
                  <ClientOnly>
                    <p className="text-base text-white font-medium">{randomSentence?.thai || getThaiWithGender(phrases[index], isMale)}</p>
                    <p className="text-sm text-gray-300 italic">
                      {getGenderedPronunciation(randomSentence, isMale, phrases[index]) || getGenderedPronunciation(phrases[index], isMale, phrases[index])}
                    </p>
                    <p className="text-sm text-gray-400 italic">{randomSentence?.english || "Loading example..."}</p>
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
                          speak(randomSentence.thai);
                        } else {
                          // Fallback to current word if no example
                          speak(getThaiWithGender(phrases[index], isMale));
                        }
                      }}
                      disabled={isPlaying}
                      className="neumorphic-button text-blue-400"
                >
                      {isPlaying ? 'Playing...' : 'Play Context'}
                </button>
                <button 
                      onClick={() => generateRandomPhrase('next')}
                      className="neumorphic-button text-blue-400 px-4"
                      aria-label="Next example"
                >
                      →
                </button>
              </div>
        </div>

                {/* Gender Switch */}
                <div className="flex items-center justify-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 text-sm">♀</span>
                    <Switch checked={isMale} onCheckedChange={setIsMale} />
                    <span className="text-gray-400 text-sm">♂</span>
              </div>
              </div>
              </div>
            )}
              </div>
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
      
      {/* Admin Settings Button (hidden in lower corner) */}
      <div className="fixed bottom-4 right-4 z-20">
          <button
          onClick={() => setShowAdminSettings(true)}
          className="text-xs text-gray-600 hover:text-gray-400"
          >
          Admin
          </button>
      </div>

      {/* Modals */}
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
'use client';

import React, { useState, useEffect } from 'react';

interface Phrase {
  meaning: string;
  thai: string;
  pronunciation: string;  // This will be used for official phonetics
  mnemonic: string;
  examples: ExampleSentence[];  // Add example sentences
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

// Replace the random phrases generator function with one that selects real examples
interface ExampleSentence {
  thai: string;
  pronunciation: string;
  translation: string;
}

// Update version info with Amsterdam time zone
const VERSION_INFO = {
  lastUpdated: new Date().toISOString(), // Current time that will be displayed in Amsterdam timezone
  version: "1.1.4",
  changes: "Updated timestamp to show actual time in Amsterdam timezone"
};

// Update phrases with real example sentences
const DEFAULT_PHRASES: Phrase[] = [
  {
    meaning: "Hello",
    thai: "สวัสดี",
    pronunciation: "sa-wat-dee",
    mnemonic: "Think: 'Swadee' - like saying 'sweet day' quickly",
    examples: [
      {
        thai: "สวัสดีตอนเช้า คุณสบายดีไหม",
        pronunciation: "sa-wat-dee ton chao, khun sa-bai dee mai",
        translation: "Good morning, how are you?"
      },
      {
        thai: "สวัสดีครับ ยินดีที่ได้รู้จัก",
        pronunciation: "sa-wat-dee krap, yin-dee tee dai roo-jak",
        translation: "Hello, nice to meet you."
      }
    ]
  },
  {
    meaning: "Thank you",
    thai: "ขอบคุณ",
    pronunciation: "khop-khun",
    mnemonic: "Think: 'Cope-Kun' - you cope with kindness",
    examples: [
      {
        thai: "ขอบคุณมากสำหรับความช่วยเหลือ",
        pronunciation: "khop-khun mak samrap kwam chuay lue",
        translation: "Thank you very much for your help."
      },
      {
        thai: "ขอบคุณสำหรับอาหารอร่อย",
        pronunciation: "khop-khun samrap a-han a-roi",
        translation: "Thank you for the delicious food."
      }
    ]
  },
  {
    meaning: "Yes",
    thai: "ใช่",
    pronunciation: "chai",
    mnemonic: "Think: 'Chai' - like the tea, say 'yes' to chai",
    examples: [
      {
        thai: "ใช่ ฉันเข้าใจแล้ว",
        pronunciation: "chai, chan kao-jai laew",
        translation: "Yes, I understand now."
      },
      {
        thai: "ใช่ นี่คือบ้านของฉัน",
        pronunciation: "chai, nee kue baan kong chan",
        translation: "Yes, this is my house."
      }
    ]
  },
  {
    meaning: "No",
    thai: "ไม่",
    pronunciation: "mai",
    mnemonic: "Think: 'My' - 'My answer is no'",
    examples: [
      {
        thai: "ไม่ ฉันไม่เอา",
        pronunciation: "mai, chan mai ao",
        translation: "No, I don't want it."
      },
      {
        thai: "ไม่ ฉันไม่ชอบอาหารเผ็ด",
        pronunciation: "mai, chan mai chop a-han pet",
        translation: "No, I don't like spicy food."
      }
    ]
  },
  {
    meaning: "How are you?",
    thai: "สบายดีไหม",
    pronunciation: "sa-bai-dee-mai",
    mnemonic: "Think: 'So bye, did I?' - asking about their well-being",
    examples: [
      {
        thai: "สบายดีไหม วันนี้อากาศดีนะ",
        pronunciation: "sa-bai-dee-mai, wan-nee a-kat dee na",
        translation: "How are you? The weather is nice today."
      },
      {
        thai: "คุณสบายดีไหม ไม่ได้เจอกันนานแล้ว",
        pronunciation: "khun sa-bai-dee-mai, mai dai jer gan naan laew",
        translation: "How are you? Haven't seen you in a long time."
      }
    ]
  }
];

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

  // Add ref to track previous showAnswer state
  const prevShowAnswerRef = React.useRef(false);

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

  // Fix autoplay to only trigger when answer is first revealed
  useEffect(() => {
    // Only play audio when showAnswer changes from false to true
    if (autoplay && showAnswer && !prevShowAnswerRef.current && !isPlaying) {
      speak(phrases[index].thai);
    }
    // Update ref with current value for next render
    prevShowAnswerRef.current = showAnswer;
  }, [showAnswer, autoplay, phrases, index]);

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

  // Update the handleCardAction function to save progress
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
    
    // Move to the next card
    setIndex((prevIndex) => (prevIndex + 1) % phrases.length);
    setShowAnswer(false);
    setRandomSentence(null);
  };

  const handleResetAll = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Replace the random phrase generator function with one that selects real examples
  const generateRandomPhrase = () => {
    if (index === null) return "";
    
    const currentPhrase = phrases[index];
    
    // Select a random example sentence for the current phrase
    if (currentPhrase.examples && currentPhrase.examples.length > 0) {
      const randomIndex = Math.floor(Math.random() * currentPhrase.examples.length);
      const example = currentPhrase.examples[randomIndex];
      
      setRandomSentence(example);
      return example.thai; // Return the Thai text for speaking
    }
    
    return currentPhrase.thai; // Fallback if no examples exist
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
                  In Context
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
            
            <div className="space-y-4">
              {(() => {
                const stats = calculateStats();
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="neumorphic p-4 text-center">
                        <div className="text-2xl font-bold text-blue-400">{stats.totalCards}</div>
                        <div className="text-sm text-gray-400">Total Cards</div>
                      </div>
                      <div className="neumorphic p-4 text-center">
                        <div className="text-2xl font-bold text-green-400">{stats.learnedCards}</div>
                        <div className="text-sm text-gray-400">Cards Learned</div>
                      </div>
                      <div className="neumorphic p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-400">{stats.dueCards}</div>
                        <div className="text-sm text-gray-400">Cards Due</div>
                      </div>
                      <div className="neumorphic p-4 text-center">
                        <div className="text-2xl font-bold text-purple-400">{stats.totalReviews}</div>
                        <div className="text-sm text-gray-400">Total Reviews</div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h3 className="text-lg font-bold mb-2">Progress</h3>
                      <div className="w-full bg-gray-800 rounded-full h-4">
                        <div 
                          className="bg-blue-500 h-4 rounded-full" 
                          style={{ width: `${(stats.learnedCards / stats.totalCards) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-sm text-gray-400 mt-1">
                        {Math.round((stats.learnedCards / stats.totalCards) * 100)}% Complete
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {showHowItWorks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="neumorphic max-w-md w-full p-6 max-h-[80vh] overflow-auto">
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
              <p>
                <strong className="text-white">Flashcards:</strong> This app helps you learn Thai vocabulary using spaced repetition.
              </p>
              
              <p>
                <strong className="text-white">Controls:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-white">Show Answer</strong> - Reveals the Thai word, pronunciation and mnemonic.</li>
                <li><strong className="text-white">Play</strong> - Listen to the Thai pronunciation.</li>
                <li><strong className="text-white">In Context</strong> - See and hear the word used in a real Thai sentence.</li>
                <li><strong className="text-white">Autoplay</strong> - Automatically plays the pronunciation when you reveal the answer.</li>
              </ul>
              
              <p>
                <strong className="text-white">Learning:</strong> After reviewing a card, rate your knowledge:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-red-500">Wrong</strong> - You didn't remember it. Card will appear again soon.</li>
                <li><strong className="text-yellow-500">Correct</strong> - You remembered with some effort. Card will repeat at a moderate interval.</li>
                <li><strong className="text-green-500">Easy</strong> - You knew it well. Card will appear after a longer interval.</li>
              </ul>
              
              <p>
                <strong className="text-white">Personalization:</strong> You can customize mnemonics and phonetic spellings to help your learning.
              </p>
            </div>
          </div>
        </div>
      )}

      {showVocabulary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="neumorphic max-w-md w-full p-6 max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Vocabulary List</h2>
              <button
                onClick={() => setShowVocabulary(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {phrases.map((phrase, idx) => {
                const isCurrentCard = idx === index;
                const status = getCardStatus(idx);
                const { color, label } = getStatusInfo(status);
                
                return (
                  <div 
                    key={idx}
                    className={`neumorphic p-3 flex items-center justify-between cursor-pointer hover:bg-gray-800 transition-colors ${isCurrentCard ? 'border-l-4 border-blue-500' : ''}`}
                    onClick={() => {
                      setIndex(idx);
                      setShowVocabulary(false);
                      setShowAnswer(false);
                      setRandomSentence(null);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${color}`} />
                      <span>{phrase.meaning}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                      <span className="text-gray-400">
                        {phrase.thai}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${color.replace('bg-', 'bg-opacity-20 text-')}`}>
                        {label}
                      </span>
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

      {/* Version indicator at the bottom - shows changes and timestamp in Amsterdam timezone */}
      <div className="w-full py-2 px-3 text-center text-xs border-t border-gray-700 bg-gray-800 sticky bottom-0 z-20">
        <div className="flex flex-col sm:flex-row sm:justify-between items-center">
          <p className="text-gray-300 font-medium">
            v{VERSION_INFO.version} | {new Date(VERSION_INFO.lastUpdated).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}
          </p>
          <p className="text-blue-400">Latest: {VERSION_INFO.changes}</p>
        </div>
      </div>
    </main>
  );
} 
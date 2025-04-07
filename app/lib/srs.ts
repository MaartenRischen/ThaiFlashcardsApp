// Constants for SM-2 SRS Algorithm
export const INITIAL_EASE_FACTOR = 2.5;
export const MIN_EASE_FACTOR = 1.3;
export const INITIAL_INTERVAL = 1; // 1 day
export const HARD_INTERVAL_MULTIPLIER = 1.2;
export const EASY_INTERVAL_MULTIPLIER = 2.5;
export const MIN_INTERVAL = 1; // Minimum interval in days
export const MAX_INTERVAL = 36500; // Maximum interval in days (100 years)

// Types
export type Difficulty = 'easy' | 'good' | 'hard';

export interface CardProgressData {
  srsLevel: number;
  nextReviewDate: string;
  lastReviewedDate: string;
  difficulty: Difficulty;
  repetitions: number;
  easeFactor: number;
}

/**
 * Calculate next review date based on SM-2 algorithm
 * @param currentProgress - The current progress data for the card
 * @param difficulty - The difficulty rating given by the user
 * @returns Updated progress data with new review date
 */
export function calculateNextReview(
  currentProgress: CardProgressData | undefined,
  difficulty: Difficulty
): CardProgressData {
  const now = new Date();
  
  // New card or card with no progress
  if (!currentProgress) {
    let daysToAdd = 1; // Default next review tomorrow
    if (difficulty === 'easy') daysToAdd = 7;
    if (difficulty === 'good') daysToAdd = 3;
    if (difficulty === 'hard') daysToAdd = 0; // Review again soon
    
    const nextReviewDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    
    return {
      srsLevel: difficulty !== 'hard' ? 1 : 0,
      nextReviewDate: nextReviewDate.toISOString(),
      lastReviewedDate: now.toISOString(),
      difficulty,
      repetitions: 1,
      easeFactor: INITIAL_EASE_FACTOR
    };
  }
  
  // Existing card with progress
  let { easeFactor, repetitions, srsLevel } = currentProgress;
  
  // Update ease factor based on response
  if (difficulty === 'easy') {
    easeFactor += 0.15;
  } else if (difficulty === 'hard') {
    easeFactor -= 0.2;
  }
  
  // Ensure ease factor doesn't go below minimum
  easeFactor = Math.max(easeFactor, MIN_EASE_FACTOR);
  
  // Update repetitions
  if (difficulty === 'hard') {
    repetitions = 0; // Reset on wrong answer
    srsLevel = Math.max(0, srsLevel - 1); // Decrease level
  } else {
    repetitions += 1;
    srsLevel += 1; // Increase level on correct answers
  }
  
  // Calculate new interval
  let interval = INITIAL_INTERVAL;
  
  if (repetitions === 1) {
    interval = INITIAL_INTERVAL;
  } else if (repetitions === 2) {
    interval = 6; // 6 days for second successful review
  } else {
    // Calculate interval based on previous interval, ease factor, and difficulty
    const prevInterval = calculatePreviousInterval(currentProgress);
    
    if (difficulty === 'easy') {
      interval = prevInterval * easeFactor * EASY_INTERVAL_MULTIPLIER;
    } else if (difficulty === 'good') {
      interval = prevInterval * easeFactor;
    } else if (difficulty === 'hard') {
      interval = prevInterval * HARD_INTERVAL_MULTIPLIER;
    }
    
    // Round to nearest day
    interval = Math.round(interval);
  }
  
  // Ensure interval is within bounds
  interval = Math.max(MIN_INTERVAL, Math.min(MAX_INTERVAL, interval));
  
  // Calculate next review date
  const nextReviewDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
  
  return {
    srsLevel,
    nextReviewDate: nextReviewDate.toISOString(),
    lastReviewedDate: now.toISOString(),
    difficulty,
    repetitions,
    easeFactor
  };
}

/**
 * Calculate the interval between last review and next scheduled review in days
 */
export function calculatePreviousInterval(progress: CardProgressData): number {
  return (new Date(progress.nextReviewDate).getTime() - 
          new Date(progress.lastReviewedDate).getTime()) / (24 * 60 * 60 * 1000);
}

/**
 * Calculate the average ease factor across all cards
 * Useful for statistics and user progress tracking
 */
export function calculateAverageEaseFactor(progressData: CardProgressData[]): number {
  if (progressData.length === 0) return INITIAL_EASE_FACTOR;
  
  const total = progressData.reduce((sum, item) => sum + item.easeFactor, 0);
  return total / progressData.length;
}

/**
 * Calculate the number of cards due for review today
 */
export function getCardsForReview(progressData: CardProgressData[], date: Date = new Date()): CardProgressData[] {
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);
  
  return progressData.filter(card => {
    const reviewDate = new Date(card.nextReviewDate);
    reviewDate.setHours(0, 0, 0, 0);
    return reviewDate <= today;
  });
}

/**
 * Calculate mastery level based on SRS level
 * @returns One of: 'new', 'learning', 'reviewing', 'mastered'
 */
export function getMasteryLevel(srsLevel: number): 'new' | 'learning' | 'reviewing' | 'mastered' {
  if (srsLevel === 0) return 'new';
  if (srsLevel < 3) return 'learning';
  if (srsLevel < 7) return 'reviewing';
  return 'mastered';
} 
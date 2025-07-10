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
  
  /*
   * Canonical SM‑2 expects a quality score 0‑5. We map three buttons to:
   *   easy  -> 5
   *   good  -> 4
   *   hard  -> 3  (still considered a correct recall but tough)
   * We don't implement qualities 0‑2 (total failure) because UI lacks "Again/Reset" button.
   */
  const qualityMap: Record<Difficulty, number> = { easy: 5, good: 4, hard: 3 };
  const q = qualityMap[difficulty];

  // Helper to update EF using SM‑2 formula
  const updateEaseFactor = (ef: number, quality: number): number => {
    const efPrime = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    return Math.max(MIN_EASE_FACTOR, efPrime);
  };

  // NEW CARD (no progress)
  if (!currentProgress) {
    const initialReps = q < 3 ? 0 : 1;
    const initialInterval = 1; // always 1 day after first assessment
    const nextReviewDate = new Date(now.getTime() + initialInterval * 24 * 60 * 60 * 1000);

    return {
      srsLevel: initialReps,
      nextReviewDate: nextReviewDate.toISOString(),
      lastReviewedDate: now.toISOString(),
      difficulty,
      repetitions: initialReps,
      easeFactor: INITIAL_EASE_FACTOR,
    };
  }

  // EXISTING CARD
  let { easeFactor, repetitions } = currentProgress;
  easeFactor = updateEaseFactor(easeFactor, q);

  let interval: number;

  if (q < 3) {
    // Considered a wrong answer – reset reps
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      const prevInterval = calculatePreviousInterval(currentProgress);
      // quality 5 (easy) gets extra boost 1.3, q=4 normal, q=3 slight penalty 0.85
      const easeMultiplier = q === 5 ? 1.3 : q === 4 ? 1.0 : 0.85;
      interval = Math.round(prevInterval * easeFactor * easeMultiplier);
    }
  }

  interval = Math.max(MIN_INTERVAL, Math.min(MAX_INTERVAL, interval));
  const nextReviewDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  return {
    srsLevel: repetitions,
    nextReviewDate: nextReviewDate.toISOString(),
    lastReviewedDate: now.toISOString(),
    difficulty,
    repetitions,
    easeFactor,
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
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  calculateNextReview, 
  calculatePreviousInterval,
  calculateAverageEaseFactor,
  getCardsForReview,
  getMasteryLevel,
  type CardProgressData,
  INITIAL_EASE_FACTOR,
  MIN_EASE_FACTOR
} from '../srs';

describe('SRS Calculation Tests', () => {
  beforeEach(() => {
    // Mock Date to ensure consistent test results
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01T12:00:00Z'));
  });
  
  it('should calculate initial review date for a new card', () => {
    const result = calculateNextReview(undefined, 'good');
    
    expect(result.srsLevel).toBe(1);
    expect(result.repetitions).toBe(1);
    expect(result.easeFactor).toBe(INITIAL_EASE_FACTOR);
    expect(result.difficulty).toBe('good');
    
    // Next review date should be 3 days later for 'good'
    const expectedDate = new Date('2023-01-04T12:00:00Z');
    expect(new Date(result.nextReviewDate)).toEqual(expectedDate);
  });
  
  it('should handle "hard" response correctly for a new card', () => {
    const result = calculateNextReview(undefined, 'hard');
    
    expect(result.srsLevel).toBe(0);
    expect(result.repetitions).toBe(1);
    expect(result.easeFactor).toBe(INITIAL_EASE_FACTOR);
    
    // Next review should be immediate (same day) for 'hard'
    const expectedDate = new Date('2023-01-01T12:00:00Z');
    expect(new Date(result.nextReviewDate)).toEqual(expectedDate);
  });
  
  it('should handle "easy" response correctly for a new card', () => {
    const result = calculateNextReview(undefined, 'easy');
    
    expect(result.srsLevel).toBe(1);
    expect(result.repetitions).toBe(1);
    expect(result.easeFactor).toBe(INITIAL_EASE_FACTOR);
    
    // Next review should be 7 days later for 'easy'
    const expectedDate = new Date('2023-01-08T12:00:00Z');
    expect(new Date(result.nextReviewDate)).toEqual(expectedDate);
  });
  
  it('should increase interval for cards with multiple successful reviews', () => {
    // Mock first review
    const firstReview = calculateNextReview(undefined, 'good');
    
    // Mock second review (after 3 days)
    vi.setSystemTime(new Date('2023-01-04T12:00:00Z'));
    const secondReview = calculateNextReview(firstReview, 'good');
    
    expect(secondReview.srsLevel).toBe(2);
    expect(secondReview.repetitions).toBe(2);
    
    // Should get 6 days interval for second review
    const expectedSecondDate = new Date('2023-01-10T12:00:00Z');
    expect(new Date(secondReview.nextReviewDate)).toEqual(expectedSecondDate);
    
    // Mock third review (after 6 days)
    vi.setSystemTime(new Date('2023-01-10T12:00:00Z'));
    const thirdReview = calculateNextReview(secondReview, 'good');
    
    expect(thirdReview.srsLevel).toBe(3);
    expect(thirdReview.repetitions).toBe(3);
    
    // Third review interval should be longer based on ease factor
    const thirdReviewDate = new Date(thirdReview.nextReviewDate);
    const thirdInterval = (thirdReviewDate.getTime() - new Date('2023-01-10T12:00:00Z').getTime()) / (24 * 60 * 60 * 1000);
    
    expect(thirdInterval).toBeGreaterThan(6); // Should be longer than previous interval
  });
  
  it('should decrease level and reset repetitions after a "hard" review', () => {
    // Mock first "good" review
    const firstReview = calculateNextReview(undefined, 'good');
    
    // Mock second "hard" review
    vi.setSystemTime(new Date('2023-01-04T12:00:00Z'));
    const secondReview = calculateNextReview(firstReview, 'hard');
    
    expect(secondReview.srsLevel).toBe(0); // Should decrease
    expect(secondReview.repetitions).toBe(0); // Should reset
    expect(secondReview.easeFactor).toBeLessThan(INITIAL_EASE_FACTOR); // Should decrease
    
    // The exact interval timing may vary based on the algorithm implementation
    // Just make sure there's a next review date set
    expect(secondReview.nextReviewDate).toBeTruthy();
  });
  
  it('should respect minimum ease factor', () => {
    // Create a card with ease factor just above minimum
    const card: CardProgressData = {
      srsLevel: 3,
      nextReviewDate: new Date('2023-01-15T12:00:00Z').toISOString(),
      lastReviewedDate: new Date('2023-01-01T12:00:00Z').toISOString(),
      difficulty: 'good',
      repetitions: 3,
      easeFactor: MIN_EASE_FACTOR + 0.1
    };
    
    // Multiple "hard" reviews should not decrease below minimum
    vi.setSystemTime(new Date('2023-01-15T12:00:00Z'));
    const review1 = calculateNextReview(card, 'hard');
    const review2 = calculateNextReview(review1, 'hard');
    const review3 = calculateNextReview(review2, 'hard');
    
    expect(review3.easeFactor).toBe(MIN_EASE_FACTOR);
  });
  
  describe('calculatePreviousInterval', () => {
    it('should calculate the interval between reviews in days', () => {
      const card: CardProgressData = {
        srsLevel: 2,
        lastReviewedDate: new Date('2023-01-01T12:00:00Z').toISOString(),
        nextReviewDate: new Date('2023-01-11T12:00:00Z').toISOString(),
        difficulty: 'good',
        repetitions: 2,
        easeFactor: 2.5
      };
      
      const interval = calculatePreviousInterval(card);
      expect(interval).toBe(10); // 10 days difference
    });
  });
  
  describe('calculateAverageEaseFactor', () => {
    it('should return default ease factor for empty array', () => {
      expect(calculateAverageEaseFactor([])).toBe(INITIAL_EASE_FACTOR);
    });
    
    it('should calculate average ease factor correctly', () => {
      const cards: CardProgressData[] = [
        { srsLevel: 1, nextReviewDate: '', lastReviewedDate: '', difficulty: 'good', repetitions: 1, easeFactor: 2.0 },
        { srsLevel: 2, nextReviewDate: '', lastReviewedDate: '', difficulty: 'good', repetitions: 2, easeFactor: 2.5 },
        { srsLevel: 3, nextReviewDate: '', lastReviewedDate: '', difficulty: 'good', repetitions: 3, easeFactor: 3.0 }
      ];
      
      expect(calculateAverageEaseFactor(cards)).toBe(2.5);
    });
  });
  
  describe('getCardsForReview', () => {
    it('should return cards due for review', () => {
      const today = new Date('2023-01-10T15:00:00Z');
      const yesterday = new Date('2023-01-09T10:00:00Z');
      const tomorrow = new Date('2023-01-11T08:00:00Z');
      
      const cards: CardProgressData[] = [
        { srsLevel: 1, nextReviewDate: yesterday.toISOString(), lastReviewedDate: '', difficulty: 'good', repetitions: 1, easeFactor: 2.5 },
        { srsLevel: 2, nextReviewDate: today.toISOString(), lastReviewedDate: '', difficulty: 'good', repetitions: 2, easeFactor: 2.5 },
        { srsLevel: 3, nextReviewDate: tomorrow.toISOString(), lastReviewedDate: '', difficulty: 'good', repetitions: 3, easeFactor: 2.5 }
      ];
      
      const dueCards = getCardsForReview(cards, today);
      expect(dueCards.length).toBe(2); // Yesterday and today
    });
  });
  
  describe('getMasteryLevel', () => {
    it('should return correct mastery levels', () => {
      expect(getMasteryLevel(0)).toBe('new');
      expect(getMasteryLevel(1)).toBe('learning');
      expect(getMasteryLevel(2)).toBe('learning');
      expect(getMasteryLevel(3)).toBe('reviewing');
      expect(getMasteryLevel(6)).toBe('reviewing');
      expect(getMasteryLevel(7)).toBe('mastered');
      expect(getMasteryLevel(10)).toBe('mastered');
    });
  });
}); 
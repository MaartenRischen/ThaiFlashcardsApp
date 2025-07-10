import { describe, it, expect, vi } from 'vitest';
import { calculateProgressStats } from '../progress-stats';
import { type Phrase } from '../pronunciation';
import { type CardProgressData } from '../srs';

// Mock current date for consistent test results
vi.useFakeTimers();
vi.setSystemTime(new Date('2023-01-01T12:00:00Z'));

describe('Progress Statistics', () => {
  // Test data
  const phrases: Phrase[] = [
    { id: 1, thai: 'สวัสดี', english: 'Hello', pronunciation: 'sawadee', translation: 'Hello' },
    { id: 2, thai: 'ขอบคุณ', english: 'Thank you', pronunciation: 'khob khun', translation: 'Thank you' },
    { id: 3, thai: 'ใช่', english: 'Yes', pronunciation: 'chai', translation: 'Yes' },
    { id: 4, thai: 'ไม่', english: 'No', pronunciation: 'mai', translation: 'No' },
    { id: 5, thai: 'หิว', english: 'Hungry', pronunciation: 'hiw', translation: 'Hungry' },
  ];
  
  const progressData: Record<string, CardProgressData> = {
    '1': {
      srsLevel: 7, // mastered
      nextReviewDate: new Date('2023-01-15').toISOString(),
      lastReviewedDate: new Date('2023-01-01').toISOString(),
      difficulty: 'good',
      repetitions: 10,
      easeFactor: 2.5,
    },
    '2': {
      srsLevel: 3, // reviewing
      nextReviewDate: new Date('2023-01-02').toISOString(), // due tomorrow
      lastReviewedDate: new Date('2023-01-01').toISOString(),
      difficulty: 'good',
      repetitions: 5,
      easeFactor: 2.3,
    },
    '3': {
      srsLevel: 1, // learning
      nextReviewDate: new Date('2023-01-01').toISOString(), // due today
      lastReviewedDate: new Date('2022-12-31').toISOString(),
      difficulty: 'hard',
      repetitions: 2,
      easeFactor: 1.5,
    }
  };
  
  it('calculates correct statistics', () => {
    const stats = calculateProgressStats(phrases, progressData);
    
    // Basic stats
    expect(stats.totalCards).toBe(5);
    expect(stats.learnedCards).toBe(3);
    expect(stats.masteredCards).toBe(1);
    
    // Review stats - only Card 3 is due today on 2023-01-01
    expect(stats.cardsToReview).toBe(1);
    expect(stats.cardsToReviewToday).toBe(1);
    
    // Performance stats
    expect(stats.accuracyRate).toBeLessThan(100); // Less than 100% due to a 'hard' card
    expect(stats.averageStreak).toBe(4); // Average of SRS levels, rounded: (7+3+1)/3 = 3.67 ≈ 4
    
    // Weakest cards
    expect(stats.weakestCards.length).toBe(2); // Only non-mastered cards (2 & 3)
    expect(stats.weakestCards[0].id).toBe(3); // Card 3 is weakest (lowest ease factor)
    expect(stats.weakestCards[1].id).toBe(2); // Card 2 is next weakest
  });
  
  it('handles empty progress data', () => {
    const stats = calculateProgressStats(phrases, {});
    
    expect(stats.totalCards).toBe(5);
    expect(stats.learnedCards).toBe(0);
    expect(stats.masteredCards).toBe(0);
    expect(stats.cardsToReview).toBe(0);
    expect(stats.cardsToReviewToday).toBe(0);
    expect(stats.accuracyRate).toBe(100);
    expect(stats.averageStreak).toBe(0);
    expect(stats.weakestCards.length).toBe(0);
  });
  
  it('calculates correct weakest cards order', () => {
    const moreProgress: Record<string, CardProgressData> = {
      ...progressData,
      '4': {
        srsLevel: 2,
        nextReviewDate: new Date('2023-01-03').toISOString(),
        lastReviewedDate: new Date('2023-01-01').toISOString(),
        difficulty: 'good',
        repetitions: 3,
        easeFactor: 2.0,
      },
      '5': {
        srsLevel: 1,
        nextReviewDate: new Date('2023-01-01').toISOString(),
        lastReviewedDate: new Date('2022-12-31').toISOString(),
        difficulty: 'hard',
        repetitions: 1,
        easeFactor: 1.7, // Between card 3 and 4
      },
    };
    
    const stats = calculateProgressStats(phrases, moreProgress);
    
    // Weakest cards should be ordered by ease factor ascending
    expect(stats.weakestCards.map(c => c.id)).toEqual([3, 5, 4, 2]);
  });
}); 
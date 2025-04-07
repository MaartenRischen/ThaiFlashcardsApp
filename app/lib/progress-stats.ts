import { type Phrase } from './pronunciation';
import { type CardProgressData, getMasteryLevel, getCardsForReview } from './srs';

export interface ProgressStats {
  totalCards: number;
  learnedCards: number;
  masteredCards: number;
  accuracyRate: number;
  cardsToReview: number;
  cardsToReviewToday: number;
  averageStreak: number;
  weakestCards: { id: number; phrase: Phrase; progress: CardProgressData }[];
}

/**
 * Calculate comprehensive progress statistics based on user's card data
 * @param phrases All phrases/cards in the set
 * @param progressData User's progress data for the cards
 * @returns ProgressStats object with computed stats
 */
export function calculateProgressStats(
  phrases: Phrase[], 
  progressData: Record<string, CardProgressData>
): ProgressStats {
  // Convert progress data to array form with IDs
  const progressArray = Object.entries(progressData).map(([id, progress]) => ({
    id: parseInt(id),
    progress,
  }));
  
  // Calculate basic stats
  const totalCards = phrases.length;
  const learnedCards = progressArray.length;
  
  // Cards at different mastery levels
  const masteredCards = progressArray.filter(
    item => getMasteryLevel(item.progress.srsLevel) === 'mastered'
  ).length;
  
  // Due for review
  const now = new Date();
  const cardsToReview = progressArray.filter(item => {
    const reviewDate = new Date(item.progress.nextReviewDate);
    return reviewDate <= now;
  }).length;
  
  // Get cards due today
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const cardsToReviewToday = progressArray.filter(item => {
    const reviewDate = new Date(item.progress.nextReviewDate);
    return reviewDate < tomorrow;
  }).length;
  
  // Calculate accuracy rate based on difficulty distribution
  const totalReviews = progressArray.reduce((sum, item) => sum + item.progress.repetitions, 0);
  const hardReviews = progressArray.filter(item => item.progress.difficulty === 'hard').length;
  
  // Avoid division by zero
  const accuracyRate = totalReviews > 0 
    ? Math.round(((totalReviews - hardReviews) / totalReviews) * 100) 
    : 100;
  
  // Calculate average streak
  // This would typically require more data about consecutive correct answers
  // Here we'll use a simple approximation based on SRS level
  const averageStreak = progressArray.length > 0 
    ? Math.round(progressArray.reduce((sum, item) => sum + item.progress.srsLevel, 0) / progressArray.length) 
    : 0;
  
  // Identify weakest cards (cards with lowest ease factor that are not mastered)
  const weakestCardsData = progressArray
    .filter(item => getMasteryLevel(item.progress.srsLevel) !== 'mastered')
    .sort((a, b) => a.progress.easeFactor - b.progress.easeFactor)
    .slice(0, 5); // Get top 5 weakest cards
  
  // Map IDs to full card details
  const weakestCards = weakestCardsData.map(item => {
    const phrase = phrases.find(p => p.id === item.id) || phrases[0];
    return {
      id: item.id,
      phrase,
      progress: item.progress,
    };
  });
  
  return {
    totalCards,
    learnedCards,
    masteredCards,
    accuracyRate,
    cardsToReview,
    cardsToReviewToday,
    averageStreak,
    weakestCards,
  };
} 
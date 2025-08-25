import { useMemo } from 'react';
import { SetProgress } from '@/app/lib/storage/types';
import { Phrase } from '@/app/data/phrases';

export function useSetCompletion(phrases: Phrase[], progress: SetProgress) {
  const isSetCompleted = useMemo(() => {
    if (!phrases || phrases.length === 0) return false;
    
    // Check if all cards in the set have been marked as 'easy'
    for (let i = 0; i < phrases.length; i++) {
      const cardProgress = progress[i];
      if (!cardProgress || cardProgress.difficulty !== 'easy') {
        return false;
      }
    }
    
    return true;
  }, [phrases, progress]);

  const completionPercentage = useMemo(() => {
    if (!phrases || phrases.length === 0) return 0;
    
    let easyCount = 0;
    for (let i = 0; i < phrases.length; i++) {
      const cardProgress = progress[i];
      if (cardProgress && cardProgress.difficulty === 'easy') {
        easyCount++;
      }
    }
    
    return (easyCount / phrases.length) * 100;
  }, [phrases, progress]);

  return { isSetCompleted, completionPercentage };
}

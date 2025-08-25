'use client';

import React, { useEffect, useState } from 'react';
import CompletionBadge from './CompletionBadge';
import { useSet } from '../context/SetContext';
import { getDefaultSetContent } from '../lib/seed-default-sets';
import type { PhraseProgressData } from '../lib/storage';

interface SetCompletionBadgeProps {
  setId: string;
}

export default function SetCompletionBadge({ setId }: SetCompletionBadgeProps) {
  const { availableSets, activeSetProgress, activeSetId } = useSet();
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCompletion = async () => {
      try {
        // Get set metadata
        const setMetadata = availableSets.find(s => s.id === setId);
        if (!setMetadata) {
          setIsCompleted(false);
          setLoading(false);
          return;
        }

        // Get progress data
        let progress: Record<string, PhraseProgressData> = {};
        
        // If this is the active set, use the current progress from context
        if (setId === activeSetId) {
          progress = activeSetProgress;
        } else {
          // Otherwise load from storage
          if (setId === 'default' || setId.startsWith('default-')) {
            // For default sets, check localStorage
            const storedProgress = localStorage.getItem(`progress_${setId}`);
            if (storedProgress) {
              try {
                progress = JSON.parse(storedProgress);
              } catch (e) {
                console.error('Failed to parse progress:', e);
              }
            }
          } else {
            // For user sets, fetch from API
            try {
              const response = await fetch(`/api/flashcard-sets/${setId}/progress`, {
                credentials: 'include'
              });
              if (response.ok) {
                const data = await response.json();
                progress = data.progress || {};
              }
            } catch (error) {
              console.error('Failed to fetch progress:', error);
            }
          }
        }

        // Get content to check total cards
        let totalCards = 0;
        if (setId === 'default' || setId.startsWith('default-')) {
          const content = getDefaultSetContent(setId);
          if (content) {
            totalCards = content.length;
          }
        } else {
          totalCards = setMetadata.phraseCount || 0;
        }

        // Check if all cards are marked as easy
        if (totalCards === 0) {
          setIsCompleted(false);
        } else {
          let allEasy = true;
          for (let i = 0; i < totalCards; i++) {
            const cardProgress = progress[i];
            if (!cardProgress || cardProgress.difficulty !== 'easy') {
              allEasy = false;
              break;
            }
          }
          setIsCompleted(allEasy);
        }
      } catch (error) {
        console.error('Error checking set completion:', error);
        setIsCompleted(false);
      } finally {
        setLoading(false);
      }
    };

    checkCompletion();
  }, [setId, availableSets, activeSetProgress, activeSetId]);

  if (loading || !isCompleted) {
    return null;
  }

  return (
    <div className="absolute top-3 left-3 z-10">
      <CompletionBadge size="sm" />
    </div>
  );
}

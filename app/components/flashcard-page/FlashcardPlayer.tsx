'use client';

import React, { useState, useEffect } from 'react';
import { FlashcardDisplay, Phrase } from '../FlashcardDisplay';
import { logger } from '@/app/lib/logger';

export interface FlashcardPlayerProps {
  phrases: Phrase[];
  initialIndex?: number;
  autoplay?: boolean;
  isMale?: boolean;
  isPoliteMode?: boolean;
  onProgress?: (cardIndex: number, difficulty: 'easy' | 'good' | 'hard') => void;
}

export const FlashcardPlayer: React.FC<FlashcardPlayerProps> = ({
  phrases,
  initialIndex = 0,
  autoplay = false,
  isMale = true,
  isPoliteMode = true,
  onProgress,
}) => {
  const [index, setIndex] = useState(initialIndex);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    setIndex(0);
    setShowAnswer(false);
  }, [phrases]);

  const nextCard = () => {
    if (phrases.length === 0) return;
    setShowAnswer(false);
    setIndex((prev) => (prev + 1) % phrases.length);
  };

  const prevCard = () => {
    if (phrases.length === 0) return;
    setShowAnswer(false);
    setIndex((prev) => (prev - 1 + phrases.length) % phrases.length);
  };

  const handleReview = (difficulty: 'easy' | 'good' | 'hard') => {
    logger.debug('FlashcardPlayer review', { index, difficulty });
    onProgress?.(index, difficulty);
    nextCard();
  };

  if (phrases.length === 0) {
    return <p className="text-center text-gray-400">No cards available.</p>;
  }

  const current = phrases[index];

  return (
    <section className="cq-card container-type-inline-size w-full max-w-lg mx-auto">
      <FlashcardDisplay
        phrase={current}
        showAnswer={showAnswer}
        autoplay={autoplay}
        isMale={isMale}
        isPoliteMode={isPoliteMode}
        mnemonic={current.mnemonic}
        onToggleAnswer={() => setShowAnswer((s) => !s)}
        onNextCard={nextCard}
        onPrevCard={prevCard}
        onPlayAudio={() => {
          window.dispatchEvent(
            new CustomEvent('flashcard-play-audio', { detail: current })
          );
        }}
      />

      {showAnswer && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            className="neumorphic-button px-3 py-1 text-red-400"
            aria-label="Mark as wrong (hard)"
            onClick={() => handleReview('hard')}
          >
            Wrong
          </button>
          <button
            className="neumorphic-button px-3 py-1 text-yellow-400"
            aria-label="Mark as correct (good)"
            onClick={() => handleReview('good')}
          >
            Correct
          </button>
          <button
            className="neumorphic-button px-3 py-1 text-green-400"
            aria-label="Mark as easy"
            onClick={() => handleReview('easy')}
          >
            Easy
          </button>
        </div>
      )}

      <div className="mt-3 text-center text-gray-500 text-sm cq-[width<350px]:text-xs">
        {index + 1} / {phrases.length}
      </div>
    </section>
  );
}; 
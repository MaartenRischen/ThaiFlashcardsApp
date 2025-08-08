'use client';

import React from 'react';
import type { Phrase } from '@/app/lib/generation/types';
import { getThaiWithGender, getGenderedPronunciation } from '@/app/lib/pronunciation';
import type { ExampleSentence as PronExample } from '@/app/lib/pronunciation';

interface AudioLearningCardProps {
  phrase: Phrase;
  isMale: boolean;
  isPoliteMode: boolean;
}

/**
 * Presentational card that mirrors the flashcard learning UI (card back)
 * but without interactivity or the "In Context" section. Used for audio-synced view.
 */
export function AudioLearningCard({ phrase, isMale, isPoliteMode }: AudioLearningCardProps) {
  const pronInput: PronExample = {
    thai: phrase.thai,
    translation: phrase.english,
    pronunciation: phrase.pronunciation,
  };
  const thaiText = getThaiWithGender(pronInput, isMale, isPoliteMode);
  const pronunciation = getGenderedPronunciation(pronInput, isMale, isPoliteMode);

  return (
    <div className="border-t border-[#333] p-6 flex flex-col min-h-[20rem] overflow-y-auto card-back-container">
      {/* Main Phrase Section - Centered */}
      <div className="flex flex-col items-center justify-center mb-4">
        <div className="text-center">
          {/* Thai word */}
          <div className="text-3xl md:text-4xl font-extrabold mb-2 text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
            {thaiText}
          </div>

          {/* Match card-back order: pronunciation (quoted) then English in parentheses */}
          {pronunciation && (
            <div className="text-center mb-2">
              <span className="text-gray-400 text-sm italic">"{pronunciation}"</span>
            </div>
          )}

          {phrase.english && (
            <div className="text-base md:text-lg font-medium mb-2 text-blue-300 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
              ({phrase.english})
            </div>
          )}
        </div>
      </div>

      {/* Mnemonic (read-only) */}
      <div className="mt-4">
        {phrase.mnemonic && (
          <div className="neumorphic-input w-full min-h-24 rounded-lg p-3 text-gray-200 bg-[#1f1f1f] border border-[#333]">
            {phrase.mnemonic}
          </div>
        )}
      </div>
    </div>
  );
}

export default AudioLearningCard;



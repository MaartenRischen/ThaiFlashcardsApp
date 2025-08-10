'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSet } from '@/app/context/SetContext';
import { FlashcardDisplay } from '@/app/components/FlashcardDisplay';
import type { Phrase as DisplayPhrase, ExampleSentence as DisplayExample } from '@/app/components/FlashcardDisplay';
import { getThaiWithGender } from '@/app/lib/pronunciation';
import { ttsService } from '@/app/lib/tts-service';

interface PassiveLearningProps {
  // Initial gender/politeness settings
  isMale?: boolean;
  isPoliteMode?: boolean;
}

export default function PassiveLearning({ isMale = false, isPoliteMode = true }: PassiveLearningProps) {
  const { activeSetContent: phrases } = useSet();
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(true); // Start with English side
  const [running, setRunning] = useState(false);
  const [repetition, setRepetition] = useState(0);
  const stopRef = useRef(false);

  const current = useMemo(() => (phrases && phrases.length > 0 ? phrases[index] : undefined), [phrases, index]);

  const currentForDisplay: DisplayPhrase | undefined = useMemo(() => {
    if (!current) return undefined;
    const mappedExamples: DisplayExample[] = Array.isArray(current.examples)
      ? current.examples.map((ex: any) => ({ thai: ex.thai, translation: ex.translation, pronunciation: ex.pronunciation }))
      : [];
    return {
      thai: current.thai,
      translation: current.english,
      pronunciation: current.pronunciation,
      english: current.english,
      examples: mappedExamples,
      mnemonic: current.mnemonic,
    };
  }, [current]);

  const pickRandomIndex = useCallback((): number => {
    if (!phrases || phrases.length === 0) return 0;
    return Math.floor(Math.random() * phrases.length);
  }, [phrases]);

  const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  const runCycle = useCallback(async () => {
    if (!phrases || phrases.length === 0) return;
    stopRef.current = false;
    setRunning(true);

    try {
      // Endless loop until stopped
      // For each iteration: pick a random card, repeat EN->TH three times
      while (!stopRef.current) {
        const nextIdx = pickRandomIndex();
        setIndex(nextIdx);
        setRepetition(0);

        for (let rep = 0; rep < 3 && !stopRef.current; rep++) {
          setRepetition(rep + 1);
          const card = phrases[nextIdx];
          // 1. Show English (back side), play English
          setShowAnswer(true);
          await ttsService.speak({ text: card.english, genderValue: isMale });
          if (stopRef.current) break;
          await wait(400); // short pause

          // 2. Flip to Thai (front side), play Thai
          const thai = getThaiWithGender(
            {
              thai: card.thai,
              translation: card.english,
              pronunciation: card.pronunciation,
            },
            isMale,
            isPoliteMode
          );
          setShowAnswer(false);
          await ttsService.speak({ text: thai, genderValue: isMale });
          if (stopRef.current) break;
          await wait(700); // small pause between reps
        }

        // proceed to new random card automatically
      }
    } finally {
      setRunning(false);
      ttsService.stop();
    }
  }, [phrases, pickRandomIndex, isMale, isPoliteMode]);

  const stop = useCallback(() => {
    stopRef.current = true;
    ttsService.stop();
    setRunning(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  if (!phrases || phrases.length === 0) {
    return <div className="text-center text-gray-400">No cards available.</div>;
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center text-sm text-gray-400 mb-3">
        {running ? `Repetition ${repetition} of 3` : 'Passive Learning is idle'}
      </div>
      <div className="border border-[#333] rounded-lg p-4 bg-[#111]">
        <FlashcardDisplay
          phrase={currentForDisplay!}
          showAnswer={showAnswer}
          autoplay={false}
          isMale={isMale}
          isPoliteMode={isPoliteMode}
          onToggleAnswer={() => {}}
          onPlayAudio={() => {}}
          onNextCard={() => {}}
          onPrevCard={() => {}}
          hideControls
        />
      </div>

      <div className="flex justify-center gap-3 mt-4">
        <button
          className={`neumorphic-button ${running ? 'text-gray-400' : 'text-green-400'}`}
          onClick={() => {
            if (!running) runCycle();
          }}
          disabled={running}
        >
          Start Passive Learning
        </button>
        <button className="neumorphic-button text-red-400" onClick={stop} disabled={!running}>
          Stop
        </button>
      </div>
      <div className="text-center text-xs text-gray-500 mt-2">
        English → Thai auto-play x3, then a random new card. Runs until you stop.
      </div>
    </div>
  );
}



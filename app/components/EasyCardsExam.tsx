'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RotateCcw, Trophy, Clock, BookOpen } from 'lucide-react';
import { ttsService } from '@/app/lib/tts-service';
import { getDefaultSetContent, getDefaultSetsForUnauthenticatedUsers } from '@/app/lib/seed-default-sets';
import type { Phrase as SeedPhrase } from '@/app/data/phrases';
import type { PhraseProgressData } from '@/app/lib/storage/types';
import Image from 'next/image';
import { getThaiWithGender, getGenderedPronunciation, type Phrase as PronPhrase } from '@/app/lib/pronunciation';

interface EasyCard {
  setId: string;
  setName: string;
  setImageUrl?: string;
  phraseIndex: number;
  phrase: {
    thai: string;
    romanization: string;
    english: string;
    mnemonic?: string;
    hint?: string;
    audioUrl?: string;
  };
  lastReviewed: string;
}

interface ExamResult {
  correct: boolean;
  cardIndex: number;
  timeSpent: number;
}

export default function EasyCardsExam() {
  const [cards, setCards] = useState<EasyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isMale, setIsMale] = useState(true);
  const [isPoliteMode, setIsPoliteMode] = useState(false);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [cardStartTime, setCardStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [examComplete, setExamComplete] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(0);

  type UiPhrase = {
    thai: string;
    romanization: string;
    english: string;
    mnemonic?: string;
    hint?: string;
    audioUrl?: string;
    examples?: { thai: string; pronunciation: string; translation: string }[];
  };

  type ApiCard = {
    setId: string;
    setName: string;
    setImageUrl?: string;
    phraseIndex: number;
    phrase: {
      thai: string;
      english: string;
      pronunciation?: string; // server may provide
      romanization?: string;  // or this
      mnemonic?: string;
    };
    lastReviewed: string | Date;
  };

  const fetchEasyCards = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/easy-cards-exam');
      
      if (!response.ok) {
        throw new Error('Failed to fetch easy cards');
      }

      const data = await response.json();

      // Also gather localStorage progress for default sets (these are saved locally even for signed-in users)
      const localEasyCards: EasyCard[] = [];
      try {
        const defaultSets = getDefaultSetsForUnauthenticatedUsers();
        for (const set of defaultSets) {
          const key = `progress_${set.id}`;
          const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
          if (!raw) continue;

          // Support both legacy and current formats
          const parsed = JSON.parse(raw) as unknown;
          const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

          const isLegacyProgress = (v: unknown): v is { learnedPhrases: number[] } => {
            if (!isRecord(v)) return false;
            const lp = v['learnedPhrases'];
            return Array.isArray(lp) && lp.every((n) => typeof n === 'number');
          };

          let easyIndices: number[] = [];
          if (isLegacyProgress(parsed)) {
            // Legacy format
            easyIndices = parsed.learnedPhrases;
          } else if (isRecord(parsed)) {
            // Current format: Record<string, PhraseProgressData>
            const rec = parsed as Record<string, PhraseProgressData>;
            easyIndices = Object.entries(rec)
              .filter(([, prog]) => prog && prog.difficulty === 'easy')
              .map(([idx]) => parseInt(idx, 10))
              .filter((n) => !Number.isNaN(n));
          }

          if (easyIndices.length > 0) {
            const content = (getDefaultSetContent(set.id) || []) as SeedPhrase[];
            for (const idx of easyIndices) {
              if (idx >= 0 && idx < content.length) {
                const p = content[idx];
                const uiPhrase: UiPhrase = {
                  thai: p.thai,
                  romanization: p.pronunciation ?? '',
                  english: p.english,
                  mnemonic: p.mnemonic,
                  examples: p.examples as { thai: string; pronunciation: string; translation: string }[],
                };

                localEasyCards.push({
                  setId: set.id,
                  setName: set.name,
                  setImageUrl: set.imageUrl || undefined,
                  phraseIndex: idx,
                  phrase: uiPhrase,
                  lastReviewed: new Date().toISOString(),
                } as EasyCard);
              }
            }
          }
        }
      } catch (e) {
        console.warn('Failed to read local default set progress:', e);
      }

      // Normalize server cards to UI shape
      const serverCards: EasyCard[] = Array.isArray(data.cards)
        ? (data.cards as ApiCard[]).map((c) => ({
            setId: c.setId,
            setName: c.setName,
            setImageUrl: c.setImageUrl,
            phraseIndex: c.phraseIndex,
            phrase: {
              thai: c.phrase?.thai ?? '',
              romanization: c.phrase?.pronunciation ?? c.phrase?.romanization ?? '',
              english: c.phrase?.english ?? '',
              mnemonic: c.phrase?.mnemonic ?? undefined,
              examples: (c.phrase as any)?.examples ?? [],
            },
            lastReviewed: typeof c.lastReviewed === 'string' ? c.lastReviewed : new Date(c.lastReviewed).toISOString(),
          }))
        : [];

      const merged = [...serverCards, ...localEasyCards];

      if (merged.length === 0) {
        setError('No easy cards found. Mark some cards as "Easy" in your sets to use this feature!');
      } else {
        // Shuffle cards for variety
        const shuffled = [...merged].sort(() => Math.random() - 0.5);
        setCards(shuffled);
        setCardStartTime(Date.now());
      }
    } catch (err) {
      console.error('Error fetching easy cards:', err);
      setError('Failed to load easy cards. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch easy cards
  useEffect(() => {
    fetchEasyCards();
  }, [fetchEasyCards]);

  const handleAnswer = (correct: boolean) => {
    const timeSpent = Date.now() - cardStartTime;
    setResults([...results, { correct, cardIndex: currentIndex, timeSpent }]);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
      setCardStartTime(Date.now());
    } else {
      setExamComplete(true);
    }
  };

  const restartExam = () => {
    // Reshuffle cards
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setResults([]);
    setShowAnswer(false);
    setExamComplete(false);
    setCardStartTime(Date.now());
  };

  const playCardAudio = useCallback(async () => {
    const currentCard = cards[currentIndex];
    if (currentCard?.phrase.thai) {
      try {
        await ttsService.speak({
          text: currentCard.phrase.thai,
          genderValue: true,
          onStart: () => {},
          onEnd: () => {},
          onError: (error) => console.error('TTS error:', error),
        });
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  }, [cards, currentIndex]);

  // Auto-play audio when card changes
  useEffect(() => {
    if (!loading && cards.length > 0 && !showAnswer) {
      playCardAudio();
    }
  }, [currentIndex, loading, cards.length, showAnswer, playCardAudio]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your easy cards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Easy Cards Yet</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.history.back()} variant="outline">
          Go Back
        </Button>
      </Card>
    );
  }

  if (examComplete) {
    const correctCount = results.filter(r => r.correct).length;
    const accuracy = (correctCount / results.length) * 100;
    const avgTime = results.reduce((sum, r) => sum + r.timeSpent, 0) / results.length / 1000;

    return (
      <Card className="p-8 max-w-2xl mx-auto">
        <div className="text-center">
          <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Exam Complete!</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Accuracy</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {accuracy.toFixed(1)}%
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Avg Time/Card</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {avgTime.toFixed(1)}s
              </p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-lg mb-2">
              {correctCount} out of {results.length} cards correct
            </p>
            <Progress value={accuracy} className="h-3" />
          </div>

          <div className="flex gap-3 justify-center">
            <Button onClick={restartExam} size="lg">
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={() => window.history.back()} variant="outline" size="lg">
              Back to Sets
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  const toPronPhrase = (c: EasyCard): PronPhrase => ({
    thai: c.phrase.thai,
    pronunciation: c.phrase.romanization ?? '',
    translation: c.phrase.english,
    english: c.phrase.english,
    examples: [],
    mnemonic: c.phrase.mnemonic,
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold">Exam</h2>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {cards.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="p-6 w-full max-w-lg mx-auto">
        {/* Set Info */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b">
          {currentCard.setImageUrl && (
            <Image src={currentCard.setImageUrl} alt={currentCard.setName} width={40} height={40} className="rounded-lg" />
          )}
          <div>
            <p className="text-sm text-muted-foreground">From set:</p>
            <p className="font-semibold">{currentCard.setName}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm text-muted-foreground">Last reviewed:</p>
            <p className="text-sm">{new Date(currentCard.lastReviewed).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Front/Back like normal card */}
        {!showAnswer ? (
          <div className="flex flex-col items-center justify-center py-10">
            <h2 className="text-3xl font-bold mb-3">{currentCard.phrase.english}</h2>
            {currentCard.phrase.mnemonic && (
              <button className="text-sm text-blue-400 hover:text-blue-300 underline mb-6" onClick={() => setShowAnswer(true)}>Show Hint</button>
            )}
            <Button onClick={() => setShowAnswer(true)} className="px-6 py-2">Show Answer</Button>
          </div>
        ) : (
          <div className="border-t border-[#333] p-6 flex flex-col min-h-[20rem] overflow-y-auto card-back-container">
            {/* Main Phrase Section */}
            <div className="flex flex-col items-center justify-center mb-4">
              <div className="text-center">
                {/* Thai */}
                <div className="text-3xl md:text-4xl font-extrabold mb-2 text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
                  {getThaiWithGender(toPronPhrase(currentCard), isMale, isPoliteMode)}
                </div>
                {/* Pronunciation label */}
                <div className="text-center mb-3">
                  <div className="text-xl md:text-2xl font-semibold text-gray-100 px-4 py-2 bg-[#0f172a] rounded-lg inline-block">
                    {getGenderedPronunciation(toPronPhrase(currentCard), isMale, isPoliteMode) || ''}
                  </div>
                </div>
                {/* Normal / Slow buttons */}
                <div className="flex justify-center gap-3 mb-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); ttsService.speak({ text: getThaiWithGender(toPronPhrase(currentCard), isMale, isPoliteMode), genderValue: isMale }); }}
                    className="neumorphic-button text-blue-400 flex items-center gap-2 px-3 py-2"
                    title="Play at normal speed"
                  >
                    Normal
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); ttsService.speak({ text: getThaiWithGender(toPronPhrase(currentCard), isMale, isPoliteMode), genderValue: isMale, rate: -30 }); }}
                    className="neumorphic-button text-green-400 flex items-center gap-2 px-3 py-2"
                    title="Play at slow speed"
                  >
                    Slow
                  </button>
                </div>
                {/* English translation */}
                <div className="text-base md:text-lg font-medium mb-2 text-blue-300 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
                  ({currentCard.phrase.english})
                </div>
                {/* Literal/Breakdown placeholder */}
                <button className="text-xs text-gray-400 hover:text-gray-300 underline mb-3" onClick={(e) => e.stopPropagation()}>
                  Literal / breakdown
                </button>
                {/* Difficulty buttons */}
                <div className="flex flex-col items-center mb-6">
                  <div className="flex justify-center space-x-3">
                    <button onClick={() => handleAnswer(true)} className="neumorphic-button text-green-400 px-4 py-2 text-sm">Easy</button>
                    <button onClick={() => handleAnswer(true)} className="neumorphic-button text-yellow-400 px-4 py-2 text-sm">Correct</button>
                    <button onClick={() => handleAnswer(false)} className="neumorphic-button text-red-400 px-4 py-2 text-sm">Wrong</button>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">Hit one of the buttons to proceed.</div>
                </div>
              </div>
            </div>

            {/* Gender & Polite toggles */}
            <div className="flex items-center justify-center space-x-4 mb-6">
              <label htmlFor="gender-toggle-exam" className="flex items-center cursor-pointer">
                <span className="mr-2 text-sm font-medium text-gray-400">Female (Ka)</span>
                <div className="relative">
                  <input type="checkbox" id="gender-toggle-exam" className="sr-only" checked={isMale} onChange={() => setIsMale(!isMale)} />
                  <div className="block bg-gray-600 w-10 h-6 rounded-full"></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${isMale ? 'translate-x-full bg-blue-400' : 'bg-pink-400'}`}></div>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-400">Male (Krap)</span>
              </label>
              <label htmlFor="polite-toggle-exam" className="flex items-center cursor-pointer">
                <span className="mr-2 text-sm font-medium text-gray-400">Casual</span>
                <div className="relative">
                  <input type="checkbox" id="polite-toggle-exam" className="sr-only" checked={isPoliteMode} onChange={() => setIsPoliteMode(!isPoliteMode)} />
                  <div className="block bg-gray-600 w-10 h-6 rounded-full"></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${isPoliteMode ? 'translate-x-full bg-green-400' : 'bg-gray-400'}`}></div>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-400">Polite</span>
              </label>
            </div>

            {/* Mnemonic read-only */}
            {currentCard.phrase.mnemonic && (
              <div className="mt-2 w-full">
                <div className="neumorphic-input w-full min-h-24 rounded-lg p-4 text-gray-200 bg-[#1f1f1f] border border-[#333] text-base">
                  {currentCard.phrase.mnemonic}
                </div>
              </div>
            )}

            {/* In Context (matches style) */}
            {Array.isArray(currentCard.phrase.examples) && currentCard.phrase.examples.length > 0 && (
              <div className="mt-6 bg-[#161616] border border-[#333] rounded-xl p-5 text-center">
                <div className="text-blue-300 tracking-wide text-sm mb-2">IN CONTEXT</div>
                <div className="text-xl text-white font-semibold mb-1">{currentCard.phrase.examples[exampleIndex]?.thai || ''}</div>
                <div className="italic text-gray-300 mb-2">{currentCard.phrase.examples[exampleIndex]?.pronunciation || ''}</div>
                <div className="text-gray-400">{currentCard.phrase.examples[exampleIndex]?.translation || ''}</div>
                <div className="flex justify-between mt-4">
                  <button className="neumorphic-button px-4 py-2" onClick={() => setExampleIndex((i) => (i - 1 + currentCard.phrase.examples!.length) % currentCard.phrase.examples!.length)}>Prev</button>
                  <button
                    className="neumorphic-button px-4 py-2"
                    onClick={() => ttsService.speak({ text: currentCard.phrase.examples?.[exampleIndex]?.thai ?? '', genderValue: isMale })}
                  >
                    Play Context
                  </button>
                  <button className="neumorphic-button px-4 py-2" onClick={() => setExampleIndex((i) => (i + 1) % currentCard.phrase.examples!.length)}>Next</button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Footer */}
      <div className="mt-6 flex justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>
            {results.filter(r => r.correct).length} correct, {results.filter(r => !r.correct).length} incorrect
          </span>
        </div>
        <Button onClick={() => window.history.back()} variant="ghost" size="sm">Exit Exam</Button>
      </div>
    </div>
  );
}

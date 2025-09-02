'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Check, X, RotateCcw, Trophy, Clock, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playAudio } from '@/app/lib/audio';
import Image from 'next/image';

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
  const [results, setResults] = useState<ExamResult[]>([]);
  const [cardStartTime, setCardStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [examComplete, setExamComplete] = useState(false);

  // Fetch easy cards
  useEffect(() => {
    fetchEasyCards();
  }, []);

  const fetchEasyCards = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/easy-cards-exam');
      
      if (!response.ok) {
        throw new Error('Failed to fetch easy cards');
      }

      const data = await response.json();
      
      if (data.cards.length === 0) {
        setError('No easy cards found. Mark some cards as "Easy" in your sets to use this feature!');
      } else {
        // Shuffle cards for variety
        const shuffled = [...data.cards].sort(() => Math.random() - 0.5);
        setCards(shuffled);
        setCardStartTime(Date.now());
      }
    } catch (err) {
      console.error('Error fetching easy cards:', err);
      setError('Failed to load easy cards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
    if (currentCard?.phrase.audioUrl) {
      await playAudio(currentCard.phrase.audioUrl);
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold">Easy Cards Exam</h2>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {cards.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Card Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8">
            {/* Set Info */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
              {currentCard.setImageUrl && (
                <Image
                  src={currentCard.setImageUrl}
                  alt={currentCard.setName}
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
              )}
              <div>
                <p className="text-sm text-muted-foreground">From set:</p>
                <p className="font-semibold">{currentCard.setName}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm text-muted-foreground">Last reviewed:</p>
                <p className="text-sm">
                  {new Date(currentCard.lastReviewed).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Question */}
            <div className="text-center mb-8">
              <h3 className="text-4xl font-thai mb-4">{currentCard.phrase.thai}</h3>
              <p className="text-xl text-muted-foreground mb-2">
                {currentCard.phrase.romanization}
              </p>
              
              <Button
                onClick={playCardAudio}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                🔊 Play Audio
              </Button>
            </div>

            {/* Answer (hidden initially) */}
            {showAnswer && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="border-t pt-6"
              >
                <p className="text-xl font-semibold text-center mb-4">
                  {currentCard.phrase.english}
                </p>
                {currentCard.phrase.mnemonic && (
                  <p className="text-sm text-muted-foreground text-center italic">
                    💡 {currentCard.phrase.mnemonic}
                  </p>
                )}
              </motion.div>
            )}

            {/* Actions */}
            <div className="mt-8">
              {!showAnswer ? (
                <Button
                  onClick={() => setShowAnswer(true)}
                  size="lg"
                  className="w-full"
                >
                  Show Answer
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => handleAnswer(false)}
                    variant="outline"
                    size="lg"
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Incorrect
                  </Button>
                  <Button
                    onClick={() => handleAnswer(true)}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Correct
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Stats Footer */}
      <div className="mt-6 flex justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>
            {results.filter(r => r.correct).length} correct, {results.filter(r => !r.correct).length} incorrect
          </span>
        </div>
        <Button
          onClick={() => window.history.back()}
          variant="ghost"
          size="sm"
        >
          Exit Exam
        </Button>
      </div>
    </div>
  );
}

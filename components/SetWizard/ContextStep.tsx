import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ContextStepProps {
  topic: string;
  onNext: (context: { additionalContext: string }) => void;
  onBack: () => void;
}

export function ContextStep({ topic, onNext, onBack }: ContextStepProps) {
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [anythingElse, setAnythingElse] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateQuestions = async () => {
      try {
        const response = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate questions.');
        }

        const data = await response.json();
        setQuestions(data.questions);
        setAnswers(new Array(data.questions.length).fill(''));
      } catch (err) {
        setError('Could not fetch questions. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    generateQuestions();
  }, [topic]);

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    const combinedContext = questions
      .map((q, i) => `Q: ${q}\nA: ${answers[i]}`)
      .join('\n\n');
    const fullContext = `${combinedContext}\n\nAnything else: ${anythingElse}`;
    onNext({ additionalContext: fullContext });
  };
  
  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
      <div className="space-y-4 px-1 text-center">
        <h3 className="text-lg font-medium text-white">
          Let&apos;s refine that a bit...
        </h3>
        <p className="text-sm text-gray-400">
          To make the best flashcards for &quot;{topic}&quot;, please answer a few questions.
        </p>

        {isLoading && (
          <div className="flex flex-col justify-center items-center p-8 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <p className="text-gray-400">Generating questions...</p>
          </div>
        )}

        {error && <p className="text-red-500">{error}</p>}

        {!isLoading && !error && (
          <div className="space-y-4 text-left">
            {questions.map((q, i) => (
              <div key={i}>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">{q}</label>
                <input
                  type="text"
                  value={answers[i]}
                  onChange={(e) => handleAnswerChange(i, e.target.value)}
                  className="w-full bg-gray-900/50 border rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-700"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Anything else?</label>
              <textarea
                value={anythingElse}
                onChange={(e) => setAnythingElse(e.target.value)}
                placeholder="Any other details to consider?"
                className="w-full bg-gray-900/50 border rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-700"
                rows={3}
              />
            </div>
          </div>
        )}

        <div className="flex justify-between pt-3">
          <button onClick={onBack} className="neumorphic-button text-blue-400">
            Back
          </button>
          <button onClick={handleNext} className="neumorphic-button text-blue-400" disabled={isLoading}>
            Next
          </button>
        </div>
      </div>
    </motion.div>
  );
} 
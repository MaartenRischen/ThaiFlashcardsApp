import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ContextStepProps {
  topic: string;
  onNext: (context: { additionalContext: string }) => void;
  onBack: () => void;
}

// Pre-set questions that can apply to any topic
const PRESET_QUESTIONS = [
  "What specific aspects or situations would you like to focus on?",
  "Are there any particular challenges or difficulties you want to address?"
];

export function ContextStep({ topic, onNext, onBack }: ContextStepProps) {
  const [answers, setAnswers] = useState<string[]>(new Array(PRESET_QUESTIONS.length).fill(''));
  const [anythingElse, setAnythingElse] = useState('');

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    const combinedContext = PRESET_QUESTIONS
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

        <div className="space-y-4 text-left">
          {PRESET_QUESTIONS.map((q, i) => (
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
              placeholder="Any other details you'd like to include in your flashcards?"
              className="w-full bg-gray-900/50 border rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-700"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-between pt-3">
          <button onClick={onBack} className="neumorphic-button text-blue-400">
            Back
          </button>
          <button onClick={handleNext} className="neumorphic-button text-blue-400">
            Next
          </button>
        </div>
      </div>
    </motion.div>
  );
} 
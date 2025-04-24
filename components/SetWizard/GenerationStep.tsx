import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { generateCustomSet, Phrase } from '@/app/lib/set-generator';
import { SetWizardState } from './SetWizardModal';
import { Loader2 } from 'lucide-react';

interface GenerationStepProps {
  state: SetWizardState;
  onComplete: () => void;
  onBack: () => void;
}

export function GenerationStep({ state, onComplete, onBack }: GenerationStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedPhrases, setGeneratedPhrases] = useState<Phrase[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generatePhrases = async () => {
      try {
        setIsGenerating(true);
        setError(null);
        setGeneratedPhrases([]); // Reset phrases at start

        // Map SetWizardState to generateCustomSet parameters
        let level: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
        const estimate = state.proficiency.levelEstimate.toLowerCase();
        if (estimate.includes('intermediate')) level = 'intermediate';
        else if (estimate.includes('advanced')) level = 'advanced';

        const scenarios = state.scenarios?.filter(Boolean) || [];
        const customGoal = state.customGoal?.trim();
        const topicsToDiscuss = [
          ...scenarios,
          ...(customGoal ? [customGoal] : [])
        ].join(', ') || undefined;

        const specificTopics = state.topics.length > 0 ? state.topics.join(', ') : undefined;
        const totalCount = state.dailyGoal?.type === 'cards' && state.dailyGoal.value > 0 
          ? state.dailyGoal.value 
          : 12;

        const result = await generateCustomSet(
          {
            level,
            specificTopics,
            topicsToDiscuss,
            seriousnessLevel: state.tone ?? 50,
          },
          totalCount,
          (progress) => {
            setProgress((progress.completed / progress.total) * 100);
            if (progress.latestPhrases) {
              setGeneratedPhrases(prev => [...prev, ...(progress.latestPhrases as Phrase[])]);
            }
          }
        );

        if (result.phrases.length > 0) {
          // Don't override the accumulated phrases, just mark as complete
          setIsComplete(true);
        } else {
          setError('Failed to generate phrases. Please try again.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred during generation');
      } finally {
        setIsGenerating(false);
      }
    };

    generatePhrases();
  }, [state]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Progress value={progress} className="flex-1" />
        {isGenerating && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
      </div>

      {error && (
        <div className="text-red-500">{error}</div>
      )}

      <div className="space-y-2">
        <h3 className="font-semibold">Latest Generated Cards:</h3>
        <ul className="space-y-1">
          {generatedPhrases.map((phrase, index) => (
            <li key={index} className="text-sm">
              <div className="text-blue-400">{phrase.thai}</div>
              <div className="text-gray-400">{phrase.english}</div>
              {phrase.mnemonic && (
                <div className="text-yellow-600 text-xs italic">
                  Mnemonic: {phrase.mnemonic}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {isComplete && !isGenerating && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={() => {
            // Only complete if we actually have phrases
            if (generatedPhrases.length > 0) {
              onComplete();
            } else {
              setError('No phrases were generated. Please try again.');
            }
          }}>
            Complete Setup
          </Button>
        </div>
      )}
    </div>
  );
} 
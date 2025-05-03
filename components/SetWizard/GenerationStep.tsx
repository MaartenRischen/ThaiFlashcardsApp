import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { generateCustomSet, Phrase } from '@/app/lib/set-generator';
import { SetWizardState } from './SetWizardModal';
import { Loader2 } from 'lucide-react';
import { defaultTopics, ScenarioKey } from './TopicStep';

interface GenerationStepProps {
  state: SetWizardState;
  onComplete: () => void;
  onBack: () => void;
}

export function GenerationStep({ state, onComplete, onBack }: GenerationStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedPhrases, setGeneratedPhrases] = useState<Phrase[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generatePhrases = useCallback(async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setGeneratedPhrases([]);

      const scenarios = state.scenarios?.filter(Boolean) || [];
      const customGoal = state.customGoal?.trim();
      
      // For title generation and topics to discuss, prioritize custom goal if it exists
      const topicsToDiscuss = customGoal || (scenarios.length > 0 
        ? Array.from(new Set(scenarios)).join(' and ') 
        : Array.from(new Set(state.topics)).join(', '));

      // For content generation, combine all topics and deduplicate
      const allTopics = [
        customGoal,
        ...scenarios,
        ...state.topics
      ].filter(Boolean);
      const specificTopics = Array.from(new Set(allTopics)).join(', ');

      // Calculate total topics (using Set to avoid duplicates)
      const uniqueTopics = new Set(allTopics);
      const totalTopics = uniqueTopics.size || 1; // Ensure at least 1 topic
      
      // Calculate cards per topic, ensuring total doesn't exceed 50
      const totalCount = Math.min(
        totalTopics * 10, // 10 cards per topic
        50 // Maximum 50 cards total
      );
      
      // If we have more than 5 topics, reduce cards per topic to stay under 50
      const cardsPerTopic = totalTopics > 5 ? Math.floor(50 / totalTopics) : 10;
      
      console.log(`Generating set with ${totalCount} cards (${totalTopics} unique topics, ${cardsPerTopic} cards per topic)`);

      // Generate the set
      const preferences = {
        level: state.proficiency.levelEstimate,
        specificTopics,
        toneLevel: state.tone,
        topicsToDiscuss
      };

      console.log(`SetWizard Completion: Calling /api/generate-set with preferences:`, preferences, `count:`, totalCount);

      const result = await generateCustomSet(
        preferences,
        totalCount,
        (progress) => {
          setProgress((progress.completed / progress.total) * 100);
          if (progress.latestPhrases && progress.latestPhrases.length > 0) {
            setGeneratedPhrases(prev => [...prev, ...(progress.latestPhrases as Phrase[])]);
          }
        }
      );

      if (result.phrases.length > 0) {
        // Call onComplete immediately when generation is successful
        onComplete();
      } else {
        setError('Failed to generate phrases. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during generation');
    } finally {
      setIsGenerating(false);
    }
  }, [state, onComplete]);

  useEffect(() => {
    generatePhrases();
  }, [generatePhrases]);

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
        <h3 className="font-semibold">Generating your custom flashcards...</h3>
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

      {error && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={generatePhrases}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
} 
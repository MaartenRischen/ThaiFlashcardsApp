import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Phrase } from '@/app/lib/set-generator';
import { SetWizardState } from './SetWizardModal';
import { Loader2 } from 'lucide-react';

interface GenerationStepProps {
  state: SetWizardState;
  onComplete: () => void;
  onBack: () => void;
}

export function GenerationStep({ state, onComplete, onBack }: GenerationStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPhrases, setGeneratedPhrases] = useState<Phrase[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generatePhrases = useCallback(async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setGeneratedPhrases([]);

      // Use the single selected topic from the state
      const selectedTopicValue = state.selectedTopic?.value;

      if (!selectedTopicValue) {
        setError('No topic selected to generate.');
        setIsGenerating(false);
        return;
      }
      
      // Use the single topic value for both title/discussion and content generation
      const topicsToDiscuss = selectedTopicValue;
      const specificTopics = selectedTopicValue;

      // FIXED: Use the cardCount from the state
      const totalCount = state.cardCount;
      
      console.log(`Generating set with ${totalCount} cards for topic: ${specificTopics}`);

      // Generate the set
      const preferences = {
        level: state.proficiency.levelEstimate,
        specificTopics,
        toneLevel: state.tone,
        topicsToDiscuss,
        additionalContext: state.additionalContext,
      };

      console.log(`SetWizard Completion: Calling /api/generate-set with preferences:`, preferences, `count:`, totalCount);

      // Call the API route instead of generateCustomSet directly
      const response = await fetch('/api/generate-set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences, totalCount }),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `API request failed with status ${response.status}`);
      }

      // Assuming the API response contains the generated phrases if successful
      // We might not need to display them here, as the main page handles completion
      // setGeneratedPhrases(result.phrases || []); 
      console.log("GenerationStep: API call successful, triggering onComplete.");

      onComplete(); // Trigger completion

    } catch (err) {
      console.error("Error in GenerationStep generatePhrases:", err);
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
        {/* Removed Progress component as setProgress is unused */}
        {/* <Progress value={progress} className="flex-1" /> */}
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
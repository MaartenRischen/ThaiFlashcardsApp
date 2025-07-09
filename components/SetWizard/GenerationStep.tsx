import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { SetWizardState } from './SetWizardModal';
import { Sparkles } from 'lucide-react';
import { GenerationProgress } from '@/app/components/GenerationProgress';

interface GenerationStepProps {
  state: SetWizardState;
  onComplete: () => void;
  onBack: () => void;
}

export function GenerationStep({ state, onComplete, onBack }: GenerationStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const generatePhrases = useCallback(async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setProgress(0);

      const selectedTopicValue = state.selectedTopic?.value;

      if (!selectedTopicValue) {
        setError('No topic selected to generate.');
        setIsGenerating(false);
        return;
      }
      
      const topicsToDiscuss = selectedTopicValue;
      const specificTopics = selectedTopicValue;
      const totalCount = state.cardCount;
      
      console.log(`Generating set with ${totalCount} cards for topic: ${specificTopics}`);

      const preferences = {
        level: state.proficiency.levelEstimate,
        specificTopics,
        toneLevel: state.tone,
        topicsToDiscuss,
        additionalContext: state.additionalContext,
      };

      console.log(`SetWizard Completion: Calling /api/generate-set with preferences:`, preferences, `count:`, totalCount);

      // Create an EventSource for SSE
      const eventSource = new EventSource(`/api/generate-set?${new URLSearchParams({
        preferences: JSON.stringify(preferences),
        totalCount: totalCount.toString()
      })}`);

      // Handle progress events
      eventSource.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        setProgress(Math.round((data.completed / data.total) * 100));
      };

      // Handle completion
      eventSource.addEventListener('complete', (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        console.log("GenerationStep: API call successful, triggering onComplete.");
        eventSource.close();
        onComplete();
      });

      // Handle errors
      eventSource.onerror = (event: Event) => {
        eventSource.close();
        throw new Error('Generation failed');
      };

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
    <>
      <GenerationProgress isGenerating={isGenerating} progress={progress} />
      
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-6 p-4">
        {isGenerating ? (
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
              <Sparkles className="w-12 h-12 text-blue-400 animate-bounce" />
            </div>
            <h3 className="text-xl font-semibold text-[#60A5FA]">Creating Your Custom Set</h3>
            <p className="text-gray-400 text-sm max-w-md">
              We&apos;re crafting personalized flashcards based on your preferences. This usually takes about 2 minutes.
            </p>
          </div>
        ) : error ? (
          <div className="text-center space-y-4">
            <div className="text-red-500 bg-red-500/10 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Generation Error</h3>
              <p className="text-sm">{error}</p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
              <Button onClick={generatePhrases}>
                Try Again
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
} 
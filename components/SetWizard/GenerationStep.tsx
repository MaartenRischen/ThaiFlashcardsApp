import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { SetWizardState } from './SetWizardModal';
import { Sparkles } from 'lucide-react';
import { GenerationProgress } from '@/app/components/GenerationProgress';
import { useSet } from '@/app/context/SetContext';
import { SetMetaData } from '@/app/lib/storage';
import { getToneLabel } from '@/app/lib/utils';

interface GenerationStepProps {
  state: SetWizardState;
  onComplete: () => void;
  onBack: () => void;
  onClose: () => void;
  onOpenSetManager: () => void;
}

// Helper to convert PascalCase level to lowercase
function getLowerCaseLevel(level: string): SetMetaData['level'] {
  return level.toLowerCase().replace(/ /g, ' ') as SetMetaData['level'];
}

export function GenerationStep({ state, onComplete, onBack, onClose, onOpenSetManager }: GenerationStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAvailableSets } = useSet();

  const generatePhrases = useCallback(async () => {
    try {
      setIsGenerating(true);
      setError(null);

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

      // Add placeholder set to the list
      const placeholderSet: SetMetaData = {
        id: 'generating',
        name: `${specificTopics} (Generating...)`,
        createdAt: new Date().toISOString(),
        phraseCount: totalCount,
        source: 'generated',
        isFullyLearned: false,
        level: getLowerCaseLevel(preferences.level),
        specificTopics: preferences.specificTopics,
        seriousnessLevel: preferences.toneLevel,
        toneLevel: getToneLabel(preferences.toneLevel),
      };
      setAvailableSets(sets => [...sets, placeholderSet]);

      // Close wizard and open My Sets modal
      onClose();
      onOpenSetManager();

      console.log(`SetWizard Completion: Calling /api/generate-set with preferences:`, preferences, `count:`, totalCount);

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

      // Remove placeholder and add real set
      setAvailableSets(sets => {
        const filtered = sets.filter(s => s.id !== 'generating');
        return [...filtered, result.newSetMetaData];
      });

      console.log("GenerationStep: API call successful, triggering onComplete.");
      onComplete();

    } catch (err) {
      console.error("Error in GenerationStep generatePhrases:", err);
      setError(err instanceof Error ? err.message : 'An error occurred during generation');
      
      // Remove placeholder on error
      setAvailableSets(sets => sets.filter(s => s.id !== 'generating'));
    } finally {
      setIsGenerating(false);
    }
  }, [state, onComplete, onClose, onOpenSetManager, setAvailableSets]);

  useEffect(() => {
    generatePhrases();
  }, [generatePhrases]);

  return (
    <>
      <GenerationProgress isGenerating={isGenerating} />
      
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
import React, { useState } from 'react';
import { GenerationStatusModal } from './GenerationStatusModal';
import { generateCustomSet, type Phrase, type GenerationResult } from '@/app/lib/set-generator';
import type { SetWizardState } from './SetWizardModal';

interface SetGenerationWrapperProps {
  wizardState: SetWizardState;
  onComplete: (phrases: Phrase[]) => void;
  onError: (error: string) => void;
}

export function SetGenerationWrapper({
  wizardState,
  onComplete,
  onError,
}: SetGenerationWrapperProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [latestPhrases, setLatestPhrases] = useState<Phrase[]>([]);
  const [error, setError] = useState<string | undefined>();

  React.useEffect(() => {
    const generate = async () => {
      try {
        setIsGenerating(true);
        setError(undefined);

        // Map wizardState to the format expected by generateCustomSet
        const preferences = {
          // Map proficiency level to set-generator level
          level: mapProficiencyToLevel(wizardState.proficiency.levelEstimate),
          // Join scenarios and topics into specificTopics
          specificTopics: [...wizardState.scenarios, ...wizardState.topics].join(', '),
          // Map tone (0-100) to seriousnessLevel (0-100)
          seriousnessLevel: wizardState.tone
        };

        // Total cards to generate (could be configurable or based on daily goal)
        const totalCards = wizardState.dailyGoal?.type === 'cards' 
          ? wizardState.dailyGoal.value 
          : 20; // Default to 20 cards if not specified

        const result: GenerationResult = await generateCustomSet(
          preferences, 
          totalCards,
          (update) => {
            setProgress({
              completed: update.completed,
              total: update.total
            });
            
            // The latestPhrases from the update might be undefined
            const newPhrases = update.latestPhrases || [];
            if (newPhrases.length > 0) {
              setLatestPhrases(prev => {
                // Keep only the most recent phrases (up to 5)
                const combined = [...prev, ...newPhrases];
                return combined.slice(Math.max(0, combined.length - 5));
              });
            }
          }
        );

        // Handle completion - pass the phrases array from the result
        onComplete(result.phrases);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        onError(errorMessage);
      } finally {
        setIsGenerating(false);
      }
    };

    generate();
  }, [wizardState, onComplete, onError]);

  return (
    <GenerationStatusModal
      isOpen={isGenerating}
      onClose={() => {}} // Modal can't be closed during generation
      completed={progress.completed}
      total={progress.total}
      latestPhrases={latestPhrases}
      error={error}
    />
  );
}

// Helper function to map proficiency level to set-generator level
function mapProficiencyToLevel(proficiencyLevel: string): 'beginner' | 'intermediate' | 'advanced' {
  switch (proficiencyLevel.toLowerCase()) {
    case 'beginner':
    case 'novice':
      return 'beginner';
    case 'intermediate':
      return 'intermediate';
    case 'advanced':
    case 'expert':
      return 'advanced';
    default:
      // Default to intermediate if level is unknown
      return 'intermediate';
  }
} 
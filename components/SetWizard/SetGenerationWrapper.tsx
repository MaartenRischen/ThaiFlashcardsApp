import React, { useState, useEffect } from 'react';
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
  const [showModal, setShowModal] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [latestPhrases, setLatestPhrases] = useState<Phrase[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [generatedPhrases, setGeneratedPhrases] = useState<Phrase[]>([]);

  // Keep modal open for at least 3 seconds after completion
  useEffect(() => {
    if (progress.completed === progress.total && progress.total > 0) {
      const timer = setTimeout(() => {
        if (generatedPhrases.length > 0) {
          setShowModal(false);
          onComplete(generatedPhrases);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [progress, generatedPhrases, onComplete]);

  // Start generation when component mounts
  useEffect(() => {
    const generate = async () => {
      try {
        setIsGenerating(true);
        setShowModal(true);
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

        console.log(`Starting generation with preferences:`, preferences, `and totalCards:`, totalCards);

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

        // Store generated phrases but don't complete yet (wait for timeout)
        console.log(`Generation complete with ${result.phrases.length} phrases`);
        setGeneratedPhrases(result.phrases);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        console.error(`Generation error:`, errorMessage);
        setError(errorMessage);
        onError(errorMessage);
        
        // Even with an error, keep the modal visible for a moment
        setTimeout(() => {
          setShowModal(false);
        }, 3000);
      } finally {
        setIsGenerating(false);
      }
    };

    generate();
  }, [wizardState, onError]);

  // Handle manual modal close
  const handleModalClose = () => {
    if (!isGenerating) {
      setShowModal(false);
      if (generatedPhrases.length > 0) {
        onComplete(generatedPhrases);
      } else if (error) {
        onError(error);
      }
    }
  };

  return (
    <GenerationStatusModal
      isOpen={showModal}
      onClose={handleModalClose}
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
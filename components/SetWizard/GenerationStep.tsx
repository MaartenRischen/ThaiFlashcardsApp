import React, { useState, useEffect } from 'react';
import { generateCustomSet, type Phrase, type GenerationResult } from '@/app/lib/set-generator';
import type { SetWizardState } from './SetWizardModal';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface GenerationStepProps {
  state: SetWizardState;
  onBack: () => void;
  onComplete: (phrases: Phrase[]) => void;
}

export function GenerationStep({ state, onBack, onComplete }: GenerationStepProps) {
  const [isGenerating, setIsGenerating] = useState(true);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [latestPhrases, setLatestPhrases] = useState<Phrase[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [generatedPhrases, setGeneratedPhrases] = useState<Phrase[]>([]);

  // Calculate progress percentage
  const progressPercentage = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
  const isComplete = progress.completed === progress.total && progress.total > 0;

  // Start generation when component mounts
  useEffect(() => {
    const generate = async () => {
      try {
        setIsGenerating(true);
        setError(undefined);

        // Map wizardState to the format expected by generateCustomSet
        const preferences = {
          level: mapProficiencyToLevel(state.proficiency.levelEstimate),
          specificTopics: [...state.scenarios, ...state.topics].join(', '),
          seriousnessLevel: state.tone
        };

        // Total cards to generate (could be configurable or based on daily goal)
        const totalCards = state.dailyGoal?.type === 'cards' 
          ? state.dailyGoal.value 
          : 10; // Default to 10 cards

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

        // Store generated phrases and complete the process
        console.log(`Generation complete with ${result.phrases.length} phrases`);
        setGeneratedPhrases(result.phrases);
        
        // Complete after 2 seconds to show the full progress
        if (result.phrases.length > 0) {
          setTimeout(() => {
            onComplete(result.phrases);
          }, 2000);
        } else {
          // Handle case with no phrases
          setError("No phrases were generated. Please try again with different preferences.");
        }
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        console.error(`Generation error:`, errorMessage);
        setError(errorMessage);
      } finally {
        setIsGenerating(false);
      }
    };

    generate();
  }, [state, onComplete]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-semibold text-blue-400">
          {isComplete ? "Set Created Successfully!" : "Generating Your Flashcards"}
        </h3>
        <p className={`text-lg ${error ? "text-red-400" : "text-gray-300"}`}>
          {error || (isComplete 
            ? "All cards have been generated!" 
            : `Generated ${progress.completed} of ${progress.total} cards`)}
        </p>
      </div>

      <div className="space-y-2">
        <Progress value={progressPercentage} className="h-3 bg-gray-700" />
        <div className="flex justify-between text-sm text-gray-400">
          <span>0%</span>
          <span>{progressPercentage}%</span>
          <span>100%</span>
        </div>
      </div>

      {latestPhrases.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-200">Latest Generated Cards</h4>
          <div className="grid gap-3">
            {latestPhrases.slice(-3).map((phrase, index) => (
              <motion.div
                key={phrase.thai + index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="neumorphic-card p-4 bg-[#222222] border-none">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="font-medium text-xl text-blue-300">{phrase.thai}</p>
                      <p className="text-gray-400">{phrase.pronunciation}</p>
                    </div>
                    <p className="text-gray-200 font-medium">{phrase.english}</p>
                    {phrase.mnemonic && (
                      <p className="text-sm text-gray-400 italic">
                        <span className="text-yellow-400 font-semibold">Mnemonic:</span> {phrase.mnemonic}
                      </p>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {isComplete ? (
            <p className="text-center text-green-400 font-medium">
              All {progress.total} cards have been successfully generated!
            </p>
          ) : (
            <div className="flex justify-center pt-2">
              <div className="flex space-x-2" aria-label="Generating cards...">
                <div className="h-3 w-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="h-3 w-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="h-3 w-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex justify-center">
          <button 
            onClick={onBack}
            className="px-6 py-2 bg-red-700 hover:bg-red-600 rounded-md transition-colors"
          >
            Go Back
          </button>
        </div>
      )}
    </div>
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
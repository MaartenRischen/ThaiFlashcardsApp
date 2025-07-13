import { useState, useCallback, useEffect } from 'react';
import { useSet } from '@/app/context/SetContext';
import { Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GenerationProgress } from '@/app/components/GenerationProgress';
import { getToneLabel } from '@/app/lib/utils';
import { SetMetaData } from '@/app/lib/storage';
import { SetWizardState } from './types';
import { motion } from 'framer-motion';

interface GenerationStepProps {
  state: SetWizardState;
  onComplete: (newSetId: string) => void;
  onBack: () => void;
  onClose: () => void;
  onOpenSetManager: (setToSelect?: string) => void;
}

// Helper to convert PascalCase level to lowercase
function getLowerCaseLevel(level: string): SetMetaData['level'] {
  return level.toLowerCase().replace(/ /g, ' ') as SetMetaData['level'];
}

// Placeholder image URL - will be generated on first use
let placeholderImageUrl: string | null = null;

export function GenerationStep({ state, onComplete, onBack, onClose, onOpenSetManager }: GenerationStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasStartedGeneration, setHasStartedGeneration] = useState(false);
  const { setAvailableSets } = useSet();

  const generatePhrases = useCallback(async () => {
    // Prevent multiple generations
    if (hasStartedGeneration || isGenerating) {
      console.log('Generation already in progress or completed, skipping...');
      return;
    }
    
    const startTime = Date.now();
    
    try {
      setHasStartedGeneration(true);
      setIsGenerating(true);
      setError(null);

      // Handle manual mode
      if (state.mode === 'manual' && state.manualPhrases) {
        const totalCount = state.manualPhrases.length;
        
        console.log(`Processing manual input with ${totalCount} phrases`);

        // Get or generate placeholder image URL
        if (!placeholderImageUrl) {
          try {
            const response = await fetch('/api/generate-placeholder-image');
            if (response.ok) {
              const data = await response.json();
              placeholderImageUrl = data.imageUrl;
            }
          } catch (error) {
            console.error('Failed to get placeholder image:', error);
          }
        }

        // Add placeholder set
        const placeholderSet: SetMetaData = {
          id: 'generating',
          name: `Custom Set (Processing...)`,
          createdAt: new Date().toISOString(),
          phraseCount: totalCount,
          source: 'manual',
          isFullyLearned: false,
          level: 'intermediate',
          specificTopics: 'Custom Vocabulary',
          seriousnessLevel: 5,
          toneLevel: 'Balanced',
          imageUrl: placeholderImageUrl || undefined
        };
        setAvailableSets(sets => [...sets, placeholderSet]);

        // Open My Sets modal with placeholder
        onOpenSetManager('generating');

        // Call API to process manual phrases
        const response = await fetch('/api/generate-set', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mode: 'manual',
            englishPhrases: state.manualPhrases,
            totalCount
          }),
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

        console.log("GenerationStep: Manual set processed successfully.");
        
        // Add a minimum display time of 3 seconds
        const MIN_DISPLAY_TIME = 3000;
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_DISPLAY_TIME - elapsedTime);
        
        setTimeout(() => {
          onComplete(result.newSetMetaData.id);
        }, remainingTime);
        return;
      }

      // Auto mode logic
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

      // Get or generate placeholder image URL
      if (!placeholderImageUrl) {
        try {
          const response = await fetch('/api/generate-placeholder-image');
          if (response.ok) {
            const data = await response.json();
            placeholderImageUrl = data.imageUrl;
          }
        } catch (error) {
          console.error('Failed to get placeholder image:', error);
        }
      }

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
        imageUrl: placeholderImageUrl || undefined
      };
      setAvailableSets(sets => [...sets, placeholderSet]);

      // Close wizard and open My Sets modal
      onClose();
      onOpenSetManager('generating');

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
      
      // Add a minimum display time of 3 seconds
      const MIN_DISPLAY_TIME = 3000;
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_DISPLAY_TIME - elapsedTime);
      
      setTimeout(() => {
        onComplete(result.newSetMetaData.id);
      }, remainingTime);

    } catch (err) {
      console.error("Error in GenerationStep generatePhrases:", err);
      console.error("Full error details:", {
        error: err,
        state: state,
        mode: state.mode,
        manualPhrases: state.manualPhrases
      });
      setError(err instanceof Error ? err.message : 'An error occurred during generation');
      
      // Remove placeholder on error
      setAvailableSets(sets => sets.filter(s => s.id !== 'generating'));
    } finally {
      setIsGenerating(false);
    }
  }, [state, onComplete, onClose, onOpenSetManager, setAvailableSets, hasStartedGeneration, isGenerating]);

  useEffect(() => {
    // Only generate if we haven't started yet
    if (!hasStartedGeneration && !isGenerating) {
      generatePhrases();
    }
    
    // Cleanup function to reset state when component unmounts
    return () => {
      setHasStartedGeneration(false);
      setIsGenerating(false);
      setError(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  return (
    <>
      <GenerationProgress isGenerating={isGenerating} />
      
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        {isGenerating ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="relative">
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -inset-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-2xl"
              />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-16 h-16 text-blue-400 relative" />
              </motion.div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-[#E0E0E0]">
                {state.mode === 'manual' 
                  ? 'Saving your custom flashcard set!' 
                  : 'Let&apos;s create your personalized Thai flashcard set!'}
              </h3>
              <p className="text-gray-400 max-w-md">
                {state.mode === 'manual'
                  ? `We're saving your ${state.manualPhrases?.length || 0} custom flashcards.`
                  : `We're crafting ${state.cardCount} personalized flashcards based on your preferences. This usually takes about 2 minutes.`}
              </p>
            </div>

            {state.mode === 'manual' ? (
              <div className="neumorphic p-4 rounded-xl max-w-sm mx-auto">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Mode:</span>
                    <span className="text-[#E0E0E0] font-medium">Manual Input</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Cards:</span>
                    <span className="text-[#E0E0E0] font-medium">{state.manualPhrases?.length || 0}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="neumorphic p-4 rounded-xl max-w-sm mx-auto">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Topic:</span>
                    <span className="text-[#E0E0E0] font-medium">{state.selectedTopic?.value || 'Custom'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Level:</span>
                    <span className="text-[#E0E0E0] font-medium">{state.proficiency.levelEstimate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Style:</span>
                    <span className="text-[#E0E0E0] font-medium">{getToneLabel(state.tone)}</span>
                  </div>
                </div>
              </div>
            )}

            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-sm text-gray-400"
            >
              &quot;Generating...&quot;
            </motion.div>
          </motion.div>
        ) : error ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 max-w-md"
          >
            <div className="neumorphic p-6 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="font-semibold text-[#E0E0E0] mb-2">Generation Error</h3>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button 
                variant="outline" 
                onClick={onBack}
                className="neumorphic-button text-gray-400"
              >
                Back
              </Button>
              <Button 
                onClick={generatePhrases}
                className="neumorphic-button text-blue-400"
              >
                Try Again
              </Button>
            </div>
          </motion.div>
        ) : null}
      </div>
    </>
  );
} 
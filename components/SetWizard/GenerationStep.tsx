'use client'

import React, { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useGeneration } from '@/app/context/GenerationContext';
import { SetWizardState } from './types';
import { useSet } from '@/app/context/SetContext';

interface GenerationStepProps {
  state: SetWizardState;
  onComplete: (setId: string) => void;
  onBack: () => void;
  onClose: () => void;
  onOpenSetManager: (setToSelect?: string) => void;
}

export function GenerationStep({ 
  state, 
  onComplete,
  onBack: _onBack,
  onClose: _onClose,
  onOpenSetManager: _onOpenSetManager
}: GenerationStepProps) {
  const { startGeneration, updateProgress, completeGeneration, failGeneration } = useGeneration();
  const { addSet: _addSet, refreshSets } = useSet();
  const [hasStarted, setHasStarted] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Prevent double execution
    if (hasStarted) return;
    
    const generateSet = async () => {
      console.log('GenerationStep: Starting generation process...');
      setHasStarted(true);
      
      // Start generation when component mounts
      const phraseCount = state.mode === 'manual' 
        ? (state.manualPhrases?.length || 0) 
        : state.cardCount;
        
      console.log('GenerationStep: Mode:', state.mode, 'Phrase count:', phraseCount);
      startGeneration(state.mode || 'auto', phraseCount);
      
      try {
        updateProgress(10, 'Preparing generation...');
        
        // Start simulated progress updates
        let simulatedProgress = 10;
        progressIntervalRef.current = setInterval(() => {
          simulatedProgress += Math.random() * 5; // Increment by 0-5%
          if (simulatedProgress < 70) { // Don't go beyond 70% with simulation
            if (state.mode === 'manual') {
              const messages = [
                'Processing your phrases...',
                'Translating to Thai...',
                'Adding pronunciations...',
                'Creating mnemonics...',
                'Generating flashcards...'
              ];
              const messageIndex = Math.floor((simulatedProgress / 70) * messages.length);
              updateProgress(simulatedProgress, messages[Math.min(messageIndex, messages.length - 1)]);
            } else {
              const messages = [
                'Contacting AI service...',
                'Analyzing your preferences...',
                'Crafting Thai phrases...',
                'Generating contextual examples...',
                'Creating flashcards...'
              ];
              const messageIndex = Math.floor((simulatedProgress / 70) * messages.length);
              updateProgress(simulatedProgress, messages[Math.min(messageIndex, messages.length - 1)]);
            }
          }
        }, 1000);
        
        if (state.mode === 'manual' && state.manualPhrases) {
          // Manual mode - call the API with manual phrases
          console.log('GenerationStep: Calling API for manual mode with phrases:', state.manualPhrases);
          
          const response = await fetch('/api/generate-set', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              mode: 'manual',
              englishPhrases: state.manualPhrases,
              totalCount: state.manualPhrases.length
            }),
            credentials: 'include'
          });
          
          console.log('GenerationStep: API response status:', response.status);
          
          if (!response.ok) {
            const error = await response.json();
            console.error('GenerationStep: API error:', error);
            throw new Error(error.error || 'Failed to generate set');
          }
          
          const result = await response.json();
          console.log('GenerationStep: API result:', result);
          
          // Clear simulated progress
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          
          updateProgress(80, 'Saving your flashcards...');
          
          // The API already created the set, so we just need to refresh and switch to it
          await refreshSets();
          
          updateProgress(100, 'Complete!');
          
          // Small delay to show completion
          await new Promise(resolve => setTimeout(resolve, 500));
          
          completeGeneration();
          
          if (result.newSetMetaData?.id) {
            console.log('GenerationStep: Calling onComplete with set ID:', result.newSetMetaData.id);
            onComplete(result.newSetMetaData.id);
          }
        } else {
          // Auto mode - generate with AI
          const preferences = {
            level: state.proficiency?.levelEstimate || 'Complete Beginner',
            specificTopics: state.selectedTopic?.value || '',
            toneLevel: state.tone || 5,
            topicsToDiscuss: state.selectedTopic?.value || '',
            additionalContext: state.additionalContext || ''
          };
          
          console.log('GenerationStep: Calling API for auto mode with preferences:', preferences);
          
          const response = await fetch('/api/generate-set', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              preferences,
              totalCount: state.cardCount || 10,
              mode: 'auto'
            }),
            credentials: 'include'
          });
          
          console.log('GenerationStep: API response status:', response.status);
          
          if (!response.ok) {
            const error = await response.json();
            console.error('GenerationStep: API error:', error);
            throw new Error(error.error || 'Failed to generate set');
          }
          
          // Clear simulated progress
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          
          updateProgress(70, 'AI is finalizing your flashcards...');
          
          const result = await response.json();
          console.log('GenerationStep: API result:', result);
          
          updateProgress(80, 'Saving your flashcards...');
          
          // The API already created the set, so we just need to refresh and switch to it
          await refreshSets();
          
          updateProgress(100, 'Complete!');
          
          // Small delay to show completion
          await new Promise(resolve => setTimeout(resolve, 500));
          
          completeGeneration();
          
          if (result.newSetMetaData?.id) {
            console.log('GenerationStep: Calling onComplete with set ID:', result.newSetMetaData.id);
            onComplete(result.newSetMetaData.id);
          }
        }
      } catch (error) {
        console.error('GenerationStep: Generation error:', error);
        
        // Clear simulated progress
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        
        failGeneration();
        alert(`Failed to generate set: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    
    generateSet();
    
    // Cleanup interval on unmount
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - we only want to run once on mount

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Creating Your Set</h2>
        <p className="text-gray-600 mb-8">
          Your flashcard set is being generated. This will take a moment...
        </p>
      </div>
      
      <div className="flex justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
      
      <div className="text-center text-sm text-gray-500">
        <p>Generating {state.mode === 'manual' ? 'translations and' : ''} flashcards...</p>
        <p className="mt-2">You can close this window - we'll notify you when it's ready!</p>
      </div>
    </div>
  );
} 
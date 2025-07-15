'use client'

import React, { useEffect, useContext } from 'react';
import { Loader2 } from 'lucide-react';
import { useGeneration } from '@/app/context/GenerationContext';

interface GenerationStepProps {
  wizardState: {
    setType: string;
    selectedPhrases: string[];
    proficiencyLevel: string;
    mode?: 'auto' | 'manual';
    manualPhrases?: string[];
  };
  onComplete: (setId: string) => void;
  onBack: () => void;
  onOpenSetManager: () => void;
}

export function GenerationStep({ 
  wizardState, 
  onComplete,
  onBack: _onBack,
  onOpenSetManager: _onOpenSetManager
}: GenerationStepProps) {
  const { startGeneration } = useGeneration();

  useEffect(() => {
    // Start generation when component mounts
    const phraseCount = wizardState.mode === 'manual' 
      ? (wizardState.manualPhrases?.length || 0) 
      : 20; // Default count for auto mode
      
    startGeneration(wizardState.mode || 'auto', phraseCount);
  }, []); // Empty dependency array to run only once on mount

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
        <p>Generating {wizardState.mode === 'manual' ? 'translations and' : ''} flashcards...</p>
        <p className="mt-2">You can close this window - we'll notify you when it's ready!</p>
      </div>
    </div>
  );
} 
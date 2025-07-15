'use client'

import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useGeneration } from '@/app/context/GenerationContext';
import { SetWizardState } from './types';

interface GenerationStepProps {
  state: SetWizardState;
  onComplete: (setId: string) => void;
  onBack: () => void;
  onClose: () => void;
  onOpenSetManager: (setToSelect?: string) => void;
}

export function GenerationStep({ 
  state, 
  onComplete: _onComplete,
  onBack: _onBack,
  onClose: _onClose,
  onOpenSetManager: _onOpenSetManager
}: GenerationStepProps) {
  const { startGeneration } = useGeneration();

  useEffect(() => {
    // Start generation when component mounts
    const phraseCount = state.mode === 'manual' 
      ? (state.manualPhrases?.length || 0) 
      : state.cardCount;
      
    startGeneration(state.mode || 'auto', phraseCount);
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
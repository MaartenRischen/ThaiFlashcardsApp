'use client'

import React, { useEffect, useState, useRef } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import ThaiFactInline from '@/app/components/ThaiFactInline';
import { useGeneration } from '@/app/context/GenerationContext';
import { SetWizardState } from './types';
import { useSet } from '@/app/context/SetContext';
import { SetMetaData } from '@/app/lib/storage';

interface GenerationResponse {
  newSetMetaData: SetMetaData;
  phrases: Array<{
    english: string;
    thai: string;
    pronunciation: string;
    mnemonic?: string;
  }>;
  generationTime: number;
}

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
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [showVisibilityWarning, setShowVisibilityWarning] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Page visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsPageVisible(isVisible);
      
      if (!isVisible && hasStarted) {
        // User switched away during generation
        setShowVisibilityWarning(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasStarted]);

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
        
        // Start simulated progress updates (cap at ~75% until server responds)
        let currentPhrase = 0;
        const maxSimulated = Math.max(1, Math.floor(phraseCount * 0.75));
        progressIntervalRef.current = setInterval(() => {
          if (currentPhrase < maxSimulated) {
            currentPhrase += 1;
            updateProgress(currentPhrase);
          }
        }, 300); // Update every 300ms instead of 1200ms for smoother progress
        
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
          
          if (response.status === 401) {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            failGeneration();
            alert('Please sign in to create a custom set.');
            return;
          }
          if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Failed to generate set';
            try {
              const parsed = JSON.parse(errorText);
              errorMessage = parsed.error || errorMessage;
            } catch {
              errorMessage = errorText || errorMessage;
            }
            console.error('GenerationStep: API error:', errorMessage);
            throw new Error(errorMessage);
          }
          
          let result: GenerationResponse;
          try {
            result = await response.json();
          } catch (e) {
            throw new Error('Unexpected response from server while generating set');
          }
          console.log('GenerationStep: API result:', result);
          
          // Clear simulated progress
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          
          // Update to show final progress (100%)
          updateProgress(phraseCount);
          
          // The API already created the set, so we just need to refresh and switch to it
          await refreshSets();
          
          // Wait a bit longer to ensure the sets are fully loaded
          await new Promise(resolve => setTimeout(resolve, 1500));
          
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
          
          if (response.status === 401) {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            failGeneration();
            alert('Please sign in to generate a set.');
            return;
          }
          if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Failed to generate set';
            try {
              const parsed = JSON.parse(errorText);
              errorMessage = parsed.error || errorMessage;
            } catch {
              errorMessage = errorText || errorMessage;
            }
            console.error('GenerationStep: API error:', errorMessage);
            throw new Error(errorMessage);
          }
          
          // Clear simulated progress
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          
          // updateProgress(70, 'AI is finalizing your flashcards...'); // Removed updateProgress
          
          let result: GenerationResponse;
          try {
            result = await response.json();
          } catch (e) {
            throw new Error('Unexpected response from server while generating set');
          }
          console.log('GenerationStep: API result:', result);
          
          // Clear simulated progress
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          
          // Update to show final progress (100%)
          updateProgress(phraseCount);
          
          // The API already created the set, so we just need to refresh and switch to it
          await refreshSets();
          
          // Wait a bit longer to ensure the sets are fully loaded
          await new Promise(resolve => setTimeout(resolve, 1500));
          
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
        
        // Provide more helpful error messages
        let errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (error instanceof Error && error.name === 'AbortError') {
          errorMessage = 'Generation is taking too long. The server might be overloaded. Please try again later.';
        } else if (errorMessage.includes('No phrases were generated')) {
          errorMessage = 'The AI service is temporarily unavailable. This could be due to:\n\n' +
            '• OpenRouter API is down or experiencing issues\n' +
            '• API key has insufficient credits\n' +
            '• Rate limiting from too many requests\n\n' +
            'Please try again in a moment or contact support if the issue persists.';
        } else if (errorMessage.includes('Rate limit exceeded')) {
          errorMessage = 'Too many requests. Please wait a minute and try again.';
        } else if (errorMessage.includes('Insufficient credits')) {
          errorMessage = 'The API has run out of credits. Please contact the app administrator.';
        } else if (errorMessage.includes('Invalid API key')) {
          errorMessage = 'API configuration error. Please contact support.';
        }
        
        alert(errorMessage);
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

      {/* Important warning about staying in the app */}
      <div className="neumorphic rounded-xl p-4 border border-yellow-500/30 bg-yellow-50/10">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-yellow-500 mb-1">Important: Stay in this app</p>
            <p className="text-gray-300 leading-relaxed">
              Please keep this app open and visible during generation. 
              Switching apps or minimizing the browser may cause the generation to fail.
            </p>
          </div>
        </div>
      </div>

      {/* Visibility warning if user switched away */}
      {showVisibilityWarning && (
        <div className="neumorphic rounded-xl p-4 border border-red-500/30 bg-red-50/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-red-500 mb-1">Warning: App was minimized</p>
              <p className="text-gray-300 leading-relaxed">
                You switched away from the app during generation. This may cause the process to fail. 
                Please return to this app and keep it visible until generation completes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Page visibility indicator */}
      {!isPageVisible && hasStarted && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-red-500/20 text-red-400 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            App is in background - generation may be affected
          </div>
        </div>
      )}
      
      <div className="flex justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
      
      <div className="text-center text-sm text-gray-500">
        <p>Generating {state.mode === 'manual' ? 'translations and' : ''} flashcards...</p>
        <p className="mt-2 text-xs text-gray-400">
          Generation typically takes 2-5 minutes. Please be patient and keep this app open.
        </p>
      </div>

      {/* Thai facts while progress runs */}
      <ThaiFactInline />
    </div>
  );
} 
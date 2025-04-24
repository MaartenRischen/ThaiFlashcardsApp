import React from 'react';
import { SetGenerationWrapper } from './SetGenerationWrapper';
import type { SetWizardState } from './SetWizardModal';
import type { Phrase } from '@/app/lib/set-generator';

interface GenerationStepProps {
  state: SetWizardState;
  onBack: () => void;
  onComplete: (phrases: Phrase[]) => void;
}

export function GenerationStep({ state, onBack, onComplete }: GenerationStepProps) {
  const [error, setError] = React.useState<string | undefined>();
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-semibold text-blue-400">Creating Your Set</h3>
        <p className="text-gray-300">
          We&apos;re generating personalized flashcards based on your preferences. 
          This may take a minute or two. You&apos;ll see cards appear below as they&apos;re created.
        </p>
        
        {error && (
          <div className="p-4 bg-red-900/30 border border-red-500 rounded-md text-red-300">
            <p className="font-medium">There was an error generating your set:</p>
            <p className="mt-1">{error}</p>
            <button 
              onClick={onBack}
              className="mt-3 px-4 py-2 bg-red-700 hover:bg-red-600 rounded-md transition-colors"
            >
              Go Back
            </button>
          </div>
        )}
      </div>

      <SetGenerationWrapper 
        wizardState={state}
        onComplete={onComplete}
        onError={setError}
      />
    </div>
  );
} 
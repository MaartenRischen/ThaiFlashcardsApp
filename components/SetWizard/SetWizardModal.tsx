import React, { useState } from 'react';
import { WelcomeStep } from './WelcomeStep';
import { ProficiencyStep } from './ProficiencyStep';
import { ScenarioStep } from './ScenarioStep';
import { ToneStep } from './ToneStep';
import { DailyGoalStep } from './DailyGoalStep';
import { ReviewStep } from './ReviewStep';
import { GenerationStep } from './GenerationStep';

// Wizard state interface
export interface SetWizardState {
  proficiency: {
    canDoSelections: string[];
    levelEstimate: string;
  };
  scenarios: string[];
  customGoal?: string;
  topics: string[];
  tone: number;
  dailyGoal?: {
    value: number;
    type: 'cards' | 'minutes';
  };
}

function ProgressStepper({ step, totalSteps }: { step: number; totalSteps: number }) {
  return (
    <div className="mb-4">
      <div className="relative h-0.5 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="absolute h-full bg-blue-600/90 rounded-full transition-all duration-300"
          style={{ width: `${(step / (totalSteps - 1)) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-xs">
        <span className="text-gray-500">Start</span>
        <span className="text-gray-500">Review</span>
      </div>
    </div>
  );
}

export function SetWizardModal({ onComplete, onClose }: { 
  onComplete: (state: SetWizardState) => void, 
  onClose: () => void 
}) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<SetWizardState>({
    proficiency: {
      canDoSelections: [],
      levelEstimate: '',
    },
    scenarios: [],
    topics: [],
    tone: 50,
  });

  // Show close button for all steps except generation (6)
  const showCloseButton = step < 6;
  
  // Show progress stepper for all steps except generation (6)
  const showProgressStepper = step < 6;
  
  // Set modal width based on step
  const modalWidth = step === 6 ? "max-w-3xl" : "max-w-2xl";

  // Use custom scenarios as topics if they exist
  const deriveTopicsFromScenarios = (scenarios: string[], customGoal?: string) => {
    // Extract custom scenarios
    const customScenarios: string[] = [];
    
    if (customGoal) {
      // Check if customGoal contains "Selected topics:" section
      const topicsMatch = customGoal.match(/Selected topics: (.*?)($|\.)/);
      if (topicsMatch && topicsMatch[1]) {
        // Split by comma and trim
        const extractedTopics = topicsMatch[1].split(',').map(t => t.trim());
        customScenarios.push(...extractedTopics);
      }
    }
    
    // Return custom scenarios as topics
    return customScenarios;
  };

  const steps = [
    <WelcomeStep
      key="welcome"
      onNext={() => setStep(1)}
      onSkip={onClose}
    />,
    <ProficiencyStep
      key="proficiency"
      value={state.proficiency}
      onNext={(proficiency) => {
        setState(prev => ({ ...prev, proficiency }));
        setStep(2);
      }}
      onBack={() => setStep(0)}
    />,
    <ScenarioStep
      key="scenario"
      value={{ scenarios: state.scenarios, customGoal: state.customGoal }}
      onNext={(data) => {
        // Automatically derive topics from custom scenarios
        const derivedTopics = deriveTopicsFromScenarios(data.scenarios, data.customGoal);
        
        setState(prev => ({ 
          ...prev, 
          ...data,
          // Use derived topics from custom scenarios
          topics: derivedTopics
        }));
        
        // Skip the topic step and go directly to tone
        setStep(3);
      }}
      onBack={() => setStep(1)}
    />,
    <ToneStep
      key="tone"
      value={state.tone}
      onNext={(tone) => {
        setState(prev => ({ ...prev, tone }));
        setStep(4);
      }}
      onBack={() => setStep(2)}
    />,
    <DailyGoalStep
      key="dailyGoal"
      value={state.dailyGoal}
      onNext={(dailyGoal) => {
        setState(prev => ({ ...prev, dailyGoal }));
        setStep(5);
      }}
      onBack={() => setStep(3)}
    />,
    <ReviewStep
      key="review"
      state={state}
      onConfirm={() => setStep(6)}
      onEdit={setStep}
      onBack={() => setStep(4)}
    />,
    <GenerationStep
      key="generation"
      state={state}
      onComplete={() => {
        onComplete(state);
      }}
      onBack={() => setStep(5)}
    />
  ];

  const totalSteps = steps.length - 1;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`${modalWidth} w-full bg-[#1a1a1a] rounded-lg overflow-hidden shadow-xl border border-gray-800/30`}>
        <div className="p-5 space-y-4">
          <div className="flex justify-between items-center relative">
            {/* Close button on the right */}
            {showCloseButton && (
              <button 
                onClick={onClose}
                className="absolute right-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-gray-400"
                aria-label="Close"
              >
                <span className="text-sm">&times;</span>
              </button>
            )}
            {/* Centered heading */}
            <h2 className="text-lg font-medium text-blue-400 w-full text-center">Make Your Own Cards</h2>
          </div>
          {showProgressStepper && <ProgressStepper step={step} totalSteps={totalSteps} />}
          <div className="max-h-[75vh] overflow-y-auto pr-1">
            {steps[step]}
          </div>
        </div>
      </div>
    </div>
  );
} 
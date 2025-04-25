import React, { useState } from 'react';
import { WelcomeStep } from './WelcomeStep';
import { ProficiencyStep } from './ProficiencyStep';
import { ScenarioStep } from './ScenarioStep';
import { TopicStep } from './TopicStep';
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

  // Show close button for all steps except generation (7)
  const showCloseButton = step < 7;
  
  // Show progress stepper for all steps except generation (7)
  const showProgressStepper = step < 7;
  
  // Set modal width based on step
  const modalWidth = step === 7 ? "max-w-3xl" : "max-w-2xl";

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
        setState(prev => ({ ...prev, ...data }));
        setStep(3);
      }}
      onBack={() => setStep(1)}
    />,
    <TopicStep
      key="topic"
      value={state.topics}
      scenarios={state.scenarios}
      onNext={(topics) => {
        setState(prev => ({ ...prev, topics }));
        setStep(4);
      }}
      onBack={() => setStep(2)}
    />,
    <ToneStep
      key="tone"
      value={state.tone}
      onNext={(tone) => {
        setState(prev => ({ ...prev, tone }));
        setStep(5);
      }}
      onBack={() => setStep(3)}
    />,
    <DailyGoalStep
      key="dailyGoal"
      value={state.dailyGoal}
      onNext={(dailyGoal) => {
        setState(prev => ({ ...prev, dailyGoal }));
        setStep(6);
      }}
      onBack={() => setStep(4)}
    />,
    <ReviewStep
      key="review"
      state={state}
      onConfirm={() => setStep(7)}
      onEdit={setStep}
      onBack={() => setStep(5)}
    />,
    <GenerationStep
      key="generation"
      state={state}
      onComplete={() => {
        onComplete(state);
      }}
      onBack={() => setStep(6)}
    />
  ];

  const totalSteps = steps.length - 1;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`${modalWidth} w-full bg-[#1a1a1a] rounded-lg overflow-hidden shadow-xl border border-gray-800/30`}>
        <div className="p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-blue-400">Set Wizard</h2>
            {showCloseButton && (
              <button 
                onClick={onClose}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-gray-400"
                aria-label="Close"
              >
                <span className="text-sm">&times;</span>
              </button>
            )}
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
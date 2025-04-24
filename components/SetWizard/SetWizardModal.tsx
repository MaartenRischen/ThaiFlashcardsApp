import React, { useState } from 'react';
import { WelcomeStep } from './WelcomeStep';
import { ProficiencyStep } from './ProficiencyStep';
import { ScenarioStep } from './ScenarioStep';
import { TopicStep } from './TopicStep';
import { ToneStep } from './ToneStep';
import { DailyGoalStep } from './DailyGoalStep';
import { ReviewStep } from './ReviewStep';
import { GenerationStep } from './GenerationStep';
import { Progress } from '../ui/progress';
import type { Phrase } from '@/app/lib/set-generator';

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
    <div className="mb-6">
      <Progress value={(step / (totalSteps - 1)) * 100} className="h-2" />
      <div className="flex justify-between mt-2 text-sm text-gray-400">
        <span>Start</span>
        <span>Review</span>
      </div>
    </div>
  );
}

export function SetWizardModal({ onComplete, onClose }: { onComplete: (state: SetWizardState, phrases: Phrase[]) => void, onClose: () => void }) {
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
  const [generatedPhrases, setGeneratedPhrases] = useState<Phrase[]>([]);

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
      onComplete={(phrases) => {
        setGeneratedPhrases(phrases);
        onComplete(state, phrases);
      }}
      onBack={() => setStep(6)}
    />
  ];

  const totalSteps = steps.length - 1;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="neumorphic max-w-2xl w-full bg-[#1a1a1a] rounded-2xl overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-blue-400">Set Wizard</h2>
            {step < 7 && (
              <button 
                onClick={onClose}
                className="neumorphic-circle hover:opacity-80 transition-opacity"
                aria-label="Close"
              >
                <span className="text-gray-400">&times;</span>
              </button>
            )}
          </div>
          {step < 7 && <ProgressStepper step={step} totalSteps={totalSteps} />}
          <div className="min-h-[400px]">
            {steps[step]}
          </div>
        </div>
      </div>
    </div>
  );
} 
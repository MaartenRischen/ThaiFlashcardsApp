import React, { useState } from 'react';
import { WelcomeStep } from './WelcomeStep';
import { ProficiencyStep } from './ProficiencyStep';
import { ScenarioStep } from './ScenarioStep';
import { TopicStep } from './TopicStep';
import { ToneStep } from './ToneStep';
import { DailyGoalStep } from './DailyGoalStep';
import { ReviewStep } from './ReviewStep';

// Wizard state interface
export interface SetWizardState {
  proficiency: {
    canDoSelections: string[];
    levelEstimate: string;
  };
  goals: {
    scenarios: string[];
    customGoal?: string;
  };
  topics: string[];
  tone: number;
  dailyGoal?: {
    type: 'cards' | 'minutes';
    value: number;
  };
}

const initialState: SetWizardState = {
  proficiency: { canDoSelections: [], levelEstimate: '' },
  goals: { scenarios: [], customGoal: '' },
  topics: [],
  tone: 50,
  dailyGoal: undefined,
};

// Add a simple progress bar/stepper
function ProgressStepper({ step, totalSteps }: { step: number, totalSteps: number }) {
  return (
    <div className="w-full flex items-center mb-6">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`flex-1 h-2 mx-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-blue-500' : 'bg-gray-700'}`}
        />
      ))}
    </div>
  );
}

export function SetWizardModal({ onComplete, onClose }: { onComplete: (state: SetWizardState) => void, onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [wizardState, setWizardState] = useState<SetWizardState>(initialState);
  const totalSteps = 7;

  // Step handlers
  const handleProficiency = (data: { canDoSelections: string[]; levelEstimate: string }) => { setWizardState(ws => ({ ...ws, proficiency: data })); setStep(2); };
  const handleGoals = (data: { scenarios: string[]; customGoal?: string }) => { setWizardState(ws => ({ ...ws, goals: data })); setStep(3); };
  const handleTopics = (data: string[]) => { setWizardState(ws => ({ ...ws, topics: data })); setStep(4); };
  const handleTone = (data: number) => { setWizardState(ws => ({ ...ws, tone: data })); setStep(5); };
  const handleDailyGoal = (data?: { type: 'cards' | 'minutes'; value: number }) => { setWizardState(ws => ({ ...ws, dailyGoal: data })); setStep(6); };
  const handleConfirm = () => { onComplete(wizardState); };

  // Editing from review step
  const handleEdit = (editStep: number) => setStep(editStep);
  const handleBack = () => setStep(step - 1);

  // Step components
  const steps = [
    <WelcomeStep key="welcome" onNext={() => setStep(1)} onSkip={onClose} />,
    <ProficiencyStep key="proficiency" value={wizardState.proficiency} onNext={handleProficiency} />,
    <ScenarioStep key="scenario" value={wizardState.goals} onNext={handleGoals} />,
    <TopicStep key="topic" value={wizardState.topics} onNext={handleTopics} scenarios={wizardState.goals.scenarios} />,
    <ToneStep key="tone" value={wizardState.tone} onNext={handleTone} />,
    <DailyGoalStep key="dailyGoal" value={wizardState.dailyGoal} onNext={handleDailyGoal} />,
    <ReviewStep key="review" state={wizardState} onConfirm={handleConfirm} onEdit={handleEdit} onBack={handleBack} />,
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-[#181c24] rounded-2xl shadow-2xl p-6 max-w-lg w-full neumorphic border border-gray-800 text-white">
        <ProgressStepper step={step} totalSteps={totalSteps} />
        {steps[step]}
      </div>
    </div>
  );
} 
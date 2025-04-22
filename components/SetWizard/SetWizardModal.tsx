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

export function SetWizardModal({ onComplete, onClose }: { onComplete: (state: SetWizardState) => void, onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [wizardState, setWizardState] = useState<SetWizardState>(initialState);

  // Step handlers
  const handleProficiency = (data: any) => { setWizardState(ws => ({ ...ws, proficiency: data })); setStep(2); };
  const handleGoals = (data: any) => { setWizardState(ws => ({ ...ws, goals: data })); setStep(3); };
  const handleTopics = (data: any) => { setWizardState(ws => ({ ...ws, topics: data })); setStep(4); };
  const handleTone = (data: any) => { setWizardState(ws => ({ ...ws, tone: data })); setStep(5); };
  const handleDailyGoal = (data: any) => { setWizardState(ws => ({ ...ws, dailyGoal: data })); setStep(6); };
  const handleConfirm = () => { onComplete(wizardState); };

  // Editing from review step
  const handleEdit = (editStep: number) => setStep(editStep);
  const handleBack = () => setStep(step - 1);

  // Step components
  const steps = [
    <WelcomeStep onNext={() => setStep(1)} onSkip={onClose} />,
    <ProficiencyStep value={wizardState.proficiency} onNext={handleProficiency} />,
    <ScenarioStep value={wizardState.goals} onNext={handleGoals} />,
    <TopicStep value={wizardState.topics} onNext={handleTopics} scenarios={wizardState.goals.scenarios} />,
    <ToneStep value={wizardState.tone} onNext={handleTone} />,
    <DailyGoalStep value={wizardState.dailyGoal} onNext={handleDailyGoal} />,
    <ReviewStep state={wizardState} onConfirm={handleConfirm} onEdit={handleEdit} onBack={handleBack} />,
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
        {/* Progress bar/stepper can go here */}
        {steps[step]}
      </div>
    </div>
  );
} 
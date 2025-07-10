import React, { useState } from 'react';
import { WelcomeStep } from './WelcomeStep';
import { ProficiencyStep } from './ProficiencyStep';
import { ScenarioStep } from './ScenarioStep';
import { ContextStep } from './ContextStep';
import { ToneStep } from './ToneStep';
import { ReviewStep } from './ReviewStep';
import { GenerationStep } from './GenerationStep';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { SetWizardState } from './types';

interface SetWizardModalProps {
  onClose: () => void;
  onComplete: (newSetId?: string) => void;
  onOpenSetManager: (setToSelect?: string) => void;
}

// Image Preloader Component
const _ImagePreloader = dynamic(() => import('./ImagePreloader'), { ssr: false });

function renderStep(
  step: number,
  state: SetWizardState,
  setState: React.Dispatch<React.SetStateAction<SetWizardState>>,
  onClose: () => void,
  onComplete: (newSetId?: string) => void,
  onOpenSetManager: (setToSelect?: string) => void,
  setCurrentStep: (step: number) => void
) {
  switch (step) {
    case 0:
      return <WelcomeStep onNext={() => setCurrentStep(1)} />;
    case 1:
      return <ProficiencyStep 
        value={state.proficiency} 
        onNext={(proficiency) => {
          setState(prev => ({ ...prev, proficiency }));
          setCurrentStep(2);
        }}
        onBack={onClose}
      />;
    case 2:
      return <ScenarioStep
        selectedTopic={state.selectedTopic}
        proficiencyLevelEstimate={state.proficiency.levelEstimate}
        onNext={(data) => {
          setState(prev => ({
            ...prev,
            selectedTopic: data.selectedTopic
          }));
          setCurrentStep(3);
        }}
        onBack={() => setCurrentStep(1)}
      />;
    case 3:
      return <ContextStep
        topic={state.selectedTopic?.value || ''}
        onNext={({ additionalContext }) => {
          setState(prev => ({ ...prev, additionalContext }));
          setCurrentStep(4);
        }}
        onBack={() => setCurrentStep(2)}
      />;
    case 4:
      return <ToneStep
        toneLevel={state.tone}
        onNext={(toneLevel) => {
          setState(prev => ({ ...prev, tone: toneLevel }));
          setCurrentStep(5);
        }}
        onBack={() => setCurrentStep(3)}
      />;
    case 5:
      return <ReviewStep
        state={state}
        onConfirm={() => setCurrentStep(6)}
        onBack={() => setCurrentStep(4)}
        onCardCountChange={(count) => setState(prev => ({...prev, cardCount: count}))}
      />;
    case 6:
      return <GenerationStep
        state={state}
        onComplete={(newSetId) => {
          onComplete(newSetId);
          onClose();
        }}
        onBack={() => setCurrentStep(5)}
        onClose={onClose}
        onOpenSetManager={onOpenSetManager}
      />;
    default:
      return null;
  }
}

export function SetWizardModal({ onClose, onComplete, onOpenSetManager }: SetWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardState, setWizardState] = useState<SetWizardState>({
    proficiency: {
      canDoSelections: [],
      levelEstimate: 'Intermediate',
    },
    selectedTopic: null,
    additionalContext: '',
    tone: 1, // Default to serious & practical
    cardCount: 10, // Default to 10 cards
  });

  const totalSteps = 7;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="neumorphic max-w-2xl w-full bg-[#1f1f1f] border-[#333] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-[#E0E0E0]">
            Create a New Flashcard Set
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Follow the steps to generate a personalized set.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex justify-center space-x-4 my-6">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full transition-all duration-300
                ${currentStep === index ? 'bg-blue-500 scale-125 shadow-[0_0_10px_2px] shadow-blue-500/50' : 'bg-gray-600'}`}
            />
          ))}
        </div>

        <div className="min-h-[400px]">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep(currentStep, wizardState, setWizardState, onClose, onComplete, onOpenSetManager, setCurrentStep)}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
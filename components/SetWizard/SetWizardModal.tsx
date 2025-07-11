import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { WelcomeStep } from './WelcomeStep';
import { TopicStep } from './TopicStep';
import { ProficiencyStep } from './ProficiencyStep';
import { ToneStep } from './ToneStep';
import { GenerationStep } from './GenerationStep';
import { ReviewStep } from './ReviewStep';

export function SetWizardModal({
  isOpen,
  onClose,
  onComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (set: any) => void;
}) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [topic, setTopic] = React.useState('');
  const [proficiencyLevel, setProficiencyLevel] = React.useState('');
  const [toneLevel, setToneLevel] = React.useState(5);
  const [generatedSet, setGeneratedSet] = React.useState<any>(null);

  const steps = [
    {
      title: 'Create a New Flashcard Set',
      subtitle: 'Follow the steps to generate a personalized set.',
      component: WelcomeStep,
      props: {
        onNext: () => setCurrentStep(1),
      },
    },
    {
      title: 'What would you like to learn?',
      subtitle: 'Choose a topic that interests you',
      component: TopicStep,
      props: {
        value: topic,
        onNext: (value: string) => {
          setTopic(value);
          setCurrentStep(2);
        },
        onBack: () => setCurrentStep(0),
      },
    },
    {
      title: "What's your current Thai level?",
      subtitle: 'This helps us create content that matches your abilities',
      component: ProficiencyStep,
      props: {
        value: proficiencyLevel,
        onNext: (value: string) => {
          setProficiencyLevel(value);
          setCurrentStep(3);
        },
        onBack: () => setCurrentStep(1),
      },
    },
    {
      title: 'Choose Your Learning Style',
      subtitle: 'Select how you want your phrases to sound',
      component: ToneStep,
      props: {
        value: toneLevel,
        onNext: (value: number) => {
          setToneLevel(value);
          setCurrentStep(4);
        },
        onBack: () => setCurrentStep(2),
      },
    },
    {
      title: 'Generating Your Set',
      subtitle: 'Please wait while we create your personalized flashcards',
      component: GenerationStep,
      props: {
        topic,
        proficiencyLevel,
        toneLevel,
        onComplete: (set: any) => {
          setGeneratedSet(set);
          setCurrentStep(5);
        },
        onBack: () => setCurrentStep(3),
      },
    },
    {
      title: 'Review Your Set',
      subtitle: 'Check out your new flashcards',
      component: ReviewStep,
      props: {
        set: generatedSet,
        onComplete: (set: any) => {
          onComplete(set);
          onClose();
        },
        onBack: () => setCurrentStep(4),
      },
    },
  ];

  const currentStepData = steps[currentStep];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[#121212] w-full max-w-lg rounded-2xl shadow-xl">
          {/* Header */}
          <div className="p-6 pb-0">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-[#E0E0E0]">
                  {currentStepData.title}
                </h2>
                <p className="text-sm text-gray-400">
                  {currentStepData.subtitle}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mt-4">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep
                      ? 'bg-blue-500'
                      : index < currentStep
                      ? 'bg-blue-800'
                      : 'bg-gray-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content Area - Fixed height with scrolling */}
          <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            {React.createElement(currentStepData.component, currentStepData.props)}
          </div>
        </div>
      </div>
    </Dialog>
  );
} 
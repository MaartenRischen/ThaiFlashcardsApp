import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { WelcomeStep } from './WelcomeStep';
import { TopicStep } from './TopicStep';
import { ProficiencyStep } from './ProficiencyStep';
import { ToneStep } from './ToneStep';
import { GenerationStep } from './GenerationStep';
import { ReviewStep } from './ReviewStep';
import { SetWizardState, ProficiencyLevelString, SelectedTopic } from './types';

interface GeneratedSet {
  id: string;
  name: string;
  phrases: Array<{
    id: string;
    english: string;
    thai: string;
    pronunciation: string;
    mnemonic?: string;
  }>;
  metadata: {
    topic: string;
    proficiencyLevel: string;
    toneLevel: number;
    generationTime: number;
  };
}

interface BaseStep {
  title: string;
  subtitle: string;
}

interface WelcomeStepData extends BaseStep {
  type: 'welcome';
  component: React.ComponentType<{ onNext: () => void }>;
  props: {
    onNext: () => void;
  };
}

interface TopicStepData extends BaseStep {
  type: 'topic';
  component: React.ComponentType<{
    value: string;
    onNext: (value: string) => void;
    onBack: () => void;
  }>;
  props: {
    value: string;
    onNext: (value: string) => void;
    onBack: () => void;
  };
}

interface ProficiencyStepData extends BaseStep {
  type: 'proficiency';
  component: React.ComponentType<{
    _value: string;
    onNext: (value: { canDoSelections: string[]; levelEstimate: ProficiencyLevelString }) => void;
    onBack: () => void;
  }>;
  props: {
    _value: string;
    onNext: (value: { canDoSelections: string[]; levelEstimate: ProficiencyLevelString }) => void;
    onBack: () => void;
  };
}

interface ToneStepData extends BaseStep {
  type: 'tone';
  component: React.ComponentType<{
    toneLevel: number;
    onNext: (toneLevel: number) => void;
    onBack: () => void;
  }>;
  props: {
    toneLevel: number;
    onNext: (toneLevel: number) => void;
    onBack: () => void;
  };
}

interface GenerationStepData extends BaseStep {
  type: 'generation';
  component: React.ComponentType<{
    state: SetWizardState;
    onComplete: (newSetId: string) => void;
    onBack: () => void;
    onClose: () => void;
    onOpenSetManager: (setToSelect?: string) => void;
  }>;
  props: {
    state: SetWizardState;
    onComplete: (newSetId: string) => void;
    onBack: () => void;
    onClose: () => void;
    onOpenSetManager: (setToSelect?: string) => void;
  };
}

interface ReviewStepData extends BaseStep {
  type: 'review';
  component: React.ComponentType<{
    state: SetWizardState;
    onConfirm: () => void;
    onBack: () => void;
    onCardCountChange: (count: number) => void;
  }>;
  props: {
    state: SetWizardState;
    onConfirm: () => void;
    onBack: () => void;
    onCardCountChange: (count: number) => void;
  };
}

type StepData = WelcomeStepData | TopicStepData | ProficiencyStepData | ToneStepData | GenerationStepData | ReviewStepData;

export function SetWizardModal({
  isOpen,
  onClose,
  onComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (set: GeneratedSet) => void;
}) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [topic, setTopic] = React.useState('');
  const [proficiencyLevel, setProficiencyLevel] = React.useState<ProficiencyLevelString>('Complete Beginner');
  const [toneLevel, setToneLevel] = React.useState(5);
  const [generatedSet, setGeneratedSet] = React.useState<GeneratedSet | null>(null);
  const [cardCount, setCardCount] = React.useState(10);

  const wizardState: SetWizardState = {
    selectedTopic: { type: 'goal', value: topic },
    proficiency: { levelEstimate: proficiencyLevel, canDoSelections: [] },
    tone: toneLevel,
    cardCount,
    additionalContext: ''
  };

  const steps: StepData[] = [
    {
      type: 'welcome',
      title: 'Create a New Flashcard Set',
      subtitle: 'Follow the steps to generate a personalized set.',
      component: WelcomeStep,
      props: {
        onNext: () => setCurrentStep(1),
      },
    },
    {
      type: 'topic',
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
      type: 'proficiency',
      title: "What's your current Thai level?",
      subtitle: 'This helps us create content that matches your abilities',
      component: ProficiencyStep,
      props: {
        _value: proficiencyLevel,
        onNext: (value: { canDoSelections: string[]; levelEstimate: ProficiencyLevelString }) => {
          setProficiencyLevel(value.levelEstimate);
          setCurrentStep(3);
        },
        onBack: () => setCurrentStep(1),
      },
    },
    {
      type: 'tone',
      title: 'Choose Your Learning Style',
      subtitle: 'Select how you want your phrases to sound',
      component: ToneStep,
      props: {
        toneLevel,
        onNext: (value: number) => {
          setToneLevel(value);
          setCurrentStep(4);
        },
        onBack: () => setCurrentStep(2),
      },
    },
    {
      type: 'generation',
      title: 'Generating Your Set',
      subtitle: 'Please wait while we create your personalized flashcards',
      component: GenerationStep,
      props: {
        state: wizardState,
        onComplete: (newSetId: string) => {
          // TODO: Fetch the generated set data using newSetId
          setCurrentStep(5);
        },
        onBack: () => setCurrentStep(3),
        onClose,
        onOpenSetManager: () => {}, // TODO: Implement set manager opening
      },
    },
    {
      type: 'review',
      title: 'Review Your Set',
      subtitle: 'Check out your new flashcards',
      component: ReviewStep,
      props: {
        state: wizardState,
        onConfirm: () => {
          if (generatedSet) {
            onComplete(generatedSet);
            onClose();
          }
        },
        onBack: () => setCurrentStep(4),
        onCardCountChange: setCardCount,
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
            {(() => {
              switch (currentStepData.type) {
                case 'welcome':
                  return <WelcomeStep {...currentStepData.props} />;
                case 'topic':
                  return <TopicStep {...currentStepData.props} />;
                case 'proficiency':
                  return <ProficiencyStep {...currentStepData.props} />;
                case 'tone':
                  return <ToneStep {...currentStepData.props} />;
                case 'generation':
                  return <GenerationStep {...currentStepData.props} />;
                case 'review':
                  return <ReviewStep {...currentStepData.props} />;
              }
            })()}
          </div>
        </div>
      </div>
    </Dialog>
  );
} 
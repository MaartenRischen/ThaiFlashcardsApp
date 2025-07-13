import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { WelcomeStep } from './WelcomeStep';
import { ModeSelectionStep } from './ModeSelectionStep';
import { ManualInputStep } from './ManualInputStep';
import { TopicStep } from './TopicStep';
import { ProficiencyStep } from './ProficiencyStep';
import { ToneStep } from './ToneStep';
import { GenerationStep } from './GenerationStep';
import { ReviewStep } from './ReviewStep';
import { SetWizardState, ProficiencyLevelString } from './types';

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

interface ModeSelectionStepData extends BaseStep {
  type: 'modeSelection';
  component: React.ComponentType<{
    onSelectMode: (mode: 'auto' | 'manual') => void;
    onBack: () => void;
  }>;
  props: {
    onSelectMode: (mode: 'auto' | 'manual') => void;
    onBack: () => void;
  };
}

interface ManualInputStepData extends BaseStep {
  type: 'manualInput';
  component: React.ComponentType<{
    onNext: (phrases: Array<{
      english: string;
      thai: string;
      pronunciation: string;
      mnemonic?: string;
    }>) => void;
    onBack: () => void;
  }>;
  props: {
    onNext: (phrases: Array<{
      english: string;
      thai: string;
      pronunciation: string;
      mnemonic?: string;
    }>) => void;
    onBack: () => void;
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

type StepData = WelcomeStepData | ModeSelectionStepData | ManualInputStepData | TopicStepData | ProficiencyStepData | ToneStepData | GenerationStepData | ReviewStepData;

export function SetWizardModal({
  isOpen,
  onClose,
  onComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (newSetId: string) => void;
}) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [mode, setMode] = React.useState<'auto' | 'manual'>('auto');
  const [topic, setTopic] = React.useState('');
  const [proficiencyLevel, setProficiencyLevel] = React.useState<ProficiencyLevelString>('Complete Beginner');
  const [toneLevel, setToneLevel] = React.useState(5);
  const [_generatedSet, _setGeneratedSet] = React.useState<GeneratedSet | null>(null);
  const [cardCount, setCardCount] = React.useState(10);
  const [manualPhrases, setManualPhrases] = React.useState<Array<{
    english: string;
    thai: string;
    pronunciation: string;
    mnemonic?: string;
  }>>([]);

  const wizardState: SetWizardState = {
    mode,
    selectedTopic: { type: 'goal', value: topic },
    proficiency: { levelEstimate: proficiencyLevel, canDoSelections: [] },
    tone: toneLevel,
    cardCount,
    additionalContext: '',
    manualPhrases
  };

  // Build steps array based on mode
  const steps: StepData[] = React.useMemo(() => {
    const baseSteps: StepData[] = [
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
        type: 'modeSelection',
        title: 'Choose Your Creation Mode',
        subtitle: 'Select how you want to create your flashcards',
        component: ModeSelectionStep,
        props: {
          onSelectMode: (selectedMode: 'auto' | 'manual') => {
            setMode(selectedMode);
            // Auto mode goes to topic selection (step 2), manual mode goes to manual input (last position)
            setCurrentStep(selectedMode === 'auto' ? 2 : baseSteps.length + 5);
          },
          onBack: () => setCurrentStep(0),
        },
      },
    ];

    if (mode === 'auto') {
      return [
        ...baseSteps,
        {
          type: 'topic',
          title: 'What would you like to learn?',
          subtitle: 'Choose a topic that interests you',
          component: TopicStep,
          props: {
            value: topic,
            onNext: (value: string) => {
              setTopic(value);
              setCurrentStep(3);
            },
            onBack: () => setCurrentStep(1),
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
              setCurrentStep(4);
            },
            onBack: () => setCurrentStep(2),
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
              setCurrentStep(5);
            },
            onBack: () => setCurrentStep(3),
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
              onComplete(newSetId);
              onClose();
            },
            onBack: () => setCurrentStep(4),
            onClose,
            onOpenSetManager: () => {}, // TODO: Implement set manager opening
          },
        },
      ];
    } else {
      // Manual mode
      return [
        ...baseSteps,
        {
          type: 'manualInput',
          title: 'Add Your Phrases',
          subtitle: 'Enter the phrases you want to learn',
          component: ManualInputStep,
          props: {
            onNext: (phrases) => {
              setManualPhrases(phrases);
              setCurrentStep(3);
            },
            onBack: () => setCurrentStep(1),
          },
        },
        {
          type: 'generation',
          title: 'Creating Your Set',
          subtitle: 'Please wait while we save your flashcards',
          component: GenerationStep,
          props: {
            state: wizardState,
            onComplete: (newSetId: string) => {
              onComplete(newSetId);
              onClose();
            },
            onBack: () => setCurrentStep(2),
            onClose,
            onOpenSetManager: () => {}, // TODO: Implement set manager opening
          },
        },
      ];
    }
  }, [mode, topic, proficiencyLevel, toneLevel, wizardState, onComplete, onClose]);

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
                case 'modeSelection':
                  return <ModeSelectionStep {...currentStepData.props} />;
                case 'manualInput':
                  return <ManualInputStep {...currentStepData.props} />;
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
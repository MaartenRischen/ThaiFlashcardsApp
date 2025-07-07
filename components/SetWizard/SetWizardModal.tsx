import React, { useState } from 'react';
import Head from 'next/head';
import { WelcomeStep } from './WelcomeStep';
import { ProficiencyStep } from './ProficiencyStep';
import { ScenarioStep } from './ScenarioStep';
import { ContextStep } from './ContextStep';
import { ToneStep } from './ToneStep';
import { ReviewStep } from './ReviewStep';
import { GenerationStep } from './GenerationStep';
import Image from 'next/image';

// Import the specific type (adjust path if needed, or redefine here)
// Assuming ProficiencyLevelString is defined/exported in ProficiencyStep
// If not, redefine it here:
type ProficiencyLevelString = 'Complete Beginner' | 'Basic Understanding' | 'Intermediate' | 'Advanced' | 'Native/Fluent' | 'God Mode';

// Wizard state interface
export interface SetWizardState {
  proficiency: {
    canDoSelections: string[];
    levelEstimate: ProficiencyLevelString;
  };
  selectedTopic: { 
    type: 'scenario' | 'goal' | 'weird'; 
    value: string; 
  } | null;
  additionalContext: string;
  tone: number;
  cardCount: number;
}

// Image Preloader Component
function ImagePreloader() {
  return (
    <div className="hidden">
      {/* Proficiency level images - 1125x633 */}
      {[...Array(6)].map((_, i) => (
        <Image
          key={`level-${i + 1}`}
          src={`/images/level/${i + 1}.png`}
          alt=""
          width={1125}
          height={633}
          priority
          loading="eager"
          fetchPriority="high"
          unoptimized
        />
      ))}
      {/* Tone step images - 1125x633 */}
      {[...Array(10)].map((_, i) => (
        <Image
          key={`level2-${i + 1}`}
          src={`/images/level2/${i + 1}.png`}
          alt=""
          width={1125}
          height={633}
          priority
          loading="eager"
          fetchPriority="high"
          unoptimized
        />
      ))}
      {/* Welcome step donkey image */}
      <Image
        key="donkey"
        src="/images/donkeycards.png"
        alt=""
        width={1125}
        height={633}
        priority
        loading="eager"
        fetchPriority="high"
        unoptimized
      />
      {/* Default set logo */}
      <Image
        key="default-set"
        src="/images/default-set-logo.png"
        alt=""
        width={1125}
        height={633}
        priority
        loading="eager"
        fetchPriority="high"
        unoptimized
      />
    </div>
  );
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
      levelEstimate: 'Intermediate',
    },
    selectedTopic: null,
    additionalContext: '',
    tone: 1, // Default to serious & practical
    cardCount: 10, // Default to 10 cards
  });

  // Show close button for all steps except generation (6)
  const showCloseButton = step < 6;
  
  // Show progress stepper for all steps except generation (6)
  const showProgressStepper = step < 6;
  
  // Set modal width based on step
  const modalWidth = step === 6 ? "max-w-3xl" : "max-w-2xl";

  // Handler for card count changes
  const handleCardCountChange = (newCount: number) => {
    setState(prev => ({ ...prev, cardCount: newCount }));
  };

  const steps = [
    <WelcomeStep
      key="welcome"
      onNext={() => setStep(1)}
    />,
    <ProficiencyStep
      key="proficiency"
      value={state.proficiency}
      onNext={(proficiency) => {
        setState(prev => ({ ...prev, proficiency }));
        setStep(2);
      }}
      onBack={onClose}
    />,
    <ScenarioStep
      key="scenario"
      selectedTopic={state.selectedTopic}
      proficiencyLevelEstimate={state.proficiency.levelEstimate}
      onNext={(data) => {
        setState(prev => ({ 
          ...prev, 
          selectedTopic: data.selectedTopic, 
        }));
        
        setStep(3);
      }}
      onBack={() => setStep(1)}
    />,
    <ContextStep
      key="context"
      topic={state.selectedTopic?.value || ''}
      onNext={({ additionalContext }) => {
        setState(prev => ({ ...prev, additionalContext }));
        setStep(4);
      }}
      onBack={() => setStep(2)}
    />,
    <ToneStep
      key="tone"
      toneLevel={state.tone}
      onNext={(toneLevel) => {
        setState(prev => ({ ...prev, tone: toneLevel }));
        setStep(5);
      }}
      onBack={() => setStep(3)}
    />,
    <ReviewStep
      key="review"
      state={state}
      onConfirm={() => {
        onComplete(state);
      }}
      onBack={() => setStep(4)}
      onCardCountChange={handleCardCountChange}
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
    <>
      <Head>
        {/* Preload the welcome step GIF */}
        <link rel="preload" href="/images/gifs/setwizardgif2.gif" as="image" />
      </Head>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <ImagePreloader />
        <div className={`${modalWidth} w-full bg-[#1F1F1F] rounded-lg overflow-hidden shadow-xl border border-[#404040]`}>
          <div className="p-5 space-y-4">
            <div className="flex justify-between items-center relative">
              {/* Close button on the right */}
              {showCloseButton && (
                <button 
                  onClick={onClose}
                  className="absolute right-0 w-6 h-6 flex items-center justify-center rounded-full bg-[#2C2C2C] hover:bg-[#3C3C3C] transition-colors text-[#BDBDBD]"
                  aria-label="Close"
                >
                  <span className="text-sm">&times;</span>
                </button>
              )}
              {/* Centered heading */}
              <h2 className="text-lg font-medium text-[#60A5FA] w-full text-center">Make Your Own Cards</h2>
            </div>
            {showProgressStepper && <ProgressStepper step={step} totalSteps={totalSteps} />}
            <div className="max-h-[75vh] overflow-y-auto pr-1">
              {steps[step]}
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 
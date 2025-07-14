import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface GenerationProgressProps {
  isGenerating: boolean;
  mode?: 'manual' | 'automatic';
}

export function GenerationProgress({ isGenerating, mode = 'automatic' }: GenerationProgressProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = mode === 'manual' ? [
    'Processing your phrases...',
    'Translating to Thai...',
    'Adding pronunciations...',
    'Creating mnemonics...',
    'Generating set image...',
    'Finalizing your set...'
  ] : [
    'Analyzing your preferences...',
    'Crafting Thai phrases...',
    'Adding mnemonics...',
    'Creating example sentences...',
    'Generating images...',
    'Almost there...'
  ];

  useEffect(() => {
    if (!isGenerating) {
      setProgress(0);
      setCurrentStep(0);
      return;
    }

    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 0.5;
      });
    }, 1000);

    // Update steps
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, [isGenerating, steps.length]);

  if (!isGenerating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-[#1F1F1F] border-b border-[#404040] z-50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-[#A9C4FC]">{steps[currentStep]}</span>
              <span className="text-xs text-gray-400">{Math.round(progress)}%</span>
            </div>
            <div className="h-1 bg-[#2C2C2C] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#60A5FA] rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
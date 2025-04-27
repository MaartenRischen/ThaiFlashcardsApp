import React from 'react';
import { SetWizardState } from '@/components/SetWizard/SetWizardModal';

export function ReviewStep({ state, onConfirm, onBack }: {
  state: SetWizardState,
  onConfirm: () => void,
  onBack: () => void,
}) {
  const getLearningStyleName = () => {
    if (state.tone <= 3) return "Serious";
    if (state.tone >= 8) return "Ridiculous";
    return "Balanced";
  };

  return (
    <div className="space-y-3 px-2">
      // ... existing code ...
    </div>
  );
} 
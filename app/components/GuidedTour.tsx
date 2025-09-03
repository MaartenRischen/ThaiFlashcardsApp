'use client';

import React, { useEffect, useState } from 'react';

type StepId =
  | 'welcome'
  | 'current'
  | 'mysets'
  | 'create'
  | 'gallery'
  | 'settings'
  | 'card'
  | 'share';

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps: Array<{ id: StepId; title: string; body: string; anchor?: string }> = [
  { id: 'welcome', title: 'Welcome to Donkey Bridge', body: 'Quick 60‑second tour of key features. You can exit anytime.' },
  { id: 'current', title: 'Current', body: 'Track progress and due cards for the active set.', anchor: '[data-tour="nav-current"]' },
  { id: 'mysets', title: 'My Sets', body: 'Manage sets, preview cards, and switch sets.', anchor: '[data-tour="nav-mysets"]' },
  { id: 'create', title: 'Create', body: 'Open the Set Wizard to generate a new personalized set.', anchor: '[data-tour="nav-create"]' },
  { id: 'gallery', title: 'Gallery', body: 'Browse the public gallery and import sets you like.', anchor: '[data-tour="nav-gallery"]' },
  { id: 'settings', title: 'Settings', body: 'Dark mode, gender, polite mode, autoplay, and more.', anchor: '[data-tour="nav-settings"]' },
  { id: 'card', title: 'Flashcards', body: 'Each card has Thai, pronunciation, AI mnemonic, audio, and examples.' },
  { id: 'share', title: 'Send to a Friend!', body: 'Share a set with a link so friends can try instantly.' },
];

export function GuidedTour({ isOpen, onClose }: GuidedTourProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    // Auto-focus anchor elements if present
    const s = steps[stepIndex];
    if (s?.anchor) {
      const el = document.querySelector<HTMLElement>(s.anchor);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isOpen, stepIndex]);

  if (!isOpen) return null;

  const s = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none">
      <div className="absolute inset-0 bg-black/60" />

      <div className="absolute inset-0 p-4 flex items-end justify-center sm:items-center pointer-events-none">
        <div className="max-w-md w-full bg-[#1F1F1F] border border-[#333] rounded-2xl shadow-2xl p-4 sm:p-6 pointer-events-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[#A9C4FC]">{s.title}</h3>
              <p className="mt-2 text-sm text-[#E0E0E0]">{s.body}</p>
            </div>
            <button onClick={onClose} className="text-[#BDBDBD] hover:text-white">✕</button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-[#9CA3AF]">
              Step {stepIndex + 1} / {steps.length}
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 text-xs rounded bg-[#2C2C2C] border border-[#444] text-[#E0E0E0] disabled:opacity-50"
                onClick={() => setStepIndex(i => Math.max(0, i - 1))}
                disabled={stepIndex === 0}
              >
                Back
              </button>
              <button
                className="px-3 py-1 text-xs rounded bg-[#A9C4FC] text-[#121212]"
                onClick={() => (isLast ? onClose() : setStepIndex(i => Math.min(steps.length - 1, i + 1)))}
              >
                {isLast ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function shouldAutoStartTour(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const seen = localStorage.getItem('tour_seen_v1');
    return !seen;
  } catch {
    return false;
  }
}

export function markTourSeen() {
  try {
    localStorage.setItem('tour_seen_v1', 'true');
  } catch {}
}



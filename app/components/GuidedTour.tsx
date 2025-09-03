'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

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
  { id: 'card', title: 'Flashcards', body: 'Each card has Thai, pronunciation, AI mnemonic, audio, and examples.', anchor: '[data-tour="card"]' },
  { id: 'current', title: 'Current', body: 'Track progress and due cards for the active set.', anchor: '[data-tour="nav-current"]' },
  { id: 'mysets', title: 'My Sets', body: 'Manage sets, preview cards, and switch sets.', anchor: '[data-tour="nav-mysets"]' },
  { id: 'gallery', title: 'Public Sets', body: 'Browse the public gallery and import sets you like.', anchor: '[data-tour="nav-gallery"]' },
  { id: 'create', title: 'Create!', body: 'Open the Set Wizard to generate a new personalized set.', anchor: '[data-tour="nav-create"]' },
  { id: 'settings', title: 'Settings', body: 'Dark mode, gender, polite mode, autoplay, and more.', anchor: '[data-tour="nav-settings"]' },
];

export function GuidedTour({ isOpen, onClose }: GuidedTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [spot, setSpot] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const s = steps[stepIndex];
    let cleanup: (() => void) | undefined;
    const measure = () => {
      if (s?.anchor) {
        const el = document.querySelector<HTMLElement>(s.anchor);
        if (el) {
          const rect = el.getBoundingClientRect();
          setSpot({ top: rect.top + window.scrollY - 8, left: rect.left + window.scrollX - 8, width: rect.width + 16, height: rect.height + 16 });
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
      setSpot(null);
    };
    measure();
    const onWinChange = () => measure();
    window.addEventListener('resize', onWinChange);
    window.addEventListener('scroll', onWinChange, true);
    cleanup = () => {
      window.removeEventListener('resize', onWinChange);
      window.removeEventListener('scroll', onWinChange, true);
    };
    return cleanup;
  }, [isOpen, stepIndex]);

  if (!isOpen) return null;

  const s = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  const overlay = (
    <div className="fixed inset-0 z-[100000] pointer-events-none">
      <div className="absolute inset-0 bg-black/60" />

      {spot && (
        <div
          className="absolute border-2 border-[#A9C4FC] rounded-xl shadow-[0_0_0_6px_rgba(169,196,252,0.25)] transition-all duration-200"
          style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
        />
      )}

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

  // Render at document.body to avoid stacking context issues
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return createPortal(overlay, document.body);
  }
  return overlay;
}

export function shouldAutoStartTour(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const url = new URL(window.location.href);
    if (url.searchParams.get('tour') === '1') return true;
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



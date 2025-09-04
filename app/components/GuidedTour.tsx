'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type StepId =
  | 'welcome'
  | 'cardFront'
  | 'cardBack'
  | 'cardBackThai'
  | 'cardBackPronunciation'
  | 'cardBackAudio'
  | 'cardBackTranslation'
  | 'cardBackLiteral'
  | 'cardBackSRS'
  | 'cardBackGender'
  | 'cardBackPolite'
  | 'cardBackMnemonic'
  | 'cardBackContext'
  | 'cardBackContextControls'
  | 'current'
  | 'mysets'
  | 'create'
  | 'gallery'
  | 'settings';

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps: Array<{ id: StepId; title: string; body: string; anchor?: string; customBody?: boolean }> = [
  { id: 'welcome', title: 'Welcome to Donkey Bridge', body: 'Quick 60‑second tour of key features. You can exit anytime.' },
  { id: 'cardFront', title: 'Flashcard Front', body: 'Front shows the English prompt and optional mnemonic hint.', anchor: '[data-tour="card-front"]' },
  { id: 'cardBack', title: 'Flashcard Back', body: 'Back shows Thai, pronunciation, audio, examples, and rating.', anchor: '[data-tour="card-back"]' },
  { id: 'cardBackThai', title: 'Thai Text', body: 'The main Thai phrase, gendered and polite based on your settings.', anchor: '[data-tour="back-thai"]' },
  { id: 'cardBackPronunciation', title: 'Pronunciation', body: 'Phonetic line matching your gender/politeness settings.', anchor: '[data-tour="back-pronunciation"]' },
  { id: 'cardBackAudio', title: 'Audio Buttons', body: 'Tap Normal or Slow to hear native-like pronunciation.', anchor: '[data-tour="back-audio"]' },
  { id: 'cardBackTranslation', title: 'English Translation', body: 'Quick English gloss to confirm meaning.', anchor: '[data-tour="back-translation"]' },
  { id: 'cardBackLiteral', title: 'Literal / Breakdown', body: 'Open a detailed breakdown with literal parts and notes.', anchor: '[data-tour="back-literal"]' },
  { id: 'cardBackSRS', title: 'Rate Your Recall', body: 'Easy / Correct / Wrong feeds the SRS to schedule reviews.', anchor: '[data-tour="back-srs"]' },
  { id: 'cardBackGender', title: 'Gender Toggle', body: 'Switch between female (Ka) and male (Krap) phrasing.', anchor: '[data-tour="back-gender"]' },
  { id: 'cardBackPolite', title: 'Politeness', body: 'Toggle polite particles on/off.', anchor: '[data-tour="back-polite"]' },
  { id: 'cardBackMnemonic', title: 'Mnemonic', body: 'Edit, reset, or generate a new memory aid.', anchor: '[data-tour="back-mnemonic"]' },
  { id: 'cardBackContext', title: 'In Context', body: 'See the phrase used in a sentence with pronunciation and translation.', anchor: '[data-tour="back-context"]' },
  { id: 'cardBackContextControls', title: 'Context Controls', body: 'Navigate examples and play the context audio.', anchor: '[data-tour="back-context-controls"]' },
  { id: 'current', title: 'Current', body: 'Track progress and due cards for the active set.', anchor: '[data-tour="nav-current"]' },
  { id: 'mysets', title: 'My Sets', body: 'Manage sets, preview cards, and switch sets.', anchor: '[data-tour="nav-mysets"]' },
  { id: 'gallery', title: 'Public Sets', body: 'Browse the public gallery and import sets you like.', anchor: '[data-tour="nav-gallery"]' },
  { id: 'create', title: 'Create!', body: 'Open the Set Wizard to generate a new personalized set.', anchor: '[data-tour="nav-create"]', customBody: true },
  { id: 'settings', title: 'Settings', body: 'Dark mode, gender, polite mode, autoplay, and more.', anchor: '[data-tour="nav-settings"]' },
];

export function GuidedTour({ isOpen, onClose }: GuidedTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [highlightEl, setHighlightEl] = useState<HTMLElement | null>(null);
  const [showTourAtStartup, setShowTourAtStartupState] = useState(getShowTourAtStartup());

  // Sync state when tour opens
  useEffect(() => {
    if (isOpen) {
      setShowTourAtStartupState(getShowTourAtStartup());
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const s = steps[stepIndex];
    let cleanup: (() => void) | undefined;
    const measure = () => {
      // Fire demo actions when entering specific steps
      if (
        s?.id === 'cardBack' ||
        s?.id === 'cardBackThai' ||
        s?.id === 'cardBackPronunciation' ||
        s?.id === 'cardBackAudio' ||
        s?.id === 'cardBackTranslation' ||
        s?.id === 'cardBackLiteral' ||
        s?.id === 'cardBackSRS'
      ) {
        window.dispatchEvent(new Event('db_tour_show_back'));
      } else if (s?.id === 'cardFront') {
        window.dispatchEvent(new Event('db_tour_show_front'));
      }
      if (s?.anchor) {
        const el = document.querySelector<HTMLElement>(s.anchor);
        if (el) {
          // Remove highlight from previous element
          if (highlightEl && highlightEl !== el) {
            highlightEl.classList.remove('db-tour-highlight');
            highlightEl.classList.remove('db-tour-highlight-create');
            (highlightEl as unknown as HTMLElement).style.zIndex = '';
          }
          // Apply highlight to current
          el.classList.add('db-tour-highlight');
          if (s?.id === 'create') {
            el.classList.add('db-tour-highlight-create');
          }
          (el as unknown as HTMLElement).style.zIndex = '100001';
          setHighlightEl(el);
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
      // No anchor found: cleanup previous
      if (highlightEl) {
        highlightEl.classList.remove('db-tour-highlight');
        highlightEl.classList.remove('db-tour-highlight-create');
        (highlightEl as unknown as HTMLElement).style.zIndex = '';
        setHighlightEl(null);
      }
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
  }, [isOpen, stepIndex, highlightEl]);

  if (!isOpen) return null;

  const s = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  const handleClose = () => {
    // Ensure any previously highlighted element is fully reset
    try {
      if (highlightEl) {
        highlightEl.classList.remove('db-tour-highlight');
        highlightEl.classList.remove('db-tour-highlight-create');
        (highlightEl as unknown as HTMLElement).style.zIndex = '';
      }
    } catch {}
    onClose();
  };

  const overlay = (
    <div className="fixed inset-0 z-[100000] pointer-events-none">
      <div className="absolute inset-0 bg-black/60" />
      {/* Highlight style */}
      <style>{`
        .db-tour-highlight {
          position: relative !important;
          box-shadow: 0 0 0 3px #A9C4FC, 0 0 0 8px rgba(169,196,252,0.25) !important;
          border-radius: 12px !important;
          transition: box-shadow .2s ease, transform .2s ease;
          pointer-events: none !important;
        }

        .db-tour-highlight-create {
          box-shadow: 0 0 0 4px #22c55e, 0 0 0 12px rgba(34, 197, 94, 0.3), 0 0 40px 20px rgba(34, 197, 94, 0.5) !important;
        }
      `}</style>

      <div className="absolute inset-0 p-2 sm:p-4 flex items-end justify-center sm:items-start pt-8 pointer-events-none">
        <div className="max-w-md w-full bg-[#1F1F1F] border border-[#333] rounded-2xl shadow-2xl p-3 sm:p-6 pointer-events-auto z-[100002] mb-3 sm:mb-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[#A9C4FC]">{s.title}</h3>
              {s.customBody && s.id === 'create' ? (
                <p className="mt-2 text-sm text-[#E0E0E0]">
                  Open the Set Wizard to generate a new personalized set.{' '}
                  <span className="text-[#22c55e] font-bold animate-pulse-slow" style={{ textShadow: '0 0 20px rgba(34, 197, 94, 0.8)' }}>
                    Our coolest feature!!
                  </span>
                </p>
              ) : s.id === 'welcome' ? (
                <div className="mt-2">
                  <p className="text-sm text-[#E0E0E0] mb-3">{s.body}</p>
                  <div className="flex items-center gap-2 p-3 bg-[#2C2C2C] rounded-lg border border-[#404040]">
                    <input
                      type="checkbox"
                      id="show-tour-checkbox"
                      checked={showTourAtStartup}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setShowTourAtStartupState(checked);
                        setShowTourAtStartup(checked);
                      }}
                      className="w-4 h-4 text-[#A9C4FC] bg-[#3C3C3C] border-[#555] rounded focus:ring-[#A9C4FC] focus:ring-2"
                    />
                    <label htmlFor="show-tour-checkbox" className="text-sm text-[#E0E0E0] cursor-pointer">
                      Show tour at startup
                    </label>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-[#E0E0E0]">{s.body}</p>
              )}
            </div>
            <button onClick={handleClose} className="text-[#BDBDBD] hover:text-white">✕</button>
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
                onClick={() => (isLast ? handleClose() : setStepIndex(i => Math.min(steps.length - 1, i + 1)))}
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
    const showTourAtStartup = localStorage.getItem('show_tour_at_startup');
    // Default to true (show tour) if preference hasn't been set
    return showTourAtStartup !== 'false';
  } catch {
    return true; // Default to showing tour if there's an error
  }
}

export function getShowTourAtStartup(): boolean {
  try {
    if (typeof window === 'undefined') return true;
    const showTourAtStartup = localStorage.getItem('show_tour_at_startup');
    return showTourAtStartup !== 'false';
  } catch {
    return true;
  }
}

export function setShowTourAtStartup(show: boolean) {
  try {
    localStorage.setItem('show_tour_at_startup', show ? 'true' : 'false');
  } catch {}
}

export function markTourSeen() {
  try {
    localStorage.setItem('tour_seen_v1', 'true');
  } catch {}
}



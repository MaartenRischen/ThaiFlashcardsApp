'use client';

import React, { useEffect, useState } from 'react';
import { PreloadProgress } from '@/app/lib/preloader';
import Image from 'next/image';

function ComicPanel() {
  const [comic, setComic] = React.useState<{ panels: string[]; title: string } | null>(null);
  const [currentPanel, setCurrentPanel] = React.useState(0);
  
  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/funny-videos/random')
      .then(r => r.ok ? r.json() : Promise.reject(new Error('failed')))
      .then(data => {
        if (!cancelled && data?.panels && data.panels.length > 0) {
          setComic({ panels: data.panels, title: data.title });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Auto-advance panels
  React.useEffect(() => {
    if (!comic || comic.panels.length === 0) return;
    const interval = setInterval(() => {
      setCurrentPanel(prev => (prev + 1) % comic.panels.length);
    }, 3000); // 3 seconds per panel
    return () => clearInterval(interval);
  }, [comic]);

  if (!comic || comic.panels.length === 0) return null;
  
  return (
    <div className="mt-6 space-y-2">
      <div className="text-center text-sm text-gray-400">{comic.title}</div>
      <div className="relative rounded-xl overflow-hidden border border-[#333] bg-black">
        <img
          src={comic.panels[currentPanel]}
          alt={`Panel ${currentPanel + 1}`}
          className="w-full h-48 object-contain"
        />
        <div className="absolute bottom-2 right-2 flex gap-1">
          {comic.panels.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentPanel ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface AppLoadingScreenProps {
  progress: PreloadProgress;
}

export function AppLoadingScreen({ progress }: AppLoadingScreenProps) {
  const [dots, setDots] = useState('');
  
  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Get stage-specific icon
  const getStageIcon = () => {
    switch (progress.stage) {
      case 'auth':
        return '🔐';
      case 'folders':
        return '📁';
      case 'sets':
        return '📚';
      case 'content':
        return '🎴';
      case 'progress':
        return '📊';
      case 'mnemonics':
        return '💡';
      case 'images':
        return '🖼️';
      case 'complete':
        return '✨';
      default:
        return '🚀';
    }
  };

  // Get stage-specific color
  const getProgressColor = () => {
    if (progress.progress >= 100) return 'bg-green-500';
    if (progress.progress >= 80) return 'bg-blue-500';
    if (progress.progress >= 60) return 'bg-indigo-500';
    if (progress.progress >= 40) return 'bg-purple-500';
    if (progress.progress >= 20) return 'bg-pink-500';
    return 'bg-orange-500';
  };

  return (
    <div className="fixed inset-0 bg-[#0F0F0F] z-[9999] flex items-center justify-center">
      <div className="max-w-md w-full px-8">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <Image
              src="/images/logonobg-rev.png"
              alt="Donkey Bridge"
              fill
              className="object-contain animate-pulse"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Donkey Bridge
          </h1>
          <p className="text-gray-400 text-sm">
            Thai Language Learning Experience
          </p>
        </div>

        {/* Progress Container */}
        <div className="bg-[#1F1F1F] rounded-2xl p-6 border border-[#404040] shadow-2xl">
          {/* Stage Icon and Message */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl animate-bounce">{getStageIcon()}</span>
            <div className="flex-1">
              <p className="text-white font-medium">
                {progress.message}{dots}
              </p>
              {progress.subProgress && (
                <p className="text-gray-400 text-sm mt-1">
                  {progress.subProgress.item || 
                   `${progress.subProgress.current} of ${progress.subProgress.total}`}
                </p>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-3 bg-[#2C2C2C] rounded-full overflow-hidden mb-2">
            <div
              className={`absolute inset-y-0 left-0 ${getProgressColor()} transition-all duration-500 ease-out`}
              style={{ width: `${progress.progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
          </div>

          {/* Progress Percentage */}
          <div className="text-right">
            <span className="text-gray-400 text-sm font-mono">
              {Math.round(progress.progress)}%
            </span>
          </div>

          {/* Stage Indicators */}
          <div className="mt-6 grid grid-cols-4 gap-2">
            {['auth', 'folders', 'sets', 'content'].map((stage, index) => (
              <div
                key={stage}
                className={`h-1 rounded-full transition-all duration-300 ${
                  progress.progress > (index + 1) * 25
                    ? 'bg-green-500'
                    : progress.progress > index * 25
                    ? 'bg-blue-500'
                    : 'bg-[#2C2C2C]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Fun Comic Strip (donkey on a bridge) */}
        <ComicPanel />

        {/* Fun Loading Tips */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm italic">
            {getLoadingTip(progress.stage)}
          </p>
        </div>
      </div>
    </div>
  );
}

function getLoadingTip(stage: PreloadProgress['stage']): string {
  const tips = {
    init: "Did you know? 'Sawatdee' can mean both hello and goodbye!",
    auth: "Preparing your personalized learning experience...",
    folders: "Thai has 44 consonants and 32 vowels!",
    sets: "The Thai language has 5 tones that change word meanings.",
    content: "'Mai pen rai' means 'no problem' - a key Thai philosophy!",
    progress: "Tracking your amazing progress so far...",
    mnemonics: "Memory palaces work great for Thai vocabulary!",
    images: "Visual learning boosts retention by up to 65%!",
    complete: "All set! Let's learn some Thai! 🇹🇭"
  };
  
  return tips[stage] || "Loading your Thai learning adventure...";
}

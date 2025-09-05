'use client';

import React, { useEffect, useState } from 'react';
import { PreloadProgress } from '@/app/lib/preloader';
import Image from 'next/image';

function ThaiFactPanel() {
  const [fact, setFact] = React.useState<{ fact: string; category: string; difficulty: string } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    let cancelled = false;
    
    const fetchFact = () => {
      fetch('/api/thai-facts/random')
        .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
        .then(data => {
          if (!cancelled) {
            setFact({
              fact: data.fact,
              category: data.category,
              difficulty: data.difficulty
            });
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error('[ThaiFactPanel] Error fetching fact:', err);
          if (!cancelled) {
            setError('Failed to load Thai fact');
            setLoading(false);
          }
        });
    };

    fetchFact();
    
    // Fetch a new fact every 8 seconds
    const interval = setInterval(fetchFact, 8000);
    
    return () => { 
      cancelled = true; 
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="mt-6 text-center">
        <div className="text-sm text-gray-500">Loading Thai facts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 text-center">
        <div className="text-sm text-gray-500">{error}</div>
      </div>
    );
  }

  if (!fact) return null;
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'grammar': return '📝';
      case 'culture': return '🏛️';
      case 'writing': return '✍️';
      case 'pronunciation': return '🗣️';
      case 'history': return '📚';
      case 'fun': return '🎉';
      default: return '🇹🇭';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400';
      case 'intermediate': return 'text-yellow-400';
      case 'advanced': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };
  
  return (
    <div className="mt-6 space-y-2">
      <div className="text-center text-xs text-gray-500 uppercase tracking-wide">
        Did you know?
      </div>
      <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[#333] relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="text-6xl text-center pt-8">🇹🇭</div>
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{getCategoryIcon(fact.category)}</span>
            <span className="text-xs text-gray-400 capitalize">{fact.category}</span>
            <span className="text-xs text-gray-600">•</span>
            <span className={`text-xs capitalize font-medium ${getDifficultyColor(fact.difficulty)}`}>
              {fact.difficulty}
            </span>
          </div>
          
          <p className="text-sm text-gray-200 leading-relaxed">
            {fact.fact}
          </p>
        </div>
        
        {/* Subtle animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
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
                  {progress.subProgress.item ? (
                    <span className="text-white font-medium">{progress.subProgress.item}</span>
                  ) : (
                    `${progress.subProgress.current} of ${progress.subProgress.total}`
                  )}
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

        {/* Thai Language Facts */}
        <ThaiFactPanel />

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

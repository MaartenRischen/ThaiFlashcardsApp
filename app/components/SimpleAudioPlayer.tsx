'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { Phrase } from '@/app/lib/generation/types';

interface SimpleAudioPlayerProps {
  audioUrl: string;
  phrases: Phrase[];
}

export function SimpleAudioPlayer({ audioUrl, phrases }: SimpleAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentDisplay, setCurrentDisplay] = useState<'english' | 'thai'>('english');
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // Simple timing calculation - each phrase has roughly equal time
  // English -> Thai -> pause pattern
  const getDisplayState = (currentTime: number, totalDuration: number) => {
    if (totalDuration === 0 || phrases.length === 0) return { phraseIndex: 0, display: 'english' as const };
    
    const timePerPhrase = totalDuration / phrases.length;
    const phraseIndex = Math.min(Math.floor(currentTime / timePerPhrase), phrases.length - 1);
    
    // Within each phrase: first half = english, second half = thai
    const timeWithinPhrase = (currentTime % timePerPhrase) / timePerPhrase;
    const display = timeWithinPhrase < 0.5 ? 'english' : 'thai';
    
    return { phraseIndex, display };
  };
  
  useEffect(() => {
    if (duration > 0) {
      const { phraseIndex, display } = getDisplayState(currentTime, duration);
      setCurrentPhraseIndex(phraseIndex);
      setCurrentDisplay(display);
    }
  }, [currentTime, duration, phrases.length]);
  
  const updateTime = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      animationRef.current = requestAnimationFrame(updateTime);
    }
  };
  
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      } else {
        audioRef.current.play();
        updateTime();
      }
    }
  };
  
  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };
  
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const currentPhrase = phrases[currentPhraseIndex];
  
  return (
    <div className="w-full bg-gray-900 rounded-2xl p-6 space-y-6">
      {/* Display Area */}
      <div className="bg-black rounded-xl p-8 min-h-[300px] flex flex-col items-center justify-center">
        {/* Phrase Counter */}
        <div className="text-gray-400 text-sm mb-4">
          Phrase {currentPhraseIndex + 1} of {phrases.length}
        </div>
        
        {/* Current Audio Type Indicator */}
        <div className="text-gray-500 text-xs mb-2">
          Now playing: {currentDisplay === 'english' ? 'English' : 'Thai'}
        </div>
        
        {/* Main Text Display */}
        <div className="text-center space-y-6 max-w-4xl">
          {currentPhrase && (
            <>
              {currentDisplay === 'english' && (
                <h2 className="text-5xl text-blue-400 transition-all duration-300">
                  {currentPhrase.english}
                </h2>
              )}
              
              {currentDisplay === 'thai' && (
                <div className="space-y-4 transition-all duration-300">
                  <h2 className="text-6xl font-thai text-green-400">
                    {currentPhrase.thai}
                  </h2>
                  <p className="text-2xl text-gray-300">
                    {currentPhrase.pronunciation}
                  </p>
                </div>
              )}
              
              {/* Memory Hint - Always visible */}
              {currentPhrase.mnemonic && (
                <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
                  <p className="text-lg text-purple-300 italic">
                    💡 {currentPhrase.mnemonic}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Auto-Sync Info */}
      <div className="text-center text-gray-400 text-sm">
        Automatically synced: English audio → English text, Thai audio → Thai text + pronunciation
      </div>
      
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
      </div>
      
      {/* Audio Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handleReset}
          className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          title="Reset"
        >
          <RotateCcw className="w-5 h-5 text-gray-300" />
        </button>
        
        <button
          onClick={handlePlayPause}
          className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full hover:from-blue-600 hover:to-purple-600 transition-all"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-white" />
          ) : (
            <Play className="w-6 h-6 text-white ml-0.5" />
          )}
        </button>
        
        <button
          className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          title="Volume"
        >
          <Volume2 className="w-5 h-5 text-gray-300" />
        </button>
      </div>
      
      {/* Instructions */}
      <div className="text-center text-gray-400 text-sm">
        Text automatically switches to match the audio - just listen and watch!
      </div>
      
      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }
        }}
      />
    </div>
  );
}
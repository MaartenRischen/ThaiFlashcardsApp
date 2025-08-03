'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { Phrase } from '@/app/lib/generation/types';
import { VideoTimingExtractor } from '@/app/lib/video/timing-extractor';
import { AudioTiming } from '@/app/lib/video/types';
import { SimpleAudioLessonConfig } from '@/app/lib/audio-lesson-generator-simple';

interface AudioLessonPlayerProps {
  audioUrl: string;
  phrases: Phrase[];
  audioConfig: SimpleAudioLessonConfig;
  lessonType: 'simple' | 'structured';
}

export function AudioLessonPlayer({
  audioUrl,
  phrases,
  audioConfig,
  lessonType
}: AudioLessonPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeTimings, setActiveTimings] = useState<AudioTiming[]>([]);
  const [allTimings, setAllTimings] = useState<AudioTiming[]>([]);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // Extract timing data on mount
  useEffect(() => {
    const timingExtractor = new VideoTimingExtractor(
      lessonType === 'simple' ? {
        pauseBetweenPhrases: audioConfig.pauseBetweenPhrases || 1500,
        speed: audioConfig.speed || 1.0,
        loops: audioConfig.loops || 1,
        phraseRepetitions: audioConfig.phraseRepetitions || 2,
        includeMnemonics: audioConfig.includeMnemonics || false,
        mixSpeed: false
      } : {
        pauseDurationMs: {
          afterInstruction: 2000,
          forPractice: 3000,
          betweenPhrases: 1500,
          beforeAnswer: 2000
        },
        repetitions: {
          introduction: 2,
          practice: 3,
          review: 2
        },
        includeMnemonics: audioConfig.includeMnemonics || false,
        speed: audioConfig.speed || 1.0
      }
    );
    
    const timings = lessonType === 'simple'
      ? timingExtractor.extractSimpleLessonTimings(phrases.length)
      : timingExtractor.extractGuidedLessonTimings(phrases.length);
    
    setAllTimings(timings);
  }, [phrases, audioConfig, lessonType]);
  
  // Update active timings based on current time
  useEffect(() => {
    const active = allTimings.filter(timing => 
      currentTime >= timing.startTime && currentTime < timing.endTime
    );
    setActiveTimings(active);
  }, [currentTime, allTimings]);
  
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
  
  const getActivePhrase = () => {
    const activeTiming = activeTimings.find(t => t.type !== 'pause');
    if (!activeTiming) return null;
    
    const phrase = phrases[activeTiming.phraseIndex];
    if (!phrase) return null;
    
    return {
      phrase,
      type: activeTiming.type,
      instructionText: activeTiming.instructionText
    };
  };
  
  const activePhrase = getActivePhrase();
  
  return (
    <div className="w-full bg-gray-900 rounded-2xl p-6 space-y-6">
      {/* Display Area */}
      <div className="bg-black rounded-xl p-8 min-h-[300px] flex items-center justify-center">
        <div className="text-center space-y-6 max-w-4xl">
          {activePhrase ? (
            <>
              {activePhrase.instructionText && (
                <p className="text-gray-400 text-lg mb-4 italic">
                  {activePhrase.instructionText}
                </p>
              )}
              
              {activePhrase.type === 'thai' && (
                <div className="space-y-4">
                  <h2 className="text-6xl font-thai text-green-400">
                    {activePhrase.phrase.thai}
                  </h2>
                  <p className="text-2xl text-gray-300">
                    {activePhrase.phrase.pronunciation}
                  </p>
                </div>
              )}
              
              {activePhrase.type === 'english' && (
                <h2 className="text-5xl text-blue-400">
                  {activePhrase.phrase.english}
                </h2>
              )}
              
              {activePhrase.type === 'mnemonic' && activePhrase.phrase.mnemonic && (
                <div className="space-y-2">
                  <p className="text-xl text-purple-400">Memory Hint:</p>
                  <p className="text-2xl text-purple-300 italic">
                    {activePhrase.phrase.mnemonic}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-500 text-2xl">
              {isPlaying ? 'Pause...' : 'Press play to start'}
            </div>
          )}
        </div>
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
          {/* Show timing markers */}
          {allTimings.map((timing, idx) => (
            <div
              key={idx}
              className={`absolute h-full w-px ${
                timing.type === 'pause' ? 'bg-gray-700' : 'bg-gray-600'
              }`}
              style={{ left: `${(timing.startTime / duration) * 100}%` }}
            />
          ))}
        </div>
      </div>
      
      {/* Controls */}
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
'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Phrase } from '@/app/lib/generation/types';
import { AudioLessonConfig } from '@/app/lib/audio-lesson-generator';
import { SimpleAudioLessonConfig } from '@/app/lib/audio-lesson-generator-simple';
import { AudioTimingExtractor } from '@/app/lib/audio-timing-extractor';
import type { AudioTiming } from '@/app/lib/video-lesson-generator';
import AudioLearningCard from '@/app/components/flashcard-page/AudioLearningCard';

interface SimpleAudioPlayerProps {
  audioUrl: string;
  phrases: Phrase[];
  mode?: 'pimsleur' | 'simple';
  pimsleurConfig?: Partial<AudioLessonConfig>;
  simpleConfig?: Partial<SimpleAudioLessonConfig>;
}

export function SimpleAudioPlayer({
  audioUrl,
  phrases,
  mode = 'simple',
  pimsleurConfig,
  simpleConfig,
}: SimpleAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const lastTimingIndexRef = useRef<number>(0);

  const timings: AudioTiming[] = useMemo(() => {
    const extractor = new AudioTimingExtractor({
      pauseBetweenPhrases:
        mode === 'simple'
          ? (simpleConfig?.pauseBetweenPhrases ?? 2000)
          : (pimsleurConfig?.pauseDurationMs?.betweenPhrases ?? 1500),
      speed: mode === 'simple' ? (simpleConfig?.speed ?? 1.0) : 1.0,
      loops: mode === 'simple' ? (simpleConfig?.loops ?? 1) : 1,
      phraseRepetitions: mode === 'simple' ? (simpleConfig?.phraseRepetitions ?? 2) : 2,
      includeMnemonics: mode === 'simple' ? Boolean(simpleConfig?.includeMnemonics) : false,
      mixSpeed: mode === 'simple' ? Boolean(simpleConfig?.mixSpeed) : false,
    });

    return mode === 'simple'
      ? extractor.extractSimpleLessonTimings(phrases.length)
      : extractor.extractStructuredLessonTimings(phrases.length);
  }, [mode, phrases.length, pimsleurConfig, simpleConfig]);

  const findActiveTiming = useCallback(
    (timeSec: number): AudioTiming | null => {
      if (timings.length === 0) return null;

      // Small optimization: continue from last known index
      let i = lastTimingIndexRef.current;
      if (i < 0 || i >= timings.length) i = 0;

      // If time is before current range, rewind search
      if (timeSec < timings[i].startTime) {
        i = 0;
      }

      for (; i < timings.length; i++) {
        const t = timings[i];
        if (timeSec >= t.startTime && timeSec < t.endTime) {
          lastTimingIndexRef.current = i;
          return t;
        }
      }

      // If not found (e.g., past end), return last timing
      return timings[timings.length - 1] ?? null;
    },
    [timings]
  );

  useEffect(() => {
    const t = findActiveTiming(currentTime);
    if (t) {
      setCurrentPhraseIndex(prevIndex => (t.phraseIndex >= 0 ? t.phraseIndex : prevIndex));
    }
  }, [currentTime, findActiveTiming]);

  const updateTime = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      animationRef.current = requestAnimationFrame(updateTime);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    } else {
      audioRef.current.play();
      updateTime();
    }
  };

  const handleReset = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    lastTimingIndexRef.current = 0;
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const seekOnProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressBarRef.current || duration === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const newTime = ratio * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const currentPhrase = phrases[Math.max(0, Math.min(currentPhraseIndex, phrases.length - 1))];
  const isMaleVoice = simpleConfig?.voiceGender === 'male' || pimsleurConfig?.voiceGender === 'male';
  const isPoliteEnabled =
    mode === 'simple'
      ? Boolean(simpleConfig?.includePolitenessParticles)
      : Boolean(pimsleurConfig?.includePolitenessParticles);

  return (
    <div className="w-full bg-gray-900 rounded-2xl p-6 space-y-6">
      {/* Display Area: Render the real flashcard UI */}
      <div className="bg-black rounded-xl p-6">
        <div className="text-gray-400 text-sm mb-2 text-center">
          {Math.max(1, currentPhraseIndex + 1)} / {phrases.length}
        </div>
        {currentPhrase && (
          <AudioLearningCard
            phrase={currentPhrase}
            isMale={Boolean(isMaleVoice)}
            isPoliteMode={isPoliteEnabled}
          />
        )}
      </div>

      <div className="text-center text-gray-400 text-sm">Auto-synced to audio</div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div
          ref={progressBarRef}
          className="relative h-2 bg-gray-800 rounded-full overflow-hidden cursor-pointer"
          onClick={seekOnProgressClick}
        >
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
          {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-0.5" />}
        </button>

        {/* Intentionally minimal controls for learning mode */}
      </div>

      <div className="text-center text-gray-400 text-sm">
        Text automatically switches to match the audio - just listen and watch!
      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="auto"
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          if (animationRef.current) cancelAnimationFrame(animationRef.current);
        }}
      />
    </div>
  );
}
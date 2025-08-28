'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Volume2, Download, Play, Pause } from 'lucide-react';
import { useAudioGeneration } from '@/app/context/AudioGenerationContext';
import { toast } from 'sonner';

interface AudioReadyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AudioReadyModal({ isOpen, onClose }: AudioReadyModalProps) {
  const { state, clearAudio } = useAudioGeneration();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [isOpen]);

  if (!isOpen || !state.audioUrl || !state.setInfo) {
    return null;
  }

  const handlePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = () => {
    if (state.audioUrl && state.setInfo) {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = state.audioUrl;
      a.download = `${state.setInfo.setName.replace(/[^a-z0-9]/gi, '_')}_audio_lesson.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Audio lesson downloaded!');
    }
  };

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onClose();
    clearAudio();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-[#1F1F1F] rounded-xl p-6 max-w-md w-full border border-[#404040]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-[#E0E0E0]">Audio Lesson Ready!</h3>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-400 text-sm mb-2">Your audio lesson for</p>
          <p className="text-[#E0E0E0] font-medium text-lg">{state.setInfo.setName}</p>
          <p className="text-gray-400 text-sm mt-2">is ready to play or download.</p>
        </div>

        <audio
          ref={audioRef}
          src={state.audioUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          controls
          className="w-full mb-4"
        />

        <div className="flex gap-3">
          <button
            onClick={handlePlay}
            className="flex-1 neumorphic-button py-3 flex items-center justify-center gap-2"
          >
            {isPlaying ? (
              <>
                <Pause className="w-5 h-5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Play</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 neumorphic-button py-3 flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}

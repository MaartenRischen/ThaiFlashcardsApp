'use client';

import React from 'react';
import { X, Volume2, Download } from 'lucide-react';
import { useAudioGeneration } from '@/app/context/AudioGenerationContext';
import { toast } from 'sonner';

interface AudioGenerationStatusBarProps {
  onAudioReady?: () => void;
}

export function AudioGenerationStatusBar({ onAudioReady }: AudioGenerationStatusBarProps) {
  const { state, cancelGeneration, clearAudio } = useAudioGeneration();

  if (!state.isGenerating && !state.audioUrl) {
    return null;
  }

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

  return (
    <div className="fixed top-[200px] left-2 right-2 sm:top-[180px] sm:left-auto sm:right-4 sm:w-96 z-40">
      <div className="neumorphic-card p-3 sm:p-4 border-2 border-blue-500 bg-[#1F1F1F]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            <span className="font-medium text-sm sm:text-base text-[#E0E0E0]">Audio Generation</span>
          </div>
          <button
            onClick={state.isGenerating ? cancelGeneration : clearAudio}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {state.isGenerating ? (
          <>
            <p className="text-sm text-gray-400 mb-2">{state.message}</p>
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-500 h-full transition-all duration-500 ease-out"
                style={{ width: `${state.progress}%` }}
              />
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-2">
              You can continue using the app. Switching sets will cancel generation.
            </p>
          </>
        ) : state.audioUrl && (
          <>
            <p className="text-sm text-green-400 mb-3">
              ✓ Audio lesson ready for "{state.setInfo?.setName}"
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onAudioReady?.();
                  clearAudio();
                }}
                className="flex-1 neumorphic-button px-3 py-2 text-sm flex items-center justify-center gap-2"
              >
                <Volume2 className="w-4 h-4" />
                <span>Play</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 neumorphic-button px-3 py-2 text-sm flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

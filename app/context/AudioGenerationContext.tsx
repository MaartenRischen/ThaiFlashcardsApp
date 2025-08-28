'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';

interface AudioGenerationState {
  isGenerating: boolean;
  progress: number;
  message: string;
  setInfo: {
    setId: string;
    setName: string;
  } | null;
  audioUrl: string | null;
  error: string | null;
}

interface AudioGenerationContextType {
  state: AudioGenerationState;
  startGeneration: (setId: string, setName: string, mode: 'pimsleur' | 'simple', config: Record<string, unknown>) => Promise<void>;
  cancelGeneration: () => void;
  clearAudio: () => void;
}

const AudioGenerationContext = createContext<AudioGenerationContextType | undefined>(undefined);

export function AudioGenerationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AudioGenerationState>({
    isGenerating: false,
    progress: 0,
    message: '',
    setInfo: null,
    audioUrl: null,
    error: null,
  });

  const startGeneration = useCallback(async (setId: string, setName: string, mode: 'pimsleur' | 'simple', config: Record<string, unknown>) => {
    // Clear any previous audio
    if (state.audioUrl) {
      window.URL.revokeObjectURL(state.audioUrl);
    }

    setState({
      isGenerating: true,
      progress: 10,
      message: `Preparing ${mode === 'pimsleur' ? 'guided lesson' : 'repetition mode'} for ${setName}...`,
      setInfo: { setId, setName },
      audioUrl: null,
      error: null,
    });

    try {
      // Update progress periodically
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }));
      }, 2000);

      const response = await fetch(`/api/flashcard-sets/${encodeURIComponent(setId)}/audio-lesson?t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode,
          config,
        }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Audio generation failed:', errorText);
        throw new Error('Failed to generate audio lesson');
      }

      setState(prev => ({
        ...prev,
        progress: 95,
        message: 'Processing audio...',
      }));

      const data = await response.json();
      
      if (data.audioDataBase64) {
        // Convert base64 to blob
        const byteCharacters = atob(data.audioDataBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/wav' });
        const url = window.URL.createObjectURL(blob);
        
        setState({
          isGenerating: false,
          progress: 100,
          message: 'Audio lesson ready!',
          setInfo: { setId, setName },
          audioUrl: url,
          error: null,
        });
        
        toast.success('Audio lesson generated successfully!');
      } else {
        throw new Error('No audio data received');
      }
    } catch (error) {
      console.error('Error generating audio lesson:', error);
      const msg = error instanceof Error ? error.message : 'Failed to generate audio lesson';
      
      setState({
        isGenerating: false,
        progress: 0,
        message: '',
        setInfo: null,
        audioUrl: null,
        error: msg,
      });
      
      toast.error(msg);
    }
  }, [state.audioUrl]);

  const cancelGeneration = useCallback(() => {
    setState(prev => ({
      ...prev,
      isGenerating: false,
      progress: 0,
      message: '',
      error: 'Generation cancelled',
    }));
    toast.info('Audio generation cancelled');
  }, []);

  const clearAudio = useCallback(() => {
    if (state.audioUrl) {
      window.URL.revokeObjectURL(state.audioUrl);
    }
    setState({
      isGenerating: false,
      progress: 0,
      message: '',
      setInfo: null,
      audioUrl: null,
      error: null,
    });
  }, [state.audioUrl]);

  return (
    <AudioGenerationContext.Provider value={{ state, startGeneration, cancelGeneration, clearAudio }}>
      {children}
    </AudioGenerationContext.Provider>
  );
}

export function useAudioGeneration() {
  const context = useContext(AudioGenerationContext);
  if (context === undefined) {
    throw new Error('useAudioGeneration must be used within an AudioGenerationProvider');
  }
  return context;
}

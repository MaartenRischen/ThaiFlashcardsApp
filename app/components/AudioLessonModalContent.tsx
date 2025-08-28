'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, Volume2, Settings2, Loader2, Brain, Repeat, Play, Pause, FileAudio, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { AudioLessonConfig } from '../lib/audio-lesson-generator';
import { SimpleAudioLessonConfig } from '../lib/audio-lesson-generator-simple';
import { toast } from 'sonner';
import { useGeneration } from '@/app/context/GenerationContext';
import { SimpleAudioPlayer } from './SimpleAudioPlayer';
import type { AudioTiming } from '@/app/lib/video-lesson-generator';
import { useSet } from '@/app/context/SetContext';

declare global {
  interface Window {
    __AUDIO_TIMINGS__?: AudioTiming[];
  }
}

interface AudioLessonModalContentProps {
  setId: string;
  setName: string;
  phraseCount: number;
  isMale?: boolean;
  onClose: () => void;
}

export function AudioLessonModalContent({ setId, setName, phraseCount, isMale = false, onClose }: AudioLessonModalContentProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [lessonMode, setLessonMode] = useState<'pimsleur' | 'simple' | 'shuffle'>('simple');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { activeSetContent } = useSet();
  const [config, setConfig] = useState<Partial<AudioLessonConfig>>({
    voiceGender: isMale ? 'male' : 'female',
    pauseDurationMs: {
      afterInstruction: 1000,
      forPractice: 3000,
      betweenPhrases: 1500,
      beforeAnswer: 2000,
    },
    repetitions: {
      introduction: 2,
      practice: 3,
      review: 2,
    },
    includePolitenessParticles: false,
  });
  
  const [simpleConfig, setSimpleConfig] = useState<Partial<SimpleAudioLessonConfig>>({
    voiceGender: isMale ? 'male' : 'female',
    repetitions: 3,
    pauseBetweenRepetitions: 1000,
    pauseBetweenPhrases: 2000,
    loops: 3,
    phraseRepetitions: 2,
    speed: 1.0,
    mixSpeed: false,
    includeMnemonics: false,
    includePolitenessParticles: false,
  });

  // Update voice gender when isMale prop changes
  useEffect(() => {
    setConfig(prev => ({ ...prev, voiceGender: isMale ? 'male' : 'female' }));
    setSimpleConfig(prev => ({ ...prev, voiceGender: isMale ? 'male' : 'female' }));
  }, [isMale]);

  const { startGeneration, completeGeneration, failGeneration } = useGeneration();

  const handleGenerate = async () => {
    // Clear previous audio if regenerating
    if (audioUrl) {
      // Stop audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      window.URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setIsPlaying(false);
      setShowPlayer(false);
    }

    setIsGenerating(true);
    startGeneration(`Generating ${lessonMode} audio lesson for ${setName}...`);
    
    try {
      console.log('🎵 Generating audio lesson:', { 
        setId, 
        mode: lessonMode,
        voiceGender: lessonMode === 'pimsleur' ? config.voiceGender : simpleConfig.voiceGender,
        config: lessonMode === 'pimsleur' ? config : simpleConfig
      });
      
      const response = await fetch(`/api/flashcard-sets/${setId}/audio-lesson?t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: lessonMode,
          config: lessonMode === 'pimsleur' ? config : simpleConfig,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Audio generation failed:', errorText);
        throw new Error('Failed to generate audio lesson');
      }

      const data = await response.json();
      console.log('Audio lesson response:', data);
      
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
        setAudioUrl(url);
        setShowPlayer(true);
        
        // Store timings if available
        if (data.timings) {
          window.__AUDIO_TIMINGS__ = data.timings;
        }
      } else {
        throw new Error('No audio data received');
      }
      
      completeGeneration();
      
      toast.success('Audio lesson generated successfully!');
    } catch (error) {
      console.error('Error generating audio lesson:', error);
      failGeneration();
      const msg = error instanceof Error ? error.message : 'Failed to generate audio lesson';
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

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
    if (audioUrl) {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = audioUrl;
      a.download = `${setName.replace(/[^a-z0-9]/gi, '_')}_${lessonMode}_lesson.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Audio lesson downloaded!');
    }
  };

  // Cleanup audio URL when component unmounts
  useEffect(() => {
    return () => {
      if (audioUrl) {
        window.URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const estimatedDuration = Math.round(
    lessonMode === 'pimsleur' 
      ? (phraseCount * 30 + // Rough estimate: 30 seconds per phrase
         phraseCount * (config.pauseDurationMs?.forPractice || 3000) / 1000 +
         120) / 60 // Plus intro/outro
      : (phraseCount * (simpleConfig.repetitions || 3) * 5 * (simpleConfig.loops || 3)) / 60 // Simple mode estimate
  );

  return (
    <div className="w-[95vw] max-w-[525px] max-h-[90vh] bg-[#1f1f1f] border border-[#404040] text-[#E0E0E0] rounded-xl overflow-hidden flex flex-col">
      <div className="sticky top-0 bg-[#1f1f1f] p-6 pb-4 z-10 border-b border-[#404040]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-[#E0E0E0]">Generate Audio Lesson</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[#BDBDBD] text-sm">
          Create an audio lesson for "{setName}" with {phraseCount} phrases.
          Estimated duration: ~{estimatedDuration} minutes.
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-6">
          {/* Mode Selection */}
          <div className="grid gap-3">
            <Label className="text-[#E0E0E0] font-medium">Lesson Style</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setLessonMode('pimsleur')}
                className={`flex items-center justify-start gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  lessonMode === 'pimsleur' 
                    ? 'bg-[#A9C4FC] text-[#121212] border border-[#A9C4FC]' 
                    : 'bg-[#3C3C3C] text-[#E0E0E0] border border-[#404040] hover:bg-[#4C4C4C]'
                }`}
              >
                <Brain className="w-5 h-5 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium">Guided Lesson</div>
                  <div className="text-xs opacity-80">For interactive learning</div>
                </div>
              </button>
              <button
                onClick={() => setLessonMode('simple')}
                className={`flex items-center justify-start gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  lessonMode === 'simple' 
                    ? 'bg-[#A9C4FC] text-[#121212] border border-[#A9C4FC]' 
                    : 'bg-[#3C3C3C] text-[#E0E0E0] border border-[#404040] hover:bg-[#4C4C4C]'
                }`}
              >
                <Repeat className="w-5 h-5 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium">Repetition Mode</div>
                  <div className="text-xs opacity-80">For passive practice</div>
                </div>
              </button>
              <button
                onClick={() => setLessonMode('shuffle')}
                className={`flex items-center justify-start gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  lessonMode === 'shuffle' 
                    ? 'bg-[#A9C4FC] text-[#121212] border border-[#A9C4FC]' 
                    : 'bg-[#3C3C3C] text-[#E0E0E0] border border-[#404040] hover:bg-[#4C4C4C]'
                }`}
              >
                <FileAudio className="w-5 h-5 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium">Shuffle Mode</div>
                  <div className="text-xs opacity-80">For review sessions</div>
                </div>
              </button>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-[#A9C4FC] hover:text-[#b8d0fd] transition-colors"
            >
              <Settings2 className="w-4 h-4" />
              {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
            </button>

            {showAdvanced && lessonMode === 'simple' && (
              <div className="space-y-4 p-4 bg-[#2a2a2a] rounded-lg">
                <div className="grid gap-3">
                  <Label>Loops (full set repetitions): {simpleConfig.loops}</Label>
                  <Slider
                    value={[simpleConfig.loops || 3]}
                    onValueChange={([value]) => setSimpleConfig(prev => ({ ...prev, loops: value }))}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                <div className="grid gap-3">
                  <Label>Speed: {simpleConfig.speed}x</Label>
                  <Slider
                    value={[simpleConfig.speed || 1]}
                    onValueChange={([value]) => setSimpleConfig(prev => ({ ...prev, speed: value }))}
                    min={0.5}
                    max={1.5}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="includeMnemonics"
                    checked={simpleConfig.includeMnemonics}
                    onChange={(e) => setSimpleConfig(prev => ({ ...prev, includeMnemonics: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="includeMnemonics">Include mnemonics</Label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="includePoliteness"
                    checked={simpleConfig.includePolitenessParticles}
                    onChange={(e) => setSimpleConfig(prev => ({ ...prev, includePolitenessParticles: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="includePoliteness">Include politeness particles (ครับ/ค่ะ)</Label>
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full neumorphic-button py-3 text-base font-medium flex items-center justify-center gap-3"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Audio Lesson...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5" />
                <span>Generate Audio Lesson</span>
              </>
            )}
          </button>

          {/* Audio Player */}
          {audioUrl && (
            <div className="space-y-4 p-4 bg-[#2a2a2a] rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-[#E0E0E0]">Audio Lesson Ready</h3>
                <button
                  onClick={handleDownload}
                  className="neumorphic-button px-3 py-1.5 text-sm flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
              
              <audio
                ref={audioRef}
                src={audioUrl}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlay}
                  className="neumorphic-button p-3 rounded-full"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <div className="flex-1">
                  <SimpleAudioPlayer
                    audioUrl={audioUrl}
                    audioRef={audioRef}
                    isPlaying={isPlaying}
                    onPlayPause={handlePlay}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

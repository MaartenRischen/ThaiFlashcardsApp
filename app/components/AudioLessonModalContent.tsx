'use client';

import { useState, useEffect } from 'react';
import { Volume2, Settings2, Loader2, Brain, Repeat, X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { AudioLessonConfig } from '../lib/audio-lesson-generator';
import { SimpleAudioLessonConfig } from '../lib/audio-lesson-generator-simple';
import { useAudioGeneration } from '@/app/context/AudioGenerationContext';
import type { AudioTiming } from '@/app/lib/video-lesson-generator';

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
  const { state, startGeneration } = useAudioGeneration();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [lessonMode, setLessonMode] = useState<'pimsleur' | 'simple'>('simple');
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

  const handleGenerate = async () => {
    const selectedConfig = lessonMode === 'pimsleur' ? config : simpleConfig;
    await startGeneration(setId, setName, lessonMode, selectedConfig);
    
    // Don't close the modal immediately - let user see the status bar appear
    // They can close it manually when ready
  };



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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            {showAdvanced && (
              <div className="space-y-4 p-4 bg-[#2a2a2a] rounded-lg">
                {/* Gender Switch - Available for both modes */}
                <div className="grid gap-3 pb-3 border-b border-gray-700">
                  <Label>Voice Gender</Label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setConfig(prev => ({ ...prev, voiceGender: 'male' }));
                        setSimpleConfig(prev => ({ ...prev, voiceGender: 'male' }));
                      }}
                      className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                        (lessonMode === 'pimsleur' ? config.voiceGender : simpleConfig.voiceGender) === 'male'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Male (ครับ)
                    </button>
                    <button
                      onClick={() => {
                        setConfig(prev => ({ ...prev, voiceGender: 'female' }));
                        setSimpleConfig(prev => ({ ...prev, voiceGender: 'female' }));
                      }}
                      className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                        (lessonMode === 'pimsleur' ? config.voiceGender : simpleConfig.voiceGender) === 'female'
                          ? 'bg-pink-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Female (ค่ะ)
                    </button>
                  </div>
                </div>

                {/* Mode-specific settings */}
                {lessonMode === 'simple' && (
                  <>
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
                  </>
                )}
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={state.isGenerating}
            className="w-full neumorphic-button py-3 text-base font-medium flex items-center justify-center gap-3"
          >
            {state.isGenerating ? (
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
          
          {/* Show confirmation when generation starts */}
          {state.isGenerating && (
            <div className="mt-4 p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
              <p className="text-sm text-green-400 text-center">
                ✓ Audio generation started! You can close this window and continue learning.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

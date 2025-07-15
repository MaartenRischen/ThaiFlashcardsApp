'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Volume2, Settings2, Loader2, Brain, Repeat, Play, Pause, FileAudio } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

interface AudioLessonDownloadProps {
  setId: string;
  setName: string;
  phraseCount: number;
}

export function AudioLessonDownload({ setId, setName, phraseCount }: AudioLessonDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [lessonMode, setLessonMode] = useState<'pimsleur' | 'simple'>('pimsleur');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [config, setConfig] = useState<Partial<AudioLessonConfig>>({
    voiceGender: 'female',
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
  });
  
  const [simpleConfig, setSimpleConfig] = useState<Partial<SimpleAudioLessonConfig>>({
    voiceGender: 'female',
    repetitions: 3,
    pauseBetweenRepetitions: 1000,
    pauseBetweenPhrases: 2000,
    loops: 3,
  });

  const handleGenerate = async () => {
    // Clear previous audio if regenerating
    if (audioUrl) {
      window.URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setIsPlaying(false);
    }
    
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/flashcard-sets/${setId}/audio-lesson`, {
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
        throw new Error('Failed to generate audio lesson');
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create object URL for in-app playback
      const url = window.URL.createObjectURL(blob);
      setAudioUrl(url);
      
      toast.success('Audio lesson generated successfully!');
    } catch (error) {
      console.error('Error generating audio lesson:', error);
      toast.error('Failed to generate audio lesson');
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
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
      <DialogTrigger asChild>
        <button
          className="relative neumorphic-icon-button text-xl rounded-xl bg-[#3C3C3C] hover:bg-[#3d3c44] text-[#f59e0b] before:absolute before:inset-0 before:rounded-xl before:shadow-[0_0_20px_10px_rgba(245,158,11,0.15)] before:pointer-events-none"
          style={{
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.2), 0 0 40px rgba(255, 255, 255, 0.1)',
          }}
          title="Audio Lesson"
          aria-label="Audio Lesson"
        >
          <Volume2 />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] bg-[#2a2a2a] border-[#404040] text-[#e0e0e0]">
        <DialogHeader>
          <DialogTitle className="text-[#e0e0e0] text-xl font-semibold">Generate Audio Lesson</DialogTitle>
          <DialogDescription className="text-[#a0a0a0]">
            Create an audio lesson for "{setName}" with {phraseCount} phrases.
            Estimated duration: ~{estimatedDuration} minutes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Mode Selection */}
          <div className="grid gap-3">
            <Label className="text-[#e0e0e0] font-medium">Lesson Style</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setLessonMode('pimsleur')}
                className={`flex items-center justify-start gap-3 px-4 py-3 rounded-xl transition-all shadow-lg ${
                  lessonMode === 'pimsleur' 
                    ? 'bg-[#f59e0b] text-white shadow-[0_4px_15px_rgba(245,158,11,0.3)] border border-[#f59e0b]' 
                    : 'bg-[#3a3a3a] text-[#e0e0e0] border border-[#505050] hover:bg-[#404040] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.1)]'
                }`}
              >
                <Brain className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Guided Lesson</div>
                  <div className="text-xs opacity-80">For interactive learning</div>
                </div>
              </button>
              <button
                onClick={() => setLessonMode('simple')}
                className={`flex items-center justify-start gap-3 px-4 py-3 rounded-xl transition-all shadow-lg ${
                  lessonMode === 'simple' 
                    ? 'bg-[#f59e0b] text-white shadow-[0_4px_15px_rgba(245,158,11,0.3)] border border-[#f59e0b]' 
                    : 'bg-[#3a3a3a] text-[#e0e0e0] border border-[#505050] hover:bg-[#404040] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.1)]'
                }`}
              >
                <Repeat className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Repetition Mode</div>
                  <div className="text-xs opacity-80">For sleep learning</div>
                </div>
              </button>
            </div>
          </div>
          {/* Voice Selection */}
          <div className="grid gap-3">
            <Label htmlFor="voice" className="text-[#e0e0e0] font-medium">Voice Gender</Label>
            <Select
              value={lessonMode === 'pimsleur' ? config.voiceGender : simpleConfig.voiceGender}
              onValueChange={(value) => {
                if (lessonMode === 'pimsleur') {
                  setConfig({ ...config, voiceGender: value as 'male' | 'female' });
                } else {
                  setSimpleConfig({ ...simpleConfig, voiceGender: value as 'male' | 'female' });
                }
              }}
            >
              <SelectTrigger id="voice" className="bg-[#3a3a3a] border-[#505050] text-[#e0e0e0] rounded-xl shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.1)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#3a3a3a] border-[#505050] text-[#e0e0e0]">
                <SelectItem value="female" className="text-[#e0e0e0] hover:bg-[#404040]">Female (Premwadee)</SelectItem>
                <SelectItem value="male" className="text-[#e0e0e0] hover:bg-[#404040]">Male (Niwat)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Basic Settings Info */}
          <div className="text-sm text-[#a0a0a0] space-y-2 bg-[#333333] p-4 rounded-xl border border-[#505050]">
            {lessonMode === 'pimsleur' ? (
              <>
                <p>• Practice pause: {(config.pauseDurationMs?.forPractice || 3000) / 1000}s</p>
                <p>• Repetitions: {config.repetitions?.practice || 3} times per phrase</p>
              </>
            ) : (
              <>
                <p>• Repetitions per phrase: {simpleConfig.repetitions || 3}x</p>
                <p>• Total loops: {simpleConfig.loops || 3}x through all phrases</p>
                <p>• Perfect for passive listening or sleep learning</p>
              </>
            )}
          </div>

          {/* Advanced Settings - Collapsible */}
          {showAdvanced && lessonMode === 'pimsleur' && (
            <>
              {/* Pause Durations */}
              <div className="grid gap-4 pt-4 border-t border-[#505050]">
                <h4 className="text-sm font-medium text-[#e0e0e0]">Pause Durations</h4>
                
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="practice-pause" className="text-xs text-[#a0a0a0]">
                      Practice Pause: {(config.pauseDurationMs?.forPractice || 3000) / 1000}s
                    </Label>
                  </div>
                  <Slider
                    id="practice-pause"
                    min={1000}
                    max={5000}
                    step={500}
                    value={[config.pauseDurationMs?.forPractice || 3000]}
                    onValueChange={(value) => setConfig({
                      ...config,
                      pauseDurationMs: {
                        ...config.pauseDurationMs!,
                        forPractice: value[0],
                      },
                    })}
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="answer-pause" className="text-xs text-[#a0a0a0]">
                      Before Answer: {(config.pauseDurationMs?.beforeAnswer || 2000) / 1000}s
                    </Label>
                  </div>
                  <Slider
                    id="answer-pause"
                    min={1000}
                    max={4000}
                    step={500}
                    value={[config.pauseDurationMs?.beforeAnswer || 2000]}
                    onValueChange={(value) => setConfig({
                      ...config,
                      pauseDurationMs: {
                        ...config.pauseDurationMs!,
                        beforeAnswer: value[0],
                      },
                    })}
                  />
                </div>
              </div>

              {/* Repetitions */}
              <div className="grid gap-4">
                <h4 className="text-sm font-medium text-[#e0e0e0]">Repetitions</h4>
                
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="intro-reps" className="text-xs text-[#a0a0a0]">
                      Introduction: {config.repetitions?.introduction || 2}x
                    </Label>
                  </div>
                  <Slider
                    id="intro-reps"
                    min={1}
                    max={4}
                    step={1}
                    value={[config.repetitions?.introduction || 2]}
                    onValueChange={(value) => setConfig({
                      ...config,
                      repetitions: {
                        ...config.repetitions!,
                        introduction: value[0],
                      },
                    })}
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="practice-reps" className="text-xs text-[#a0a0a0]">
                      Practice: {config.repetitions?.practice || 3}x
                    </Label>
                  </div>
                  <Slider
                    id="practice-reps"
                    min={1}
                    max={5}
                    step={1}
                    value={[config.repetitions?.practice || 3]}
                    onValueChange={(value) => setConfig({
                      ...config,
                      repetitions: {
                        ...config.repetitions!,
                        practice: value[0],
                      },
                    })}
                  />
                </div>
              </div>
            </>
          )}
          
          {/* Advanced Settings for Simple Mode */}
          {showAdvanced && lessonMode === 'simple' && (
            <div className="grid gap-4 pt-4 border-t border-[#505050]">
              <div className="grid gap-2">
                <Label htmlFor="simple-reps" className="text-xs text-[#a0a0a0]">
                  Repetitions per phrase: {simpleConfig.repetitions}x
                </Label>
                <Slider
                  id="simple-reps"
                  min={1}
                  max={5}
                  step={1}
                  value={[simpleConfig.repetitions || 3]}
                  onValueChange={(value) => setSimpleConfig({
                    ...simpleConfig,
                    repetitions: value[0],
                  })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="loops" className="text-xs text-[#a0a0a0]">
                  Total loops: {simpleConfig.loops}x
                </Label>
                <Slider
                  id="loops"
                  min={1}
                  max={10}
                  step={1}
                  value={[simpleConfig.loops || 3]}
                  onValueChange={(value) => setSimpleConfig({
                    ...simpleConfig,
                    loops: value[0],
                  })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="pause-between" className="text-xs text-[#a0a0a0]">
                  Pause between phrases: {(simpleConfig.pauseBetweenPhrases || 2000) / 1000}s
                </Label>
                <Slider
                  id="pause-between"
                  min={500}
                  max={3000}
                  step={500}
                  value={[simpleConfig.pauseBetweenPhrases || 2000]}
                  onValueChange={(value) => setSimpleConfig({
                    ...simpleConfig,
                    pauseBetweenPhrases: value[0],
                  })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Audio Player Section */}
        {audioUrl && (
          <div className="border border-[#505050] rounded-xl p-4 space-y-3 bg-[#333333] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.1)]">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-[#e0e0e0] flex items-center gap-2">
                <FileAudio className="w-4 h-4 text-[#f59e0b]" />
                Audio Lesson Ready
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePlay}
                  className="flex items-center gap-2 px-3 py-2 bg-[#f59e0b] text-white rounded-lg hover:bg-[#e08e00] transition-colors shadow-lg"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Play
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-3 py-2 bg-[#3a3a3a] text-[#e0e0e0] border border-[#505050] rounded-lg hover:bg-[#404040] transition-colors shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.1)]"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>
        )}

        <div className="flex justify-between items-center pt-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 px-3 py-2 bg-[#3a3a3a] text-[#e0e0e0] border border-[#505050] rounded-lg hover:bg-[#404040] transition-colors shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.1)]"
          >
            <Settings2 className="w-4 h-4" />
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>

          <button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all shadow-lg ${
              isGenerating 
                ? 'bg-[#666666] text-[#999999] cursor-not-allowed' 
                : 'bg-[#f59e0b] text-white hover:bg-[#e08e00] shadow-[0_4px_15px_rgba(245,158,11,0.3)]'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : audioUrl ? (
              <>
                <FileAudio className="w-5 h-5" />
                Regenerate Lesson
              </>
            ) : (
              <>
                <FileAudio className="w-5 h-5" />
                Generate Lesson
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
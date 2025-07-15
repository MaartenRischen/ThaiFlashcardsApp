'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Volume2, Settings2, Loader2, Brain, Repeat } from 'lucide-react';
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

  const handleDownload = async () => {
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
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${setName.replace(/[^a-z0-9]/gi, '_')}_lesson.wav`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setShowSettings(false);
    } catch (error) {
      console.error('Error downloading audio lesson:', error);
      alert('Failed to generate audio lesson. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

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
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Generate Audio Lesson</DialogTitle>
          <DialogDescription>
            Create an audio lesson for "{setName}" with {phraseCount} phrases.
            Estimated duration: ~{estimatedDuration} minutes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Mode Selection */}
          <div className="grid gap-3">
            <Label>Lesson Style</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={lessonMode === 'pimsleur' ? 'default' : 'outline'}
                onClick={() => setLessonMode('pimsleur')}
                className="justify-start gap-2"
              >
                <Brain className="w-4 h-4" />
                <div className="text-left">
                  <div className="font-medium">Pimsleur Style</div>
                  <div className="text-xs opacity-80">Interactive learning</div>
                </div>
              </Button>
              <Button
                variant={lessonMode === 'simple' ? 'default' : 'outline'}
                onClick={() => setLessonMode('simple')}
                className="justify-start gap-2"
              >
                <Repeat className="w-4 h-4" />
                <div className="text-left">
                  <div className="font-medium">Repetition Mode</div>
                  <div className="text-xs opacity-80">For sleep learning</div>
                </div>
              </Button>
            </div>
          </div>
          {/* Voice Selection */}
          <div className="grid gap-2">
            <Label htmlFor="voice">Voice Gender</Label>
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
              <SelectTrigger id="voice">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Female (Premwadee)</SelectItem>
                <SelectItem value="male">Male (Niwat)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Basic Settings Info */}
          <div className="text-sm text-gray-600 space-y-1">
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
              <div className="grid gap-4 pt-4 border-t">
                <h4 className="text-sm font-medium">Pause Durations</h4>
                
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="practice-pause" className="text-xs">
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
                    <Label htmlFor="answer-pause" className="text-xs">
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
                <h4 className="text-sm font-medium">Repetitions</h4>
                
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="intro-reps" className="text-xs">
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
                    <Label htmlFor="practice-reps" className="text-xs">
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
            <div className="grid gap-4 pt-4 border-t">
              <div className="grid gap-2">
                <Label htmlFor="simple-reps" className="text-xs">
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
                <Label htmlFor="loops" className="text-xs">
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
                <Label htmlFor="pause-between" className="text-xs">
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

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Settings2 className="w-4 h-4 mr-2" />
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </Button>

          <Button 
            onClick={handleDownload} 
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download Lesson
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Volume2, Settings2, Loader2 } from 'lucide-react';
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

interface AudioLessonDownloadProps {
  setId: string;
  setName: string;
  phraseCount: number;
}

export function AudioLessonDownload({ setId, setName, phraseCount }: AudioLessonDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/flashcard-sets/${setId}/audio-lesson`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
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
    (phraseCount * 30 + // Rough estimate: 30 seconds per phrase
    phraseCount * (config.pauseDurationMs?.forPractice || 3000) / 1000 +
    120) / 60 // Plus intro/outro
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
            Create a Pimsleur-style audio lesson for "{setName}" with {phraseCount} phrases.
            Estimated duration: ~{estimatedDuration} minutes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Voice Selection */}
          <div className="grid gap-2">
            <Label htmlFor="voice">Voice Gender</Label>
            <Select
              value={config.voiceGender}
              onValueChange={(value) => setConfig({ ...config, voiceGender: value as 'male' | 'female' })}
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

          {/* Pause Durations */}
          <div className="grid gap-4">
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
        </div>

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings2 className="w-4 h-4 mr-2" />
            Advanced
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
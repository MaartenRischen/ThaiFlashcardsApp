'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, Volume2, Settings2, Loader2, Brain, Repeat, Play, Pause, FileAudio, Video } from 'lucide-react';
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
import { useGeneration } from '@/app/context/GenerationContext';
import { VideoLessonModal } from './VideoLessonModal';
import { useSet } from '@/app/context/SetContext';

interface AudioLessonDownloadProps {
  setId: string;
  setName: string;
  phraseCount: number;
  isMale?: boolean;
}

export function AudioLessonDownload({ setId, setName, phraseCount, isMale = false }: AudioLessonDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [lessonMode, setLessonMode] = useState<'pimsleur' | 'simple'>('simple');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
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
    }
    
    setIsGenerating(true);
    
    // Start generation progress immediately
    const mode = lessonMode === 'pimsleur' ? 'audio-pimsleur' : 'audio-simple';
    startGeneration(mode, 0);
    
    try {
      // Debug logging
      const configToSend = lessonMode === 'pimsleur' ? config : simpleConfig;
      console.log('🚀 FRONTEND: Sending audio generation request');
      console.log('🚀 Mode:', lessonMode);
      console.log('🚀 Full config object being sent:', JSON.stringify(configToSend, null, 2));
      console.log('🚀 Politeness particles setting:', configToSend.includePolitenessParticles);
      console.log('🚀 Voice gender:', configToSend.voiceGender);
      console.log('🚀 Request body:', JSON.stringify({
        mode: lessonMode,
        config: configToSend,
      }, null, 2));
      
      const response = await fetch(`/api/flashcard-sets/${setId}/audio-lesson?t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          mode: lessonMode,
          config: configToSend,
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
      
      // Complete generation after a short delay
      setTimeout(() => {
        completeGeneration();
      }, 500);
      
      toast.success('Audio lesson generated successfully!');
    } catch (error) {
      console.error('Error generating audio lesson:', error);
      failGeneration();
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
    <>
    <Dialog open={showSettings} onOpenChange={(open) => {
        setShowSettings(open);
        if (!open) {
          // Close video modal when audio modal is closed
          setShowVideoModal(false);
        }
      }}>
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
      <DialogContent className="w-[95vw] max-w-[525px] max-h-[90vh] bg-[#1f1f1f] border-[#404040] text-[#E0E0E0] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-[#1f1f1f] pb-4 z-10">
          <DialogTitle className="text-[#E0E0E0] text-xl font-semibold">Generate Audio Lesson</DialogTitle>
          <DialogDescription className="text-[#BDBDBD]">
            Create an audio lesson for "{setName}" with {phraseCount} phrases.
            Estimated duration: ~{estimatedDuration} minutes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4 pb-6">
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
                  <div className="text-xs opacity-80">For sleep learning</div>
                </div>
              </button>
            </div>
          </div>

          {/* Voice Selection */}
          <div className="grid gap-3">
            <Label htmlFor="voice" className="text-[#E0E0E0] font-medium">Voice Gender</Label>
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
              <SelectTrigger id="voice" className="bg-[#3C3C3C] border-[#404040] text-[#E0E0E0] rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#3C3C3C] border-[#404040] text-[#E0E0E0]">
                <SelectItem value="female" className="text-[#E0E0E0] hover:bg-[#4C4C4C]">Female (Premwadee)</SelectItem>
                <SelectItem value="male" className="text-[#E0E0E0] hover:bg-[#4C4C4C]">Male (Niwat)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Basic Settings Info */}
          <div className="text-sm text-[#BDBDBD] space-y-2 bg-[#2C2C2C] p-4 rounded-lg border border-[#404040]">
            {lessonMode === 'pimsleur' ? (
              <>
                <p>• Practice time: {(config.pauseDurationMs?.forPractice || 3000) / 1000} seconds to repeat each word</p>
                <p>• Each phrase will be repeated {config.repetitions?.practice || 3} times</p>
              </>
            ) : (
              <>
                <p>• Each phrase will be repeated {simpleConfig.phraseRepetitions || 2} times in a row</p>
                <p>• Speaking speed: {((simpleConfig.speed || 1) * 100).toFixed(0)}% of normal speed</p>
                {simpleConfig.mixSpeed && <p>• Speed will vary between repetitions for better learning</p>}
                <p>• The entire set will be repeated {simpleConfig.loops || 3} times</p>
                <p>• Perfect for passive listening or sleep learning</p>
                {simpleConfig.includeMnemonics && <p>• Memory hints (mnemonics) will be included in the audio</p>}
                {simpleConfig.includePolitenessParticles && <p>• Polite endings (ka/krub) will be added</p>}
              </>
            )}
          </div>

          {/* Politeness Particles Option */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="include-politeness"
              checked={lessonMode === 'pimsleur' ? (config.includePolitenessParticles || false) : (simpleConfig.includePolitenessParticles || false)}
              onChange={(e) => {
                console.log('🔧 POLITENESS CHECKBOX CHANGED:', {
                  checked: e.target.checked,
                  lessonMode,
                  currentPimsleurConfig: config.includePolitenessParticles,
                  currentSimpleConfig: simpleConfig.includePolitenessParticles
                });
                
                if (lessonMode === 'pimsleur') {
                  const newConfig = { ...config, includePolitenessParticles: e.target.checked };
                  console.log('🔧 UPDATING PIMSLEUR CONFIG:', newConfig);
                  setConfig(newConfig);
                } else {
                  const newConfig = { ...simpleConfig, includePolitenessParticles: e.target.checked };
                  console.log('🔧 UPDATING SIMPLE CONFIG:', newConfig);
                  setSimpleConfig(newConfig);
                }
              }}
              className="w-4 h-4 text-[#A9C4FC] bg-[#3C3C3C] border-[#404040] rounded focus:ring-[#A9C4FC] focus:ring-2"
            />
            <Label htmlFor="include-politeness" className="text-[#E0E0E0] cursor-pointer">
              Add polite endings ({(lessonMode === 'pimsleur' ? config.voiceGender : simpleConfig.voiceGender) === 'female' ? 'ka' : 'krub'}) to phrases
            </Label>
          </div>

          {/* Include Mnemonics Option for Repetition Mode */}
          {lessonMode === 'simple' && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="include-mnemonics"
                checked={simpleConfig.includeMnemonics || false}
                onChange={(e) => setSimpleConfig({ ...simpleConfig, includeMnemonics: e.target.checked })}
                className="w-4 h-4 text-[#A9C4FC] bg-[#3C3C3C] border-[#404040] rounded focus:ring-[#A9C4FC] focus:ring-2"
              />
              <Label htmlFor="include-mnemonics" className="text-[#E0E0E0] cursor-pointer">
                Include memory hints (mnemonics) in the audio
              </Label>
            </div>
          )}

          {/* Repetition Settings for Simple Mode */}
          {lessonMode === 'simple' && (
            <div className="space-y-4">
              {/* Phrase Repetitions */}
              <div className="grid gap-2">
                <Label htmlFor="phrase-repetitions" className="text-[#E0E0E0] text-sm">
                  Number of times to repeat each phrase in a row: {simpleConfig.phraseRepetitions || 2}
                </Label>
                <Slider
                  id="phrase-repetitions"
                  min={1}
                  max={10}
                  step={1}
                  value={[simpleConfig.phraseRepetitions || 2]}
                  onValueChange={(value) => setSimpleConfig({ ...simpleConfig, phraseRepetitions: value[0] })}
                  className="[&_[role=slider]]:bg-[#A9C4FC]"
                />
              </div>

              {/* Total Loops */}
              <div className="grid gap-2">
                <Label htmlFor="loops" className="text-[#E0E0E0] text-sm">
                  Number of times to repeat the entire set: {simpleConfig.loops || 3}
                </Label>
                <Slider
                  id="loops"
                  min={1}
                  max={10}
                  step={1}
                  value={[simpleConfig.loops || 3]}
                  onValueChange={(value) => setSimpleConfig({ ...simpleConfig, loops: value[0] })}
                  className="[&_[role=slider]]:bg-[#A9C4FC]"
                />
              </div>

              {/* Speed Control */}
              <div className="grid gap-2">
                <Label htmlFor="speed" className="text-[#E0E0E0] text-sm">
                  Speaking speed: {((simpleConfig.speed || 1) * 100).toFixed(0)}% of normal speed
                </Label>
                <Slider
                  id="speed"
                  min={0.5}
                  max={1.5}
                  step={0.1}
                  value={[simpleConfig.speed || 1]}
                  onValueChange={(value) => setSimpleConfig({ ...simpleConfig, speed: value[0] })}
                  className="[&_[role=slider]]:bg-[#A9C4FC]"
                />
              </div>

              {/* Mix Speed Option */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="mix-speed"
                  checked={simpleConfig.mixSpeed || false}
                  onChange={(e) => setSimpleConfig({ ...simpleConfig, mixSpeed: e.target.checked })}
                  className="w-4 h-4 text-[#A9C4FC] bg-[#3C3C3C] border-[#404040] rounded focus:ring-[#A9C4FC] focus:ring-2"
                />
                <Label htmlFor="mix-speed" className="text-[#E0E0E0] cursor-pointer">
                  Vary the speaking speed between repetitions (helps with learning)
                </Label>
              </div>
            </div>
          )}

          {/* Advanced Settings - Collapsible */}
          {showAdvanced && lessonMode === 'pimsleur' && (
            <>
              {/* Pause Durations */}
              <div className="grid gap-4 pt-4 border-t border-[#404040]">
                <h4 className="text-sm font-medium text-[#A9C4FC]">Pause Durations</h4>
                
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="practice-pause" className="text-xs text-[#BDBDBD]">
                      Time given to practice each word: {(config.pauseDurationMs?.forPractice || 3000) / 1000} seconds
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
                    <Label htmlFor="answer-pause" className="text-xs text-[#BDBDBD]">
                      Time before showing the answer: {(config.pauseDurationMs?.beforeAnswer || 2000) / 1000} seconds
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
            </>
          )}
          
          {/* Advanced Settings for Simple Mode */}
          {showAdvanced && lessonMode === 'simple' && (
            <div className="grid gap-4 pt-4 border-t border-[#404040]">
              <div className="grid gap-2">
                <Label htmlFor="pause-between" className="text-xs text-[#BDBDBD]">
                  Silence between phrases: {(simpleConfig.pauseBetweenPhrases || 2000) / 1000} seconds
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
          <div className="border border-[#404040] rounded-lg p-4 space-y-3 bg-[#2C2C2C] mx-6 mb-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-[#E0E0E0] flex items-center gap-2">
                <FileAudio className="w-4 h-4 text-[#A9C4FC]" />
                Audio Lesson Ready
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePlay}
                  className="flex items-center gap-2 px-3 py-2 bg-[#A9C4FC] text-[#121212] rounded-lg hover:bg-[#BB86FC] transition-colors"
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
                  className="flex items-center gap-2 px-3 py-2 bg-[#3C3C3C] text-[#E0E0E0] border border-[#404040] rounded-lg hover:bg-[#4C4C4C] transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => setShowVideoModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                  title="Generate video lesson with synchronized text"
                >
                  <Video className="w-4 h-4" />
                  Video
                </button>
              </div>
            </div>
            
            {/* Download Warning */}
            <div className="bg-[#2A2A2A] border border-[#555555] rounded-lg p-3">
              <div className="flex items-start gap-2">
                <div className="text-yellow-400 text-lg">⚠️</div>
                <div className="text-sm text-[#E0E0E0]">
                  <p className="font-medium mb-1">Important: Download your audio lesson</p>
                  <p className="text-[#BDBDBD]">
                    Please download the audio file before switching to another set. 
                    Audio lessons are not saved in the app and will be lost when you navigate away.
                    We recommend using your preferred audio player for the best listening experience.
                  </p>
                </div>
              </div>
            </div>
            
            <audio
              key={audioUrl}  // Force re-render when URL changes
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>
        )}

        {/* Generation Info Message */}
        {!audioUrl && (
          <div className="text-sm text-[#BDBDBD] bg-[#2C2C2C] p-3 rounded-lg border border-[#404040] mx-6 mb-4">
            <p className="mb-1">💡 <strong>Tip:</strong> Once generation starts, you can close this dialog and continue using the app.</p>
            <p className="mb-2">The audio generation will continue in the background and you'll be notified when it's complete.</p>
            
            {isGenerating && (
              <div className="bg-[#2A2A2A] border border-[#555555] rounded-lg p-3 mt-3">
                <div className="flex items-start gap-2">
                  <div className="text-yellow-400 text-lg">⚠️</div>
                  <div className="text-sm text-[#E0E0E0]">
                    <p className="font-medium mb-1">Audio generation in progress</p>
                    <p className="text-[#BDBDBD]">
                      Switching to another flashcard set will cancel the current audio generation.
                      Please wait for completion or cancel if you need to navigate elsewhere.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 px-6 pb-6 bg-[#1f1f1f] sticky bottom-0">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 px-3 py-2 bg-[#3C3C3C] text-[#E0E0E0] border border-[#404040] rounded-lg hover:bg-[#4C4C4C] transition-colors order-2 sm:order-1"
          >
            <Settings2 className="w-4 h-4" />
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>

          <button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all order-1 sm:order-2 w-full sm:w-auto ${
              isGenerating 
                ? 'bg-[#666666] text-[#999999] cursor-not-allowed' 
                : 'bg-[#A9C4FC] text-[#121212] hover:bg-[#BB86FC]'
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
    
    {/* Video Lesson Modal */}
    {audioUrl && activeSetContent && activeSetContent.length > 0 && (
      <VideoLessonModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        phrases={activeSetContent}
        setName={setName}
        audioConfig={lessonMode === 'simple' ? simpleConfig as SimpleAudioLessonConfig : {
          voiceGender: config.voiceGender || 'female',
          repetitions: 3,
          pauseBetweenRepetitions: 1000,
          pauseBetweenPhrases: 1500,
          speed: 1.0,
          loops: 1,
          phraseRepetitions: 2,
          mixSpeed: false,
          includeMnemonics: false,
          includePolitenessParticles: config.includePolitenessParticles || false
        } as SimpleAudioLessonConfig}
        lessonType={lessonMode === 'pimsleur' ? 'structured' : 'simple'}
      />
    )}
    {/* Debug info */}
    {showVideoModal && (!audioUrl || !activeSetContent || activeSetContent.length === 0) && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Cannot Generate Video</h2>
          <div className="text-gray-300 space-y-2">
            <p>Debug information:</p>
            <ul className="list-disc list-inside">
              <li>Audio URL: {audioUrl ? 'Available' : 'Not available'}</li>
              <li>Active Set Content: {activeSetContent ? `${activeSetContent.length} phrases` : 'Not available'}</li>
            </ul>
            <p className="mt-4">Please ensure you have generated an audio lesson and the set content is loaded before trying to generate a video.</p>
          </div>
          <button
            onClick={() => setShowVideoModal(false)}
            className="mt-6 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    )}
    </>
  );
} 
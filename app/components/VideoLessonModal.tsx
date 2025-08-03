'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Download, Settings, Play, Pause } from 'lucide-react';
import { CanvasCapture } from 'canvas-capture';
import { Phrase } from '@/app/lib/types';
import { VideoLessonGenerator, VideoLessonConfig } from '@/app/lib/video-lesson-generator';
import { AudioTimingExtractor } from '@/app/lib/audio-timing-extractor';
import { SimpleAudioLessonConfig } from '@/app/lib/audio-lesson-generator-simple';
import { toast } from 'sonner';

interface VideoLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  phrases: Phrase[];
  setName: string;
  audioConfig: SimpleAudioLessonConfig;
  lessonType: 'simple' | 'structured';
}

export function VideoLessonModal({
  isOpen,
  onClose,
  phrases,
  setName,
  audioConfig,
  lessonType
}: VideoLessonModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const generatorRef = useRef<VideoLessonGenerator | null>(null);

  
  // Video settings
  const [videoConfig, setVideoConfig] = useState<VideoLessonConfig>({
    width: 1920,
    height: 1080,
    fps: 30,
    fontSize: 56,
    backgroundColor: '#1a1a1a',
    textColor: '#ffffff',
    highlightColor: '#00ff88',
    voiceGender: audioConfig.voiceGender || 'female',
    includeMnemonics: audioConfig.includeMnemonics
  });
  
  useEffect(() => {
    if (!isOpen) {
      // Cleanup when modal closes
      stopPreview();
      if (generatorRef.current) {
        generatorRef.current.dispose();
        generatorRef.current = null;
      }
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    // Initialize preview
    const initializePreview = () => {
    // Create video generator
    const generator = new VideoLessonGenerator(videoConfig);
    generatorRef.current = generator;
    
    // Extract timing data
    const timingExtractor = new AudioTimingExtractor({
      pauseBetweenPhrases: audioConfig.pauseBetweenPhrases || 1500,
      speed: audioConfig.speed || 1.0,
      loops: audioConfig.loops || 1,
      phraseRepetitions: audioConfig.phraseRepetitions || 2,
      includeMnemonics: audioConfig.includeMnemonics || false,
      mixSpeed: audioConfig.mixSpeed
    });
    
    const timings = lessonType === 'simple'
      ? timingExtractor.extractSimpleLessonTimings(phrases.length)
      : timingExtractor.extractStructuredLessonTimings(phrases.length);
    
    // Generate overlays
    const overlays = generator.generateOverlayTimings(phrases, timings);
    generator.setOverlays(overlays);
    
    // Display preview canvas
    if (canvasRef.current) {
      const sourceCanvas = generator.getCanvas();
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        // Scale canvas to fit preview
        const scale = Math.min(
          canvasRef.current.width / sourceCanvas.width,
          canvasRef.current.height / sourceCanvas.height
        );
        
        const scaledWidth = sourceCanvas.width * scale;
        const scaledHeight = sourceCanvas.height * scale;
        const x = (canvasRef.current.width - scaledWidth) / 2;
        const y = (canvasRef.current.height - scaledHeight) / 2;
        
        // Render initial frame
        generator.renderFrame(0);
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(sourceCanvas, x, y, scaledWidth, scaledHeight);
      }
    }
  };
    
    // Call initialize
    initializePreview();
  }, [isOpen, phrases, videoConfig]);
  
  const startPreview = () => {
    if (!generatorRef.current) return;
    
    setIsPreviewPlaying(true);
    const startTime = Date.now() - previewTime * 1000;
    
    const animate = () => {
      if (!generatorRef.current || !canvasRef.current) return;
      
      const currentTime = (Date.now() - startTime) / 1000;
      const totalDuration = generatorRef.current.getTotalDuration();
      
      if (currentTime >= totalDuration) {
        // Loop preview
        setPreviewTime(0);
        startPreview();
        return;
      }
      
      setPreviewTime(currentTime);
      
      // Render frame
      generatorRef.current.renderFrame(currentTime);
      
      // Copy to preview canvas
      const sourceCanvas = generatorRef.current.getCanvas();
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const scale = Math.min(
          canvasRef.current.width / sourceCanvas.width,
          canvasRef.current.height / sourceCanvas.height
        );
        
        const scaledWidth = sourceCanvas.width * scale;
        const scaledHeight = sourceCanvas.height * scale;
        const x = (canvasRef.current.width - scaledWidth) / 2;
        const y = (canvasRef.current.height - scaledHeight) / 2;
        
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(sourceCanvas, x, y, scaledWidth, scaledHeight);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };
  
  const stopPreview = () => {
    setIsPreviewPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };
  
  const generateVideo = async () => {
    if (!generatorRef.current) return;
    
    setIsGenerating(true);
    setProgress(0);
    
    try {
      // Initialize canvas-capture
      const sourceCanvas = generatorRef.current.getCanvas();
      
      // Initialize CanvasCapture with the source canvas
      CanvasCapture.init(sourceCanvas, {
        verbose: false,
        showRecDot: false,
        showAlerts: true,
        showDialogs: false
      });
      
      // Start recording
      CanvasCapture.beginVideoRecord({
        format: 'mp4',
        name: `${setName}_Video_Lesson`,
        fps: videoConfig.fps || 30,
        quality: 0.9,
        onExportProgress: (prog: number) => {
          setProgress(Math.round(prog * 100));
        },
        onExportFinish: () => {
          toast.success('Video generated successfully!');
          setIsGenerating(false);
          setProgress(0);
        },
        onError: (error: Error | unknown) => {
          console.error('Video generation error:', error);
          toast.error('Failed to generate video');
          setIsGenerating(false);
          setProgress(0);
        }
      });
      
      // Render all frames
      const fps = videoConfig.fps || 30;
      const totalDuration = generatorRef.current.getTotalDuration();
      const totalFrames = Math.ceil(totalDuration * fps);
      
      for (let frame = 0; frame < totalFrames; frame++) {
        const currentTime = frame / fps;
        
        // Update progress (recording phase)
        setProgress(Math.round((frame / totalFrames) * 50)); // 0-50% for recording
        
        // Render frame
        generatorRef.current.renderFrame(currentTime);
        
        // Record frame
        CanvasCapture.recordFrame();
        
        // Allow UI to update
        if (frame % 30 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      
      // Stop recording and export
      setProgress(50); // Start export phase
      CanvasCapture.stopRecord();
      
    } catch (error) {
      console.error('Error generating video:', error);
      toast.error('Failed to generate video');
      setIsGenerating(false);
      setProgress(0);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Generate Video Lesson</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Preview */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-white">Preview</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Settings className="w-5 h-5 text-gray-400" />
                  </button>
                  <button
                    onClick={isPreviewPlaying ? stopPreview : startPreview}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    {isPreviewPlaying ? (
                      <Pause className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Play className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="bg-black rounded-lg overflow-hidden aspect-video">
                <canvas
                  ref={canvasRef}
                  width={960}
                  height={540}
                  className="w-full h-full"
                />
              </div>
              
              {/* Preview time */}
              <div className="mt-2 text-sm text-gray-400 text-center">
                {Math.floor(previewTime / 60)}:{Math.floor(previewTime % 60).toString().padStart(2, '0')} / 
                {generatorRef.current ? ` ${Math.floor(generatorRef.current.getTotalDuration() / 60)}:${Math.floor(generatorRef.current.getTotalDuration() % 60).toString().padStart(2, '0')}` : ' 0:00'}
              </div>
            </div>
            
            {/* Settings / Info */}
            <div>
              {showSettings ? (
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Video Settings</h3>
                  
                  <div className="space-y-4">
                    {/* Resolution */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Resolution
                      </label>
                      <select
                        value={`${videoConfig.width}x${videoConfig.height}`}
                        onChange={(e) => {
                          const [width, height] = e.target.value.split('x').map(Number);
                          setVideoConfig({ ...videoConfig, width, height });
                        }}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      >
                        <option value="1920x1080">1080p (1920x1080)</option>
                        <option value="1280x720">720p (1280x720)</option>
                        <option value="854x480">480p (854x480)</option>
                        <option value="1080x1920">Vertical (1080x1920)</option>
                        <option value="1080x1080">Square (1080x1080)</option>
                      </select>
                    </div>
                    
                    {/* Font Size */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Font Size
                      </label>
                      <input
                        type="range"
                        min="32"
                        max="96"
                        value={videoConfig.fontSize}
                        onChange={(e) => setVideoConfig({ ...videoConfig, fontSize: Number(e.target.value) })}
                        className="w-full"
                      />
                      <div className="text-sm text-gray-400 text-center">{videoConfig.fontSize}px</div>
                    </div>
                    
                    {/* Colors */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Text Color
                        </label>
                        <input
                          type="color"
                          value={videoConfig.textColor}
                          onChange={(e) => setVideoConfig({ ...videoConfig, textColor: e.target.value })}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Highlight Color
                        </label>
                        <input
                          type="color"
                          value={videoConfig.highlightColor}
                          onChange={(e) => setVideoConfig({ ...videoConfig, highlightColor: e.target.value })}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Video Information</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Set Name:</span>
                      <span className="text-white">{setName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Phrases:</span>
                      <span className="text-white">{phrases.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Lesson Type:</span>
                      <span className="text-white">{lessonType === 'simple' ? 'Repetitive' : 'Structured'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Resolution:</span>
                      <span className="text-white">{videoConfig.width}x{videoConfig.height}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Frame Rate:</span>
                      <span className="text-white">{videoConfig.fps} fps</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Estimated Duration:</span>
                      <span className="text-white">
                        {generatorRef.current ? 
                          `${Math.floor(generatorRef.current.getTotalDuration() / 60)}:${Math.floor(generatorRef.current.getTotalDuration() % 60).toString().padStart(2, '0')}` 
                          : 'Calculating...'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-gray-300">
                      This will generate an MP4 video with synchronized text overlays matching your audio lesson. 
                      The text will appear in sync with the audio, highlighting active phrases for better learning.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Progress */}
          {isGenerating && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">
                  {progress < 50 ? 'Recording frames...' : 'Encoding video...'}
                </span>
                <span className="text-sm text-white">{progress}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            disabled={isGenerating}
          >
            Cancel
          </button>
          <button
            onClick={generateVideo}
            disabled={isGenerating}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            {isGenerating ? 'Generating...' : 'Generate Video'}
          </button>
        </div>
      </div>
    </div>
  );
}
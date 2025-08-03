'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Download, Play, Pause } from 'lucide-react';
// Import canvas-capture dynamically to avoid SSR issues
import type { CanvasCapture as CanvasCaptureType } from 'canvas-capture';
let CanvasCapture: typeof CanvasCaptureType | undefined;
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const canvasCapture = require('canvas-capture');
  console.log('Loaded canvas-capture:', canvasCapture);
  CanvasCapture = canvasCapture.CanvasCapture;
  console.log('CanvasCapture initialized:', CanvasCapture);
}

import { VideoLessonConfig, VideoLessonModalProps } from '@/app/lib/video/types';
import { VideoLessonGenerator } from '@/app/lib/video/lesson-generator';
import { VideoTimingExtractor } from '@/app/lib/video/timing-extractor';
import { toast } from 'sonner';

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
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const generatorRef = useRef<VideoLessonGenerator | null>(null);
  

  
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
      // Video settings
      const videoConfig: VideoLessonConfig = {
        width: 1920,
        height: 1080,
        fps: 30,
        fontSize: 56,
        backgroundColor: '#1a1a1a',
        textColor: '#ffffff',
        highlightColor: '#00ff88',
        voiceGender: audioConfig.voiceGender || 'female',
        includeMnemonics: audioConfig.includeMnemonics
      };
      
      // Create video generator
      const generator = new VideoLessonGenerator(videoConfig);
      generatorRef.current = generator;
      
      // Extract timing data
      const timingExtractor = new VideoTimingExtractor(
        lessonType === 'simple' ? {
          pauseBetweenPhrases: audioConfig.pauseBetweenPhrases || 1500,
          speed: audioConfig.speed || 1.0,
          loops: audioConfig.loops || 1,
          phraseRepetitions: audioConfig.phraseRepetitions || 2,
          includeMnemonics: audioConfig.includeMnemonics || false,
          mixSpeed: false
        } : {
          pauseDurationMs: {
            afterInstruction: 2000,
            forPractice: 3000,
            betweenPhrases: 1500,
            beforeAnswer: 2000
          },
          repetitions: {
            introduction: 2,
            practice: 3,
            review: 2
          },
          includeMnemonics: audioConfig.includeMnemonics || false,
          speed: audioConfig.speed || 1.0
        }
      );
      
      const timings = lessonType === 'simple'
        ? timingExtractor.extractSimpleLessonTimings(phrases.length)
        : timingExtractor.extractGuidedLessonTimings(phrases.length);
      
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
    
    initializePreview();
  }, [isOpen, phrases, audioConfig, lessonType]);
  
  const startPreview = () => {
    if (!generatorRef.current) {
      console.error('No generator available for preview');
      return;
    }
    
    console.log('Starting preview...');
    setIsPreviewPlaying(true);
    const startTime = Date.now() - previewTime * 1000;
    
    const animate = () => {
      if (!generatorRef.current || !canvasRef.current) {
        console.error('Generator or canvas not available during animation');
        return;
      }
      
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
    console.log('generateVideo called');
    console.log('generatorRef.current:', generatorRef.current);
    console.log('CanvasCapture:', CanvasCapture);
    
    if (!generatorRef.current || !CanvasCapture) {
      toast.error('Video generation not available');
      return;
    }
    
    setIsGenerating(true);
    setProgress(0);
    stopPreview();
    
    try {
      const sourceCanvas = generatorRef.current.getCanvas();
      
      console.log('Starting video generation with source canvas:', sourceCanvas);
      
      // Configure recording
      const fps = 30;
      const totalDuration = generatorRef.current.getTotalDuration();
      const totalFrames = Math.ceil(totalDuration * fps);
      console.log('Video config:', { fps, totalDuration, totalFrames });
      
      try {
        // Initialize CanvasCapture
        console.log('Initializing CanvasCapture...');
        CanvasCapture.init(sourceCanvas, {
          verbose: true, // Enable verbose logging
          showRecDot: false,
          showAlerts: true,
          showDialogs: false
        });
        console.log('CanvasCapture initialized successfully');
        
        // Start recording
        console.log('Starting video recording...');
        CanvasCapture.beginVideoRecord({
          format: 'webm',
          name: `${setName}_Video_Lesson`,
          fps: fps,
          quality: 0.92,
          onExportProgress: (prog: number) => {
            console.log('Export progress:', prog);
            setProgress(50 + Math.round(prog * 50)); // 50-100% for encoding
          },
          onExportFinish: () => {
            console.log('Video export finished successfully');
            toast.success('Video downloaded successfully!');
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
        console.log('Video recording started');
      } catch (initError) {
        console.error('Error during CanvasCapture initialization:', initError);
        toast.error('Failed to initialize video recording');
        setIsGenerating(false);
        setProgress(0);
        return;
      }
      
      // Render all frames
      console.log('Starting frame rendering...');
      for (let frame = 0; frame < totalFrames; frame++) {
        const currentTime = frame / fps;
        
        // Update progress (recording phase)
        const recordingProgress = Math.round((frame / totalFrames) * 50);
        setProgress(recordingProgress);
        if (frame % 30 === 0) {
          console.log(`Recording progress: ${recordingProgress}%, Frame: ${frame}/${totalFrames}`);
        }
        
        try {
          // Render frame
          generatorRef.current.renderFrame(currentTime);
          
          // Record frame
          CanvasCapture.recordFrame();
        } catch (frameError) {
          console.error('Error during frame rendering/recording:', frameError);
          toast.error('Failed to render video frame');
          setIsGenerating(false);
          setProgress(0);
          return;
        }
        
        // Allow UI to update
        if (frame % 30 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      
      // Stop recording and export
      console.log('Frame rendering complete, stopping recording...');
      setProgress(50); // Start export phase
      CanvasCapture.stopRecord();
      console.log('Recording stopped, waiting for export...');
      
    } catch (error) {
      console.error('Error generating video:', error);
      toast.error('Failed to generate video');
      setIsGenerating(false);
      setProgress(0);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Video Lesson</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Preview */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-white">Preview</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    isPreviewPlaying ? stopPreview() : startPreview();
                  }}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {isPreviewPlaying ? (
                    <Pause className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Play className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
              
              <div className="bg-black rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={854}
                  height={480}
                  className="w-full"
                />
              </div>
              
              {/* Preview time */}
              <div className="mt-2 text-sm text-gray-400 text-center">
                {Math.floor(previewTime / 60)}:{Math.floor(previewTime % 60).toString().padStart(2, '0')} / 
                {generatorRef.current ? ` ${Math.floor(generatorRef.current.getTotalDuration() / 60)}:${Math.floor(generatorRef.current.getTotalDuration() % 60).toString().padStart(2, '0')}` : ' 0:00'}
              </div>
            </div>
            
            {/* Progress */}
            {isGenerating && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Generating video...</span>
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
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            disabled={isGenerating}
          >
            Close
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Download button clicked');
              generateVideo();
            }}
            disabled={isGenerating || !CanvasCapture}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            {isGenerating ? 'Generating...' : 'Download Video'}
          </button>
        </div>
      </div>
    </div>
  );
}
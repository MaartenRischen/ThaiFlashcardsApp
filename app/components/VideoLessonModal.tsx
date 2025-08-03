'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
// Import canvas-capture dynamically to avoid SSR issues
import type { CanvasCapture as CanvasCaptureType } from 'canvas-capture';
let CanvasCapture: typeof CanvasCaptureType | undefined;
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  CanvasCapture = (require('canvas-capture') as { CanvasCapture: typeof CanvasCaptureType }).CanvasCapture;
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
  const [isGenerating, setIsGenerating] = useState(true);
  const [progress, setProgress] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const generatorRef = useRef<VideoLessonGenerator | null>(null);
  
  // Generate video immediately when modal opens
  useEffect(() => {
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
    if (!isOpen) {
      // Cleanup when modal closes
      if (generatorRef.current) {
        generatorRef.current.dispose();
        generatorRef.current = null;
      }

      setProgress(0);
      setError(null);
      return;
    }
    
    const generateVideo = async () => {
      setIsGenerating(true);
      setProgress(0);
      setError(null);
      
      try {
        if (!CanvasCapture) {
          throw new Error('Video generation is only available in the browser');
        }
        
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
        
        // Initialize canvas-capture
        const sourceCanvas = generator.getCanvas();
        
        // Initialize CanvasCapture with the source canvas
        await new Promise<void>((resolve, reject) => {
          CanvasCapture!.init(sourceCanvas, {
            verbose: false,
            showRecDot: false,
            showAlerts: false,
            showDialogs: false
          });
          
          // Start recording
          CanvasCapture!.beginVideoRecord({
            format: 'mp4',
            name: `${setName}_Video_Lesson`,
            fps: videoConfig.fps || 30,
            quality: 0.9,
            onExportProgress: (prog: number) => {
              setProgress(50 + Math.round(prog * 50)); // 50-100% for encoding
            },
            onExportFinish: () => {
              // Video will be automatically downloaded by canvas-capture
              setIsGenerating(false);
              toast.success('Video generated successfully!');
              resolve();
            },
            onError: (error: Error | unknown) => {
              console.error('Video generation error:', error);
              reject(error);
            }
          });
          
          // Render all frames
          const fps = videoConfig.fps || 30;
          const totalDuration = generator.getTotalDuration();
          const totalFrames = Math.ceil(totalDuration * fps);
          
          // Render frames asynchronously
          (async () => {
            for (let frame = 0; frame < totalFrames; frame++) {
              const currentTime = frame / fps;
              
              // Update progress (recording phase)
              setProgress(Math.round((frame / totalFrames) * 50)); // 0-50% for recording
              
              // Render frame
              generator.renderFrame(currentTime);
              
              // Record frame
              CanvasCapture!.recordFrame();
              
              // Allow UI to update
              if (frame % 30 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
              }
            }
            
            // Stop recording and export
            setProgress(50); // Start export phase
            CanvasCapture!.stopRecord();
          })();
        });
        
      } catch (err) {
        console.error('Error generating video:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate video');
        setIsGenerating(false);
        toast.error('Failed to generate video');
      }
    };
    
    generateVideo();
  }, [isOpen, phrases, setName, audioConfig, lessonType]);
  
  // Video is automatically downloaded by canvas-capture
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
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
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : isGenerating ? (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-white mb-2">Generating video...</p>
              <p className="text-gray-400 text-sm mb-4">
                {progress < 50 ? 'Recording frames...' : 'Encoding video...'}
              </p>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-gray-400 text-sm mt-2">{progress}%</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                  <Download className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Video Ready!</h3>
                <p className="text-gray-400 text-sm">
                  Your video lesson has been generated with synchronized text overlays.
                </p>
              </div>
              
              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
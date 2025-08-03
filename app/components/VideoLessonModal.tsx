'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import { VideoLessonConfig, VideoLessonModalProps } from '@/app/lib/video/types';
import { VideoLessonGenerator } from '@/app/lib/video/lesson-generator';
import { VideoTimingExtractor } from '@/app/lib/video/timing-extractor';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';

export function VideoLessonModal({
  isOpen,
  onClose,
  phrases,
  setName,
  audioConfig,
  lessonType
}: VideoLessonModalProps) {
  const params = useParams();
  const setId = params?.id as string || 'default';
  const [isGenerating, setIsGenerating] = useState(true);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('Initializing...');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const generatorRef = useRef<VideoLessonGenerator | null>(null);
  
  // Generate video immediately when modal opens
  useEffect(() => {
    if (!isOpen) {
      // Cleanup when modal closes
      if (generatorRef.current) {
        generatorRef.current.dispose();
        generatorRef.current = null;
      }
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
      }
      setProgress(0);
      setError(null);
      setIsGenerating(true); // Reset for next time
      return;
    }
    
    // Skip if video already generated
    if (videoUrl) {
      return;
    }
    
    const generateVideo = async () => {
      setIsGenerating(true);
      setProgress(0);
      setError(null);
      
      try {
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
        setProgressMessage('Setting up video generator...');
        const generator = new VideoLessonGenerator(videoConfig);
        generatorRef.current = generator;
        
        // Extract timing data
        setProgressMessage('Extracting audio timings...');
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
        setProgressMessage('Preparing text overlays...');
        const overlays = generator.generateOverlayTimings(phrases, timings);
        generator.setOverlays(overlays);
        
        // For now, just generate a preview GIF instead of full video
        // Full video generation would require WebAssembly FFmpeg or server-side processing
        const fps = 10; // Lower fps for GIF
        const duration = Math.min(generator.getTotalDuration(), 10); // Max 10 seconds for preview
        const totalFrames = Math.ceil(duration * fps);
        
        setProgressMessage('Generating preview...');
        
        // Create a simple animated preview
        const canvas = generator.getCanvas();
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = 640; // Smaller size for preview
        previewCanvas.height = 360;
        const previewCtx = previewCanvas.getContext('2d')!;
        
        // Render a few key frames
        const keyFrames = [0, duration / 3, duration * 2 / 3, duration - 0.1];
        for (let i = 0; i < keyFrames.length; i++) {
          generator.renderFrame(keyFrames[i]);
          previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
          previewCtx.drawImage(canvas, 0, 0, previewCanvas.width, previewCanvas.height);
          setProgress(Math.round(((i + 1) / keyFrames.length) * 100));
        }
        
        // Convert to blob
        const blob = await new Promise<Blob>((resolve) => {
          previewCanvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        setIsGenerating(false);
        
        toast.info('Preview generated. Full video generation requires server deployment with FFmpeg.');
        
      } catch (err) {
        console.error('Error generating video:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate video');
        setIsGenerating(false);
        toast.error('Failed to generate video');
      }
    };
    
    generateVideo();
  }, [isOpen, phrases, setName, audioConfig, lessonType, setId, videoUrl]);
  
  const handleDownload = () => {
    if (!videoUrl) return;
    
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `${setName.replace(/[^a-z0-9]/gi, '_')}_Video_Preview.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.info('Downloaded preview image. Full video requires server deployment.');
  };
  
  const handleClose = () => {
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Video Lesson Preview</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            disabled={isGenerating}
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
                onClick={handleClose}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : isGenerating ? (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-white mb-2">Generating preview...</p>
              <p className="text-gray-400 text-sm mb-4">{progressMessage}</p>
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
              {videoUrl && (
                <div className="mb-6">
                  <img 
                    src={videoUrl} 
                    alt="Video preview" 
                    className="w-full rounded-lg shadow-lg mb-4"
                  />
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-2">Preview Ready</h3>
                <p className="text-gray-400 text-sm mb-2">
                  This is a preview of your video lesson.
                </p>
                <p className="text-yellow-400 text-xs">
                  Full video generation with synchronized audio requires server deployment with FFmpeg.
                </p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={handleDownload}
                  className="w-full px-6 py-3 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Preview
                </button>
                
                <button
                  onClick={handleClose}
                  className="w-full px-6 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
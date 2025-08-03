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
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
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
      if (videoBlob) {
        setVideoBlob(null);
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
        
        // Generate frames as data URLs
        const fps = videoConfig.fps || 30;
        const totalDuration = generator.getTotalDuration();
        const totalFrames = Math.ceil(totalDuration * fps);
        const frames: string[] = [];
        
        setProgressMessage('Rendering video frames...');
        
        // Render all frames
        for (let frame = 0; frame < totalFrames; frame++) {
          const currentTime = frame / fps;
          
          // Update progress (0-70% for frame generation)
          setProgress(Math.round((frame / totalFrames) * 70));
          
          // Render frame
          generator.renderFrame(currentTime);
          
          // Get frame as data URL
          const canvas = generator.getCanvas();
          const dataUrl = canvas.toDataURL('image/png', 0.9);
          frames.push(dataUrl);
          
          // Allow UI to update every 10 frames
          if (frame % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
        
        // Send frames to server for encoding
        setProgressMessage('Encoding video on server...');
        setProgress(75);
        
        const response = await fetch(`/api/flashcard-sets/${setId}/video-lesson`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            frames,
            fps,
            width: videoConfig.width,
            height: videoConfig.height,
            filename: setName
          }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to generate video');
        }
        
        setProgress(90);
        setProgressMessage('Downloading video...');
        
        // Get video blob from response
        const blob = await response.blob();
        setVideoBlob(blob);
        
        setProgress(100);
        setIsGenerating(false);
        
        // Automatically download the video
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${setName.replace(/[^a-z0-9]/gi, '_')}_Video_Lesson.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('Video downloaded successfully!');
        
      } catch (err) {
        console.error('Error generating video:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate video');
        setIsGenerating(false);
        toast.error('Failed to generate video');
      }
    };
    
    generateVideo();
  }, [isOpen, phrases, setName, audioConfig, lessonType, setId, videoBlob]);
  
  const handleDownload = () => {
    if (!videoBlob) return;
    
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${setName.replace(/[^a-z0-9]/gi, '_')}_Video_Lesson.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Video downloaded!');
  };
  
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
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                  <Download className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Video Ready!</h3>
                <p className="text-gray-400 text-sm">
                  Your video lesson has been generated and downloaded.
                </p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={handleDownload}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Again
                </button>
                
                <button
                  onClick={onClose}
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
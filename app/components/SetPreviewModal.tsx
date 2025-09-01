'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { Phrase } from '@/app/lib/set-generator';
import { SetProgress } from '@/app/lib/storage/types';
import { useAuth } from '@clerk/nextjs';
import { usePreloadedSetContent } from '@/app/hooks/usePreloadedData';
import { useSetCache } from '@/app/context/SetCacheContext';

interface SetPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  setId: string;
  setName: string;
  phraseCount: number;
  imageUrl?: string | null;
}

export function SetPreviewModal({ 
  isOpen, 
  onClose, 
  setId, 
  setName, 
  phraseCount: _phraseCount,
  imageUrl: _imageUrl 
}: SetPreviewModalProps) {
  const { isSignedIn } = useAuth();
  const { content: preloadedContent, progress: preloadedProgress } = usePreloadedSetContent(setId);
  const { getCachedContent } = useSetCache();
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [progress, setProgress] = useState<SetProgress>({});
  const [loading, setLoading] = useState(false);

  const loadSetData = useCallback(async () => {
    console.log(`[SetPreviewModal] Loading data for set: ${setId}`);
    
    // First check cache
    const cachedContent = getCachedContent(setId);
    if (cachedContent && cachedContent.phrases.length > 0) {
      console.log(`[SetPreviewModal] Using cached content for set ${setId}: ${cachedContent.phrases.length} phrases`);
      setPhrases(cachedContent.phrases);
      setProgress(cachedContent.progress || {});
      setLoading(false); // Ensure loading is false
      return;
    }
    
    // Then check preloaded data
    if (preloadedContent && preloadedContent.length > 0) {
      console.log(`[SetPreviewModal] Using preloaded content for set ${setId}: ${preloadedContent.length} phrases`);
      setPhrases(preloadedContent);
      setProgress(preloadedProgress || {});
      setLoading(false); // Ensure loading is false
      return;
    }
    
    // Only show loading if we need to fetch
    console.log(`[SetPreviewModal] No cached/preloaded data found, fetching from API for set ${setId}`);
    setLoading(true);
    try {
      // Load set content
      const contentRes = await fetch(`/api/flashcard-sets/${setId}/content`, {
        credentials: 'include'
      });
      
      if (contentRes.ok) {
        const contentData = await contentRes.json();
        console.log(`[SetPreviewModal] Content data received for ${setId}:`, contentData);
        // The API returns the phrases array directly, not wrapped in an object
        const phrasesArray = Array.isArray(contentData) ? contentData : contentData.phrases || [];
        console.log(`[SetPreviewModal] Phrases extracted for ${setId}:`, phrasesArray.length, 'items');
        setPhrases(phrasesArray);
      } else {
        console.error(`[SetPreviewModal] Failed to load content for ${setId}:`, contentRes.status, contentRes.statusText);
        setPhrases([]);
      }

      // Load progress if signed in
      if (isSignedIn) {
        const progressRes = await fetch(`/api/flashcard-sets/${setId}/progress`, {
          credentials: 'include'
        });
        
        if (progressRes.ok) {
          const progressData = await progressRes.json();
          setProgress(progressData.progress || {});
        }
      }
    } catch (error) {
      console.error(`[SetPreviewModal] Error loading set data for ${setId}:`, error);
      setPhrases([]);
      setProgress({});
    } finally {
      setLoading(false);
    }
  }, [setId, isSignedIn, preloadedContent, preloadedProgress, getCachedContent]);

  useEffect(() => {
    if (isOpen && setId) {
      loadSetData();
    }
  }, [isOpen, setId, loadSetData]);



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#1F1F1F] rounded-xl p-6 max-w-2xl w-full max-h-[85vh] overflow-hidden relative flex flex-col border border-[#404040]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-[#E0E0E0]">{setName}</h3>
          <button 
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors" 
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading cards...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {phrases.map((phrase, idx) => (
              <div 
                key={idx} 
                className="neumorphic rounded-lg p-3 flex flex-col space-y-1"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-2xl font-bold text-[#E0E0E0]">{phrase.thai}</span>
                  <span className="text-xs text-[#8B8B8B] ml-2">#{idx + 1}</span>
                </div>
                <div className="text-sm text-[#BDBDBD] italic">{phrase.pronunciation}</div>
                <div className="text-base text-[#A9C4FC]">{phrase.english}</div>
                {phrase.mnemonic && (
                  <div className="text-xs text-[#8B8B8B] mt-1 p-2 bg-[#1F1F1F] rounded border border-[#333333]">
                    Hint: {phrase.mnemonic}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
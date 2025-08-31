'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useSet } from '@/app/context/SetContext';
import { Phrase } from '@/app/lib/set-generator';
import { SetProgress } from '@/app/lib/storage/types';
import { useAuth } from '@clerk/nextjs';

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
  const { switchSet } = useSet();
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [progress, setProgress] = useState<SetProgress>({});
  const [loading, setLoading] = useState(false);

  const loadSetData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Loading content for set:', setId);
      // Load set content
      const contentRes = await fetch(`/api/flashcard-sets/${setId}/content`, {
        credentials: 'include'
      });
      
      if (contentRes.ok) {
        const contentData = await contentRes.json();
        console.log('Content data received:', contentData);
        // The API returns the phrases array directly, not wrapped in an object
        const phrasesArray = Array.isArray(contentData) ? contentData : contentData.phrases || [];
        console.log('Phrases extracted:', phrasesArray.length, 'items');
        setPhrases(phrasesArray);
      } else {
        console.error('Failed to load content:', contentRes.status, contentRes.statusText);
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
      console.error('Error loading set data:', error);
    } finally {
      setLoading(false);
    }
  }, [setId, isSignedIn]);

  useEffect(() => {
    if (isOpen && setId) {
      loadSetData();
    }
  }, [isOpen, setId, loadSetData]);

  const getCardStatus = (index: number): string => {
    const progressData = progress[index];
    if (!progressData || !progressData.difficulty) return 'unseen';
    
    // Map difficulty to status
    if (progressData.difficulty === 'easy') return 'easy';
    if (progressData.difficulty === 'good') return 'correct';
    if (progressData.difficulty === 'hard') return 'wrong';
    return 'unseen';
  };

  const handleSelectCard = (index: number) => {
    // Set the active card index in localStorage so main UI can pick it up
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeCardIndex', String(index));
    }
    switchSet(setId);
    onClose();
  };

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
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {phrases.map((phrase, idx) => {
              const status = getCardStatus(idx);
              let statusStyle = '';
              let statusText = 'Unseen';
              
              if (status === 'easy') { 
                statusStyle = 'bg-green-400 text-black'; 
                statusText = 'Easy'; 
              } else if (status === 'correct') { 
                statusStyle = 'bg-blue-400 text-black'; 
                statusText = 'Correct'; 
              } else if (status === 'wrong') { 
                statusStyle = 'bg-red-400 text-black'; 
                statusText = 'Wrong'; 
              } else { 
                statusStyle = 'bg-gray-600 text-gray-300'; 
                statusText = 'Unseen'; 
              }
              
              return (
                <div
                  key={idx}
                  className="neumorphic-card p-4 cursor-pointer hover:scale-[1.02] transition-transform"
                  onClick={() => handleSelectCard(idx)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] text-[#E0E0E0] font-medium leading-tight mb-1">
                        {phrase.english}
                      </p>
                      <p className="text-[13px] text-gray-400">
                        {phrase.thai} • {phrase.pronunciation}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg ${statusStyle}`}
                      >
                        {statusText}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
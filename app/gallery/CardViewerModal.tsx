"use client";
import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { Phrase } from '@/app/lib/set-generator';

// Re-use or redefine the FullGallerySet interface if needed, or import it
interface FullGallerySet {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  seriousnessLevel?: number;
  createdAt?: string | Date;
  timestamp?: string | Date;
  author?: string;
  cardCount?: number;
  phrases: Phrase[];
  specificTopics?: string;
  llmBrand?: string;
  llmModel?: string;
}

interface CardViewerModalProps {
  set: FullGallerySet | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

const CardViewerModal: React.FC<CardViewerModalProps> = ({ set, isLoading, error, onClose }) => {
  // Prevent interaction with the background
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={handleBackgroundClick} // Close on background click
    >
      <div className="neumorphic bg-[#2C2C2C] rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-[#404040]">
          <h2 className="text-lg font-medium text-[#E0E0E0] truncate pr-4">
            {isLoading ? 'Loading Set...' : set?.title || 'View Cards'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-[#BDBDBD] hover:text-[#E0E0E0] transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-[#BB86FC]" />
            </div>
          )}
          {error && (
            <div className="text-red-400 text-center">
              Error: {error}
            </div>
          )}
          {!isLoading && !error && set && (
            <div className="space-y-3">
              {set.phrases.map((phrase, index) => (
                <div 
                  key={index} 
                  className="neumorphic rounded-lg p-3 flex flex-col space-y-1"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-2xl font-bold text-[#E0E0E0]">{phrase.thai}</span>
                    <span className="text-xs text-[#8B8B8B] ml-2">#{index + 1}</span>
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

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#404040]">
          <button 
            onClick={onClose} 
            className="neumorphic-button w-full text-[#E0E0E0]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardViewerModal; 
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
      <div className="bg-indigo-950 border border-indigo-800/50 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-indigo-800/50">
          <h2 className="text-lg font-medium text-indigo-300 truncate pr-4">
            {isLoading ? 'Loading Set...' : set?.title || 'View Cards'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-indigo-400 hover:text-indigo-200"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-grow">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : error ? (
            <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-md text-red-400 text-sm">
              Error loading cards: {error}
            </div>
          ) : set && set.phrases && set.phrases.length > 0 ? (
            <ul className="space-y-3">
              {set.phrases.map((phrase, index) => (
                <li key={index} className="bg-indigo-900/40 border border-indigo-700/30 rounded-md p-3">
                  <p className="text-sm text-indigo-200 mb-1">
                    <span className="font-semibold text-indigo-300">Thai:</span> {phrase.thai}
                  </p>
                  <p className="text-sm text-indigo-200">
                    <span className="font-semibold text-indigo-300">English:</span> {phrase.english}
                  </p>
                  {phrase.pronunciation && (
                     <p className="text-xs text-indigo-400/80 mt-1">
                        <span className="font-semibold text-indigo-400">Pronunciation:</span> {phrase.pronunciation}
                     </p> 
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-indigo-400 text-center py-10">No cards found in this set.</p>
          )}
        </div>

        {/* Modal Footer (Optional) */}
        {/* <div className="p-4 border-t border-indigo-800/50 text-right">
          <button 
            onClick={onClose}
            className="neumorphic-button-secondary px-4 py-1.5 text-sm"
          >
            Close
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default CardViewerModal; 
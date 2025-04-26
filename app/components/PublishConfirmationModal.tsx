'use client';
import React, { useState, useEffect } from 'react';
import type { SetMetaData } from '@/app/lib/storage'; // Assuming SetMetaData is the correct type for the set prop
import { X, Loader2, User, EyeOff } from 'lucide-react';

interface PublishConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (authorName: string | null) => Promise<void>; // authorName: null for anonymous
  set: SetMetaData;
  defaultUsername: string; // User's default name from Clerk
  isPublishing: boolean; // Loading state from parent
}

const PublishConfirmationModal: React.FC<PublishConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  set, 
  defaultUsername, 
  isPublishing 
}) => {
  const [publishAnonymously, setPublishAnonymously] = useState(false);
  const [authorName, setAuthorName] = useState(defaultUsername || '');

  // Reset author name when anonymous preference changes
  useEffect(() => {
    if (publishAnonymously) {
      setAuthorName('');
    } else {
      setAuthorName(defaultUsername || '');
    }
  }, [publishAnonymously, defaultUsername]);

  if (!isOpen) return null;

  const handleConfirmClick = () => {
    const finalAuthorName = publishAnonymously ? null : authorName.trim() || null;
    onConfirm(finalAuthorName);
  };

  // Prevent background click from closing if it's the modal content itself
  const handleContentClick = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose} // Close on background click
    >
      <div 
        className="bg-indigo-950 border border-indigo-800/50 rounded-lg shadow-xl max-w-md w-full flex flex-col"
        onClick={handleContentClick}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-indigo-800/50">
          <h2 className="text-lg font-medium text-indigo-300">Publish Set</h2>
          <button 
            onClick={onClose} 
            disabled={isPublishing}
            className="text-indigo-400 hover:text-indigo-200 disabled:opacity-50"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-indigo-200">
            You are about to publish the set "<span className="font-semibold text-indigo-100">{set.name}</span>" to the public gallery.
          </p>

          {/* Anonymous Option */}
          <div className="flex items-center space-x-2 bg-indigo-900/30 p-3 rounded-md border border-indigo-700/30">
            <input
              type="checkbox"
              id="anonymous-publish"
              className="h-4 w-4 rounded border-gray-500 text-blue-600 focus:ring-blue-500 accent-blue-500"
              checked={publishAnonymously}
              onChange={(e) => setPublishAnonymously(e.target.checked)}
              disabled={isPublishing}
            />
            <label htmlFor="anonymous-publish" className="text-sm font-medium text-indigo-200 flex items-center gap-1.5">
               <EyeOff size={16}/> Publish Anonymously
            </label>
          </div>

          {/* Author Name Input (conditional) */}
          {!publishAnonymously && (
            <div className="space-y-2">
              <label htmlFor="author-name" className="text-sm font-medium text-indigo-300 flex items-center gap-1.5">
                 <User size={16}/> Author Name (optional)
              </label>
              <input
                type="text"
                id="author-name"
                className="w-full bg-indigo-900/60 border border-indigo-700/50 rounded-md px-3 py-2 text-indigo-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Leave blank for Anonymous" 
                disabled={isPublishing}
              />
              <p className="text-xs text-indigo-400/80">
                This name will be displayed with your set in the gallery. Leave blank to publish anonymously.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end items-center p-4 border-t border-indigo-800/50 space-x-3">
          <button 
            onClick={onClose}
            disabled={isPublishing}
            className="neumorphic-button-secondary px-4 py-1.5 text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirmClick}
            disabled={isPublishing}
            className="neumorphic-button px-4 py-1.5 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPublishing ? (
              <><Loader2 className="animate-spin h-4 w-4" /> Publishing...</>
            ) : (
              'Confirm Publish'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublishConfirmationModal; 
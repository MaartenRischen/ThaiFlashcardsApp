import React, { useState, useEffect } from 'react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => void;
  status: 'idle' | 'success' | 'error';
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmit, status }) => {
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!isOpen || status === 'success') {
      setFeedback('');
    }
  }, [isOpen, status]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback.trim().length === 0) return;
    onSubmit(feedback);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="bg-[#181818] border border-gray-700 rounded-xl shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl"
          aria-label="Close feedback form"
        >
          ×
        </button>
        <h2 className="text-lg font-bold text-yellow-400 mb-2">We'd love your feedback!</h2>
        {status === 'success' ? (
          <div className="text-green-400 text-center py-8">
            Thank you for your feedback! 🙏
          </div>
        ) : status === 'error' ? (
          <div className="text-red-400 text-center py-8">
            Sorry, something went wrong. Please try again later.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <textarea
              className="w-full h-32 p-2 rounded bg-[#222] border border-gray-600 text-white resize-none mb-4 focus:outline-none focus:border-yellow-400"
              placeholder="Share your thoughts, suggestions, or report a bug..."
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              required
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1 rounded bg-gray-700 text-gray-200 hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1 rounded bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition"
                disabled={feedback.trim().length === 0}
              >
                Submit
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}; 
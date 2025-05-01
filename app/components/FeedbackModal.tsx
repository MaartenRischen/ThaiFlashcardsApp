import React, { useState, useEffect } from 'react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => void;
  status: 'idle' | 'success' | 'error';
  includeConsoleLogs: boolean;
  setIncludeConsoleLogs: (value: boolean) => void;
  includeGenerationDetails: boolean;
  setIncludeGenerationDetails: (value: boolean) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  status,
  includeConsoleLogs,
  setIncludeConsoleLogs,
  includeGenerationDetails,
  setIncludeGenerationDetails,
}) => {
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!isOpen || status === 'success') {
      setFeedback('');
      setIncludeConsoleLogs(false);
      setIncludeGenerationDetails(false);
    }
  }, [isOpen, status, setIncludeConsoleLogs, setIncludeGenerationDetails]);

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
        <h2 className="text-lg font-bold text-blue-400 mb-4">We&apos;d love your feedback!</h2>
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
              className="w-full h-28 p-2 rounded bg-[#222] border border-gray-600 text-white resize-none mb-4 focus:outline-none focus:border-blue-400"
              placeholder="Share your thoughts, suggestions, or report a bug..."
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              required
              autoFocus
            />
            <div className="space-y-2 mb-4">
              <label className="flex items-center text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="includeConsoleLogs"
                  className="mr-2 accent-blue-500"
                  checked={includeConsoleLogs}
                  onChange={(e) => setIncludeConsoleLogs(e.target.checked)}
                />
                Include browser console logs (helps with debugging)
              </label>
              <label className="flex items-center text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="includeGenerationDetails"
                  className="mr-2 accent-blue-500"
                  checked={includeGenerationDetails}
                  onChange={(e) => setIncludeGenerationDetails(e.target.checked)}
                />
                Include last generation details (input, prompt, output)
              </label>
            </div>
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
                className="px-4 py-1 rounded bg-blue-600 text-white font-bold hover:bg-blue-500 transition"
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
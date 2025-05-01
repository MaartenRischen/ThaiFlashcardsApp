"use client";
import { useState } from "react";
import { FeedbackModal } from "./FeedbackModal";

export function FeedbackFooterClient() {
  const [isFeedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleFeedbackSubmit = async (feedback: string) => {
    setFeedbackStatus('idle');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });
      if (res.ok) {
        setFeedbackStatus('success');
        setTimeout(() => {
          setFeedbackOpen(false);
          setFeedbackStatus('idle');
        }, 1500);
      } else {
        setFeedbackStatus('error');
      }
    } catch (e) {
      setFeedbackStatus('error');
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 w-full z-40 flex flex-col items-center justify-center bg-[#181818] border-t border-gray-700 py-3 px-2 shadow-lg">
        <span className="text-xs md:text-sm text-gray-300 text-center mb-2 md:mb-0">
          This is a <span className="bg-yellow-400 text-black rounded-full px-2 py-0.5 font-bold mx-1">Beta</span> version, 100% free to use. If you could take a minute to give us your unbridled feedback in return, we would massively appreciate that.
        </span>
        <button
          onClick={() => setFeedbackOpen(true)}
          className="mt-2 md:mt-0 px-4 py-1 rounded bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition text-xs md:text-sm shadow"
        >
          Give Feedback
        </button>
      </div>
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => { setFeedbackOpen(false); setFeedbackStatus('idle'); }}
        onSubmit={handleFeedbackSubmit}
        status={feedbackStatus}
      />
    </>
  );
} 
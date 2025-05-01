"use client";
import { useState } from "react";
import { FeedbackModal } from "./FeedbackModal";
import { useFeedback } from "../context/FeedbackContext";
import { useUser } from "@clerk/nextjs";

export function FeedbackFooterClient() {
  const { isFeedbackOpen, openFeedbackModal, closeFeedbackModal } = useFeedback();
  const { user } = useUser();
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [includeConsoleLogs, setIncludeConsoleLogs] = useState(false);
  const [includeGenerationDetails, setIncludeGenerationDetails] = useState(false);

  const handleFeedbackSubmit = async (feedback: string) => {
    setFeedbackStatus('idle');
    const username = user?.username || user?.firstName || 'anonymous';
    try {
      const payload = {
        feedback,
        username,
        includeConsoleLogs,
        includeGenerationDetails,
      };

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setFeedbackStatus('success');
        setTimeout(() => {
          closeFeedbackModal();
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
      <div className="w-full flex flex-col items-center justify-center bg-[#181818] border-t border-gray-700 py-4 px-4 mt-12 shadow-lg">
        <span className="text-xs md:text-sm text-gray-300 text-center mb-2 md:mb-0">
          This is a <span className="bg-blue-500 text-white rounded-full px-2 py-0.5 font-bold mx-1">Beta</span> version, 100% free to use. If you could take a minute to give us your unbridled feedback in return, we would massively appreciate that.
        </span>
        <button
          onClick={openFeedbackModal}
          className="mt-3 px-4 py-1 rounded bg-blue-600 text-white font-bold hover:bg-blue-500 transition text-xs md:text-sm shadow"
        >
          Give Feedback
        </button>
      </div>
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => { closeFeedbackModal(); setFeedbackStatus('idle'); }}
        onSubmit={handleFeedbackSubmit}
        status={feedbackStatus}
        includeConsoleLogs={includeConsoleLogs}
        setIncludeConsoleLogs={setIncludeConsoleLogs}
        includeGenerationDetails={includeGenerationDetails}
        setIncludeGenerationDetails={setIncludeGenerationDetails}
      />
    </>
  );
} 
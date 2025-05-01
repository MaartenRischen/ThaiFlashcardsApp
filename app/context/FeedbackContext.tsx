"use client";
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface FeedbackContextType {
  isFeedbackOpen: boolean;
  openFeedbackModal: () => void;
  closeFeedbackModal: () => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const FeedbackProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isFeedbackOpen, setFeedbackOpen] = useState(false);

  const openFeedbackModal = () => setFeedbackOpen(true);
  const closeFeedbackModal = () => setFeedbackOpen(false);

  return (
    <FeedbackContext.Provider value={{ isFeedbackOpen, openFeedbackModal, closeFeedbackModal }}>
      {children}
    </FeedbackContext.Provider>
  );
};

export const useFeedback = (): FeedbackContextType => {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}; 
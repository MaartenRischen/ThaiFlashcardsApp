'use client';

import React from 'react';

const SetWizardPage = () => {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Thai Flashcards Set Wizard</h1>
          <a href="/" 
             className="text-sm text-blue-400 hover:text-blue-300 underline"
             title="Return to Main App">
            Back to Main App
          </a>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-blue-400">Welcome to the Set Wizard!</h2>
          <p className="mb-4">The Set Wizard is temporarily under maintenance.</p>
          <p className="mb-6">We're working to restore full functionality soon. Thank you for your patience!</p>
        </div>
      </div>
    </div>
  );
};

export default SetWizardPage; 
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SetWizardPage = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [thaiLevel, setThaiLevel] = useState<string>('beginner');
  const [learningGoals, setLearningGoals] = useState<string[]>([]);
  const [specificTopics, setSpecificTopics] = useState<string>('');
  const [generatedSetName, setGeneratedSetName] = useState<string>('');
  const [customSetName, setCustomSetName] = useState<string>('');
  const [totalSteps] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate a unique set name when component mounts
  useEffect(() => {
    generateSetName();
  }, []);

  // Update set name when relevant inputs change
  useEffect(() => {
    if (thaiLevel || learningGoals.length > 0) {
      generateSetName();
    }
  }, [thaiLevel, learningGoals]);

  const generateSetName = () => {
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    // Base name on level and goals if available
    let baseName = 'Thai';
    if (thaiLevel) {
      baseName += ` ${thaiLevel.charAt(0).toUpperCase() + thaiLevel.slice(1)}`;
    }
    
    if (learningGoals.length > 0) {
      // Take only the first goal for the name to keep it concise
      const primaryGoal = learningGoals[0].charAt(0).toUpperCase() + learningGoals[0].slice(1);
      baseName += ` for ${primaryGoal}`;
    }
    
    // Add date to ensure uniqueness
    const setName = `${baseName} Set (${dateStr})`;
    setGeneratedSetName(setName);
    setCustomSetName(setName);
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleGoal = (goal: string) => {
    setLearningGoals(prev => 
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const handleCreateSet = () => {
    // In the future, this will generate a custom set based on user preferences
    // For now, we'll just export a simple structure
    setIsGenerating(true);
    
    setTimeout(() => {
      // Placeholder for actual set generation
      // In a real implementation, this would create phrases based on level and goals
      const newSet = {
        name: customSetName,
        level: thaiLevel,
        goals: learningGoals,
        specificTopics: specificTopics,
        createdAt: new Date().toISOString(),
        phrases: [
          // This would be filled with actual phrases based on the user's selections
          // Just a placeholder for now
        ],
        mnemonics: {}
      };
      
      // Open the download dialog
      const dataStr = JSON.stringify(newSet, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileName = customSetName.replace(/\s+/g, '-').toLowerCase() + '.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);
      linkElement.click();
      
      setIsGenerating(false);
      
      // Show completion message
      alert(`Your set "${customSetName}" has been created! You can import it from the main app's Settings menu.`);
      
      // Optionally redirect back to main app
      if (confirm('Would you like to return to the main app now?')) {
        router.push('/');
      }
    }, 1500); // Simulate generation time
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Thai Flashcards Set Wizard</h1>
          <div className="text-sm text-gray-400">
            Step {currentStep} of {totalSteps}
          </div>
        </div>
        
        <div className="neumorphic rounded-xl p-6 mb-8">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-blue-400">Welcome to the Set Wizard!</h2>
              <p className="mb-4">This tool will help you create a custom Thai flashcard set tailored to your learning goals.</p>
              <p className="mb-6">We'll ask you a few questions about your Thai level and what you want to learn.</p>
              <p className="text-yellow-400 mb-4">Note: Currently in development. In this version, you can set up your preferences but the generated set will be a placeholder.</p>
            </div>
          )}
          
          {/* Step 2: Thai Level */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-blue-400">What is your current Thai level?</h2>
              <div className="space-y-3">
                {['beginner', 'intermediate', 'advanced'].map(level => (
                  <label key={level} className="flex items-center space-x-2 cursor-pointer p-3 rounded hover:bg-gray-800">
                    <input 
                      type="radio" 
                      name="thaiLevel" 
                      value={level} 
                      checked={thaiLevel === level}
                      onChange={(e) => setThaiLevel(e.target.value)}
                      className="accent-blue-400 h-4 w-4"
                    />
                    <span className="capitalize">{level}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          {/* Step 3: Learning Goals */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-blue-400">What are your learning goals?</h2>
              <p className="mb-4 text-gray-300">Select all that apply:</p>
              <div className="space-y-3">
                {['travel', 'conversation', 'reading', 'business', 'culture', 'food'].map(goal => (
                  <label key={goal} className="flex items-center space-x-2 cursor-pointer p-3 rounded hover:bg-gray-800">
                    <input 
                      type="checkbox" 
                      value={goal} 
                      checked={learningGoals.includes(goal)}
                      onChange={() => toggleGoal(goal)}
                      className="accent-green-400 h-4 w-4 rounded"
                    />
                    <span className="capitalize">{goal}</span>
                  </label>
                ))}
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Any specific topics you're interested in?
                </label>
                <textarea
                  value={specificTopics}
                  onChange={(e) => setSpecificTopics(e.target.value)}
                  placeholder="E.g., ordering food, asking for directions, talking about weather..."
                  className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white"
                  rows={3}
                />
              </div>
            </div>
          )}
          
          {/* Step 4: Set Name */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-blue-400">Name Your Set</h2>
              <p className="mb-4 text-gray-300">We've generated a name based on your preferences, but you can customize it:</p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Set Name
                </label>
                <input
                  type="text"
                  value={customSetName}
                  onChange={(e) => setCustomSetName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white"
                />
              </div>
              
              <div className="bg-gray-800 p-4 rounded mb-6">
                <h3 className="font-semibold mb-2">Set Summary</h3>
                <ul className="space-y-2 text-gray-300">
                  <li><span className="text-gray-400">Name:</span> {customSetName}</li>
                  <li><span className="text-gray-400">Level:</span> {thaiLevel.charAt(0).toUpperCase() + thaiLevel.slice(1)}</li>
                  <li>
                    <span className="text-gray-400">Goals:</span> {learningGoals.length > 0 
                      ? learningGoals.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(', ') 
                      : 'None specified'}
                  </li>
                  {specificTopics && (
                    <li><span className="text-gray-400">Specific Topics:</span> {specificTopics}</li>
                  )}
                </ul>
              </div>
              
              <button 
                onClick={handleCreateSet} 
                disabled={isGenerating || !customSetName.trim()}
                className={`w-full py-3 rounded-lg font-bold ${
                  isGenerating || !customSetName.trim() 
                    ? 'bg-gray-600 text-gray-400' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isGenerating ? 'Generating Set...' : 'Create My Custom Set'}
              </button>
            </div>
          )}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button 
            onClick={handleBack} 
            disabled={currentStep === 1}
            className={`py-2 px-6 rounded ${
              currentStep === 1 ? 'bg-gray-700 text-gray-500' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Back
          </button>
          
          {currentStep < totalSteps && (
            <button 
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetWizardPage; 
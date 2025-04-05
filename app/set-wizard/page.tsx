'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateCustomSet, createCustomSet, Phrase, generateSingleFlashcard, BatchError } from '../lib/set-generator';
import * as storage from '../lib/storage'; // Import storage functions

// Card Editor component for previewing and editing generated cards
const CardEditor = ({ 
  phrase, 
  onChange,
  onRegenerate,
  index,
  level,
  goals,
  specificTopics
}: { 
  phrase: Phrase, 
  onChange: (index: number, updatedPhrase: Phrase) => void,
  onRegenerate: (index: number) => void,
  index: number,
  level: string,
  goals: string[],
  specificTopics?: string
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPhrase, setEditedPhrase] = useState<Phrase>(phrase);

  const handleUpdate = () => {
    onChange(index, editedPhrase);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedPhrase(phrase);
    setIsEditing(false);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">English</label>
            <input 
              value={editedPhrase.english}
              onChange={(e) => setEditedPhrase({...editedPhrase, english: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Thai</label>
            <input 
              value={editedPhrase.thai}
              onChange={(e) => setEditedPhrase({...editedPhrase, thai: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Thai (Masculine)</label>
            <input 
              value={editedPhrase.thaiMasculine}
              onChange={(e) => setEditedPhrase({...editedPhrase, thaiMasculine: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Thai (Feminine)</label>
            <input 
              value={editedPhrase.thaiFeminine}
              onChange={(e) => setEditedPhrase({...editedPhrase, thaiFeminine: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pronunciation</label>
            <input 
              value={editedPhrase.pronunciation}
              onChange={(e) => setEditedPhrase({...editedPhrase, pronunciation: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Mnemonic</label>
            <textarea 
              value={editedPhrase.mnemonic || ''}
              onChange={(e) => setEditedPhrase({...editedPhrase, mnemonic: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
              rows={2}
            />
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={handleUpdate}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
            >
              Save
            </button>
            <button 
              onClick={handleCancel}
              className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between mb-2">
            <h3 className="text-lg font-bold text-white">
              {phrase.english}
            </h3>
            <div className="flex space-x-2">
              <button 
                onClick={() => setIsEditing(true)}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Edit
              </button>
              <button 
                onClick={() => onRegenerate(index)}
                className="text-green-400 hover:text-green-300 text-sm"
              >
                Regenerate
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-2xl mb-1">{phrase.thai}</p>
              <div className="flex space-x-4 text-sm text-gray-400">
                <span>♂ {phrase.thaiMasculine}</span>
                <span>♀ {phrase.thaiFeminine}</span>
              </div>
              <p className="text-gray-400 mt-2 italic">
                {phrase.pronunciation}
              </p>
            </div>
            
            <div>
              {phrase.mnemonic && (
                <div className="mb-3">
                  <p className="text-sm text-gray-400">Mnemonic:</p>
                  <p className="text-gray-300">{phrase.mnemonic}</p>
                </div>
              )}
              
              {phrase.examples && phrase.examples.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Example:</p>
                  <p className="text-gray-300">{phrase.examples[0].thai}</p>
                  <p className="text-gray-400 italic text-sm">
                    {phrase.examples[0].pronunciation}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {phrase.examples[0].translation}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SetWizardPage = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [thaiLevel, setThaiLevel] = useState<string>('beginner');
  const [learningGoals, setLearningGoals] = useState<string[]>([]);
  const [specificTopics, setSpecificTopics] = useState<string>('');
  const [cardCount, setCardCount] = useState<number>(10);
  const [customSetName, setCustomSetName] = useState<string>(`Thai ${thaiLevel} for ${learningGoals.length ? learningGoals[0] : 'Beginners'} Set`);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<{ completed: number, total: number }>({ completed: 0, total: 0 });
  const [generatedPhrases, setGeneratedPhrases] = useState<Phrase[]>([]);
  const [generationErrors, setGenerationErrors] = useState<(BatchError & { batchIndex: number })[]>([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState<number>(0);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [errorSummary, setErrorSummary] = useState<{
    errorTypes: string[]; 
    totalErrors: number;
    userMessage: string;
  } | null>(null);
  const [totalSteps] = useState(5); // Total steps including generation and preview

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
    setCustomSetName(setName);
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      if (currentStep === 3) {
        // About to enter the generation step - start generation process
        startGeneration();
      } else {
        setCurrentStep(currentStep + 1);
      }
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

  const startGeneration = async () => {
    setIsGenerating(true);
    setGenerationProgress({ completed: 0, total: cardCount });
    setCurrentStep(4); // Move to generation step

    try {
      // Call the generation service
      const result = await generateCustomSet(
        {
          level: thaiLevel as 'beginner' | 'intermediate' | 'advanced',
          goals: learningGoals,
          specificTopics: specificTopics || undefined
        },
        cardCount,
        (progress) => {
          setGenerationProgress(progress);
        }
      );

      setGeneratedPhrases(result.phrases);
      setGenerationErrors(result.aggregatedErrors);
      
      // Store error summary for UI display
      if (result.errorSummary) {
        console.log("Generation completed with errors:", result.errorSummary);
        setErrorSummary(result.errorSummary);
      }
      
      // Automatically move to preview step after generation completes
      setCurrentStep(5);
    } catch (error) {
      console.error("Failed to generate flashcard set:", error);
      alert("There was an error generating your flashcard set. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateCard = async (index: number) => {
    if (isRegenerating) return;
    
    setIsRegenerating(true);
    
    try {
      const result = await generateSingleFlashcard({
        level: thaiLevel as 'beginner' | 'intermediate' | 'advanced',
        goals: learningGoals,
        specificTopics: specificTopics || undefined
      });
      
      if (result.phrase) {
        const updatedPhrases = [...generatedPhrases];
        updatedPhrases[index] = result.phrase;
        setGeneratedPhrases(updatedPhrases);
      } else if (result.error) {
        console.error("Error regenerating card:", result.error);
        alert(`Error regenerating this card: ${result.error.message}`);
      } else {
        alert("Could not regenerate the card. Please try again.");
      }
    } catch (error) {
      console.error("Failed to regenerate card:", error);
      alert("Error regenerating this card. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleUpdateCard = (index: number, updatedPhrase: Phrase) => {
    const updatedPhrases = [...generatedPhrases];
    updatedPhrases[index] = updatedPhrase;
    setGeneratedPhrases(updatedPhrases);
  };

  const handleCreateSet = () => {
    if (generatedPhrases.length === 0) {
      alert("No cards have been generated. Please go back and generate cards first.");
      return;
    }

    // Create the data that will be added to the sets registry
    const setData = {
      name: customSetName,
      level: thaiLevel,
      goals: learningGoals,
      specificTopics: specificTopics,
      source: 'wizard' as const
    };

    // Generate a new set ID
    const newId = storage.generateUUID();
    const now = new Date().toISOString();
    
    // Prepare the complete metadata with ID and timestamps
    const newMetaData = {
      ...setData,
      id: newId,
      createdAt: now,
      phraseCount: generatedPhrases.length,
    };

    // Save the set content and metadata
    storage.saveSetContent(newId, generatedPhrases);
    
    // Update available sets list
    const currentSets = storage.getAvailableSets();
    const updatedSets = [...currentSets, newMetaData];
    storage.saveAvailableSets(updatedSets);
    
    // Set this new set as active immediately
    storage.setActiveSetId(newId);

    // Still provide download option
    const dataToExport = {
      ...setData,
      createdAt: now,
      phrases: generatedPhrases,
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileName = customSetName.replace(/\s+/g, '-').toLowerCase() + '.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
    
    // Show completion message
    alert(`Your set "${customSetName}" has been created and will be loaded when you return to the main app!`);
    
    // Offer to return to main app
    if (confirm('Would you like to return to the main app now?')) {
      // Force full page reload to ensure context is refreshed with the new set
      window.location.href = '/';
    }
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
              <p className="mb-6">We'll ask you a few questions about your Thai level and what you want to learn, then use AI to generate a personalized set of flashcards for you.</p>
              <p className="text-yellow-400 mb-4">The flashcards will be generated using Gemini, which may take a few moments to complete.</p>
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

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  How many cards would you like in your set?
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="5"
                    value={cardCount}
                    onChange={(e) => setCardCount(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="font-medium text-blue-400">{cardCount}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4: Generation */}
          {currentStep === 4 && (
            <div className="text-center py-10">
              <h2 className="text-2xl font-bold mb-6 text-blue-400">
                Generating Your Custom Set
              </h2>
              
              <div className="relative pt-1 mb-8">
                <div className="h-2 bg-gray-700 rounded-full">
                  <div 
                    className="h-2 bg-blue-600 rounded-full" 
                    style={{ width: `${Math.round((generationProgress.completed / generationProgress.total) * 100)}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-gray-400">
                  Generated {generationProgress.completed} of {generationProgress.total} cards
                </div>
              </div>
              
              <div className="text-gray-300 animate-pulse">
                {isGenerating 
                  ? "Please wait while Gemini creates your custom Thai flashcards..." 
                  : "Finishing up..."
                }
              </div>
            </div>
          )}
          
          {/* Step 5: Preview and Edit */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-blue-400">
                Review Your Flashcards
              </h2>
              
              {generationErrors.length > 0 && (
                <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded p-4 mb-6">
                  <p className="text-red-400 mb-1">
                    {errorSummary?.userMessage || 
                      `There were some issues with card generation. ${generatedPhrases.length} cards were generated successfully.`}
                  </p>
                  <p className="text-gray-400 text-sm">
                    You can continue with the cards that were generated, or go back and try again.
                  </p>
                  {errorSummary?.errorTypes.includes('NETWORK') && (
                    <p className="text-orange-400 text-sm mt-2">
                      Network issues detected. Please check your internet connection and try again.
                    </p>
                  )}
                  {errorSummary?.errorTypes.includes('API') && (
                    <p className="text-orange-400 text-sm mt-2">
                      API errors occurred. The service might be experiencing high traffic or temporary issues.
                    </p>
                  )}
                  {errorSummary?.errorTypes.includes('VALIDATION') && (
                    <p className="text-orange-400 text-sm mt-2">
                      The AI had trouble generating valid flashcards for "{specificTopics}". Try simplifying your topic or using different terms.
                    </p>
                  )}
                </div>
              )}
              
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
                  <li><span className="text-gray-400">Cards:</span> {generatedPhrases.length}</li>
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
              
              <div className="mb-6">
                <h3 className="font-semibold mb-4">Card Preview</h3>
                
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-400">
                    Showing card {currentPreviewIndex + 1} of {generatedPhrases.length}
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setCurrentPreviewIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentPreviewIndex === 0}
                      className={`px-3 py-1 rounded ${currentPreviewIndex === 0 ? 'bg-gray-700 text-gray-500' : 'bg-blue-600 text-white'}`}
                    >
                      Previous
                    </button>
                    <button 
                      onClick={() => setCurrentPreviewIndex(prev => Math.min(generatedPhrases.length - 1, prev + 1))}
                      disabled={currentPreviewIndex === generatedPhrases.length - 1}
                      className={`px-3 py-1 rounded ${currentPreviewIndex === generatedPhrases.length - 1 ? 'bg-gray-700 text-gray-500' : 'bg-blue-600 text-white'}`}
                    >
                      Next
                    </button>
                  </div>
                </div>
                
                {generatedPhrases.length > 0 ? (
                  <CardEditor
                    phrase={generatedPhrases[currentPreviewIndex]}
                    onChange={handleUpdateCard}
                    onRegenerate={handleRegenerateCard}
                    index={currentPreviewIndex}
                    level={thaiLevel}
                    goals={learningGoals}
                    specificTopics={specificTopics}
                  />
                ) : (
                  <div className="text-center p-8 bg-gray-800 rounded">
                    <p className="text-gray-400">No cards have been generated.</p>
                  </div>
                )}
              </div>
              
              <button 
                onClick={handleCreateSet} 
                disabled={generatedPhrases.length === 0 || !customSetName.trim()}
                className={`w-full py-3 rounded-lg font-bold ${
                  generatedPhrases.length === 0 || !customSetName.trim() 
                    ? 'bg-gray-600 text-gray-400' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                Create My Custom Set
              </button>
            </div>
          )}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button 
            onClick={handleBack} 
            disabled={currentStep === 1 || currentStep === 4}
            className={`py-2 px-6 rounded ${
              currentStep === 1 || currentStep === 4 ? 'bg-gray-700 text-gray-500' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Back
          </button>
          
          {currentStep < totalSteps && currentStep !== 4 && (
            <button 
              onClick={handleNext}
              disabled={
                (currentStep === 2 && !thaiLevel) || 
                (currentStep === 3 && learningGoals.length === 0)
              }
              className={`py-2 px-6 rounded ${
                ((currentStep === 2 && !thaiLevel) || 
                (currentStep === 3 && learningGoals.length === 0)) 
                  ? 'bg-gray-700 text-gray-500' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {currentStep === 3 ? 'Generate Cards' : 'Next'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetWizardPage; 
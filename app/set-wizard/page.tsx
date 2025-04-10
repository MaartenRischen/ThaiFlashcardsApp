'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { generateCustomSet, createCustomSet, generateSingleFlashcard, BatchError, type Phrase } from '../lib/set-generator';
import { SetMetaData } from '../lib/storage'; // Import SetMetaData type
import { Slider } from "@/components/ui/slider"; // Import the slider component
import { useSet } from '../context/SetContext'; // Import the useSet hook
import * as storage from '../lib/storage'; // Import storage utilities

// Card Editor component for previewing and editing generated cards
const CardEditor = ({ 
  phrase, 
  onChange,
  onRegenerate,
  index,
  level,
  specificTopics,
  friendNames,
  userName,
  situations,
  topicsToAvoid,
  seriousnessLevel
}: { 
  phrase: Phrase, 
  onChange: (index: number, updatedPhrase: Phrase) => void,
  onRegenerate: (index: number) => void,
  index: number,
  level: string,
  specificTopics?: string,
  friendNames?: string[],
  userName?: string,
  situations?: string,
  topicsToAvoid?: string,
  seriousnessLevel?: number
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
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [thaiLevel, setThaiLevel] = useState<string>('beginner');
  const [specificTopics, setSpecificTopics] = useState<string>('');
  const [friendNames, setFriendNames] = useState<string>('');
  const [situations, setSituations] = useState<string>('');
  const [topicsToAvoid, setTopicsToAvoid] = useState<string>('');
  const [seriousnessLevel, setSeriousnessLevel] = useState<number>(50);
  const [cardCount, setCardCount] = useState<number>(8);
  const [customSetName, setCustomSetName] = useState<string>('');
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
  const [aiGeneratedTitle, setAiGeneratedTitle] = useState<string | undefined>(undefined);
  const [generatingDisplayPhrases, setGeneratingDisplayPhrases] = useState<Phrase[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Generate a unique set name when component mounts
  useEffect(() => {
    generateSetName();
  }, []);

  // Update set name when relevant inputs change
  useEffect(() => {
    if (thaiLevel) {
      generateSetName();
    }
  }, [thaiLevel]);

  // NEW: useEffect to log changes to generatingDisplayPhrases
  useEffect(() => {
    console.log(`Effect: generatingDisplayPhrases updated. New length: ${generatingDisplayPhrases.length}`);
  }, [generatingDisplayPhrases]);

  const generateSetName = () => {
    if (!customSetName && session?.user?.name) {
      const date = new Date();
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      setCustomSetName(`${session.user.name}'s ${thaiLevel} Set (${dateStr})`);
    } else if (!customSetName) {
      const date = new Date();
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      setCustomSetName(`My ${thaiLevel} Set (${dateStr})`);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      if (currentStep === 3) {
        startGeneration();
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    // Prevent going back to Generation step (4) from Preview step (5)
    if (currentStep > 1 && currentStep !== 5) { 
      setCurrentStep(currentStep - 1);
    } else if (currentStep === 5) {
      // Optionally go back to Step 3 (Inputs) from Preview
      console.log("Navigating back from Preview (5) to Input (3)");
      setCurrentStep(3); 
    }
  };

  const startGeneration = async () => {
    try {
      const friendNamesArray = friendNames ? friendNames.split(',').map(n => n.trim()).filter(n => n) : [];
      const userName = 'You'; // Could be personalized in future

      setIsGenerating(true);
      setGeneratedPhrases([]);
      setGeneratingDisplayPhrases([]);
      setErrorSummary(null);
      setGenerationProgress({ completed: 0, total: cardCount });

      console.log("Starting generation with inputs:", {
        level: thaiLevel,
        specificTopics,
        friendNames: friendNamesArray,
        situations,
        topicsToAvoid,
        seriousnessLevel
      });

      // Update to reflect the new approach
      const result = await generateCustomSet(
        {
          level: thaiLevel as 'beginner' | 'intermediate' | 'advanced',
          specificTopics: specificTopics || undefined,
          friendNames: friendNamesArray,
          userName: userName,
          topicsToDiscuss: situations || undefined,
          topicsToAvoid: topicsToAvoid || undefined,
          seriousnessLevel: seriousnessLevel,
        },
        cardCount,
        (progress) => {
          console.log("Generation progress:", progress);
          setGenerationProgress({
            completed: progress.completed,
            total: progress.total
          });
          // CRITICAL: Update the display phrases in real-time
          if (progress.latestPhrases && progress.latestPhrases.length > 0) {
            setGeneratingDisplayPhrases(prev => [...prev, ...(progress.latestPhrases || [])]);
          }
        }
      );

      setGeneratedPhrases(result.phrases); // Store the final complete list
      setGenerationErrors(result.aggregatedErrors);
      
      // Set final display list to the complete generated list
      setGeneratingDisplayPhrases(result.phrases); 

      if (result.cleverTitle) {
        setAiGeneratedTitle(result.cleverTitle);
        setCustomSetName(result.cleverTitle); 
      }
      
      if (result.errorSummary) {
        console.log("Generation completed with errors:", result.errorSummary);
        setErrorSummary(result.errorSummary);
      }
      
      // --- REMOVED: No longer auto-advance --- 
      // setCurrentStep(5);

    } catch (error) {
      console.error("Failed to generate flashcard set:", error);
      alert("There was an error generating your flashcard set. Please try again.");
      // Optionally, handle error by allowing user to go back
      // setCurrentStep(3); 
    } finally {
      setIsGenerating(false); // Mark generation as complete
    }
  };

  const handleRegenerateCard = async (index: number) => {
    try {
      setIsRegenerating(true);
      const friendNamesArray = friendNames ? friendNames.split(',').map(n => n.trim()).filter(n => n) : [];
      const userName = 'You'; // Personalized in future
      
      console.log(`Regenerating card at index ${index}`);
      
      const result = await generateSingleFlashcard({
        level: thaiLevel as 'beginner' | 'intermediate' | 'advanced',
        specificTopics: specificTopics || undefined,
        friendNames: friendNamesArray,
        userName: userName,
        topicsToDiscuss: situations || undefined,
        topicsToAvoid: topicsToAvoid || undefined,
        seriousnessLevel: seriousnessLevel,
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

  const handleCreateSet = async () => {
    try {
      setIsSaving(true);
      
      // Create the data for the set
      const setData = {
        name: customSetName || `Generated Set ${new Date().toLocaleDateString()}`, 
        cleverTitle: aiGeneratedTitle, 
        level: thaiLevel,
        specificTopics: specificTopics,
        source: 'wizard' as const,
        phrases: generatedPhrases
      };

      // Log the first phrase to see its structure (for debugging)
      if (generatedPhrases.length > 0) {
        console.log("First phrase example:", JSON.stringify(generatedPhrases[0], null, 2));
         
        // Check if examples have the correct structure
        if (generatedPhrases[0].examples && generatedPhrases[0].examples.length > 0) {
          console.log("Example structure:", JSON.stringify(generatedPhrases[0].examples[0], null, 2));
        }
      }

      if (status === 'authenticated') {
        // User is logged in, save to database via API
        console.log("Saving set to database for authenticated user");
         
        try {
          const response = await fetch('/api/flashcard-sets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(setData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error("Error response from API:", errorData);
             
            if (response.status === 401) {
              // Authentication error
              alert("Your session has expired. Please sign in again to save your set.");
              window.location.href = '/login'; // Redirect to login
              return;
            }
             
            throw new Error(errorData.error || errorData.message || 'Failed to create set');
          }

          const result = await response.json();
          console.log("Set saved successfully:", result);
           
          // Update success message
          alert(`Your set "${customSetName}" has been created and saved to your account!`);
        } catch (error) {
          console.error("Fetch error:", error);
          throw error; // Re-throw to be caught by outer try/catch
        }
      } else {
        // User is not logged in, save to localStorage
        console.log("Saving set to localStorage for unauthenticated user");
        const newId = storage.generateUUID();
        const now = new Date().toISOString();
         
        const newMetaData: SetMetaData = {
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
         
        // Update completion message
        alert(`Your set "${customSetName}" has been created and saved locally. Sign in to save it to your account!`);
      }
    } catch (error) {
      console.error('Error saving set:', error);
      alert(`Error saving set: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
     
    // Offer to return to main app
    if (confirm('Would you like to return to the main app now?')) {
      window.location.href = '/'; // Force reload to ensure context update
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Thai Flashcards Set Wizard</h1>
          {/* Home Link */}
          <a href="/" 
             className="text-sm text-blue-400 hover:text-blue-300 underline" 
             title="Return to Main App (Discards Wizard Progress)"
             onClick={(e) => {
                 if (!confirm('Return to main app? Any wizard progress will be lost.')) {
                     e.preventDefault(); // Prevent navigation if user cancels
                 }
             }}
          >
            Back to Main App
          </a>
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
          
          {/* Step 3: Customization - UPDATED */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-blue-400">Customize Your Set</h2>
              
              {/* Friend Names Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Enter a few names of people you know (nicknames ok, comma-separated):
                </label>
                <input
                  type="text"
                  value={friendNames}
                  onChange={(e) => setFriendNames(e.target.value)}
                  placeholder="E.g., Somchai, Priya, Alex, Bo"
                  className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white"
                />
                 <p className="text-xs text-gray-400 mt-1 italic">These names (and yours!) will be used in example sentences.</p>
              </div>

              {/* Situations Input (Replaces Topics to Discuss) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  In what *situations* will you be speaking Thai? (Required)
                </label>
                <textarea
                  value={situations}
                  onChange={(e) => setSituations(e.target.value)}
                  placeholder="Describe scenarios, e.g., ordering food at street stalls, talking with hotel staff, discussing hobbies with friends, surviving a zombie apocalypse in Bangkok..."
                  className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white"
                  rows={3}
                  required
                />
                 <p className="text-xs text-gray-400 mt-1 italic">This helps generate relevant and contextual sentences.</p>
              </div>

              {/* Topics to Avoid Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Any topics to strictly avoid? (Optional)
                </label>
                <textarea
                  value={topicsToAvoid}
                  onChange={(e) => setTopicsToAvoid(e.target.value)}
                  placeholder="E.g., politics, specific sensitive subjects..."
                  className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white"
                  rows={2}
                />
              </div>
              
              {/* Specific Topics (Optional Refinement) - Keep or remove? Keeping for now */}
               <div className="mb-6">
                 <label className="block text-sm font-medium text-gray-300 mb-2">
                   Any *very* specific focus within your topics? (Optional)
                 </label>
                 <textarea
                   value={specificTopics}
                   onChange={(e) => setSpecificTopics(e.target.value)}
                   placeholder="E.g., types of noodles, names of Bangkok districts, specific movie titles..."
                   className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white"
                   rows={2}
                 />
               </div>

              {/* Seriousness Slider */}
              <div className="mb-6">
                 <label className="block text-sm font-medium text-gray-300 mb-2">
                   Tone: Serious vs. Ridiculous ({seriousnessLevel}%)
                 </label>
                 <div className="flex items-center space-x-4">
                    <span className="text-xs text-gray-400">Serious</span>
                    <Slider 
                        defaultValue={[seriousnessLevel]} 
                        min={0} max={100} step={1} 
                        onValueChange={(value: number[]) => setSeriousnessLevel(value[0])}
                        className="w-full"
                    />
                    <span className="text-xs text-gray-400">Ridiculous</span>
                 </div>
                 <p className="text-xs text-gray-400 mt-1 italic">Controls the tone from textbook-dry (0%) to absurd humor (100%).</p>
              </div>

              {/* Card Count */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  How many cards would you like in your set?
                </label>
                <div className="flex items-center gap-4 bg-gray-800 rounded-lg p-3 border border-gray-700">
                  {[8, 16, 24].map(countOption => (
                    <label key={countOption} className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="cardCount" 
                        value={countOption} 
                        checked={cardCount === countOption}
                        onChange={(e) => setCardCount(parseInt(e.target.value))}
                        className="accent-blue-400 h-4 w-4"
                      />
                      <span className="font-medium text-blue-400">{countOption} cards</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4: Generation - Update Summary */} 
          {currentStep === 4 && (
            <div className="text-center py-10 flex flex-col items-center"> 
              <h2 className="text-2xl font-bold mb-6 text-blue-400">
                {isGenerating ? 'Generating Your Custom Set' : 'Generation Complete!'} 
              </h2>
              
              {/* UPDATED Input Summary */} 
              <div className="w-full max-w-md text-left bg-gray-700 bg-opacity-40 rounded-lg p-3 mb-4 text-sm">
                 <p className="text-gray-400">
                   <span className="font-semibold text-gray-300">Level:</span> {thaiLevel.charAt(0).toUpperCase() + thaiLevel.slice(1)}
                 </p>
                 <p className="text-gray-400">
                   <span className="font-semibold text-gray-300">Situations:</span> {situations || 'General'}
                 </p>
                 {specificTopics && (
                   <p className="text-gray-400">
                     <span className="font-semibold text-gray-300">Specific Focus:</span> {specificTopics}
                   </p>
                 )}
                  {topicsToAvoid && (
                    <p className="text-gray-400">
                      <span className="font-semibold text-gray-300">Avoid:</span> {topicsToAvoid}
                    </p>
                  )}
                   <p className="text-gray-400">
                      <span className="font-semibold text-gray-300">Tone:</span> {seriousnessLevel}% Ridiculous
                    </p>
                    {friendNames && (
                      <p className="text-gray-400">
                        <span className="font-semibold text-gray-300">Featuring:</span> {friendNames}
                      </p>
                    )}
              </div>
              
              {/* Display minor error summary if present, even on success */} 
              {errorSummary && errorSummary.totalErrors > 0 && (
                  <div className="w-full max-w-md bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded p-3 mb-4 text-sm">
                    <p className="text-yellow-400 mb-1">
                        Note: {errorSummary.userMessage || 'Some minor issues occurred during generation.'}
                    </p>
                  </div>
              )}
              
              {/* Show Progress Bar and Loading Text ONLY when generating */} 
              {isGenerating && (
                <>
                  <div className="w-full max-w-md relative pt-1 mb-4">
                    <div className="h-2 bg-gray-700 rounded-full">
                      <div 
                        className="h-2 bg-blue-600 rounded-full transition-width duration-300 ease-linear"
                        style={{ width: `${Math.round((generationProgress.completed / generationProgress.total) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="mt-2 text-gray-400">
                      Generated {generationProgress.completed} of {generationProgress.total} cards
                    </div>
                  </div>
                  <div className="text-gray-300 animate-pulse mb-6">
                    Please wait while Gemini creates your custom Thai flashcards...
                  </div>
                </>
              )}
               
              {/* Real-time/Final Phrase Display */} 
              <div className="w-full max-w-md text-left bg-gray-800 rounded-lg p-4 min-h-[12rem] max-h-[24rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">
                  Generated Phrases: ({generatingDisplayPhrases.length} / {cardCount})
                </h4>
                {/* ... logging ... */} 
                {generatingDisplayPhrases.length === 0 && !isGenerating && ( // Show if empty AND finished
                    <p className="text-red-400 text-sm italic">No phrases were generated. Please go back and adjust your inputs.</p>
                )}
                {generatingDisplayPhrases.length === 0 && isGenerating && (
                   <p className="text-gray-500 text-sm italic">Waiting for first batch...</p>
                )}
                {generatingDisplayPhrases.map((phrase, index) => (
                     <p key={`${index}-${phrase.english}`} className="text-gray-300 text-sm">
                       {index + 1}. {phrase.thai} - {phrase.english}
                     </p>
                   )
                )}
              </div>
              
              {/* Show "Review" button if generation is complete AND *at least one card* was generated */} 
              {!isGenerating && generatedPhrases.length > 0 && ( 
                <button
                  onClick={() => setCurrentStep(5)} 
                  className="mt-6 neumorphic-button py-2 px-6 text-lg font-semibold text-green-400 hover:text-green-300"
                >
                  Review Set & Mnemonics ({generatedPhrases.length} cards)
                </button>
              )}
              
              {/* Show critical failure message ONLY if generation is complete AND *zero cards* were generated */} 
              {!isGenerating && generatedPhrases.length === 0 && ( 
                 <p className="mt-4 text-red-400">
                    Generation failed or produced no cards. Please go back and adjust your inputs. 
                    {/* Optionally display error type summary here too */} 
                    {errorSummary?.userMessage && ` (${errorSummary.userMessage})`}
                 </p>
              )}
            </div>
          )}
          
          {/* Step 5: Preview & Save - Update Summary */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-blue-400">Review & Create Your Set</h2>
              
               {/* Error Summary */}
               {errorSummary && errorSummary.totalErrors > 0 && (
                 <div className="bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded p-3 mb-4 text-sm">
                   <p className="text-yellow-400 mb-1">
                       Note: {errorSummary.userMessage || 'Some minor issues occurred during generation.'}
                       {errorSummary.errorTypes.includes('VALIDATION') && ' Try simplifying your topics.'}
                   </p>
                 </div>
               )}
              
              {/* Set Title */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Set Title (Edit if desired)
                </label>
                <input
                  type="text"
                  value={customSetName}
                  onChange={(e) => setCustomSetName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white font-semibold text-lg"
                />
                {aiGeneratedTitle && customSetName === aiGeneratedTitle && (
                    <p className="text-xs text-gray-400 mt-1 italic">AI suggested title</p>
                )}
              </div>
              
              {/* UPDATED Set Summary */}
              <div className="bg-gray-800 p-4 rounded mb-6">
                <h3 className="font-semibold mb-2">Set Summary</h3>
                <ul className="space-y-1 text-gray-300 text-sm">
                  <li><span className="text-gray-400">Cards:</span> {generatedPhrases.length}</li>
                  <li><span className="text-gray-400">Level:</span> {thaiLevel.charAt(0).toUpperCase() + thaiLevel.slice(1)}</li>
                  <li><span className="text-gray-400">Situations:</span> {situations || 'General'}</li>
                   {specificTopics && (
                     <li><span className="text-gray-400">Specific Focus:</span> {specificTopics}</li>
                   )}
                   {topicsToAvoid && (
                    <li><span className="text-gray-400">Avoid:</span> {topicsToAvoid}</li>
                   )}
                   <li><span className="text-gray-400">Tone:</span> {seriousnessLevel}% Ridiculous</li>
                   {friendNames && (
                     <li><span className="text-gray-400">Featuring:</span> {friendNames}</li>
                   )}
                </ul>
              </div>
              
              {/* Card Preview */}
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
                    specificTopics={specificTopics}
                    friendNames={friendNames.split(',').map(n=>n.trim()).filter(n=>n)}
                    userName={session?.user?.name || 'You'}
                    situations={situations}
                    topicsToAvoid={topicsToAvoid}
                    seriousnessLevel={seriousnessLevel}
                  />
                ) : (
                  <div className="text-center p-8 bg-gray-800 rounded">
                    <p className="text-gray-400">No cards have been generated.</p>
                  </div>
                )}
              </div>
              
              {/* Create Set Button */}
              <button 
                onClick={handleCreateSet} 
                disabled={generatedPhrases.length === 0 || !customSetName.trim() || isGenerating}
                className={`w-full py-3 rounded-lg font-bold transition-colors ${
                  generatedPhrases.length === 0 || !customSetName.trim() || isGenerating
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isGenerating ? 'Saving...' : 'Create My Custom Set'}
              </button>
            </div>
          )}
        </div>
        
        {/* Navigation Buttons */}
        {currentStep !== 4 || isGenerating ? ( 
          <div className="flex justify-between mt-8">
            <button 
              onClick={handleBack} 
              disabled={currentStep === 1 || currentStep === 4} 
              className={`neumorphic-button py-2 px-6 text-sm ${ 
                (currentStep === 1 || currentStep === 4) ? 'text-gray-500 cursor-not-allowed' : 'text-blue-400 hover:text-blue-300'
              }`}
            >
              Back
            </button>
            
            {currentStep < totalSteps && currentStep !== 4 && (
              <button
                onClick={handleNext}
                disabled={ 
                  (currentStep === 2 && !thaiLevel) || 
                  (currentStep === 3 && !situations.trim())
                }
                className={`neumorphic-button py-2 px-6 text-sm font-semibold ${ 
                  ((currentStep === 2 && !thaiLevel) || 
                  (currentStep === 3 && !situations.trim()))
                    ? 'text-gray-500 cursor-not-allowed'
                    : (currentStep === 3 ? 'text-green-400 hover:text-green-300' : 'text-blue-400 hover:text-blue-300')
                }`}
              >
                {currentStep === 3 ? 'Generate Cards' : 'Next'}
              </button>
            )}
          </div>
        ) : null} 
      </div>
    </div>
  );
};

export default SetWizardPage; 
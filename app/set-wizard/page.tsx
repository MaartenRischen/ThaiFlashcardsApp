'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { generateCustomSet, createCustomSet, generateSingleFlashcard, BatchError, type Phrase } from '../lib/set-generator';
import { SetMetaData } from '../lib/storage'; // Import SetMetaData type
import { Slider } from "@/components/ui/slider"; // Import the slider component
import { useSet } from '../context/SetContext'; // Import the useSet hook
import * as storage from '../lib/storage'; // Import storage utilities
import { LLMSettingsSelector, LLMSettings } from "@/app/components/LLMSettings";

// --- Placeholder Data ---
const seriousSituationsExamples = [
  "Ordering food at street stalls, talking with hotel staff, discussing hobbies with friends",
  "Asking for directions, making small talk with taxi drivers, shopping at a market",
  "Booking a tour, checking into a flight, discussing weekend plans with colleagues",
  "Visiting a temple (asking about rules), buying train tickets, talking about the weather"
];

const ridiculousFocusExamples = [
  "Types of alien noodles found only in Chatuchak market on alternate Tuesdays",
  "Names of Bangkok districts ruled by sentient cats",
  "Specific movie titles starring heroic tuk-tuks that fight crime",
  "The secret language of soi dogs",
  "Advanced techniques for bargaining using only interpretive dance",
  "Documenting the migration patterns of ghost spirits near temples"
];

const ridiculousNamesExamples = [
  "Captain Sparklefingers, Professor Wobblebottom, Agent Meowser",
  "Sir Reginald Fluffington III, Madame Zuzu, General Grumbles",
  "Doctor Quackenstein, Princess Banana-Hammock, Baron von Wigglebutt",
  "Empress Bubbles, Colonel Cuddlepants, Lord Fuzzington"
];

// Helper to get random element
const getRandomElement = <T extends unknown>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Card Editor component for previewing and editing generated cards
const CardEditor = ({ 
  phrase, 
  onChange,
  index,
  level,
  specificTopics,
  userName,
  situations,
  seriousnessLevel
}: { 
  phrase: Phrase, 
  onChange: (index: number, updatedPhrase: Phrase) => void,
  index: number,
  level: string,
  specificTopics?: string,
  userName?: string,
  situations?: string,
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

// Define the specific level type
type ThaiLevel = 'beginner' | 'intermediate' | 'advanced';

const SetWizardPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { addSet } = useSet(); // Get addSet from context
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [thaiLevel, setThaiLevel] = useState<ThaiLevel | ''>(() => {
    try {
      const saved = localStorage.getItem('wizardLevel');
      if (saved) return saved as ThaiLevel;
      localStorage.setItem('wizardLevel', 'beginner');
      return 'beginner';
    } catch { return 'beginner'; }
  });
  const [situations, setSituations] = useState<string>('');
  const [specificTopics, setSpecificTopics] = useState<string>('');
  const [cardCount, setCardCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('wizardCardCount');
      if (saved !== null) return parseInt(saved);
      localStorage.setItem('wizardCardCount', '8');
      return 8;
    } catch { return 8; }
  });
  const [seriousnessLevel, setSeriousnessLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('wizardRidiculousness');
      if (saved !== null) return parseInt(saved);
      localStorage.setItem('wizardRidiculousness', '0');
      return 0;
    } catch { return 0; }
  });
  const [customSetName, setCustomSetName] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<{ completed: number, total: number }>({ completed: 0, total: 0 });
  const [generatedPhrases, setGeneratedPhrases] = useState<Phrase[]>([]);
  const [generationErrors, setGenerationErrors] = useState<(BatchError & { batchIndex: number })[]>([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState<number>(0);
  const [errorSummary, setErrorSummary] = useState<{
    errorTypes: string[]; 
    totalErrors: number;
    userMessage: string;
  } | null>(null);
  const [totalSteps] = useState(5); // Total steps including generation and preview
  const [aiGeneratedTitle, setAiGeneratedTitle] = useState<string | undefined>(undefined);
  const [generatingDisplayPhrases, setGeneratingDisplayPhrases] = useState<Phrase[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // --- NEW: State for dynamic placeholders ---
  const [situationPlaceholder, setSituationPlaceholder] = useState<string>(`E.g., ${seriousSituationsExamples[0]}`);
  const [focusPlaceholder, setFocusPlaceholder] = useState<string>(`E.g., ${ridiculousFocusExamples[0]}`);

  // Generate a unique set name when component mounts
  useEffect(() => {
    generateSetName();
    // --- NEW: Set random placeholders on mount ---
    setSituationPlaceholder(`E.g., ${getRandomElement(seriousSituationsExamples)}`);
    setFocusPlaceholder(`E.g., ${getRandomElement(ridiculousFocusExamples)}`);
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

  useEffect(() => {
    localStorage.setItem('wizardLevel', thaiLevel);
  }, [thaiLevel]);
  useEffect(() => {
    localStorage.setItem('wizardRidiculousness', seriousnessLevel.toString());
  }, [seriousnessLevel]);
  useEffect(() => {
    localStorage.setItem('wizardCardCount', cardCount.toString());
  }, [cardCount]);

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

  // Helper to build the image prompt
  const buildImagePrompt = () => {
    // Compose a prompt that strictly forbids text and language/country references
    return `Create a playful illustration with only: 1) a donkey, 2) a bridge, 3) a visual depiction of the situation(s): ${situations || 'general'}, 4) a visual depiction of the specific focus: ${specificTopics || 'none'}. Do NOT include any text, writing, language, or country references. No title, no words, no letters. Only the four required elements.`;
  };

  // Function to generate the image (used in background during card generation and on review step)
  const generateSetImage = useCallback(async () => {
    setImageLoading(true);
    setImageError(null);
    setImageUrl(null);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: buildImagePrompt() }),
      });
      if (!response.ok) {
        const errorJson = await response.json();
        setImageError(errorJson.error || 'Failed to generate image.');
        setImageLoading(false);
        return;
      }
      const result = await response.json();
      setImageUrl(result.imageUrl);
      setImageLoading(false);
    } catch (err: any) {
      setImageError(err.message || 'Failed to generate image.');
      setImageLoading(false);
    }
  }, [customSetName, specificTopics, situations]);

  // Start image generation in background when entering the generation step
  useEffect(() => {
    if (currentStep === 4) {
      generateSetImage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const [llmSettings, setLlmSettings] = useState<LLMSettings>({
    brand: "google",
    model: "gemini-2.0-flash-lite",
    apiKey: undefined,
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      setLlmSettings({
        brand: localStorage.getItem("llmBrand") || "google",
        model: localStorage.getItem("llmModel") || "gemini-2.0-flash-lite",
        apiKey: localStorage.getItem("llmApiKey") || undefined,
      });
    }
  }, []);

  const startGeneration = async () => {
    setCurrentStep(4); // Move to generation step immediately
    setIsGenerating(true);
    setGeneratedPhrases([]);
    setGeneratingDisplayPhrases([]); // Clear display phrases
    setErrorSummary(null);
    setGenerationProgress({ completed: 0, total: cardCount });

    const userName = session?.user?.name || 'You'; // Get username from session

    // Prepare the request body for the API route
    const requestBody = {
      level: thaiLevel as 'beginner' | 'intermediate' | 'advanced',
      situations: situations || undefined,
      specificTopics: specificTopics || undefined,
      userName: userName,
      seriousnessLevel: seriousnessLevel,
      count: cardCount,
      llmBrand: llmSettings.brand,
      llmModel: llmSettings.model,
      llmApiKey: llmSettings.apiKey,
    };

    console.log("SetWizard: Calling /api/generate-set with body:", requestBody);

    try {
      const response = await fetch('/api/generate-set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log("SetWizard: API response status:", response.status);

      if (!response.ok) {
        // Attempt to parse error from API response body
        let errorDetails = 'Unknown API error';
        try {
            const errorJson = await response.json();
            errorDetails = errorJson.error || errorJson.details || JSON.stringify(errorJson);
            console.error("SetWizard: API error response body:", errorJson);
        } catch (parseError) {
            errorDetails = `API responded with status ${response.status} but failed to parse error body.`;
            console.error("SetWizard: Failed to parse error response body:", parseError);
        }
        throw new Error(`API Error: ${errorDetails}`);
      }

      // Parse the successful JSON response from the API route
      const result = await response.json();
      console.log("SetWizard: API response parsed successfully:", result);

      // Update state based on the API response
      setGeneratedPhrases(result.phrases || []); 
      setGeneratingDisplayPhrases(result.phrases || []); // Show final list
      setGenerationErrors(result.aggregatedErrors || []); // Assuming API returns this structure
      if (result.cleverTitle) {
        setAiGeneratedTitle(result.cleverTitle);
        setCustomSetName(result.cleverTitle); 
      }
      if (result.errorSummary) {
        console.log("Generation completed with errors (from API):", result.errorSummary);
        setErrorSummary(result.errorSummary);
      }
      // Manually update progress to 100% as we don't have streaming updates from API yet
      setGenerationProgress({ completed: result.phrases?.length ?? 0, total: cardCount });

    } catch (error) {
      console.error("SetWizard: Failed to generate flashcard set via API:", error);
      alert(`There was an error generating your flashcard set. Please check the console or try again. Error: ${error instanceof Error ? error.message : String(error)}`);
      setCurrentStep(3); // Go back to input step on fetch/parse error
    } finally {
      setIsGenerating(false); 
    }
  };

  const handleUpdateCard = (index: number, updatedPhrase: Phrase) => {
    const updatedPhrases = [...generatedPhrases];
    updatedPhrases[index] = updatedPhrase;
    setGeneratedPhrases(updatedPhrases);
  };

  const handleSaveSet = async () => {
    if (!generatedPhrases || generatedPhrases.length === 0) {
        alert("Cannot save: No phrases were generated.");
        return;
    }
    if (!thaiLevel) { // Ensure thaiLevel is selected
        alert("Cannot save: Thai level is missing.");
        return;
    }

    // Prepare the metadata for the context addSet function
    const setData: Omit<SetMetaData, 'id' | 'createdAt' | 'phraseCount' | 'isFullyLearned'> = {
        name: customSetName, // Use the AI-generated or user-edited title as the set name
        cleverTitle: customSetName, // Use the same for cleverTitle
        level: thaiLevel, // Correct type assured by the check above
        specificTopics: specificTopics || undefined,
        source: 'generated', // Literal type
        goals: situations ? [situations] : [],
        imageUrl: imageUrl || undefined, // Pass the generated image URL
        seriousnessLevel // <-- Add this field
    };

    try {
        console.log("Calling addSet with:", setData, generatedPhrases);
        // Use the addSet function from the context
        const newSetId = await addSet(setData, generatedPhrases);
        console.log("Set saved via context with ID:", newSetId);
        router.push('/'); // Navigate back to the main app immediately
    } catch (error) {
        console.error("Error saving set via context:", error);
        alert(`Failed to save the generated set: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // New: When user clicks to review, only generate image if not already available
  const handleReviewClick = async () => {
    console.log('[handleReviewClick] User clicked review. Transitioning to review step.');
    setCurrentStep(5); // Show review step immediately
    // Only generate image if not already available
    if (!imageUrl) {
      setImageLoading(true);
      setImageError(null);
      setImageUrl(null);
      try {
        await generateSetImage();
        console.log('[handleReviewClick] Image generation completed.');
      } catch (err: any) {
        setImageError(err.message || 'Failed to generate image.');
        console.error('[handleReviewClick] Image generation failed:', err);
      }
    }
  };

  // Regenerate button handler (explicit only)
  const handleRegenerateImage = async () => {
    setImageLoading(true);
    setImageError(null);
    setImageUrl(null);
    try {
      await generateSetImage();
      console.log('[handleRegenerateImage] Image regeneration completed.');
    } catch (err: any) {
      setImageError(err.message || 'Failed to generate image.');
      console.error('[handleRegenerateImage] Image regeneration failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">DonkeyBridge Set Wizard</h1>
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
              {status !== 'loading' && !session && (
                <div className="bg-yellow-900 border border-yellow-600 text-yellow-200 rounded p-3 mb-4 text-center font-semibold">
                  You must be <span className="underline">logged in</span> to save a set. <br />
                  <span className="text-yellow-300">Log in or create an account before starting if you want to keep your progress!</span>
                </div>
              )}
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
                {(['beginner', 'intermediate', 'advanced'] as ThaiLevel[]).map(level => (
                  <label key={level} className="flex items-center space-x-2 cursor-pointer p-3 rounded hover:bg-gray-800">
                    <input 
                      type="radio" 
                      name="thaiLevel" 
                      value={level} 
                      checked={thaiLevel === level}
                      onChange={(e) => setThaiLevel(e.target.value as ThaiLevel)}
                      className="accent-blue-400 h-4 w-4"
                    />
                    <span className="capitalize">{level}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          {/* Step 3: Customization - REORDERED */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-blue-400">Customize Your Set</h2>
              
              {/* Situations Input (First) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  In what *situations* will you be speaking Thai? (Required)
                </label>
                <textarea
                  value={situations}
                  onChange={(e) => setSituations(e.target.value)}
                  placeholder={situationPlaceholder}
                  className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white"
                  rows={3}
                  required
                />
                 <p className="text-xs text-gray-400 mt-1 italic">This helps generate relevant and contextual sentences.</p>
              </div>

              {/* Specific Topics Input (Second) */}
               <div className="mb-6">
                 <label className="block text-sm font-medium text-gray-300 mb-2">
                   Any *very* specific focus within your topics? (Optional)
                 </label>
                 <textarea
                   value={specificTopics}
                   onChange={(e) => setSpecificTopics(e.target.value)}
                   placeholder={focusPlaceholder}
                   className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white"
                   rows={2}
                 />
               </div>

              {/* Seriousness Slider (Fourth) */}
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

              {/* Card Count (Fifth) */}
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
              {/* IMAGE BLOCK REMOVED FROM THIS STEP - image is generated in background, not shown here */}
              {/* UPDATED Input Summary */} 
              <div className="w-full max-w-md text-left bg-gray-700 bg-opacity-40 rounded-lg p-3 mb-4 text-sm">
                 <p className="text-gray-400">
                   <span className="font-semibold text-gray-300">Level:</span> {thaiLevel?.charAt(0).toUpperCase() + thaiLevel?.slice(1) || 'Not selected'}
                 </p>
                 <p className="text-gray-400">
                   <span className="font-semibold text-gray-300">Situations:</span> {situations || 'General'}
                 </p>
                 {specificTopics && (
                   <p className="text-gray-400">
                     <span className="font-semibold text-gray-300">Specific Focus:</span> {specificTopics}
                   </p>
                 )}
                  <p className="text-gray-400">
                     <span className="font-semibold text-gray-300">Tone:</span> {seriousnessLevel}% Ridiculous
                   </p>
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
                  onClick={handleReviewClick} 
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
              {/* IMAGE BLOCK - show at top with regenerate button */}
              <div className="mb-8 flex flex-col items-center">
                {imageLoading && <div className="w-[35rem] h-[17.5rem] bg-gray-800 flex items-center justify-center animate-pulse rounded mb-2">Generating image...</div>}
                {imageError && <div className="text-red-400 mb-2">{imageError}</div>}
                {imageUrl && !imageLoading && (
                  <div className="w-full max-w-2xl aspect-[16/9] rounded overflow-hidden mb-2 border border-gray-700 mx-auto block">
                    <img
                      src={imageUrl}
                      alt="Set Illustration"
                      className="w-full h-full object-contain"
                      style={{ objectFit: 'contain', objectPosition: 'center' }}
                    />
                  </div>
                )}
                <button onClick={handleRegenerateImage} disabled={imageLoading} className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-4 rounded text-sm mt-2">
                  {imageLoading ? 'Regenerating...' : 'Regenerate Image'}
                </button>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-blue-400">Review & Create Your Set</h2>
              
               {/* Error Summary */}
               {errorSummary && errorSummary.totalErrors > 0 && (
                 <div className="bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded p-3 mb-4 text-sm">
                   <p className="text-yellow-400 mb-1">
                       Note: {errorSummary.userMessage || 'Some minor issues occurred during generation.'}
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
                  <li><span className="text-gray-400">Level:</span> {thaiLevel?.charAt(0).toUpperCase() + thaiLevel?.slice(1) || 'Not selected'}</li>
                  <li><span className="text-gray-400">Situations:</span> {situations || 'General'}</li>
                   {specificTopics && (
                     <li><span className="text-gray-400">Specific Focus:</span> {specificTopics}</li>
                   )}
                   <li><span className="text-gray-400">Tone:</span> {seriousnessLevel}% Ridiculous</li>
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
                    index={currentPreviewIndex}
                    level={thaiLevel as string}
                    specificTopics={specificTopics}
                    userName={session?.user?.name || 'You'}
                    situations={situations}
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
                onClick={handleSaveSet} 
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
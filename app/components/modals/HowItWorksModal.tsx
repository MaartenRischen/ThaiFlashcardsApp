import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Grid, Layers, GalleryHorizontal, Bookmark, Settings, HelpCircle } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto" onClick={onClose}>
      <div className="neumorphic max-w-2xl w-full p-6 bg-[#1f1f1f]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#A9C4FC]">How Donkey Bridge Works</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-2 text-gray-300 text-sm max-h-[70vh] overflow-y-auto pr-2">
          {/* Set Wizard - Updated for 7 steps */}
          <AccordionItem value="item-0" className="border-[#333]">
            <AccordionTrigger className="text-lg font-semibold text-[#22c55e] hover:no-underline py-3 shadow-[0_0_20px_10px_rgba(34,197,94,0.15)]" style={{ textShadow: '0 0 8px #22c55e, 0 0 16px #22c55e' }}>
              Set Wizard (7 Steps)
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3 text-gray-300 text-sm">
              <p>The Set Wizard guides you through creating personalized Thai vocabulary sets with AI-generated content. Access it by tapping the <span className="inline-flex items-center justify-center bg-[#3C3C3C] p-1 rounded-xl text-green-400"><Plus className="w-4 h-4" /></span> button at the bottom of the screen.</p>
              <div className="space-y-3">
                {/* Step 0: Welcome */}
                <div className="p-3 border border-[#333] rounded-md">
                  <h4 className="text-[#A9C4FC] font-semibold mb-2">Step 0: Welcome</h4>
                  <p>Introduction with an animated preview of the creation process. No data collected - just sets expectations for the journey ahead.</p>
                </div>
                {/* Step 1: Proficiency Level */}
                <div className="p-3 border border-[#333] rounded-md">
                  <h4 className="text-[#A9C4FC] font-semibold mb-2">Step 1: Thai Proficiency Level</h4>
                  <p>Choose your Thai language level using an interactive slider with visual images:</p>
                  <ul className="pl-4 space-y-1 list-disc list-inside">
                    <li><b>Complete Beginner:</b> Single words and two-word combinations</li>
                    <li><b>Basic Understanding:</b> Short phrases (2-4 words) for daily needs</li>
                    <li><b>Intermediate:</b> Medium sentences (4-7 words) for common situations</li>
                    <li><b>Advanced:</b> Complex sentences (7-12 words) with nuanced vocabulary</li>
                    <li><b>Native/Fluent:</b> Natural, idiomatic Thai of any length</li>
                    <li><b>God Mode:</b> Sophisticated, elaborate Thai with literary language</li>
                  </ul>
                  <p className="mt-2 text-xs text-blue-300">✨ New: Visual slider with level images that preload for instant transitions!</p>
                </div>
                {/* Step 2: Topic Selection */}
                <div className="p-3 border border-[#333] rounded-md">
                  <h4 className="text-[#A9C4FC] font-semibold mb-2">Step 2: Topic Selection</h4>
                  <p>Choose what you want to learn about with three options:</p>
                  <ul className="pl-4 space-y-1 list-disc list-inside">
                    <li><b>Custom Goal:</b> Enter your specific learning objective (recommended)</li>
                    <li><b>Level-Appropriate Scenarios:</b> Choose from curated topics matching your proficiency</li>
                    <li><b>Weird Options:</b> Creative, unusual scenarios for memorable learning</li>
                  </ul>
                  <p className="mt-1 text-xs">The more specific your topic, the more focused and useful your flashcards will be.</p>
                </div>
                {/* Step 3: Context Refinement */}
                <div className="p-3 border border-[#333] rounded-md">
                  <h4 className="text-[#A9C4FC] font-semibold mb-2">Step 3: Context Refinement</h4>
                  <p>Answer structured questions to refine your topic:</p>
                  <ul className="pl-4 space-y-1 list-disc list-inside">
                    <li>What specific aspects would you like to focus on?</li>
                    <li>Are there particular challenges you want to address?</li>
                    <li>Any additional context or preferences?</li>
                  </ul>
                  <p className="mt-1 text-xs">This step helps the AI understand exactly what kind of vocabulary you need.</p>
                </div>
                {/* Step 4: Learning Style (Tone) */}
                <div className="p-3 border border-[#333] rounded-md">
                  <h4 className="text-[#A9C4FC] font-semibold mb-2">Step 4: Learning Style</h4>
                  <p>Adjust the tone slider (1-10) to control content style with visual previews:</p>
                  <ul className="pl-4 space-y-1 list-disc list-inside">
                    <li><b>1-2:</b> Textbook realism, serious & practical</li>
                    <li><b>3-4:</b> Somewhat funny, like your "funny" uncle</li>
                    <li><b>5-6:</b> Actually funny, but getting less practical</li>
                    <li><b>7-8:</b> Definitely too much, proceed with caution</li>
                    <li><b>9-10:</b> Glitched donkey mode - pure chaos!</li>
                  </ul>
                  <p className="mt-2 text-xs text-blue-300">✨ New: Interactive slider with images showing different tone levels!</p>
                </div>
                {/* Step 5: Review & Card Count */}
                <div className="p-3 border border-[#333] rounded-md">
                  <h4 className="text-[#A9C4FC] font-semibold mb-2">Step 5: Review & Card Count</h4>
                  <p>Review all your choices and adjust the number of cards:</p>
                  <ul className="pl-4 space-y-1 list-disc list-inside">
                    <li>See a summary of your level, topic, tone, and card count</li>
                    <li>Adjust card count from 5 to 30 cards using +/- buttons</li>
                    <li>Recommended: 10-20 cards for optimal learning</li>
                  </ul>
                  <p className="mt-1 text-xs">Perfect time to make final adjustments before generation begins.</p>
                </div>
                {/* Step 6: Generation */}
                <div className="p-3 border border-[#333] rounded-md">
                  <h4 className="text-[#A9C4FC] font-semibold mb-2">Step 6: AI Generation</h4>
                  <p>Watch as your personalized set is created:</p>
                  <ul className="pl-4 space-y-1 list-disc list-inside">
                    <li>Advanced AI generates unique phrases with gendered variations</li>
                    <li>Custom set image created using AI art generation</li>
                    <li>Real-time progress updates during 1-2 minute process</li>
                    <li>Automatic fallback to multiple AI models if needed</li>
                  </ul>
                  <p className="mt-2 text-xs text-blue-300">✨ New: Multi-model AI system with intelligent batch processing!</p>
                  <p className="mt-1 text-xs">Your new set automatically appears in <span className="inline-flex items-center justify-center bg-[#3C3C3C] p-1 rounded-xl text-blue-400"><Grid className="w-4 h-4" /></span> "My Sets" when complete.</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Enhanced Card & Study Features */}
          <AccordionItem value="item-1" className="border-[#333]">
            <AccordionTrigger className="text-lg font-semibold text-[#A9C4FC] hover:no-underline py-3">
              Enhanced Card & Study Features
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3 text-gray-300 text-sm">
              <p>Each flashcard includes advanced features for personalized learning:</p>
              <div className="space-y-3">
                {/* Gendered Speech */}
                <div>
                  <span className="text-[#A9C4FC] font-semibold">Gendered Speech Variations:</span>
                  <p className="mt-1">Every phrase includes both masculine and feminine variations with appropriate particles (ครับ/ค่ะ) and pronouns. Toggle between them to learn proper gendered speech patterns in Thai.</p>
                </div>
                {/* Mnemonics */}
                <div>
                  <span className="text-[#A9C4FC] font-semibold">AI-Generated Mnemonics:</span>
                  <p className="mt-1">Each card comes with a creative memory aid generated by AI. These "donkey bridges" (from German "Eselsbrücke") help you remember vocabulary through visual associations and wordplay. Edit them to make them more personal!</p>
                </div>
                {/* Enhanced Examples */}
                <div>
                  <span className="text-[#A9C4FC] font-semibold">Rich Example Sentences:</span>
                  <p className="mt-1">Multiple contextual examples for each phrase, complete with:</p>
                  <ul className="pl-4 space-y-1 list-disc list-inside">
                    <li>Thai script with gendered variations</li>
                    <li>Phonetic pronunciation guides</li>
                    <li>English translations</li>
                    <li>Audio playback for proper pronunciation</li>
                  </ul>
                </div>
                {/* Smart Controls */}
                <div>
                  <span className="text-[#A9C4FC] font-semibold">Smart Study Controls:</span>
                  <ul className="pl-4 space-y-1 list-disc list-inside">
                    <li><b>Gender Switch:</b> Toggle between masculine/feminine speech patterns</li>
                    <li><b>Politeness Mode:</b> Add or remove polite particles</li>
                    <li><b>Show Hint:</b> See mnemonic before revealing answer</li>
                    <li><b>Audio Playback:</b> Hear native-like Thai pronunciation</li>
                    <li><b>Progress Tracking:</b> Advanced SRS (Spaced Repetition System)</li>
                  </ul>
                </div>
              </div>
              
              {/* Progress System */}
              <div className="mt-6">
                <h4 className="text-[#A9C4FC] font-semibold mb-2">Advanced Progress System</h4>
                <p>Intelligent learning progress with multiple tracking methods:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span>Access via</span>
                    <span className="inline-flex items-center justify-center bg-[#3C3C3C] p-1 rounded-xl text-[#2563EB]"><Layers className="w-4 h-4" /></span>
                    <span className="text-[#A9C4FC] font-semibold">"Current"</span>
                    <span>button to see detailed card status</span>
                  </div>
                  <ul className="pl-4 space-y-1 list-disc list-inside">
                    <li><b>Color-coded Status:</b> Unseen (gray), Wrong (red), Correct (yellow), Easy (green)</li>
                    <li><b>Spaced Repetition:</b> Cards reappear based on your performance</li>
                    <li><b>Progress Visualization:</b> Bars show completion percentage</li>
                    <li><b>Automatic Prioritization:</b> Difficult cards appear more frequently</li>
                    <li><b>Persistent Storage:</b> Progress saved across sessions</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Navigation & App Structure */}
          <AccordionItem value="item-2" className="border-[#333]">
            <AccordionTrigger className="text-lg font-semibold text-[#A9C4FC] hover:no-underline py-3">
              Navigation & App Structure
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3 text-gray-300 text-sm">
              <p>Understanding the app's main interface and navigation:</p>
              <div className="space-y-3">
                <div className="p-3 border border-[#333] rounded-md">
                  <h4 className="text-[#A9C4FC] font-semibold mb-2">Bottom Navigation Bar</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center bg-[#3C3C3C] p-1 rounded-xl text-[#2563EB]"><Layers className="w-4 h-4" /></span>
                      <span><b>Current:</b> View progress and status of cards in active set</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center bg-[#3C3C3C] p-1 rounded-xl text-blue-400"><Grid className="w-4 h-4" /></span>
                      <span><b>My Sets:</b> Manage your flashcard collections</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center bg-[#3C3C3C] p-1 rounded-xl text-green-400"><Plus className="w-4 h-4" /></span>
                      <span><b>Create:</b> Launch the Set Wizard to make new sets</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center bg-[#3C3C3C] p-1 rounded-xl text-purple-400"><GalleryHorizontal className="w-4 h-4" /></span>
                      <span><b>Gallery:</b> Browse and import community sets</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center bg-[#3C3C3C] p-1 rounded-xl text-gray-400"><Settings className="w-4 h-4" /></span>
                      <span><b>Settings:</b> Configure app preferences</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center bg-[#3C3C3C] p-1 rounded-xl text-gray-400"><HelpCircle className="w-4 h-4" /></span>
                      <span><b>Help:</b> Access this guide (you're here now!)</span>
                    </div>
                  </div>
                </div>
                <div className="p-3 border border-[#333] rounded-md">
                  <h4 className="text-[#A9C4FC] font-semibold mb-2">Set Management</h4>
                  <p>From the "My Sets" view, you can:</p>
                  <ul className="pl-4 space-y-1 list-disc list-inside">
                    <li>Switch between different flashcard sets</li>
                    <li>View set metadata (level, topic, card count)</li>
                    <li>Export sets as JSON files</li>
                    <li>Import sets from files</li>
                    <li>Delete sets you no longer need</li>
                    <li>See AI-generated set cover images</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Community Features */}
          <AccordionItem value="item-3" className="border-[#333]">
            <AccordionTrigger className="text-lg font-semibold text-[#A9C4FC] hover:no-underline py-3">
              Community Features
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3 text-gray-300 text-sm">
              <p>Share your creations and learn from others:</p>
              <div className="space-y-3">
                <div className="p-3 border border-[#333] rounded-md">
                  <h4 className="text-[#A9C4FC] font-semibold mb-2">Publishing Sets</h4>
                  <p>Share your custom sets with the community:</p>
                  <ol className="pl-4 space-y-1 list-decimal list-inside">
                    <li>Go to "My Sets" and find the set you want to share</li>
                    <li>Long-press or use the menu to select "Publish to Gallery"</li>
                    <li>Add tags and description to help others find your set</li>
                    <li>Your set becomes available to all users</li>
                  </ol>
                  <p className="mt-2 text-xs">Published sets are read-only but can be unpublished anytime.</p>
                </div>
                <div className="p-3 border border-[#333] rounded-md">
                  <h4 className="text-[#A9C4FC] font-semibold mb-2">Gallery Browsing</h4>
                  <p>Discover sets created by other learners:</p>
                  <ul className="pl-4 space-y-1 list-disc list-inside">
                    <li>Browse featured sets or search by topic</li>
                    <li>Filter by proficiency level and popularity</li>
                    <li>Preview cards before importing</li>
                    <li>Rate and bookmark useful sets</li>
                  </ul>
                </div>
                <div className="p-3 border border-[#333] rounded-md">
                  <h4 className="text-[#A9C4FC] font-semibold mb-2">Importing & Rating</h4>
                  <p>Add community sets to your collection:</p>
                  <ul className="pl-4 space-y-1 list-disc list-inside">
                    <li>Tap "Add to My Sets" to import any gallery set</li>
                    <li>Rate sets with 1-5 stars to help others</li>
                    <li>Bookmark favorites with the <span className="inline-flex items-center justify-center bg-[#3C3C3C] p-1 rounded-xl text-yellow-400"><Bookmark className="w-4 h-4" /></span> icon</li>
                    <li>Leave comments for feedback</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Technical Details */}
          <AccordionItem value="item-4" className="border-[#333]">
            <AccordionTrigger className="text-lg font-semibold text-[#A9C4FC] hover:no-underline py-3">
              Technical Details & Advanced Features
            </AccordionTrigger>
            <AccordionContent className="pb-4 text-gray-300 text-sm">
              <p>For those interested in the technical implementation:</p>
              <div className="space-y-3">
                <div>
                  <span className="text-[#A9C4FC] font-semibold">AI Generation System:</span>
                  <ul className="pl-4 space-y-1 list-disc list-inside">
                    <li>Multi-model approach with Gemini 2.5 Flash (primary)</li>
                    <li>Automatic fallback to GPT-4, Claude, and other models</li>
                    <li>Intelligent batch processing for efficiency</li>
                    <li>Comprehensive validation and error handling</li>
                  </ul>
                </div>
                <div>
                  <span className="text-[#A9C4FC] font-semibold">Image Generation:</span>
                  <ul className="pl-4 space-y-1 list-disc list-inside">
                    <li>Ideogram v3 API for custom set covers</li>
                    <li>Structured prompts ensuring no text in images</li>
                    <li>Automatic upload to cloud storage</li>
                  </ul>
                </div>
                <div>
                  <span className="text-[#A9C4FC] font-semibold">Development Resources:</span>
                  <p className="mt-2">
                    <a 
                      href="/generation_logic_visualization.html" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      📊 Complete Architecture Documentation
                    </a>
                  </p>
                  <p className="mt-2">
                    <a 
                      href="/test-variations" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      🧪 Test Generation Parameters
                    </a>
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
} 
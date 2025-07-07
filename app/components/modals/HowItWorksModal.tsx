import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Grid, Layers, GalleryHorizontal, Bookmark } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto" onClick={onClose}>
      <div className="neumorphic max-w-lg w-full p-6 bg-[#1f1f1f]" onClick={e => e.stopPropagation()}>
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
          {/* Set Wizard (with glow) - now at the top */}
          <AccordionItem value="item-0" className="border-[#333]">
            <AccordionTrigger className="text-lg font-semibold text-[#22c55e] hover:no-underline py-3 shadow-[0_0_20px_10px_rgba(34,197,94,0.15)]" style={{ textShadow: '0 0 8px #22c55e, 0 0 16px #22c55e' }}>
              Set Wizard
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3 text-gray-300 text-sm">
              <p>The Set Wizard helps you create personalized Thai vocabulary sets. Access it by tapping the <span className="inline-flex items-center justify-center bg-[#3C3C3C] p-1 rounded-xl text-green-400"><Plus className="w-4 h-4" /></span> button at the bottom of the screen.</p>
              <div className="space-y-3">
                {/* Step 1: Welcome */}
                <div className="p-3 border border-[#333] rounded-md">
                  <h4 className="text-[#A9C4FC] font-semibold mb-2">Step 1: Welcome</h4>
                  <p>Get a quick intro and preview of what the Set Wizard will help you do.</p>
                </div>
                {/* Step 2: Set Your Proficiency */}
                <div className="p-3 border border-[#333] rounded-md">
                  <h4 className="text-[#A9C4FC] font-semibold mb-2">Step 2: Set Your Proficiency</h4>
                  <p>Choose your Thai language level from:</p>
                  <ul className="pl-4 space-y-1 list-disc list-inside">
                    <li>Complete Beginner (single words, basic nouns)</li>
                    <li>Basic Understanding (short phrases, everyday needs)</li>
                    <li>Intermediate (medium-length sentences, common situations)</li>
                    <li>Advanced (complex sentences, nuanced vocabulary)</li>
                    <li>Native/Fluent (natural, idiomatic Thai)</li>
                    <li>God Mode (sophisticated, advanced Thai)</li>
                  </ul>
                </div>
                {/* Step 3: Choose Topics & Goals */}
                <div className="p-3 border border-[#333] rounded-md">
                  <h4 className="text-[#A9C4FC] font-semibold mb-2">Step 3: Choose Topics & Goals</h4>
                  <p>Select from preset scenarios or enter custom topics:</p>
                  <ul className="pl-4 space-y-1 list-disc list-inside">
                    <li>Choose from common scenarios (travel, shopping, dining)</li>
                    <li>Enter specific topics (e.g., {'"hiking equipment,"'} {'"vegetarian food"'})</li>
                    <li>Describe specific goals (e.g., {'"ordering coffee at a café"'})</li>
                  </ul>
                  <p className="mt-1 text-xs">The more specific your topics, the more focused your vocabulary set will be.</p>
                </div>
                {/* Step 4: Select Content Style (Tone) */}
                <div className="p-3 border border-[#333] rounded-md">
                  <h4 className="text-[#A9C4FC] font-semibold mb-2">Step 4: Select Content Style</h4>
                  <p>Adjust the tone slider to control the style of generated content.</p>
                  <p className="mt-2 text-xs">Lower settings create practical, textbook-like content. Higher settings make the generated phrases more creative, funny, and sometimes surreal—but also less useful for real-world situations. The label above the slider changes as you move it!</p>
                </div>
                {/* Step 5: Review & Card Count */}
                <div className="p-3 border border-[#333] rounded-md">
                                      <h4 className="text-[#A9C4FC] font-semibold mb-2">Step 5: Review & Card Count</h4>
                    <p>Review your choices and select how many cards you want in your set (5, 10, 15, or 20). When you&apos;re ready, continue to generate your set.</p>
                </div>
                {/* Step 6: Generate & Wait */}
                <div className="p-3 border border-[#333] rounded-md">
                  <h4 className="text-[#A9C4FC] font-semibold mb-2">Step 6: Generate & Wait</h4>
                  <p>After clicking the {'"Generate Set"'} button:</p>
                  <ul className="pl-4 space-y-1 list-disc list-inside">
                    <li>The system will create 5-20 unique flashcards (depending on your selection)</li>
                    <li>Generation typically takes 1-2 minutes</li>
                    <li>A custom image for your set cover will be created</li>
                    <li>You&apos;ll receive a notification when your set is ready</li>
                  </ul>
                                      <p className="mt-1 text-xs">Find your new set in the <span className="inline-flex items-center justify-center bg-[#3C3C3C] p-1 rounded-xl text-blue-400"><Grid className="w-4 h-4" /></span> {'"My Sets"'} view after generation is complete.</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          {/* Card & Study Features (with Progress Tracking) */}
          <AccordionItem value="item-1" className="border-[#333]">
            <AccordionTrigger className="text-lg font-semibold text-[#A9C4FC] hover:no-underline py-3">
              Card & Study Features
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3 text-gray-300 text-sm">
              <p>Each flashcard includes multiple tools to enhance your learning and make it more personal and effective:</p>
              <div className="space-y-3">
                {/* Mnemonics explanation */}
                <div>
                  <span className="text-[#A9C4FC] font-semibold">Mnemonics (Donkey Bridges):</span>
                  <p className="mt-1">A mnemonic is a memory aid—a creative phrase, story, or image that helps you remember a word or concept. In Donkey Bridge, you can view, edit, or create your own mnemonic for each card. The app&apos;s name comes from the German term {'"Eselsbrücke"'} (donkey bridge), which means a memory trick or shortcut. Use mnemonics to make vocabulary stick!</p>
                </div>
                {/* Gender switch */}
                <div>
                  <span className="text-[#A9C4FC] font-semibold">Gender Switch:</span>
                  <p className="mt-1">Toggle between male ({'"krap"'}) and female ({'"ka"'}) speech patterns. This changes the polite particles and sometimes the pronouns in Thai phrases and audio, so you can learn to speak appropriately for your gender or preference.</p>
                </div>
                {/* Politeness switch */}
                <div>
                  <span className="text-[#A9C4FC] font-semibold">Politeness Switch:</span>
                  <p className="mt-1">Turn polite mode on or off. When enabled, polite particles (ครับ/ค่ะ) are added to the end of phrases, as is common in Thai conversation. Turn it off for more casual speech.</p>
                </div>
                {/* In Context */}
                <div>
                  <span className="text-[#A9C4FC] font-semibold">In Context:</span>
                  <p className="mt-1">See each word or phrase used in a real sentence. The {'"In Context"'} section shows example sentences, their pronunciation, and translation. You can cycle through different examples and play audio to hear them spoken aloud.</p>
                </div>
                {/* Other features */}
                <div>
                  <span className="text-[#A9C4FC] font-semibold">Other Features:</span>
                  <ul className="pl-4 space-y-1 list-disc list-inside">
                    <li><b>Show Answer:</b> Reveals the Thai translation, pronunciation, and examples.</li>
                    <li><b>Show Hint:</b> Displays a mnemonic aid before revealing the answer.</li>
                    <li><b>Text-to-speech:</b> Hear proper Thai pronunciation for words and example sentences.</li>
                    <li><b>Edit mnemonics:</b> Personalize your memory aids for each card.</li>
                    <li><b>Progress Tracking:</b> Track your learning status for each card (Unseen, Wrong, Correct, Easy).</li>
                    <li><b>Reset Progress:</b> Reset your progress for individual cards or entire sets if you want to start over.</li>
                  </ul>
                </div>
              </div>
              {/* Progress Tracking content moved here */}
              <div className="mt-6">
                <h4 className="text-[#A9C4FC] font-semibold mb-2">Progress Tracking</h4>
                <p>Monitor your learning journey:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span>The</span>
                                            <span className="text-[#A9C4FC] font-semibold">&apos;Current&apos;</span>
                    <span className="inline-flex items-center justify-center bg-[#3C3C3C] p-1 rounded-xl text-[#2563EB]"><Layers className="w-4 h-4" /></span>
                    <span>view shows the status of each card</span>
                  </div>
                  <ul className="pl-4 space-y-1 list-disc list-inside">
                    <li>Cards are color-coded by status: Unseen, Wrong, Correct, or Easy</li>
                    <li>Progress bars indicate how much of a set you&apos;ve learned</li>
                    <li>The system automatically prioritizes cards needing review</li>
                    <li>Your learning data is saved automatically between sessions</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          {/* Publishing & Importing Sets */}
          <AccordionItem value="item-2" className="border-[#333]">
            <AccordionTrigger className="text-lg font-semibold text-[#A9C4FC] hover:no-underline py-3">
              Publishing & Importing Sets
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3 text-gray-300 text-sm">
              <p>Share your custom sets with others or import sets created by the community:</p>
              <div className="space-y-3">
                <div className="p-3 border border-[#333] rounded-md">
                  <h4 className="text-[#A9C4FC] font-semibold mb-2">Finding Your Sets</h4>
                                      <p>Access your sets by tapping the <span className="inline-flex items-center justify-center bg-[#3C3C3C] p-1 rounded-xl text-blue-400"><Grid className="w-4 h-4" /></span> {'"My Sets"'} button in the bottom navigation bar.</p>
                  <p className="mt-2">Your custom sets and any imported sets will appear in this view, organized by creation date.</p>
                </div>
                <div className="p-3 border border-[#333] rounded-md">
                  <h4 className="text-[#A9C4FC] font-semibold mb-2">Publishing to Gallery</h4>
                  <p>To share a set with the community:</p>
                  <ol className="pl-4 space-y-1 list-decimal list-inside">
                    <li>Open the <span className="inline-flex items-center justify-center bg-[#3C3C3C] p-1 rounded-xl text-blue-400"><Grid className="w-4 h-4" /></span> {'"My Sets"'} view</li>
                    <li>Long-press on the set you want to share</li>
                    <li>Select {'"Publish to Gallery"'} from the menu</li>
                    <li>Add optional tags and a description</li>
                    <li>Tap {'"Publish"'} to make your set available to others</li>
                  </ol>
                  <p className="mt-1 text-xs">Published sets can&apos;t be edited, but you can unpublish them at any time.</p>
                </div>
                <div className="p-3 border border-[#333] rounded-md">
                  <h4 className="text-[#A9C4FC] font-semibold mb-2">Browsing the Gallery</h4>
                  <p>To explore sets created by other users:</p>
                  <ol className="pl-4 space-y-1 list-decimal list-inside">
                    <li>Tap the <span className="inline-flex items-center justify-center bg-[#3C3C3C] p-1 rounded-xl text-purple-400"><GalleryHorizontal className="w-4 h-4" /></span> {'"Gallery"'} button in the bottom navigation</li>
                    <li>Browse featured sets or use the search bar to find specific content</li>
                    <li>Filter sets by proficiency level, topic, or popularity</li>
                    <li>Tap on any set to view details and preview cards</li>
                  </ol>
                </div>
                <div className="p-3 border border-[#333] rounded-md">
                  <h4 className="text-[#A9C4FC] font-semibold mb-2">Importing Sets</h4>
                  <p>To add a set from the gallery to your collection:</p>
                  <ol className="pl-4 space-y-1 list-decimal list-inside">
                    <li>Find a set you want to study in the Gallery</li>
                    <li>Tap the <span className="text-blue-400 font-bold">+ Add to My Sets</span> button</li>
                    <li>The set will be copied to your collection</li>
                    <li>Access it anytime from your <span className="inline-flex items-center justify-center bg-[#3C3C3C] p-1 rounded-xl text-blue-400"><Grid className="w-4 h-4" /></span> {'"My Sets"'} view</li>
                  </ol>
                  <p className="mt-2">You can also export and import sets as JSON files using the <span className="bg-[#252525] text-xs px-2 py-1 rounded">⋮</span> menu in the {'"My Sets"'} view.</p>
                </div>
                <div className="p-3 border border-[#333] rounded-md">
                  <h4 className="text-[#A9C4FC] font-semibold mb-2">Rating & Favorites</h4>
                  <p>Help the community by rating sets you&apos;ve imported:</p>
                  <ul className="pl-4 space-y-1 list-disc list-inside">
                    <li>Rate sets with 1-5 stars based on quality and usefulness</li>
                    <li>Bookmark favorite sets by tapping the <span className="inline-flex items-center justify-center bg-[#3C3C3C] p-1 rounded-xl text-yellow-400"><Bookmark className="w-4 h-4" /></span> icon</li>
                    <li>Leave comments to help others decide if a set is right for them</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          {/* App & Language Logic For Nerds */}
          <AccordionItem value="item-3" className="border-[#333]">
            <AccordionTrigger className="text-lg font-semibold text-[#A9C4FC] hover:no-underline py-3">
              App & Language Logic For Nerds
            </AccordionTrigger>
            <AccordionContent className="pb-4 text-gray-300 text-sm">
              <p>
                For those interested in the technical details, the generation and validation logic is visualized here:
              </p>
              <p className="mt-2">
                <a 
                  href="/generation_logic_visualization.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  View Detailed Generation Logic Visualization (Opens in new tab)
                </a>
              </p>
              
              <p className="mt-4">
                You can also experiment with different generation parameters (like proficiency and tone) and see example outputs on the test variations page:
              </p>
              <p className="mt-2">
                <a 
                  href="/test-variations" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Go to Test Variations Page (Opens in new tab)
                </a>
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
} 
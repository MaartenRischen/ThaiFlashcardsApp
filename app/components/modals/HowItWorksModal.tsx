import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Plus, Grid, Layers, GalleryHorizontal, Settings, HelpCircle, 
  Star, Share2, Download, FolderPlus, Heart, Sparkles, Brain,
  Volume2, Users, BookOpen, Target, Zap, CheckCircle, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#1F1F1F] border-[#404040] [&>button]:hidden">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#BB86FC] to-[#9B6DD0] bg-clip-text text-transparent">
              How Donkey Bridge Works
            </DialogTitle>
            <button
              onClick={onClose}
              className="rounded-full p-1 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#BB86FC] disabled:pointer-events-none transition-all duration-200 hover:bg-[#2C2C2C] text-[#E0E0E0]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        {/* Quick Tour CTA */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-[#BB86FC]/20 to-[#9B6DD0]/20 border border-[#BB86FC]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#BB86FC]" />
            <span className="text-[#E0E0E0]">Prefer a quick, interactive walkthrough?</span>
          </div>
          <Button
            onClick={() => {
              try { localStorage.removeItem('tour_seen_v1'); } catch {}
              window.location.reload();
            }}
            className="bg-gradient-to-r from-[#BB86FC] to-[#9B6DD0] hover:from-[#A66EFC] hover:to-[#8B5DC0] text-white"
            size="sm"
          >
            Start Tour
          </Button>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-3">
          {/* Getting Started */}
          <AccordionItem value="getting-started" className="border border-[#404040] rounded-xl px-4">
            <AccordionTrigger className="text-lg font-semibold text-[#E0E0E0] hover:text-[#BB86FC] transition-colors">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-[#BB86FC]" />
                Getting Started
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 text-[#BDBDBD] pb-4">
              <p>Welcome to Donkey Bridge - your AI-powered Thai language learning companion!</p>
              
              <div className="space-y-3">
                <div className="p-3 bg-[#2C2C2C] rounded-xl border border-[#404040]">
                  <h4 className="font-semibold text-[#E0E0E0] mb-2">What is a "Donkey Bridge"?</h4>
                  <p className="text-sm">From the German "Eselsbrücke" - a memory trick that helps stubborn knowledge cross into your mind. Each flashcard includes creative mnemonics to make Thai vocabulary stick!</p>
                </div>

                <div className="p-3 bg-[#2C2C2C] rounded-xl border border-[#404040]">
                  <h4 className="font-semibold text-[#E0E0E0] mb-2">Key Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>AI-generated flashcard sets tailored to your level and interests</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Gendered speech variations (ครับ/ค่ะ) for authentic communication</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Spaced repetition system for optimal memory retention</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Community gallery to share and discover sets</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Audio lessons for passive learning on-the-go</span>
                    </li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Creating Custom Sets */}
          <AccordionItem value="creating-sets" className="border border-[#404040] rounded-xl px-4">
            <AccordionTrigger className="text-lg font-semibold text-[#E0E0E0] hover:text-[#BB86FC] transition-colors">
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-green-400" />
                Creating Custom Sets
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 text-[#BDBDBD] pb-4">
              <p>Create personalized Thai vocabulary sets with our AI-powered wizard or manual input.</p>
              
              <div className="space-y-3">
                <div className="p-3 bg-[#2C2C2C] rounded-xl border border-[#404040]">
                  <h4 className="font-semibold text-[#E0E0E0] mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#BB86FC]" />
                    Automatic Set Wizard
                  </h4>
                  <p className="text-sm mb-3">Tap the <span className="inline-flex items-center justify-center bg-green-500 text-white p-1 rounded-full mx-1"><Plus className="w-3 h-3" /></span> button to start the wizard:</p>
                  
                  <ol className="space-y-2 text-sm">
                    <li><strong className="text-[#E0E0E0]">1. Choose Your Topic:</strong> Enter any learning goal or select from suggestions</li>
                    <li><strong className="text-[#E0E0E0]">2. Set Proficiency Level:</strong> From Complete Beginner to Native Speaker</li>
                    <li><strong className="text-[#E0E0E0]">3. Adjust Tone:</strong> Control how serious or playful the content should be</li>
                    <li><strong className="text-[#E0E0E0]">4. Generate:</strong> AI creates 10-30 customized flashcards in ~30 seconds</li>
                  </ol>
                  
                  <p className="text-xs text-[#BB86FC] mt-3">💡 Tip: Be specific! "Ordering coffee in Bangkok" works better than just "coffee"</p>
                </div>

                <div className="p-3 bg-[#2C2C2C] rounded-xl border border-[#404040]">
                  <h4 className="font-semibold text-[#E0E0E0] mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    Manual Sets
                  </h4>
                  <p className="text-sm mb-3">For specific phrases you want to learn:</p>
                  <ol className="space-y-1 text-sm">
                    <li>1. Choose "Manual" from the wizard</li>
                    <li>2. Enter your Thai phrases (or let AI translate English)</li>
                    <li>3. Review and confirm</li>
                    <li>4. Get AI-generated mnemonics for each phrase</li>
                  </ol>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Studying & Progress */}
          <AccordionItem value="studying" className="border border-[#404040] rounded-xl px-4">
            <AccordionTrigger className="text-lg font-semibold text-[#E0E0E0] hover:text-[#BB86FC] transition-colors">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-blue-400" />
                Studying & Progress
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 text-[#BDBDBD] pb-4">
              <p>Master Thai vocabulary with our intelligent learning system.</p>
              
              <div className="space-y-3">
                <div className="p-3 bg-[#2C2C2C] rounded-xl border border-[#404040]">
                  <h4 className="font-semibold text-[#E0E0E0] mb-2">Card Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-[#BB86FC]">•</span>
                      <span><strong className="text-[#E0E0E0]">Gender Toggle:</strong> Switch between masculine/feminine speech patterns</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#BB86FC]">•</span>
                      <span><strong className="text-[#E0E0E0]">Politeness Mode:</strong> Add/remove polite particles (ครับ/ค่ะ)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#BB86FC]">•</span>
                      <span><strong className="text-[#E0E0E0]">Audio Playback:</strong> Hear native pronunciation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#BB86FC]">•</span>
                      <span><strong className="text-[#E0E0E0]">Mnemonics:</strong> View/edit memory aids</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#BB86FC]">•</span>
                      <span><strong className="text-[#E0E0E0]">Examples:</strong> See phrases used in context</span>
                    </li>
                  </ul>
                </div>

                <div className="p-3 bg-[#2C2C2C] rounded-xl border border-[#404040]">
                  <h4 className="font-semibold text-[#E0E0E0] mb-2">Spaced Repetition System</h4>
                  <p className="text-sm mb-2">Cards are scheduled based on your performance:</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-[#3C3C3C] rounded"></div>
                      <span><strong>Unseen:</strong> New cards you haven't studied</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-600 rounded"></div>
                      <span><strong>Wrong:</strong> Cards to review soon</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span><strong>Due:</strong> Time to review again</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span><strong>Learned:</strong> Well-memorized cards</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#BB86FC] mt-2">View detailed progress with the "Current" button</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Managing Sets */}
          <AccordionItem value="managing" className="border border-[#404040] rounded-xl px-4">
            <AccordionTrigger className="text-lg font-semibold text-[#E0E0E0] hover:text-[#BB86FC] transition-colors">
              <div className="flex items-center gap-3">
                <Grid className="w-5 h-5 text-blue-400" />
                Managing Your Sets
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 text-[#BDBDBD] pb-4">
              <p>Organize and manage your flashcard collection efficiently.</p>
              
              <div className="space-y-3">
                <div className="p-3 bg-[#2C2C2C] rounded-xl border border-[#404040]">
                  <h4 className="font-semibold text-[#E0E0E0] mb-2">Folder Organization</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <FolderPlus className="w-4 h-4 text-[#BB86FC] mt-0.5" />
                      <span><strong className="text-[#E0E0E0]">Default Sets:</strong> Pre-made sets for beginners</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FolderPlus className="w-4 h-4 text-[#BB86FC] mt-0.5" />
                      <span><strong className="text-[#E0E0E0]">My Automatic Sets:</strong> AI-generated sets</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FolderPlus className="w-4 h-4 text-[#BB86FC] mt-0.5" />
                      <span><strong className="text-[#E0E0E0]">My Manual Sets:</strong> Custom phrase sets</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FolderPlus className="w-4 h-4 text-[#BB86FC] mt-0.5" />
                      <span><strong className="text-[#E0E0E0]">Imported Sets:</strong> From friends or gallery</span>
                    </li>
                  </ul>
                  <p className="text-xs mt-2">Create custom folders to organize by topic or goal!</p>
                </div>

                <div className="p-3 bg-[#2C2C2C] rounded-xl border border-[#404040]">
                  <h4 className="font-semibold text-[#E0E0E0] mb-2">Set Actions</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span>Rate sets (1-5 stars)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-[#BB86FC]" />
                      <span>Share with friends</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-400" />
                      <span>Publish to gallery</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-amber-400" />
                      <span>Generate audio lessons</span>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Community & Sharing */}
          <AccordionItem value="community" className="border border-[#404040] rounded-xl px-4">
            <AccordionTrigger className="text-lg font-semibold text-[#E0E0E0] hover:text-[#BB86FC] transition-colors">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-400" />
                Community & Sharing
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 text-[#BDBDBD] pb-4">
              <p>Learn together with the Donkey Bridge community!</p>
              
              <div className="space-y-3">
                <div className="p-3 bg-[#2C2C2C] rounded-xl border border-[#404040]">
                  <h4 className="font-semibold text-[#E0E0E0] mb-2 flex items-center gap-2">
                    <GalleryHorizontal className="w-4 h-4 text-purple-400" />
                    Public Gallery
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Browse sets created by other learners</li>
                    <li>• Filter by level, rating, or search keywords</li>
                    <li>• Preview cards before importing</li>
                    <li>• Import sets to your "Imported Sets" folder</li>
                    <li>• Rate and review to help others</li>
                  </ul>
                </div>

                <div className="p-3 bg-[#2C2C2C] rounded-xl border border-[#404040]">
                  <h4 className="font-semibold text-[#E0E0E0] mb-2 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-[#BB86FC]" />
                    Sharing Your Sets
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><strong className="text-[#E0E0E0]">Send to a Friend:</strong></p>
                    <ul className="space-y-1 ml-4">
                      <li>• Click the heart button on any set</li>
                      <li>• Share via email or copy link</li>
                      <li>• Friends can preview and import instantly</li>
                    </ul>
                    
                    <p className="mt-2"><strong className="text-[#E0E0E0]">Publish to Gallery:</strong></p>
                    <ul className="space-y-1 ml-4">
                      <li>• Make your set available to all users</li>
                      <li>• Earn ratings and help others learn</li>
                      <li>• Unpublish anytime from set options</li>
                    </ul>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Advanced Features */}
          <AccordionItem value="advanced" className="border border-[#404040] rounded-xl px-4">
            <AccordionTrigger className="text-lg font-semibold text-[#E0E0E0] hover:text-[#BB86FC] transition-colors">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-[#BDBDBD]" />
                Advanced Features
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 text-[#BDBDBD] pb-4">
              <p>Power user features to enhance your learning experience.</p>
              
              <div className="space-y-3">
                <div className="p-3 bg-[#2C2C2C] rounded-xl border border-[#404040]">
                  <h4 className="font-semibold text-[#E0E0E0] mb-2 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    Audio Lessons
                  </h4>
                  <p className="text-sm mb-2">Generate downloadable audio for passive learning:</p>
                  <ul className="space-y-1 text-sm">
                    <li>• <strong className="text-[#E0E0E0]">Guided Lesson:</strong> Interactive Pimsleur-style format</li>
                    <li>• <strong className="text-[#E0E0E0]">Repetition Mode:</strong> Simple Thai-English-Thai pattern</li>
                    <li>• <strong className="text-[#E0E0E0]">Shuffle Mode:</strong> Randomized order for variety</li>
                    <li>• Choose male/female voice and repetition count</li>
                  </ul>
                </div>

                <div className="p-3 bg-[#2C2C2C] rounded-xl border border-[#404040]">
                  <h4 className="font-semibold text-[#E0E0E0] mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-400" />
                    Focused Practice
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>• <strong className="text-[#E0E0E0]">Cards View:</strong> Review all cards in a list</li>
                    <li>• <strong className="text-[#E0E0E0]">The Everything Exam:</strong> Test yourself on all learned cards</li>
                    <li>• <strong className="text-[#E0E0E0]">Progress Tracking:</strong> See completion percentage</li>
                    <li>• <strong className="text-[#E0E0E0]">Export/Import:</strong> Backup sets as JSON files</li>
                  </ul>
                </div>

                <div className="p-3 bg-[#2C2C2C] rounded-xl border border-[#404040]">
                  <h4 className="font-semibold text-[#E0E0E0] mb-2">Pro Tips</h4>
                  <ul className="space-y-1 text-sm">
                    <li>💡 Study the same set on multiple devices - progress syncs!</li>
                    <li>💡 Edit mnemonics to make them more personal and memorable</li>
                    <li>💡 Use audio lessons during commutes for extra practice</li>
                    <li>💡 Rate your own sets to track which ones work best</li>
                    <li>💡 Install as a PWA for offline access on mobile</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Keyboard Shortcuts */}
          <AccordionItem value="shortcuts" className="border border-[#404040] rounded-xl px-4">
            <AccordionTrigger className="text-lg font-semibold text-[#E0E0E0] hover:text-[#BB86FC] transition-colors">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-yellow-400" />
                Keyboard Shortcuts
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 text-[#BDBDBD] pb-4">
              <p>Speed up your learning with these handy shortcuts:</p>
              
              <div className="p-3 bg-[#2C2C2C] rounded-xl border border-[#404040]">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-semibold text-[#E0E0E0] mb-2">Study Mode</p>
                    <ul className="space-y-1">
                      <li><kbd className="px-2 py-1 bg-[#3C3C3C] rounded text-xs">Space</kbd> Show answer</li>
                      <li><kbd className="px-2 py-1 bg-[#3C3C3C] rounded text-xs">←</kbd> Previous card</li>
                      <li><kbd className="px-2 py-1 bg-[#3C3C3C] rounded text-xs">→</kbd> Next card</li>
                      <li><kbd className="px-2 py-1 bg-[#3C3C3C] rounded text-xs">H</kbd> Show hint</li>
                      <li><kbd className="px-2 py-1 bg-[#3C3C3C] rounded text-xs">A</kbd> Play audio</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-semibold text-[#E0E0E0] mb-2">Rating Cards</p>
                    <ul className="space-y-1">
                      <li><kbd className="px-2 py-1 bg-[#3C3C3C] rounded text-xs">1</kbd> Wrong</li>
                      <li><kbd className="px-2 py-1 bg-[#3C3C3C] rounded text-xs">2</kbd> Hard</li>
                      <li><kbd className="px-2 py-1 bg-[#3C3C3C] rounded text-xs">3</kbd> Good</li>
                      <li><kbd className="px-2 py-1 bg-[#3C3C3C] rounded text-xs">4</kbd> Easy</li>
                      <li><kbd className="px-2 py-1 bg-[#3C3C3C] rounded text-xs">G</kbd> Toggle gender</li>
                    </ul>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#404040] text-center text-sm text-[#BDBDBD]">
          <p>Made with ❤️ for Thai language learners</p>
          <p className="text-xs mt-1">Questions? Found a bug? Contact support through Settings</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
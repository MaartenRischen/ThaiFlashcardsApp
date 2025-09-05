'use client';

import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { ChevronLeft, Sparkles, AlertCircle, AlertTriangle } from 'lucide-react';

interface ConfirmationStepProps {
  phrases: string[];
  corrections?: Array<{original: string, corrected: string}>;
  onConfirm: () => void;
  onBack: () => void;
}

export function ConfirmationStep({ phrases, corrections, onConfirm, onBack }: ConfirmationStepProps) {
  console.log('ConfirmationStep rendered with phrases:', phrases);
  console.log('Corrections:', corrections);
  
  // Create a map for quick lookup of corrections
  const correctionMap = new Map(
    corrections?.map(c => [c.corrected, c.original]) || []
  );
  
  return (
    <div className="relative h-full flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-6"
      >
        <motion.div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-[#E0E0E0]">
            Confirm Your Phrases
          </h3>
          <p className="text-sm text-gray-400">
            Review your phrases before we generate the flashcards
          </p>
        </motion.div>

        <div className="bg-[#1E1E1E] rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-blue-400 mb-3">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {phrases.length} phrase{phrases.length !== 1 ? 's' : ''} will be translated
              {corrections && corrections.length > 0 && (
                <span className="text-yellow-500 ml-2">
                  ({corrections.length} corrected)
                </span>
              )}
            </span>
          </div>
          
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {phrases.map((phrase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-2 rounded bg-[#2A2A2A]"
              >
                <span className="text-xs text-gray-500 font-mono w-6">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <div className="flex-1">
                  <span className="text-sm text-gray-200">
                    {phrase}
                  </span>
                  {correctionMap.has(phrase) && (
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="text-yellow-500">✓ Corrected from:</span> {correctionMap.get(phrase)}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-[#2A2A2A] rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-300">What happens next?</h4>
          <ul className="space-y-1 text-xs text-gray-400">
            <li>• We'll translate each phrase to Thai</li>
            <li>• Add pronunciation guides and mnemonics</li>
            <li>• Create example sentences for context</li>
            <li>• Generate a smart title based on your content</li>
          </ul>
        </div>

        {/* Pre-generation warning */}
        <div className="neumorphic rounded-xl p-4 border border-blue-500/30 bg-blue-50/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-blue-400 mb-1">Before we generate your set</p>
              <p className="text-gray-300 leading-relaxed">
                The next step will generate your flashcards, which takes 2-5 minutes. 
                Please keep this app open and visible during the entire process.
              </p>
              <p className="text-gray-300 leading-relaxed mt-2">
                You can close this window and keep learning in the meantime!
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="p-6 border-t border-gray-800 bg-[#1A1A1A]">
        <div className="flex justify-between items-center">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-gray-400 hover:text-gray-200"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <Button
            onClick={onConfirm}
            className="neumorphic-button bg-[#BB86FC] hover:bg-[#A66EFC] text-[#1A1A1A] font-bold rounded-xl"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Flashcards
          </Button>
        </div>
      </div>
    </div>
  );
} 
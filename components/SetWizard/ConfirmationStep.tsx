'use client';

import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { ChevronLeft, Sparkles, AlertCircle } from 'lucide-react';

interface ConfirmationStepProps {
  phrases: string[];
  onConfirm: () => void;
  onBack: () => void;
}

export function ConfirmationStep({ phrases, onConfirm, onBack }: ConfirmationStepProps) {
  console.log('ConfirmationStep rendered with phrases:', phrases);
  
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
                <span className="text-sm text-gray-200 flex-1">
                  {phrase}
                </span>
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
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Flashcards
          </Button>
        </div>
      </div>
    </div>
  );
} 
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, PenTool, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface ModeSelectionStepProps {
  onSelectMode: (mode: 'auto' | 'manual') => void;
  onBack: () => void;
}

export function ModeSelectionStep({ onSelectMode, onBack }: ModeSelectionStepProps) {
  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-2"
      >
        <h3 className="text-lg font-semibold text-[#E0E0E0]">
          How would you like to create your flashcards?
        </h3>
        <p className="text-sm text-gray-400">
          Choose the method that works best for you
        </p>
      </motion.div>

      <div className="space-y-4">
        {/* Auto Mode Option */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          onClick={() => onSelectMode('auto')}
          className="w-full p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 
            border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300
            hover:shadow-lg hover:shadow-blue-500/20 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 
            opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative z-10 flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500/20 
              flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            
            <div className="flex-1 text-left space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-[#E0E0E0]">
                  Auto Mode
                </h4>
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                  Recommended
                </span>
              </div>
              <p className="text-sm text-gray-400">
                Let AI generate personalized flashcards based on your topic, level, and preferences. 
                Perfect for comprehensive learning.
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-20 h-20 relative flex-shrink-0">
                <Image 
                  src="/images/automode.png" 
                  alt="Robot donkey writing notes" 
                  width={80}
                  height={80}
                  className="object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                />
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 
                transition-colors duration-300 flex-shrink-0" />
            </div>
          </div>
        </motion.button>

        {/* Manual Mode Option */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          onClick={() => onSelectMode('manual')}
          className="w-full p-6 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-700/30 
            border border-gray-600/30 hover:border-gray-500/50 transition-all duration-300
            hover:shadow-lg hover:shadow-gray-500/10 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-700/10 to-gray-600/10 
            opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative z-10 flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-700/30 
              flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <PenTool className="w-6 h-6 text-gray-400" />
            </div>
            
            <div className="flex-1 text-left space-y-2">
              <h4 className="text-lg font-semibold text-[#E0E0E0]">
                Manual Mode
              </h4>
              <p className="text-sm text-gray-400">
                Input your own specific words or phrases. Ideal when you have exact sentences 
                you want to learn (10-20 cards).
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-20 h-20 relative flex-shrink-0">
                <Image 
                  src="/images/manualmode.png" 
                  alt="Donkey writing notes" 
                  width={80}
                  height={80}
                  className="object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                />
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-300 
                transition-colors duration-300 flex-shrink-0" />
            </div>
          </div>
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex justify-center pt-2"
      >
        <button
          onClick={onBack}
          className="text-sm text-gray-400 hover:text-gray-300 transition-colors duration-200"
        >
          Back
        </button>
      </motion.div>
    </div>
  );
} 
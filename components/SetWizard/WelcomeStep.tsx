import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6 px-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <div className="relative inline-block">
          <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
          <Sparkles className="w-16 h-16 text-blue-400 relative" />
        </div>
        
        <h3 className="text-2xl font-bold text-[#E0E0E0]">
          Welcome to the Set Creator!
        </h3>
        
        <p className="text-gray-400 max-w-md mx-auto">
          Let&apos;s create your personalized Thai flashcard set! 
          This will only take a few minutes.
        </p>
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="relative w-full max-w-sm mx-auto aspect-square rounded-xl overflow-hidden neumorphic"
      >
        <Image
          src="/images/gifs/setwizardgif2.gif"
          alt="Set creation wizard animation"
          fill
          className="object-cover"
          priority
        />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="flex justify-center pt-4"
      >
        <button
          onClick={onNext}
          className="neumorphic-button text-blue-400 px-8 py-3 text-lg font-medium
            hover:scale-105 transition-all duration-200"
        >
          Let's Get Started
        </button>
      </motion.div>
    </div>
  );
} 
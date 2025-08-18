import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { SignInButton } from '@clerk/nextjs';
import { LogIn } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
  isAuthenticated?: boolean;
}

export function WelcomeStep({ onNext, isAuthenticated = true }: WelcomeStepProps) {
  return (
    <div className="space-y-6 px-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <p className="text-gray-400 max-w-md mx-auto">
          Let&apos;s create your personalized Thai flashcard set! 
          This will only take a few minutes.
        </p>
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="relative w-full max-w-[280px] h-[160px] mx-auto rounded-xl overflow-hidden neumorphic"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
        <Image
          src="/images/gifs/setwizardgif2.gif"
          alt="Set creation wizard animation"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/40 to-transparent z-10" />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="flex justify-center pt-4"
      >
        {isAuthenticated ? (
          <button
            onClick={onNext}
            className="neumorphic-button text-blue-400 px-8 py-3 text-lg font-medium
              hover:scale-105 transition-all duration-200
              bg-gradient-to-r from-blue-500/10 to-purple-500/10
              hover:from-blue-500/20 hover:to-purple-500/20"
          >
            Let's Get Started
          </button>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">Sign in to create your own flashcard sets</p>
            <SignInButton mode="modal">
              <button className="neumorphic-button text-blue-400 px-8 py-3 text-lg font-medium
                hover:scale-105 transition-all duration-200
                bg-gradient-to-r from-blue-500/10 to-purple-500/10
                hover:from-blue-500/20 hover:to-purple-500/20
                flex items-center gap-2"
              >
                <LogIn className="w-5 h-5" /> Sign In
              </button>
            </SignInButton>
          </div>
        )}
      </motion.div>
    </div>
  );
} 
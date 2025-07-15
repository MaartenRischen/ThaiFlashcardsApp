'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { SetWizardState } from './types'
import { useGeneration } from '@/app/context/GenerationContext'
import { toast } from 'sonner'

interface GenerationStepProps {
  state: SetWizardState
  onComplete: (newSetId: string) => void
  onBack: () => void
  onClose: () => void
  onOpenSetManager: (setToSelect?: string) => void
}

export function GenerationStep({ state, onComplete, onBack, onClose, onOpenSetManager }: GenerationStepProps) {
  const { startGeneration, updateProgress, completeGeneration, failGeneration } = useGeneration()
  const hasStartedRef = useRef(false)

  useEffect(() => {
    // Prevent multiple generations
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    const phraseCount = state.mode === 'manual' ? (state.manualPhrases?.length || 0) : state.cardCount

    // Start generation tracking
    startGeneration(state.mode || 'auto', phraseCount)

    // Close the wizard immediately so user can continue using the app
    setTimeout(() => {
      onClose()
    }, 4000) // Show loading state for 4 seconds before closing

    // Start the actual generation
    const generateSet = async () => {
      try {
        // Simulate progress updates
        const progressSteps = [
          { progress: 10, text: 'Initializing...', delay: 100 },
          { progress: 25, text: 'Connecting to AI...', delay: 500 },
          { progress: 40, text: 'Generating translations...', delay: 1000 },
          { progress: 60, text: 'Creating mnemonics...', delay: 1500 },
          { progress: 80, text: 'Finalizing your set...', delay: 2000 }
        ]

        // Start progress animation
        progressSteps.forEach(step => {
          setTimeout(() => updateProgress(step.progress, step.text), step.delay)
        })

        // Make API call
        const response = await fetch('/api/generate-set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            state.mode === 'manual' 
              ? {
                  mode: 'manual',
                  englishPhrases: state.manualPhrases || []
                }
              : {
                  preferences: {
                    level: state.proficiency.levelEstimate,
                    specificTopics: state.selectedTopic?.value || '',
                    toneLevel: state.tone,
                    topicsToDiscuss: state.selectedTopic?.value || '',
                    additionalContext: state.additionalContext || ''
                  },
                  totalCount: state.cardCount
                }
          ),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate set')
        }

        // Success! Extract the set ID
        const setId = data.setId || data.newSetMetaData?.id || data.newSetId
        if (!setId) {
          throw new Error('No set ID returned from API')
        }

        // Update to 100% and complete
        updateProgress(100, 'Complete!')
        
        // Wait a moment then complete and open My Sets
        setTimeout(() => {
          completeGeneration()
          toast.success(`Your ${phraseCount} flashcards are ready!`, {
            description: 'Opening My Sets...',
            duration: 3000
          })
          onComplete(setId) // This will open My Sets modal with the new set
        }, 1000)

      } catch (error) {
        console.error('[GenerationStep] Error:', error)
        failGeneration()
        toast.error('Failed to generate flashcards', {
          description: error instanceof Error ? error.message : 'Please try again',
          duration: 5000
        })
      }
    }

    generateSet()
  }, [state, onClose, onComplete, startGeneration, updateProgress, completeGeneration, failGeneration])

  // Show a brief loading state before closing
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="relative"
      >
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl" />
        <Sparkles className="w-20 h-20 text-blue-400 relative z-10" />
      </motion.div>
      
      <div className="text-center space-y-3">
        <h3 className="text-2xl font-bold text-[#E0E0E0]">
          {state.mode === 'manual' 
            ? 'Processing your phrases...'
            : 'Generating your flashcard set...'}
        </h3>
        <p className="text-gray-400">
          You can close this window and continue using the app.
        </p>
        <p className="text-sm text-gray-500 italic">
          We'll notify you when your {state.mode === 'manual' ? 'custom' : 'personalized'} set is ready!
        </p>
      </div>
    </div>
  )
} 
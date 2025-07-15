'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, CheckCircle, XCircle } from 'lucide-react'
import { SetWizardState } from './types'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface GenerationStepProps {
  state: SetWizardState
  onComplete: (newSetId: string) => void
  onBack: () => void
  onClose: () => void
  onOpenSetManager: (setToSelect?: string) => void
}

export function GenerationStep({ state, onComplete, onBack, onClose, onOpenSetManager }: GenerationStepProps) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'generating' | 'success' | 'error'>('generating')
  const [errorMessage, setErrorMessage] = useState('')
  const [newSetId, setNewSetId] = useState<string | null>(null)
  const hasStartedRef = useRef(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    // Track component mount status
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    // Prevent multiple generations
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    console.log('[GenerationStep] Starting generation with state:', state)

    const generateSet = async () => {
      try {
        // Start progress animation
        let currentProgress = 0
        const progressInterval = setInterval(() => {
          if (!isMountedRef.current) {
            clearInterval(progressInterval)
            return
          }
          currentProgress = Math.min(currentProgress + 5, 90)
          setProgress(currentProgress)
        }, 200)

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
        clearInterval(progressInterval)

        if (!isMountedRef.current) return

        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate set')
        }

        // Success! Extract the set ID
        const setId = data.setId || data.newSetMetaData?.id || data.newSetId
        if (!setId) {
          throw new Error('No set ID returned from API')
        }

        setProgress(100)
        setNewSetId(setId)
        setStatus('success')

        // Show success screen for 2 seconds, then close wizard and open My Sets
        setTimeout(() => {
          if (!isMountedRef.current) return
          console.log('[GenerationStep] Generation complete, opening My Sets with setId:', setId)
          onClose() // Close the wizard
          onComplete(setId) // This will open My Sets modal with the new set highlighted
        }, 2000)

      } catch (error) {
        if (!isMountedRef.current) return
        console.error('[GenerationStep] Error:', error)
        setStatus('error')
        setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred')
        setProgress(0)
      }
    }

    // Small delay to ensure UI renders first
    setTimeout(generateSet, 100)
  }, [state, onClose, onComplete]) // Add dependencies

  // Render loading screen
  if (status === 'generating') {
    return (
      <div className="space-y-6">
        <Progress value={progress} className="w-full h-2" />
        
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
            <p className="text-gray-400 max-w-md mx-auto">
              {state.mode === 'manual'
                ? `We're creating ${state.manualPhrases?.length || 0} flashcards with Thai translations and mnemonics.`
                : `We're crafting ${state.cardCount} personalized flashcards just for you.`}
            </p>
            <p className="text-sm text-gray-500 italic">
              This usually takes 30-60 seconds...
            </p>
          </div>

          <div className="neumorphic p-6 rounded-xl">
            <div className="space-y-3 text-sm">
              {state.mode === 'manual' ? (
                <>
                  <div className="flex items-center justify-between gap-8">
                    <span className="text-gray-400">Mode:</span>
                    <span className="text-[#E0E0E0] font-medium">Manual Input</span>
                  </div>
                  <div className="flex items-center justify-between gap-8">
                    <span className="text-gray-400">Phrases:</span>
                    <span className="text-[#E0E0E0] font-medium">{state.manualPhrases?.length || 0}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-8">
                    <span className="text-gray-400">Topic:</span>
                    <span className="text-[#E0E0E0] font-medium">{state.selectedTopic?.value || 'Custom'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-8">
                    <span className="text-gray-400">Level:</span>
                    <span className="text-[#E0E0E0] font-medium">{state.proficiency.levelEstimate}</span>
                  </div>
                  <div className="flex items-center justify-between gap-8">
                    <span className="text-gray-400">Cards:</span>
                    <span className="text-[#E0E0E0] font-medium">{state.cardCount}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <motion.div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-blue-400 rounded-full"
                animate={{ 
                  y: [-5, 5, -5],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        </div>
      </div>
    )
  }

  // Render success screen
  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <CheckCircle className="w-24 h-24 text-green-400" />
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center space-y-3"
        >
          <h3 className="text-2xl font-bold text-[#E0E0E0]">
            Success! Your flashcards are ready!
          </h3>
          <p className="text-gray-400">
            {state.mode === 'manual'
              ? `Created ${state.manualPhrases?.length || 0} flashcards`
              : `Created ${state.cardCount} flashcards`}
          </p>
          <p className="text-sm text-gray-500 animate-pulse">
            Opening My Sets...
          </p>
        </motion.div>
      </div>
    )
  }

  // Render error screen
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <XCircle className="w-20 h-20 text-red-400" />
      </motion.div>
      
      <div className="text-center space-y-3">
        <h3 className="text-xl font-bold text-[#E0E0E0]">
          Generation Failed
        </h3>
        <p className="text-gray-400 max-w-md">
          {errorMessage}
        </p>
      </div>

      <div className="flex gap-3">
        <Button 
          onClick={onBack}
          variant="ghost" 
          className="text-gray-400"
        >
          Go Back
        </Button>
        <Button 
          onClick={() => {
            hasStartedRef.current = false
            setStatus('generating')
            setProgress(0)
            setErrorMessage('')
          }}
          className="neumorphic-button text-blue-400"
        >
          Try Again
        </Button>
      </div>
    </div>
  )
} 
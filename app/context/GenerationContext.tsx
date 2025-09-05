'use client'

import { createContext, useContext, useState, useCallback } from 'react'

type GenerationMode = 'auto' | 'manual' | 'audio-pimsleur' | 'audio-simple' | 'audio-shuffle'

interface GenerationStatus {
  isGenerating: boolean
  mode: GenerationMode
  phraseCount: number
  currentPhrase?: number
  showFullModal?: boolean
}

interface GenerationContextType {
  generationStatus: GenerationStatus | null
  startGeneration: (mode: GenerationMode, phraseCount: number) => void
  updateProgress: (currentPhrase: number) => void
  completeGeneration: () => void
  failGeneration: () => void
  cancelGeneration: () => void
  showGenerationModal: () => void
  hideGenerationModal: () => void
}

const GenerationContext = createContext<GenerationContextType | undefined>(undefined)

export function GenerationProvider({ children }: { children: React.ReactNode }) {
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null)

  const startGeneration = useCallback((mode: GenerationMode, phraseCount: number) => {
    setGenerationStatus({
      isGenerating: true,
      mode,
      phraseCount,
      currentPhrase: 0,
      showFullModal: true
    })
  }, [])

  const updateProgress = useCallback((currentPhrase: number) => {
    setGenerationStatus(prev => prev ? { ...prev, currentPhrase } : null)
  }, [])

  const completeGeneration = useCallback(() => {
    setGenerationStatus(null)
  }, [])

  const failGeneration = useCallback(() => {
    setGenerationStatus(null)
  }, [])

  const cancelGeneration = useCallback(() => {
    // TODO: Implement actual cancellation logic if needed
    setGenerationStatus(null)
  }, [])

  const showGenerationModal = useCallback(() => {
    setGenerationStatus(prev => prev ? { ...prev, showFullModal: true } : null)
  }, [])

  const hideGenerationModal = useCallback(() => {
    setGenerationStatus(prev => prev ? { ...prev, showFullModal: false } : null)
  }, [])

  return (
    <GenerationContext.Provider value={{
      generationStatus,
      startGeneration,
      updateProgress,
      completeGeneration,
      failGeneration,
      cancelGeneration,
      showGenerationModal,
      hideGenerationModal
    }}>
      {children}
    </GenerationContext.Provider>
  )
}

export function useGeneration() {
  const context = useContext(GenerationContext)
  if (context === undefined) {
    throw new Error('useGeneration must be used within a GenerationProvider')
  }
  return context
} 
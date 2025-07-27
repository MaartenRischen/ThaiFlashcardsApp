'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type GenerationMode = 'auto' | 'manual' | 'audio-pimsleur' | 'audio-simple'

interface GenerationStatus {
  isGenerating: boolean
  progress: number
  statusText: string
  mode: GenerationMode
  phraseCount: number
}

interface GenerationContextType {
  generationStatus: GenerationStatus | null
  startGeneration: (mode: GenerationMode, phraseCount: number) => void
  updateProgress: (progress: number, statusText: string) => void
  completeGeneration: () => void
  failGeneration: () => void
}

const GenerationContext = createContext<GenerationContextType | undefined>(undefined)

export function GenerationProvider({ children }: { children: React.ReactNode }) {
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null)

  const startGeneration = useCallback((mode: GenerationMode, phraseCount: number) => {
    setGenerationStatus({
      isGenerating: true,
      progress: 0,
      statusText: 'Initializing...',
      mode,
      phraseCount
    })
  }, [])

  const updateProgress = useCallback((progress: number, statusText: string) => {
    setGenerationStatus(prev => prev ? { ...prev, progress, statusText } : null)
  }, [])

  const completeGeneration = useCallback(() => {
    setGenerationStatus(null)
  }, [])

  const failGeneration = useCallback(() => {
    setGenerationStatus(null)
  }, [])

  return (
    <GenerationContext.Provider value={{
      generationStatus,
      startGeneration,
      updateProgress,
      completeGeneration,
      failGeneration
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
'use client'

import React from 'react'
import { X, Sparkles, Volume2 } from 'lucide-react'
import { useGeneration } from '@/app/context/GenerationContext'

export function GenerationStatusBar() {
  const { generationStatus, cancelGeneration, showGenerationModal } = useGeneration()
  const [displayProgress, setDisplayProgress] = React.useState(0)
  const tickRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const getTitle = () => {
    const mode = generationStatus?.mode || 'auto'
    switch (mode) {
      case 'audio-pimsleur':
        return 'Audio Generation'
      case 'audio-simple':
        return 'Audio Generation'
      case 'manual':
        return 'Flashcard Generation'
      case 'auto':
      default:
        return 'Flashcard Generation'
    }
  }

  const getIcon = () => {
    if (generationStatus?.mode?.startsWith('audio-')) {
      return <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
    }
    return <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
  }

  const getMessage = () => {
    const mode = generationStatus?.mode || 'auto'
    switch (mode) {
      case 'audio-pimsleur':
        return 'Creating guided audio lesson...'
      case 'audio-simple':
        return 'Creating repetition audio lesson...'
      case 'manual':
        return `Creating ${generationStatus?.phraseCount ?? 0} flashcards...`
      case 'auto':
      default:
        return `Generating ${generationStatus?.phraseCount ?? 0} flashcards...`
    }
  }

  const rawProgress = React.useMemo(() => {
    if (generationStatus?.currentPhrase && generationStatus?.phraseCount) {
      return Math.round((generationStatus.currentPhrase / generationStatus.phraseCount) * 100)
    }
    return 0
  }, [generationStatus])

  // Smooth, time-based progress: gently advance to 85% while generating
  React.useEffect(() => {
    if (!generationStatus?.isGenerating) {
      if (tickRef.current) clearInterval(tickRef.current)
      setDisplayProgress(0)
      return
    }

    // Start at 8% to show movement
    setDisplayProgress(prev => (prev === 0 ? 8 : prev))

    const CAP = 85
    tickRef.current = setInterval(() => {
      setDisplayProgress(prev => {
        const target = Math.max(prev, rawProgress)
        if (target >= CAP) return target
        const next = Math.min(CAP, target + 2) // slow, steady increment
        return next
      })
    }, 800)

    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [generationStatus?.isGenerating, rawProgress])

  // If server reports higher progress, snap up to it
  React.useEffect(() => {
    if (rawProgress > displayProgress) {
      setDisplayProgress(rawProgress)
    }
  }, [rawProgress, displayProgress])

  const progress = displayProgress

  if (!generationStatus?.isGenerating) return null

  return (
    <div className="fixed top-20 left-2 right-2 sm:top-24 sm:left-auto sm:right-4 sm:w-96 z-40">
      <div 
        className="p-3 sm:p-4 border border-blue-500/30 bg-black/50 backdrop-blur-md rounded-xl cursor-pointer hover:bg-black/60 transition-colors"
        onClick={showGenerationModal}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {getIcon()}
            <span className="font-medium text-sm sm:text-base text-[#E0E0E0]">{getTitle()}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              cancelGeneration()
            }}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-2">{getMessage()}</p>
        <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-blue-500 h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[11px] sm:text-xs text-gray-300 mt-2">
          {generationStatus?.mode?.startsWith('audio-') 
            ? '✓ Continue learning • Navigate freely • Only switching sets cancels'
            : 'Please wait...'}
        </p>
      </div>
    </div>
  )
} 
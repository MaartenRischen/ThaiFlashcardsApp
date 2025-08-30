'use client'

import React from 'react'
import { X, Sparkles, Volume2 } from 'lucide-react'
import { useGeneration } from '@/app/context/GenerationContext'

export function GenerationStatusBar() {
  const { generationStatus, cancelGeneration } = useGeneration()

  if (!generationStatus?.isGenerating) {
    return null
  }

  const getTitle = () => {
    switch (generationStatus.mode) {
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
    if (generationStatus.mode.startsWith('audio-')) {
      return <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
    }
    return <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
  }

  const getMessage = () => {
    switch (generationStatus.mode) {
      case 'audio-pimsleur':
        return 'Creating guided audio lesson...'
      case 'audio-simple':
        return 'Creating repetition audio lesson...'
      case 'manual':
        return `Creating ${generationStatus.phraseCount} flashcards...`
      case 'auto':
      default:
        return `Generating ${generationStatus.phraseCount} flashcards...`
    }
  }

  const getProgress = () => {
    // Estimate progress based on the generation process
    if (generationStatus.currentPhrase && generationStatus.phraseCount) {
      return Math.round((generationStatus.currentPhrase / generationStatus.phraseCount) * 100)
    }
    return 0
  }

  const progress = getProgress()

  return (
    <div className="fixed top-20 left-2 right-2 sm:top-24 sm:left-auto sm:right-4 sm:w-96 z-40">
      <div className="p-3 sm:p-4 border border-blue-500/50 bg-black/50 backdrop-blur-md rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {getIcon()}
            <span className="font-medium text-sm sm:text-base text-[#E0E0E0]">{getTitle()}</span>
          </div>
          <button
            onClick={cancelGeneration}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-2">{getMessage()}</p>
        <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-blue-500 h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[11px] sm:text-xs text-gray-300 mt-2">
          {generationStatus.mode.startsWith('audio-') 
            ? '✓ Continue learning • Navigate freely • Only switching sets cancels'
            : 'Please wait...'}
        </p>
      </div>
    </div>
  )
} 
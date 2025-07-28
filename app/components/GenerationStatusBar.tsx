'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Volume2, Loader2 } from 'lucide-react'
import { useGeneration } from '@/app/context/GenerationContext'

export function GenerationStatusBar() {
  const { generationStatus } = useGeneration()

  const getTitle = () => {
    if (!generationStatus) return ''
    
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

  const getIcon = () => {
    if (!generationStatus) return <Sparkles className="w-5 h-5 text-blue-400" />
    
    if (generationStatus.mode.startsWith('audio-')) {
      return <Volume2 className="w-5 h-5 text-green-400" />
    }
    
    return <Sparkles className="w-5 h-5 text-blue-400" />
  }

  return (
    <AnimatePresence>
      {generationStatus?.isGenerating && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md"
        >
          <div className="bg-[#1F1F1F] border border-[#404040] rounded-lg shadow-xl p-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                {getIcon()}
              </motion.div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#E0E0E0]">
                    {getTitle()}
                  </span>
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {generationStatus.mode.startsWith('audio-') 
                    ? 'Audio generation in progress. You can continue using the app while you wait.'
                    : 'Please wait...'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 
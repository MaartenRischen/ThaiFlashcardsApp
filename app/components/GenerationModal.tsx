'use client'

import React from 'react'
import { X, Loader2, AlertTriangle } from 'lucide-react'
import { useGeneration } from '@/app/context/GenerationContext'
import ThaiFactInline from '@/app/components/ThaiFactInline'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function GenerationModal() {
  const { generationStatus, hideGenerationModal } = useGeneration()
  
  if (!generationStatus?.isGenerating || !generationStatus?.showFullModal) {
    return null
  }

  const getMessage = () => {
    const mode = generationStatus.mode
    switch (mode) {
      case 'manual':
        return `Creating ${generationStatus.phraseCount} flashcards...`
      case 'auto':
      default:
        return `Generating ${generationStatus.phraseCount} flashcards...`
    }
  }

  return (
    <Dialog open={true} onOpenChange={() => hideGenerationModal()}>
      <DialogContent className="neumorphic max-w-2xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              Flashcard Generation
            </DialogTitle>
            <button
              onClick={hideGenerationModal}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gray-400">
              Your flashcard set is being generated. This will take a moment...
            </p>
          </div>

          {/* Important warning about staying in the app */}
          <div className="neumorphic rounded-xl p-4 border border-yellow-500/30 bg-yellow-50/10">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-500 mb-1">Important: Stay in this app</p>
                <p className="text-gray-300 leading-relaxed">
                  Please keep this app open and visible during generation. 
                  Switching apps or minimizing the browser may cause the generation to fail.
                </p>
                <p className="text-gray-300 leading-relaxed mt-2">
                  You can close this window and keep learning in the meantime!
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>{getMessage()}</p>
            <p className="mt-2 text-xs text-gray-400">
              Generation typically takes 2-5 minutes. Please be patient and keep this app open.
            </p>
          </div>

          {/* Thai facts while progress runs */}
          <ThaiFactInline />
        </div>
      </DialogContent>
    </Dialog>
  )
}

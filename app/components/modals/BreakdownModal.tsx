import React from 'react';
import { X } from 'lucide-react';
import { PhraseBreakdown } from '@/app/lib/word-breakdown';

interface BreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakdown: PhraseBreakdown | null;
  literal: string | null;
  isLoading: boolean;
}

export function BreakdownModal({
  isOpen,
  onClose,
  breakdown,
  literal,
  isLoading
}: BreakdownModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-[#1a1a1a] rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto border border-[#2a2a2a]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-blue-300">Breaking It Down</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center text-gray-400 py-8">Loading breakdown...</div>
        ) : (
          <div className="space-y-4">
            {/* Literal Translation */}
            {literal && (
              <div className="mb-4 p-4 bg-[#0f0f0f] rounded-lg border border-[#333]">
                <h4 className="text-sm text-gray-400 mb-2">Literal Translation:</h4>
                <p className="text-white font-medium">{literal}</p>
              </div>
            )}

            {/* Word Breakdown */}
            {breakdown ? (
              <>
                <div className="space-y-2">
                  <h4 className="text-sm text-gray-400 mb-2">Word by Word:</h4>
                  {breakdown.words.map((word, idx) => (
                    <div key={idx} className="flex items-baseline gap-2 bg-[#0f0f0f] p-3 rounded-lg">
                      <span className="text-white font-medium">{word.thai}</span>
                      <span className="text-gray-400 text-sm">({word.pronunciation})</span>
                      <span className="text-blue-300 text-sm flex-1">= {word.english}</span>
                    </div>
                  ))}
                </div>

                {/* Compound Meanings */}
                {breakdown.compounds && breakdown.compounds.length > 0 && (
                  <div className="border-t border-[#333] pt-4">
                    <h4 className="text-sm text-gray-400 mb-2">Compound meanings:</h4>
                    <div className="space-y-2">
                      {breakdown.compounds.map((compound, idx) => (
                        <div key={idx} className="flex items-baseline gap-2 bg-[#0f0f0f] p-3 rounded-lg">
                          <span className="text-white font-medium">{compound.thai}</span>
                          <span className="text-gray-400 text-sm">({compound.pronunciation})</span>
                          <span className="text-green-300 text-sm flex-1">= {compound.english}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : !literal ? (
              <div className="text-center text-gray-400 py-8">No breakdown available</div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

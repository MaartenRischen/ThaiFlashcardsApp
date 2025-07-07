import React from 'react';
import { Phrase } from '@/app/lib/set-generator';

type CardStatus = 'unseen' | 'wrong' | 'due' | 'reviewed';

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  phrases: Phrase[];
  activeSetProgress: { [key: number]: unknown };
  currentIndex: number;
  onSelectCard: (index: number) => void;
  getCardStatus: (index: number) => string;
  getStatusInfo: (status: CardStatus) => { color: string; label: string };
}

export function ProgressModal({
  isOpen,
  onClose,
  phrases,
  activeSetProgress: _activeSetProgress,
  currentIndex,
  onSelectCard,
  getCardStatus,
  getStatusInfo
}: ProgressModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto" onClick={onClose}>
      <div className="neumorphic max-w-md w-full p-6 max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-[#1a1a1a] py-2">
          <h2 className="text-xl font-bold">Set Progress</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2">
          {phrases.map((phrase, i) => {
            console.log(`Vocabulary List: Rendering item ${i}`); // Log inside map
            // Get the status of the card
            const status = getCardStatus(i);
            const { color, label } = getStatusInfo(status as CardStatus);
            
            return (
              <div key={i} className={`p-3 border-b border-[#333] flex justify-between ${currentIndex === i ? 'bg-opacity-20 bg-blue-900' : ''}`}>
                <div>
                  <p className="text-white">{phrase.thai}</p>
                  <p className="text-gray-400 text-sm">{phrase?.english}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded text-xs font-medium ${color}`}>
                    {label}
                  </span>
                  <button
                    onClick={() => onSelectCard(i)}
                    className={`px-3 py-1 rounded text-blue-400 text-sm ${status === 'unseen' ? 'bg-blue-900 bg-opacity-20 font-medium' : ''}`}
                  >
                    Study
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 
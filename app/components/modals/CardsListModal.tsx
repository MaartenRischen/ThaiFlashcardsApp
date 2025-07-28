import React from 'react';
import { Phrase } from '@/app/lib/set-generator';

interface CardsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  phrases: Phrase[];
  onSelectCard: (index: number) => void;
  getCardStatus: (index: number) => string;
}

export function CardsListModal({
  isOpen,
  onClose,
  phrases,
  onSelectCard,
  getCardStatus
}: CardsListModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-xl p-4 max-w-md w-full max-h-[80vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
        <button className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl" onClick={onClose}>&times;</button>
        <h3 className="text-lg font-bold text-blue-300 mb-3">Cards in Current Set</h3>
        <div className="bg-[#1a1b26] rounded-lg overflow-hidden">
          {phrases.map((phrase, idx) => {
            const status = getCardStatus(idx);
            let color = '#6b7280';
            let label = 'Unseen';
            if (status === 'easy') { color = '#22c55e'; label = 'Easy'; }
            else if (status === 'correct') { color = '#3b82f6'; label = 'Correct'; }
            else if (status === 'wrong') { color = '#ef4444'; label = 'Wrong'; }
            else if (status === 'unseen') { color = '#6b7280'; label = 'Unseen'; }
            return (
              <div
                key={idx}
                className="cursor-pointer border-b border-gray-700/50 last:border-b-0 hover:bg-[#1f2937]"
                onClick={() => { onSelectCard(idx); onClose(); }}
              >
                <div className="flex p-4 items-center gap-3">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-[15px] text-white break-words" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      wordBreak: 'break-word',
                      lineHeight: '1.4'
                    }}>
                      {phrase.english}
                    </p>
                    <p className="text-[13px] text-gray-400 mt-1 truncate">
                      {phrase.thai}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <div
                      className="px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap text-center"
                      style={{
                        backgroundColor: color,
                        minWidth: '80px'
                      }}
                    >
                      {label}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 
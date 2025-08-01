import React, { useState, useEffect } from 'react';
import { Phrase } from '@/app/lib/set-generator';
import { Trash2, Plus, Edit3, Check, X, Loader2 } from 'lucide-react';
import { useSet } from '@/app/context/SetContext';
import { saveSetContent } from '@/app/lib/storage/set-content';
import { toast } from 'sonner';

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
  const { activeSetId, refreshSets, reloadActiveSet } = useSet();
  const [isEditMode, setIsEditMode] = useState(false);
  const [localPhrases, setLocalPhrases] = useState<Phrase[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [newCardEnglish, setNewCardEnglish] = useState('');

  useEffect(() => {
    setLocalPhrases([...phrases]);
    setHasUnsavedChanges(false);
  }, [phrases]);

  if (!isOpen) return null;

  const handleDeleteCard = (index: number) => {
    const updatedPhrases = localPhrases.filter((_, i) => i !== index);
    setLocalPhrases(updatedPhrases);
    setHasUnsavedChanges(true);
  };

  const handleAddCard = async () => {
    if (!newCardEnglish.trim()) {
      toast.error('Please enter an English word or phrase');
      return;
    }

    if (!activeSetId) {
      toast.error('No active set selected');
      return;
    }

    setIsGenerating(true);
    try {
      // Step 1: Spell check the English phrase
      const spellCheckResponse = await fetch('/api/spellcheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phrases: [newCardEnglish.trim()]
        })
      });

      if (!spellCheckResponse.ok) {
        throw new Error('Spell check failed');
      }

      const { correctedPhrases } = await spellCheckResponse.json();
      const correctedEnglish = correctedPhrases[0];

      // Step 2: Generate Thai translation, pronunciation, and mnemonic
      const generateResponse = await fetch('/api/generate-set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'manual',
          englishPhrases: [correctedEnglish],
          totalCount: 1
        }),
        credentials: 'include'
      });

      if (!generateResponse.ok) {
        throw new Error('Failed to generate translation');
      }

      const generationResult = await generateResponse.json();
      if (!generationResult.phrases || generationResult.phrases.length === 0) {
        throw new Error('No translation generated');
      }

      // Step 3: Immediately save the new card to the set
      const newPhrase = generationResult.phrases[0];
      const updatedPhrases = [...localPhrases, newPhrase];
      
      const success = await saveSetContent(activeSetId, updatedPhrases);
      if (success) {
        setLocalPhrases(updatedPhrases);
        await refreshSets();
        await reloadActiveSet();
        setNewCardEnglish('');
        setShowAddCard(false);
        toast.success('Card added successfully');
      } else {
        throw new Error('Failed to save card');
      }
    } catch (error) {
      console.error('Error adding card:', error);
      toast.error('Failed to add card');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!activeSetId) {
      toast.error('No active set selected');
      return;
    }

    try {
      const success = await saveSetContent(activeSetId, localPhrases);
      if (success) {
        await refreshSets();
        await reloadActiveSet();
        toast.success('Changes saved successfully');
        setIsEditMode(false);
        setHasUnsavedChanges(false);
      } else {
        toast.error('Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes');
    }
  };

  const handleCancelEdit = () => {
    setLocalPhrases([...phrases]);
    setIsEditMode(false);
    setShowAddCard(false);
    setNewCardEnglish('');
    setHasUnsavedChanges(false);
  };

  const handleClose = () => {
    // Allow closing even during generation
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-gray-900 rounded-xl p-4 max-w-2xl w-full max-h-[85vh] overflow-hidden relative flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-blue-300">Cards in Current Set</h3>
          <div className="flex items-center gap-2">
            {!isEditMode ? (
              <button
                onClick={() => setIsEditMode(true)}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit Cards
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 rounded-lg flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                {hasUnsavedChanges && (
                  <button
                    onClick={handleSaveChanges}
                    className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Save Changes
                  </button>
                )}
              </>
            )}
            <button className="text-gray-400 hover:text-white text-2xl ml-2" onClick={handleClose}>&times;</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="bg-[#1a1b26] rounded-lg overflow-hidden">
            {localPhrases.map((phrase, idx) => {
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
                  className={`border-b border-gray-700/50 last:border-b-0 ${!isEditMode && 'cursor-pointer hover:bg-[#1f2937]'}`}
                  onClick={() => !isEditMode && onSelectCard(idx) && onClose()}
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
                      <p className="text-[13px] text-gray-400 mt-1">
                        {phrase.thai} • {phrase.pronunciation}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isEditMode && (
                        <div
                          className="px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap text-center"
                          style={{
                            backgroundColor: color,
                            minWidth: '80px'
                          }}
                        >
                          {label}
                        </div>
                      )}
                      {isEditMode && (
                        <button
                          onClick={() => handleDeleteCard(idx)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add New Card Section */}
            {isEditMode && !showAddCard && (
              <button
                onClick={() => setShowAddCard(true)}
                className="w-full p-4 text-green-400 hover:text-green-300 hover:bg-green-900/20 flex items-center justify-center gap-2 border-t border-gray-700"
              >
                <Plus className="w-5 h-5" />
                Add New Card
              </button>
            )}

            {/* New Card Form */}
            {isEditMode && showAddCard && (
              <div className="p-4 bg-gray-800/50 border-t border-gray-700">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Add New Card</h4>
                <p className="text-xs text-gray-400 mb-3">
                  Enter an English word or phrase. We'll handle the Thai translation.
                </p>
                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={newCardEnglish}
                      onChange={(e) => setNewCardEnglish(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                      placeholder="Enter an English word or phrase"
                      disabled={isGenerating}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowAddCard(false);
                        setNewCardEnglish('');
                      }}
                      className="flex-1 px-3 py-2 text-sm bg-gray-600 hover:bg-gray-700 rounded-lg"
                      disabled={isGenerating}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCard}
                      className="flex-1 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 rounded-lg flex items-center justify-center gap-2"
                      disabled={isGenerating || !newCardEnglish.trim()}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Add Card
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {isEditMode && !isGenerating && (
          <div className="mt-3 p-3 bg-blue-900/20 rounded-lg border border-blue-700/50">
            <p className="text-xs text-blue-400">
              <strong>Tip:</strong> New cards are saved automatically. Use the delete button to remove unwanted cards.
            </p>
          </div>
        )}

        {isGenerating && (
          <div className="mt-3 p-3 bg-yellow-900/20 rounded-lg border border-yellow-700/50">
            <p className="text-xs text-yellow-400">
              <strong>Generating card...</strong> You can close this window and the card will be added automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 
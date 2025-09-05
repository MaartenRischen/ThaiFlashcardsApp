import React, { useState, useEffect } from 'react';
import { Phrase } from '@/app/lib/set-generator';
import { Trash2, Plus, Edit3, Check, X, Loader2, Volume2 } from 'lucide-react';
import { useSet } from '@/app/context/SetContext';
import { saveSetContent } from '@/app/lib/storage/set-content';
import { toast } from 'sonner';
import { AudioLessonModalContent } from '../AudioLessonModalContent';
import { ShareButton } from '../ShareButton';
import { GoLiveButton } from '../GoLiveButton';

interface CardsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  phrases: Phrase[];
  onSelectCard: (index: number) => void;
  getCardStatus: (index: number) => string;
  isMale: boolean;
}

export function CardsListModal({
  isOpen,
  onClose,
  phrases,
  onSelectCard,
  getCardStatus,
  isMale
}: CardsListModalProps) {
  const { activeSetId, refreshSets, reloadActiveSet, availableSets } = useSet();
  
  // Get active set data for audio lesson
  const activeSet = availableSets.find(set => set.id === activeSetId);
  const [isEditMode, setIsEditMode] = useState(false);
  const [localPhrases, setLocalPhrases] = useState<Phrase[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [newCardEnglish, setNewCardEnglish] = useState('');
  const [showAudioSettings, setShowAudioSettings] = useState(false);

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

    console.log('[ADD CARD] Starting card addition process...');
    console.log('[ADD CARD] Active set ID:', activeSetId);
    console.log('[ADD CARD] New card English:', newCardEnglish.trim());

    setIsGenerating(true);
    try {
      // Step 1: Spell check the English phrase
      console.log('[ADD CARD] Step 1: Calling spellcheck API...');
      const spellCheckResponse = await fetch('/api/spellcheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phrases: [newCardEnglish.trim()]
        }),
        credentials: 'include'
      });

      console.log('[ADD CARD] Spellcheck response status:', spellCheckResponse.status);
      console.log('[ADD CARD] Spellcheck response ok:', spellCheckResponse.ok);

      if (!spellCheckResponse.ok) {
        const errorText = await spellCheckResponse.text();
        console.error('[ADD CARD] Spellcheck error response:', errorText);
        throw new Error('Spell check failed');
      }

      const spellCheckResult = await spellCheckResponse.json();
      console.log('[ADD CARD] Spellcheck result:', spellCheckResult);
      const { correctedPhrases } = spellCheckResult;
      const correctedEnglish = correctedPhrases[0];

      // Step 2: Generate Thai translation, pronunciation, and mnemonic
      console.log('[ADD CARD] Step 2: Calling generate-set API...');
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

      console.log('[ADD CARD] Generate response status:', generateResponse.status);
      console.log('[ADD CARD] Generate response ok:', generateResponse.ok);

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        console.error('[ADD CARD] Generate error response:', errorText);
        throw new Error('Failed to generate translation');
      }

      const generationResult = await generateResponse.json();
      console.log('[ADD CARD] Generation result:', generationResult);
      
      if (!generationResult.phrases || generationResult.phrases.length === 0) {
        throw new Error('No translation generated');
      }

      // Step 3: Immediately save the new card to the set
      console.log('[ADD CARD] Step 3: Saving card to set...');
      const newPhrase = generationResult.phrases[0];
      const updatedPhrases = [...localPhrases, newPhrase];
      console.log('[ADD CARD] Updated phrases count:', updatedPhrases.length);
      
      const success = await saveSetContent(activeSetId, updatedPhrases);
      console.log('[ADD CARD] Save success:', success);
      
      if (success) {
        setLocalPhrases(updatedPhrases);
        console.log('[ADD CARD] Calling refreshSets...');
        await refreshSets();
        console.log('[ADD CARD] Calling reloadActiveSet...');
        await reloadActiveSet();
        setNewCardEnglish('');
        setShowAddCard(false);
        console.log('[ADD CARD] Card addition completed successfully!');
        toast.success('Card added successfully');
      } else {
        throw new Error('Failed to save card');
      }
    } catch (error) {
      console.error('[ADD CARD] Error adding card:', error);
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
    <>
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={handleClose}>
        <div className="bg-[#1F1F1F] rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-hidden relative flex flex-col border border-[#404040] shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col gap-3 mb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-[#E0E0E0]">Current Set</h3>
            <div className="flex items-center gap-3">
              {/* Publish and Share Buttons - only show for user-created sets (not default sets) */}
              {activeSet && activeSet.source !== 'default' && !activeSet.id.startsWith('default-') && (
                <>
                  <GoLiveButton
                    setId={activeSet.id}
                    setName={activeSet.name}
                    variant="prominent"
                    className="scale-90"
                  />
                  <ShareButton
                    setId={activeSet.id}
                    setName={activeSet.name}
                    variant="prominent"
                    className="scale-90"
                  />
                </>
              )}
              <button 
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors" 
                onClick={handleClose}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Audio Lesson Button - only show for non-default sets */}
            {activeSet && activeSet.id !== 'default' && (
              <button
                onClick={() => setShowAudioSettings(true)}
                className="relative neumorphic-button px-4 py-2.5 text-sm flex items-center gap-2.5 bg-gradient-to-r from-[#f59e0b] to-[#d97706] hover:from-[#fbbf24] hover:to-[#f59e0b] text-white font-medium transition-all duration-300 shadow-lg hover:shadow-xl rounded-full"
                style={{
                  boxShadow: '0 0 20px rgba(245, 158, 11, 0.2), 0 0 40px rgba(255, 255, 255, 0.1)',
                }}
              >
                <Volume2 className="w-4 h-4" />
                <span>Audio Lesson</span>
              </button>
            )}
            {!isEditMode ? (
              <button
                onClick={() => setIsEditMode(true)}
                className="relative neumorphic-button px-5 py-2.5 text-sm flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#BB86FC] to-[#9B6DD0] hover:from-[#C896FC] hover:to-[#AB7DE0] text-white font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl edit-button-glow"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit / Add / Delete</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="neumorphic-button px-4 py-2 text-sm flex items-center gap-2 text-gray-400"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                {hasUnsavedChanges && (
                  <button
                    onClick={handleSaveChanges}
                    className="neumorphic-button px-4 py-2 text-sm flex items-center gap-2 text-green-400"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {localPhrases.map((phrase, idx) => {
            const status = getCardStatus(idx);
            let statusStyle = '';
            let statusText = 'Unseen';
            
            if (status === 'easy') { 
              statusStyle = 'bg-green-400 text-black'; 
              statusText = 'Easy'; 
            } else if (status === 'correct') { 
              statusStyle = 'bg-blue-400 text-black'; 
              statusText = 'Correct'; 
            } else if (status === 'wrong') { 
              statusStyle = 'bg-red-400 text-black'; 
              statusText = 'Wrong'; 
            } else { 
              statusStyle = 'bg-gray-600 text-gray-300'; 
              statusText = 'Unseen'; 
            }
            
            return (
              <div
                key={idx}
                className={`
                  neumorphic-card p-4 
                  ${!isEditMode && 'cursor-pointer hover:scale-[1.02] transition-transform'} 
                  ${isEditMode && 'border-2 border-transparent hover:border-gray-600'}
                `}
                onClick={() => {
                  if (!isEditMode) {
                    onSelectCard(idx);
                    onClose();
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] text-[#E0E0E0] font-medium leading-tight mb-1">
                      {phrase.english}
                    </p>
                    <p className="text-[13px] text-gray-400">
                      {phrase.thai} • {phrase.pronunciation}
                    </p>
                    {phrase.mnemonic && (
                      <p className="text-[12px] text-purple-400 mt-1.5 italic">
                        💡 {phrase.mnemonic}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isEditMode && (
                      <div
                        className={`px-3 py-1.5 text-xs font-medium rounded-full ${statusStyle}`}
                      >
                        {statusText}
                      </div>
                    )}
                    {isEditMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCard(idx);
                        }}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
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
              className="neumorphic-card p-4 w-full text-green-400 hover:text-green-300 flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add New Card</span>
            </button>
          )}

          {/* New Card Form */}
          {isEditMode && showAddCard && (
            <div className="neumorphic-card p-4 border-2 border-green-800">
              <h4 className="text-sm font-medium text-[#E0E0E0] mb-3">Add New Card</h4>
              <p className="text-xs text-gray-400 mb-3">
                Enter an English word or phrase. We'll handle the Thai translation.
              </p>
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={newCardEnglish}
                    onChange={(e) => setNewCardEnglish(e.target.value)}
                    className="w-full bg-[#2C2C2C] border border-[#404040] rounded-lg px-3 py-2 text-white text-sm focus:border-green-500 focus:outline-none transition-colors"
                    placeholder="Enter an English word or phrase"
                    disabled={isGenerating}
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowAddCard(false);
                      setNewCardEnglish('');
                    }}
                    className="flex-1 neumorphic-button px-3 py-2 text-sm text-gray-400"
                    disabled={isGenerating}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCard}
                    className="flex-1 neumorphic-button px-3 py-2 text-sm text-green-400 flex items-center justify-center gap-2"
                    disabled={isGenerating || !newCardEnglish.trim()}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Add Card</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {isEditMode && !isGenerating && (
          <div className="mt-4 p-3 neumorphic-card border-l-4 border-blue-500">
            <p className="text-xs text-blue-400">
              <strong>Tip:</strong> New cards are saved automatically. Use the delete button to remove unwanted cards.
            </p>
          </div>
        )}

        {isGenerating && (
          <div className="mt-4 p-3 neumorphic-card border-l-4 border-yellow-500">
            <p className="text-xs text-yellow-400">
              <strong>Generating card...</strong> You can close this window and the card will be added automatically.
            </p>
          </div>
        )}
      </div>
    </div>
    
    {/* Audio Lesson Modal */}
    {showAudioSettings && activeSet && activeSet.id !== 'default' && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={() => setShowAudioSettings(false)}>
        <div onClick={e => e.stopPropagation()}>
          <AudioLessonModalContent
            setId={activeSet.id}
            setName={activeSet.name}
            phraseCount={activeSet.phraseCount}
            isMale={isMale}
            onClose={() => setShowAudioSettings(false)}
          />
        </div>
      </div>
    )}
    </>
  );
} 
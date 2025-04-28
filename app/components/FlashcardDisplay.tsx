import React from 'react';

interface ExampleSentence {
  thai: string;
  translation: string;
  pronunciation: string;
}

export interface Phrase extends ExampleSentence {
  id?: number;
  english: string;
  examples: ExampleSentence[];
  mnemonic?: string;
}

export interface FlashcardDisplayProps {
  phrase: Phrase;
  showAnswer: boolean;
  mnemonic?: string;
  autoplay?: boolean;
  isMale?: boolean;
  isPoliteMode?: boolean;
  onToggleAnswer?: () => void;
  onPlayAudio?: () => void;
  onNextCard?: () => void;
  onPrevCard?: () => void;
}

export function FlashcardDisplay({
  phrase,
  showAnswer,
  mnemonic = '',
  autoplay = false,
  isMale = true,
  isPoliteMode = true,
  onToggleAnswer = () => {},
  onPlayAudio = () => {},
  onNextCard = () => {},
  onPrevCard = () => {},
}: FlashcardDisplayProps) {
  // Play audio automatically when answer is shown if autoplay is enabled
  React.useEffect(() => {
    if (showAnswer && autoplay) {
      onPlayAudio();
    }
  }, [showAnswer, autoplay, onPlayAudio]);

  // Get the appropriate Thai text based on gender and politeness
  const thaiText = React.useMemo(() => {
    let text = phrase.thai;
    // Add polite particle if needed
    if (isPoliteMode) {
      text += ' ' + (isMale ? 'ครับ' : 'ค่ะ');
    }
    return text;
  }, [phrase.thai, isMale, isPoliteMode]);
  
  return (
    <div 
      className="flashcard-container" 
      data-testid="flashcard"
      onClick={onToggleAnswer}
    >
      {/* Front side - always visible */}
      <div className="card-front" data-testid="front">
        <h2 className="thai-text">{thaiText}</h2>
      </div>
      
      {/* Back side - visible when showAnswer is true */}
      {showAnswer && (
        <div className="card-back" data-testid="back">
          <h3>{phrase.english}</h3>
          <p className="pronunciation">{phrase.pronunciation}</p>
          
          {/* Audio controls */}
          <button 
            className="play-button"
            onClick={(e) => {
              e.stopPropagation();
              onPlayAudio();
            }}
            aria-label="Play pronunciation"
          >
            Play
          </button>
          
          {/* Navigation controls */}
          <div className="navigation">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onPrevCard();
              }}
              aria-label="Previous card"
            >
              ← Prev
            </button>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onNextCard();
              }}
              aria-label="Next card"
            >
              Next →
            </button>
          </div>
          
          {/* Mnemonic section */}
          {mnemonic && (
            <div className="mnemonic-section">
              <h4>Mnemonic</h4>
              <p>{mnemonic}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
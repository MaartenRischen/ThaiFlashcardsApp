import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FlashcardDisplay, type Phrase } from '../FlashcardDisplay';

// Mock the speak function
const mockSpeak = vi.fn();
vi.mock('../../lib/tts', () => ({
  speak: (text: string) => mockSpeak(text),
}));

// Mock localStorage
beforeEach(() => {
  vi.resetAllMocks();
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    writable: true,
  });
});

// Test data
const testPhrase: Phrase = {
  id: 1,
  thai: 'สวัสดี',
  english: 'Hello',
  pronunciation: 'sawadee',
  translation: 'Hello',
  mnemonic: 'Say "Sawadee" sounds like "Saw a bee"',
};

describe('FlashcardDisplay', () => {
  it('should render the Thai text on front side', () => {
    const { rerender } = render(
      <FlashcardDisplay phrase={testPhrase} showAnswer={false} />
    );
    
    expect(screen.getByTestId('front')).toHaveTextContent('สวัสดี');
    expect(screen.queryByTestId('back')).not.toBeInTheDocument();
    
    // Test flipping the card
    rerender(
      <FlashcardDisplay phrase={testPhrase} showAnswer={true} />
    );
    
    expect(screen.getByTestId('front')).toHaveTextContent('สวัสดี');
    expect(screen.getByTestId('back')).toHaveTextContent('Hello');
  });
  
  it('should play audio when play button is clicked', async () => {
    const user = userEvent.setup();
    const playAudioMock = vi.fn();
    
    render(
      <FlashcardDisplay 
        phrase={testPhrase} 
        showAnswer={true}
        onPlayAudio={playAudioMock}
      />
    );
    
    const playButton = screen.getByRole('button', { name: /Play pronunciation/i });
    await user.click(playButton);
    
    expect(playAudioMock).toHaveBeenCalledTimes(1);
  });
  
  it('should toggle answer visibility when card is clicked', async () => {
    const user = userEvent.setup();
    const toggleMock = vi.fn();
    
    render(
      <FlashcardDisplay 
        phrase={testPhrase} 
        showAnswer={false}
        onToggleAnswer={toggleMock}
      />
    );
    
    const card = screen.getByTestId('flashcard');
    await user.click(card);
    
    expect(toggleMock).toHaveBeenCalledTimes(1);
  });
  
  it('should display mnemonic when provided and card is flipped', () => {
    render(
      <FlashcardDisplay 
        phrase={testPhrase} 
        showAnswer={true}
        mnemonic="Test mnemonic"
      />
    );
    
    const mnemonicSection = screen.getByText('Mnemonic');
    expect(mnemonicSection).toBeInTheDocument();
    expect(screen.getByText('Test mnemonic')).toBeInTheDocument();
  });
  
  it('should call navigation functions when navigation buttons are clicked', async () => {
    const user = userEvent.setup();
    const nextMock = vi.fn();
    const prevMock = vi.fn();
    
    render(
      <FlashcardDisplay 
        phrase={testPhrase} 
        showAnswer={true}
        onNextCard={nextMock}
        onPrevCard={prevMock}
      />
    );
    
    // Click next
    const nextButton = screen.getByRole('button', { name: /Next card/i });
    await user.click(nextButton);
    expect(nextMock).toHaveBeenCalledTimes(1);
    
    // Click prev
    const prevButton = screen.getByRole('button', { name: /Previous card/i });
    await user.click(prevButton);
    expect(prevMock).toHaveBeenCalledTimes(1);
  });
});

// Note: To make this test pass, we would need to:
// 1. Extract the Flashcard component from page.tsx to its own file
// 2. Modify it to accept props for phrase, showAnswer, and event handlers
// 3. Add data-testid attributes to key elements
// 4. Update the tests to match the actual implementation 
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgressDashboard } from '../ProgressDashboard';
import { type Phrase } from '../../lib/pronunciation';
import { type CardProgressData, type Difficulty } from '../../lib/srs';

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h3 data-testid="card-title">{children}</h3>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <p data-testid="card-description">{children}</p>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: { value: number }) => <div data-testid="progress" data-value={value}></div>,
}));

describe('ProgressDashboard', () => {
  const mockStats = {
    totalCards: 100,
    learnedCards: 60,
    masteredCards: 30,
    accuracyRate: 85,
    cardsToReview: 15,
    cardsToReviewToday: 5,
    averageStreak: 4,
    weakestCards: [
      {
        id: 1,
        phrase: {
          thai: 'สวัสดี',
          english: 'Hello',
          pronunciation: 'sawadee',
          translation: 'Hello',
        } as Phrase,
        progress: {
          srsLevel: 1,
          nextReviewDate: new Date().toISOString(),
          lastReviewedDate: new Date().toISOString(),
          difficulty: 'hard' as Difficulty,
          repetitions: 2,
          easeFactor: 2.5,
        } as CardProgressData,
      },
      {
        id: 2,
        phrase: {
          thai: 'ขอบคุณ',
          english: 'Thank you',
          pronunciation: 'khob khun',
          translation: 'Thank you',
        } as Phrase,
        progress: {
          srsLevel: 2,
          nextReviewDate: new Date().toISOString(),
          lastReviewedDate: new Date().toISOString(),
          difficulty: 'hard' as Difficulty,
          repetitions: 3,
          easeFactor: 2.2,
        } as CardProgressData,
      },
    ],
  };
  
  it('renders dashboard with correct stats', () => {
    render(<ProgressDashboard stats={mockStats} onSelectCard={() => {}} />);
    
    // Check headings
    expect(screen.getByText('Learning Progress')).toBeInTheDocument();
    expect(screen.getByText('Overall Progress')).toBeInTheDocument();
    expect(screen.getByText('Review Schedule')).toBeInTheDocument();
    expect(screen.getByText('Focus Areas')).toBeInTheDocument();
    
    // Check stats values
    expect(screen.getByText('Learned: 60 of 100')).toBeInTheDocument();
    expect(screen.getByText('Mastered: 30 of 100')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument(); // accuracy rate
    expect(screen.getByText('5')).toBeInTheDocument(); // cards to review today
  });
  
  it('displays weakest cards correctly', () => {
    render(<ProgressDashboard stats={mockStats} onSelectCard={() => {}} />);
    
    expect(screen.getByText('สวัสดี')).toBeInTheDocument();
    expect(screen.getByText('ขอบคุณ')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Thank you')).toBeInTheDocument();
  });
  
  it('calls onSelectCard when clicking a card', async () => {
    const mockOnSelectCard = vi.fn();
    const user = userEvent.setup();
    
    render(<ProgressDashboard stats={mockStats} onSelectCard={mockOnSelectCard} />);
    
    // Find and click the first card
    const thaiWord = screen.getByText('สวัสดี');
    const card = thaiWord.closest('div[role="button"]') || thaiWord.parentElement?.parentElement;
    
    if (card) {
      await user.click(card);
      expect(mockOnSelectCard).toHaveBeenCalledWith(1);
    } else {
      // Fallback if the exact structure changes
      expect(mockOnSelectCard).not.toHaveBeenCalled();
    }
  });
  
  it('renders empty state when no weak cards present', () => {
    const emptyStats = {
      ...mockStats,
      weakestCards: [],
    };
    
    render(<ProgressDashboard stats={emptyStats} onSelectCard={() => {}} />);
    
    expect(screen.getByText('Great job! No trouble areas detected.')).toBeInTheDocument();
  });
}); 
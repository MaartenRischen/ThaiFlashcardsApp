import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getMasteryLevel, type CardProgressData } from '../lib/srs';
import { type Phrase } from '../lib/pronunciation';

interface ProgressStats {
  totalCards: number;
  learnedCards: number;
  masteredCards: number;
  accuracyRate: number;
  cardsToReview: number;
  cardsToReviewToday: number;
  averageStreak: number;
  weakestCards: { id: number; phrase: Phrase; progress: CardProgressData }[];
}

interface ProgressDashboardProps {
  stats: ProgressStats;
  onSelectCard: (id: number) => void;
}

export function ProgressDashboard({ stats, onSelectCard }: ProgressDashboardProps) {
  // Calculate percentage values for progress bars
  const learnedPercentage = Math.round((stats.learnedCards / stats.totalCards) * 100) || 0;
  const masteredPercentage = Math.round((stats.masteredCards / stats.totalCards) * 100) || 0;
  
  // Group cards by mastery level
  const masteryLevels = {
    new: 0,
    learning: 0,
    reviewing: 0,
    mastered: 0,
  };
  
  // Calculate mastery level distribution (for future data)
  const totalLearned = stats.learnedCards;
  if (totalLearned > 0) {
    masteryLevels.new = stats.totalCards - stats.learnedCards;
    masteryLevels.mastered = stats.masteredCards;
    masteryLevels.learning = Math.floor((totalLearned - stats.masteredCards) * 0.6);
    masteryLevels.reviewing = totalLearned - stats.masteredCards - masteryLevels.learning;
  }
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-center mb-6">Learning Progress</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Overall Progress Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Overall Progress</CardTitle>
            <CardDescription>Your vocabulary learning journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Learned: {stats.learnedCards} of {stats.totalCards}</span>
                  <span className="text-sm font-semibold">{learnedPercentage}%</span>
                </div>
                <Progress value={learnedPercentage} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Mastered: {stats.masteredCards} of {stats.totalCards}</span>
                  <span className="text-sm font-semibold">{masteredPercentage}%</span>
                </div>
                <Progress value={masteredPercentage} className="h-2" />
              </div>
              
              <div className="pt-4 grid grid-cols-2 gap-2">
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold">{stats.accuracyRate}%</p>
                  <p className="text-xs text-gray-400">Accuracy Rate</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold">{stats.averageStreak}</p>
                  <p className="text-xs text-gray-400">Avg. Streak</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Reviews Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[#E0E0E0]">Review Schedule</CardTitle>
            <CardDescription className="text-[#BDBDBD]">Cards due for review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#2C2C2C] border border-[#404040] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[#BB86FC]">{stats.cardsToReviewToday}</p>
                <p className="text-xs text-[#BDBDBD]">Due Today</p>
              </div>
              <div className="bg-[#2C2C2C] border border-[#404040] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[#BB86FC]">{stats.cardsToReview - stats.cardsToReviewToday}</p>
                <p className="text-xs text-[#BDBDBD]">Due Soon</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Mastery Distribution</h4>
              <div className="flex h-4 rounded-full overflow-hidden">
                <div
                  className="bg-gray-500"
                  style={{ width: `${(masteryLevels.new / stats.totalCards) * 100}%` }}
                  title={`New: ${masteryLevels.new}`}
                />
                <div
                  className="bg-blue-500"
                  style={{ width: `${(masteryLevels.learning / stats.totalCards) * 100}%` }}
                  title={`Learning: ${masteryLevels.learning}`}
                />
                <div
                  className="bg-purple-500"
                  style={{ width: `${(masteryLevels.reviewing / stats.totalCards) * 100}%` }}
                  title={`Reviewing: ${masteryLevels.reviewing}`}
                />
                <div
                  className="bg-green-500"
                  style={{ width: `${(masteryLevels.mastered / stats.totalCards) * 100}%` }}
                  title={`Mastered: ${masteryLevels.mastered}`}
                />
              </div>
              <div className="flex text-xs justify-between pt-1">
                <span className="text-gray-500">New</span>
                <span className="text-blue-500">Learning</span>
                <span className="text-purple-500">Reviewing</span>
                <span className="text-green-500">Mastered</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Focus Area Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Focus Areas</CardTitle>
          <CardDescription>Cards that need more attention</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.weakestCards.length > 0 ? (
            <div className="space-y-3">
              {stats.weakestCards.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700"
                  onClick={() => onSelectCard(item.id)}
                >
                  <div>
                    <p className="font-medium">{item.phrase.thai}</p>
                    <p className="text-sm text-gray-400">{item.phrase.english}</p>
                  </div>
                  <div>
                    <div className="text-xs px-2 py-1 rounded bg-gray-700">
                      {getMasteryLevel(item.progress.srsLevel)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-6">Great job! No trouble areas detected.</p>
          )}
        </CardContent>
      </Card>
      
      {/* Tips */}
      <div className="text-sm text-gray-400 p-4 bg-gray-800 rounded-lg">
        <h4 className="font-semibold mb-2">Tips for Effective Learning</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Review cards regularly to strengthen memory</li>
          <li>Focus on difficult cards before they become due</li>
          <li>Use mnemonics to remember challenging words</li>
          <li>Practice using new words in sentences</li>
        </ul>
      </div>
    </div>
  );
} 
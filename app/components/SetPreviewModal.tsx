'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Eye, Clock, CheckCircle2, AlertCircle, TrendingUp, Calendar, BarChart3, Play } from 'lucide-react';
import { useSet } from '@/app/context/SetContext';
import { Phrase } from '@/app/lib/set-generator';
import { SetProgress } from '@/app/lib/storage/types';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface SetPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  setId: string;
  setName: string;
  phraseCount: number;
  imageUrl?: string | null;
}

interface ProgressStats {
  totalCards: number;
  seenCards: number;
  easyCards: number;
  correctCards: number;
  hardCards: number;
  unseenCards: number;
  percentComplete: number;
  nextReviewDate?: Date;
  averageDifficulty: number;
}

export function SetPreviewModal({ 
  isOpen, 
  onClose, 
  setId, 
  setName, 
  phraseCount,
  imageUrl 
}: SetPreviewModalProps) {
  const { switchSet } = useSet();
  const { isSignedIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [progress, setProgress] = useState<SetProgress>({});
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'cards' | 'progress'>('overview');

  useEffect(() => {
    if (isOpen && setId) {
      loadSetData();
    }
  }, [isOpen, setId]);

  const loadSetData = async () => {
    setLoading(true);
    try {
      // Load phrases from API
      const phrasesResponse = await fetch(`/api/flashcard-sets/${setId}/content`);
      const phrasesData = phrasesResponse.ok ? await phrasesResponse.json() : [];
      
      // Load progress from API if signed in
      let progressData: SetProgress = {};
      if (isSignedIn) {
        const progressResponse = await fetch(`/api/user-progress?setId=${setId}`);
        if (progressResponse.ok) {
          const data = await progressResponse.json();
          progressData = data.progress || {};
        }
      }

      setPhrases(phrasesData || []);
      setProgress(progressData);
      
      // Calculate progress statistics
      const stats = calculateProgressStats(phrasesData || [], progressData);
      setProgressStats(stats);
    } catch (error) {
      console.error('Error loading set data:', error);
      toast.error('Failed to load set preview');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgressStats = (phrases: Phrase[], progress: SetProgress): ProgressStats => {
    const totalCards = phrases.length;
    let seenCards = 0;
    let easyCards = 0;
    let correctCards = 0;
    let hardCards = 0;
    let nextReviewDate: Date | undefined;
    let totalDifficulty = 0;

    Object.entries(progress).forEach(([index, data]) => {
      const idx = parseInt(index);
      if (idx < totalCards) {
        seenCards++;
        
        // Count by difficulty
        if (data.difficulty === 'easy') easyCards++;
        else if (data.difficulty === 'good') correctCards++;
        else if (data.difficulty === 'hard') hardCards++;
        
        // Track difficulty for average
        const difficultyValue = data.difficulty === 'easy' ? 1 : 
                              data.difficulty === 'good' ? 2 : 3;
        totalDifficulty += difficultyValue;
        
        // Find next review date
        const reviewDate = new Date(data.nextReviewDate);
        if (!nextReviewDate || reviewDate < nextReviewDate) {
          nextReviewDate = reviewDate;
        }
      }
    });

    const unseenCards = totalCards - seenCards;
    const percentComplete = totalCards > 0 ? Math.round((seenCards / totalCards) * 100) : 0;
    const averageDifficulty = seenCards > 0 ? totalDifficulty / seenCards : 0;

    return {
      totalCards,
      seenCards,
      easyCards,
      correctCards,
      hardCards,
      unseenCards,
      percentComplete,
      nextReviewDate,
      averageDifficulty
    };
  };

  const getCardStatus = (index: number) => {
    const progressData = progress[index];
    if (!progressData) return 'unseen';
    return progressData.difficulty || 'unseen';
  };

  const handleLoadSet = () => {
    switchSet(setId);
    onClose();
    toast.success(`Loaded "${setName}"`);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-[#E0E0E0] mb-2">
                {setName}
              </DialogTitle>
              <p className="text-sm text-gray-400">
                {phraseCount} cards • Preview mode
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1">
          <TabsList className="w-full border-b border-[#404040] bg-transparent rounded-none px-6">
            <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500">
              <Eye className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="cards" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500">
              <BarChart3 className="w-4 h-4 mr-2" />
              Cards
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500">
              <TrendingUp className="w-4 h-4 mr-2" />
              Progress
            </TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading set data...</p>
              </div>
            </div>
          ) : (
            <>
              <TabsContent value="overview" className="p-6 space-y-6">
                {/* Set Image */}
                {imageUrl && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={setName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                )}

                {/* Progress Overview */}
                {progressStats && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-[#E0E0E0]">Your Progress</h3>
                      <span className="text-2xl font-bold text-blue-500">{progressStats.percentComplete}%</span>
                    </div>
                    
                    <Progress value={progressStats.percentComplete} className="h-3" />
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                      <div className="bg-[#2C2C2C] rounded-lg p-4">
                        <p className="text-xs text-gray-400 mb-1">Seen</p>
                        <p className="text-xl font-bold text-[#E0E0E0]">{progressStats.seenCards}</p>
                      </div>
                      <div className="bg-[#2C2C2C] rounded-lg p-4">
                        <p className="text-xs text-gray-400 mb-1">Easy</p>
                        <p className="text-xl font-bold text-green-500">{progressStats.easyCards}</p>
                      </div>
                      <div className="bg-[#2C2C2C] rounded-lg p-4">
                        <p className="text-xs text-gray-400 mb-1">Correct</p>
                        <p className="text-xl font-bold text-blue-500">{progressStats.correctCards}</p>
                      </div>
                      <div className="bg-[#2C2C2C] rounded-lg p-4">
                        <p className="text-xs text-gray-400 mb-1">Hard</p>
                        <p className="text-xl font-bold text-red-500">{progressStats.hardCards}</p>
                      </div>
                    </div>

                    {progressStats.nextReviewDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Next review: {formatDistanceToNow(progressStats.nextReviewDate, { addSuffix: true })}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Stats */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-[#E0E0E0] mb-3">Set Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <BarChart3 className="w-4 h-4" />
                      <span>Total cards:</span>
                    </div>
                    <span className="text-[#E0E0E0] font-medium">{phraseCount}</span>
                    
                    <div className="flex items-center gap-2 text-gray-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Completed:</span>
                    </div>
                    <span className="text-[#E0E0E0] font-medium">
                      {progressStats?.seenCards || 0} / {phraseCount}
                    </span>
                    
                    <div className="flex items-center gap-2 text-gray-400">
                      <TrendingUp className="w-4 h-4" />
                      <span>Average difficulty:</span>
                    </div>
                    <span className="text-[#E0E0E0] font-medium">
                      {progressStats?.averageDifficulty 
                        ? progressStats.averageDifficulty < 1.5 ? 'Easy' 
                          : progressStats.averageDifficulty < 2.5 ? 'Medium' 
                          : 'Hard'
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="cards" className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="p-6 space-y-3">
                    {phrases.map((phrase, idx) => {
                      const status = getCardStatus(idx);
                      const statusConfig = {
                        easy: { bg: 'bg-green-500/20', text: 'text-green-500', label: 'Easy' },
                        good: { bg: 'bg-blue-500/20', text: 'text-blue-500', label: 'Good' },
                        hard: { bg: 'bg-red-500/20', text: 'text-red-500', label: 'Hard' },
                        unseen: { bg: 'bg-gray-500/20', text: 'text-gray-500', label: 'Unseen' }
                      }[status] || { bg: 'bg-gray-500/20', text: 'text-gray-500', label: 'Unseen' };

                      return (
                        <div
                          key={idx}
                          className="p-4 bg-[#2C2C2C] rounded-lg border border-[#404040] hover:border-[#606060] transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <p className="text-[#E0E0E0] font-medium">{phrase.english}</p>
                              <p className="text-sm text-gray-400">
                                {phrase.thai} • {phrase.pronunciation}
                              </p>
                              {phrase.mnemonic && (
                                <p className="text-xs text-gray-500 italic">
                                  💭 {phrase.mnemonic}
                                </p>
                              )}
                            </div>
                            <div className={cn(
                              "px-3 py-1 rounded-full text-xs font-medium",
                              statusConfig.bg,
                              statusConfig.text
                            )}>
                              {statusConfig.label}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="progress" className="p-6">
                <div className="space-y-6">
                  {/* Progress Chart */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[#E0E0E0]">Progress Breakdown</h3>
                    
                    {progressStats && progressStats.seenCards > 0 ? (
                      <div className="space-y-3">
                        {/* Easy */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-green-500">Easy</span>
                            <span className="text-gray-400">
                              {progressStats.easyCards} ({Math.round((progressStats.easyCards / progressStats.seenCards) * 100)}%)
                            </span>
                          </div>
                          <div className="h-4 bg-[#2C2C2C] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 transition-all duration-500"
                              style={{ width: `${(progressStats.easyCards / progressStats.seenCards) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Good */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-500">Good</span>
                            <span className="text-gray-400">
                              {progressStats.correctCards} ({Math.round((progressStats.correctCards / progressStats.seenCards) * 100)}%)
                            </span>
                          </div>
                          <div className="h-4 bg-[#2C2C2C] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-500"
                              style={{ width: `${(progressStats.correctCards / progressStats.seenCards) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Hard */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-red-500">Hard</span>
                            <span className="text-gray-400">
                              {progressStats.hardCards} ({Math.round((progressStats.hardCards / progressStats.seenCards) * 100)}%)
                            </span>
                          </div>
                          <div className="h-4 bg-[#2C2C2C] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-red-500 transition-all duration-500"
                              style={{ width: `${(progressStats.hardCards / progressStats.seenCards) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-400">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No progress data yet</p>
                        <p className="text-sm mt-1">Start learning to track your progress!</p>
                      </div>
                    )}
                  </div>

                  {/* Learning Tips */}
                  <div className="bg-[#2C2C2C] rounded-lg p-4 space-y-2">
                    <h4 className="font-medium text-[#E0E0E0]">Learning Tips</h4>
                    {progressStats && progressStats.averageDifficulty > 2.5 && (
                      <p className="text-sm text-gray-400">
                        🎯 This set seems challenging. Consider reviewing the easier cards more frequently to build confidence.
                      </p>
                    )}
                    {progressStats && progressStats.unseenCards > progressStats.totalCards * 0.5 && (
                      <p className="text-sm text-gray-400">
                        📚 You have many unseen cards. Try to review a few new cards each session for steady progress.
                      </p>
                    )}
                    {progressStats && progressStats.percentComplete === 100 && (
                      <p className="text-sm text-gray-400">
                        🎉 Congratulations! You've seen all cards. Keep reviewing to improve retention.
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>

        <div className="p-6 pt-0 border-t border-[#404040]">
          <Button
            onClick={handleLoadSet}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <Play className="w-4 h-4 mr-2" />
            Load This Set
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

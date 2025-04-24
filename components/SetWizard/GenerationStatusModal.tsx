import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import type { Phrase } from '@/app/lib/set-generator';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

interface GenerationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  completed: number;
  total: number;
  latestPhrases: Phrase[];
  error?: string;
}

export function GenerationStatusModal({
  isOpen,
  onClose,
  completed,
  total,
  latestPhrases,
  error
}: GenerationStatusModalProps) {
  const progress = total > 0 ? (completed / total) * 100 : 0;
  const isComplete = completed === total && total > 0;
  const progressText = isComplete 
    ? "All cards have been generated!" 
    : `Generated ${completed} of ${total} cards`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="neumorphic bg-[#1a1a1a] border-none shadow-xl max-w-xl w-full">
        <div className="grid gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-blue-400">
              {isComplete ? "Set Created Successfully!" : "Generating Your Flashcards"}
            </h2>
            <p className={`text-lg ${error ? "text-red-400" : "text-gray-300"}`}>
              {error || progressText}
            </p>
          </div>

          <div className="space-y-2">
            <Progress value={progress} className="h-3 bg-gray-700" />
            <div className="flex justify-between text-sm text-gray-400">
              <span>0%</span>
              <span>{Math.round(progress)}%</span>
              <span>100%</span>
            </div>
          </div>

          <AnimatePresence>
            {latestPhrases.length > 0 && (
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-semibold text-gray-200">Latest Generated Cards</h3>
                <div className="grid gap-3">
                  {latestPhrases.slice(-3).map((phrase, index) => (
                    <motion.div
                      key={phrase.thai + index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="neumorphic-card p-4 bg-[#222222] border-none">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <p className="font-medium text-xl text-blue-300">{phrase.thai}</p>
                            <p className="text-gray-400">{phrase.pronunciation}</p>
                          </div>
                          <p className="text-gray-200 font-medium">{phrase.english}</p>
                          {phrase.mnemonic && (
                            <p className="text-sm text-gray-400 italic">
                              <span className="text-yellow-400 font-semibold">Mnemonic:</span> {phrase.mnemonic}
                            </p>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {isComplete ? (
                  <p className="text-center text-green-400 font-medium">
                    All {total} cards have been successfully generated!
                  </p>
                ) : (
                  <div className="flex justify-center pt-2">
                    <motion.div 
                      className="flex space-x-2"
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatType: "loop"
                      }}
                    >
                      <div className="h-3 w-3 bg-blue-400 rounded-full"></div>
                      <div className="h-3 w-3 bg-blue-400 rounded-full"></div>
                      <div className="h-3 w-3 bg-blue-400 rounded-full"></div>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
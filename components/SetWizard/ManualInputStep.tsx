import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

interface ManualInputStepProps {
  onNext: (phrases: string[]) => void;
  onBack: () => void;
}

export function ManualInputStep({ onNext, onBack }: ManualInputStepProps) {
  const [phrases, setPhrases] = useState<string[]>(['']);
  const [showError, setShowError] = useState(false);

  const addPhrase = () => {
    setPhrases([...phrases, '']);
  };

  const removePhrase = (index: number) => {
    if (phrases.length > 1) {
      setPhrases(phrases.filter((_, i) => i !== index));
    }
  };

  const updatePhrase = (index: number, value: string) => {
    const updatedPhrases = [...phrases];
    updatedPhrases[index] = value;
    setPhrases(updatedPhrases);
  };

  const handleNext = () => {
    // Filter out empty phrases and trim whitespace
    const validPhrases = phrases
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    if (validPhrases.length === 0) {
      setShowError(true);
      return;
    }
    
    setShowError(false);
    onNext(validPhrases);
  };

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-2"
      >
        <h3 className="text-lg font-semibold text-[#E0E0E0]">
          Add Your Phrases
        </h3>
        <p className="text-sm text-gray-400">
          Enter English words or phrases you want to learn. We'll handle the Thai translations.
        </p>
      </motion.div>

      {showError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
        >
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">
            Please add at least one word or phrase.
          </p>
        </motion.div>
      )}

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {phrases.map((phrase, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50 space-y-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">
                Phrase {index + 1}
              </span>
              {phrases.length > 1 && (
                <button
                  onClick={() => removePhrase(index)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <input
              type="text"
              placeholder="Enter an English word or phrase"
              value={phrase}
              onChange={(e) => updatePhrase(index, e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-900/50 border border-gray-700 
                text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                focus:ring-blue-500/50 text-sm"
            />
          </motion.div>
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={addPhrase}
        className="w-full p-3 rounded-lg border border-dashed border-gray-600 
          hover:border-blue-500/50 transition-colors duration-200 
          flex items-center justify-center gap-2 text-gray-400 hover:text-blue-400"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm">Add Another Phrase</span>
      </motion.button>

      <div className="flex justify-between items-center pt-4">
        <button
          onClick={onBack}
          className="neumorphic-button text-blue-400"
        >
          Back
        </button>
        
        <div className="text-sm text-gray-400">
          {phrases.filter(p => p.trim()).length} phrase{phrases.filter(p => p.trim()).length !== 1 ? 's' : ''}
        </div>
        
        <button
          onClick={handleNext}
          className="neumorphic-button text-blue-400"
        >
          Generate Set
        </button>
      </div>
    </div>
  );
} 
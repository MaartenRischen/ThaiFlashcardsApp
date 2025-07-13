import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

interface ManualInputStepProps {
  onNext: (phrases: string[], corrections?: Array<{original: string, corrected: string}>) => void;
  onBack: () => void;
}

export function ManualInputStep({ onNext, onBack }: ManualInputStepProps) {
  const [phrases, setPhrases] = useState<string[]>(['']);
  const [showError, setShowError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleNext = async () => {
    // Filter out empty phrases and trim whitespace
    const validPhrases = phrases
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    if (validPhrases.length === 0) {
      setShowError(true);
      return;
    }
    
    setIsProcessing(true);
    
    // Perform spell check and correction
    const { correctedPhrases, corrections } = await spellCheckPhrases(validPhrases);
    
    setShowError(false);
    setIsProcessing(false);
    console.log('ManualInputStep sending corrected phrases:', correctedPhrases);
    console.log('Corrections made:', corrections);
    onNext(correctedPhrases, corrections);
  };
  
  // Simple spell check function (can be enhanced with a proper spell check API)
  const spellCheckPhrases = async (phrases: string[]): Promise<{
    correctedPhrases: string[],
    corrections: Array<{original: string, corrected: string}>
  }> => {
    // Common corrections
    const corrections: Record<string, string> = {
      'teh': 'the',
      'adn': 'and',
      'taht': 'that',
      'wiht': 'with',
      'recieve': 'receive',
      'beleive': 'believe',
      'occured': 'occurred',
      'untill': 'until',
      'wich': 'which',
      'thier': 'their',
      'alot': 'a lot',
      'definately': 'definitely',
      'seperate': 'separate',
      'ocurr': 'occur',
      'accomodate': 'accommodate',
      'acheive': 'achieve',
      'adress': 'address',
      'calender': 'calendar',
      'collegue': 'colleague',
      'concious': 'conscious',
      'dissapear': 'disappear',
      'existance': 'existence',
      'foriegn': 'foreign',
      'fourty': 'forty',
      'goverment': 'government',
      'harrass': 'harass',
      'independant': 'independent',
      'knowlege': 'knowledge',
      'lisence': 'license',
      'mispell': 'misspell',
      'neccessary': 'necessary',
      'noticable': 'noticeable',
      'occassion': 'occasion',
      'occurence': 'occurrence',
      'persistant': 'persistent',
      'preceed': 'precede',
      'priviledge': 'privilege',
      'pronounciation': 'pronunciation',
      'reccomend': 'recommend',
      'rythm': 'rhythm',
      'sieze': 'seize',
      'suprise': 'surprise',
      'tommorow': 'tomorrow',
      'tounge': 'tongue',
      'truely': 'truly',
      'vaccuum': 'vacuum',
      'weird': 'weird',
      'whereever': 'wherever'
    };
    
    const allCorrections: Array<{original: string, corrected: string}> = [];
    
    const correctedPhrases = phrases.map(phrase => {
      let corrected = phrase;
      
      // Apply corrections word by word
      const words = corrected.split(' ');
      const correctedWords = words.map(word => {
        const lowerWord = word.toLowerCase();
        const punctuation = word.match(/[.,!?;:]$/)?.[0] || '';
        const cleanWord = lowerWord.replace(/[.,!?;:]$/, '');
        
        if (corrections[cleanWord]) {
          // Preserve original capitalization
          const correctedWord = corrections[cleanWord];
          if (word[0] === word[0].toUpperCase()) {
            return correctedWord.charAt(0).toUpperCase() + correctedWord.slice(1) + punctuation;
          }
          return correctedWord + punctuation;
        }
        return word;
      });
      
      corrected = correctedWords.join(' ');
      
      // Capitalize first letter of sentence
      corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
      
      // Fix common grammar issues
      corrected = corrected
        .replace(/\s+/g, ' ') // Multiple spaces to single space
        .replace(/\s+([.,!?;:])/g, '$1') // Remove space before punctuation
        .replace(/([.,!?;:])\s*$/g, '$1') // Ensure punctuation at end
        .trim();
      
      // Add period if no ending punctuation
      if (!/[.!?]$/.test(corrected)) {
        corrected += '.';
      }
      
      // Track if correction was made
      if (corrected !== phrase) {
        allCorrections.push({ original: phrase, corrected });
      }
      
      return corrected;
    });
    
    return { correctedPhrases, corrections: allCorrections };
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
          disabled={isProcessing}
        >
          {isProcessing ? 'Checking Spelling...' : 'Continue'}
        </button>
      </div>
    </div>
  );
} 
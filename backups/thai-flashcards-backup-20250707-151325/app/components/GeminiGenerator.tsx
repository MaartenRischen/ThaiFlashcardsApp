'use client';

import React, { useState } from 'react';
import { generateMnemonic, generateExampleSentence } from '../lib/gemini';

interface GeminiGeneratorProps {
  thaiWord?: string;
  englishMeaning?: string;
  type: 'mnemonic' | 'example';
  onResult: (result: unknown) => void;
}

const GeminiGenerator: React.FC<GeminiGeneratorProps> = ({ 
  thaiWord = '', 
  englishMeaning = '', 
  type,
  onResult 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localThaiWord, setLocalThaiWord] = useState(thaiWord);
  const [localEnglishMeaning, setLocalEnglishMeaning] = useState(englishMeaning);

  const handleGenerate = async () => {
    if (!localThaiWord || !localEnglishMeaning) {
      setError('Both Thai word and English meaning are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let result;
      if (type === 'mnemonic') {
        result = await generateMnemonic(localThaiWord, localEnglishMeaning);
      } else {
        result = await generateExampleSentence(localThaiWord, localEnglishMeaning);
      }
      
      onResult(result);
    } catch (err: unknown) {
      let message = 'Failed to generate content';
      if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
        message = (err as { message: string }).message;
      }
      setError(message);
      console.error('Gemini generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-400 mb-2">
        {type === 'mnemonic' ? 'Generate mnemonic using Gemini 2.5' : 'Generate example sentence using Gemini 2.5'}
      </div>
      
      <div className="space-y-2">
        <input
          type="text"
          value={localThaiWord}
          onChange={(e) => setLocalThaiWord(e.target.value)}
          placeholder="Enter Thai word"
          className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
        />
        
        <input
          type="text"
          value={localEnglishMeaning}
          onChange={(e) => setLocalEnglishMeaning(e.target.value)}
          placeholder="Enter English meaning"
          className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
        />
      </div>
      
      {error && (
        <div className="text-red-400 text-sm">
          {error}
        </div>
      )}
      
      <button
        onClick={handleGenerate}
        disabled={loading || !localThaiWord || !localEnglishMeaning}
        className={`w-full py-2 rounded font-medium ${
          loading || !localThaiWord || !localEnglishMeaning 
            ? 'bg-gray-700 text-gray-400' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? 'Generating...' : `Generate ${type === 'mnemonic' ? 'Mnemonic' : 'Example'}`}
      </button>
    </div>
  );
};

export default GeminiGenerator; 
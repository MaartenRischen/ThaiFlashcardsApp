import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const getToneLevelLabel = (value: number): string => {
  switch (value) {
    case 1: return 'Textbook realism';
    case 2: return 'Serious & practical';
    case 3: return 'Sorta funny, but like your \'funny\' uncle';
    case 4: return 'Actually funny';
    case 5: return 'A little too much maybe';
    case 6: return 'Definitely too much';
    case 7: return 'Woah now';
    case 8: return 'Ehrm..';
    case 9: return 'You sure about this?';
    case 10: return '̷̛̤̖̯͕̭͙̏̀̏̑̔̆͝Ǫ̶̬̩͇̼͖͖͈̯̳͎͛̀̐͌̅̿̈́̏̾̏̽̎H̶̼̹͓̩̥͈̞̫̯͋̓̄́̓̽̈́̈́̈́͛̎͒̿͜H̴̘͎̗̮̱̗̰̱͓̪̘͛̅̅̐͌̑͆̆̐͐̈́͌̚O̴̖̥̺͎̰̰̠͙̹̔̑̆͆͋̀̐̄̈́͝ͅI̴̢̛̩͔̺͓̯̯̟̱͎͓̾̃̅̈́̍͋̒̔̚͜͠͠͝͝Ḋ̵̻͓̹̼̳̻̼̼̥̳͍͛̈́̑̆̈́̈́̅͜͝͝͠͝Ǫ̶͔̯̟͙̪͗̆͛̍̓̒̔̒̎̄̈́̅͜͝͠N̵̢̢̩̫͚̪̦̥̳̯͚̺̍̏͂͗̌̍̿̾̿́̓͌͛͝K̷̨̨̟̺͔̻̮̯̰̤̬͇̟̙̆͆͗̀̈́̔̅͒͛͊͘͝͠I̶̡̢̡̛͔͎͍̤̤̪͍͙̜͚̓̀͋́̈́̈́̿͂̈́̐͘͘͜';
    default: return 'Textbook realism';
  }
};

const getToneLevelColor = (value: number): string => {
  if (value <= 2) return 'text-green-400';
  if (value <= 4) return 'text-blue-400';
  if (value <= 6) return 'text-yellow-400';
  if (value <= 8) return 'text-orange-400';
  return 'text-red-400';
};

export function ToneStep({ toneLevel, onNext, onBack }: { 
  toneLevel: number,
  onNext: (toneLevel: number) => void,
  onBack: () => void
}) {
  const [currentToneLevel, setCurrentToneLevel] = useState(toneLevel);

  useEffect(() => {
    const handleTouchEnd = () => {
      // setIsDragging(false); // This line is removed
    };
    document.addEventListener('touchend', handleTouchEnd);
    return () => document.removeEventListener('touchend', handleTouchEnd);
  }, []);

  const safeToneLevel = Math.max(1, Math.min(10, Number(currentToneLevel) || 1));

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="neumorphic-button px-6 py-3 text-[#BDBDBD] rounded-xl"
        >
          ← Back
        </button>
        <button
          onClick={() => onNext(safeToneLevel)}
          className="px-6 py-3 rounded-xl bg-[#BB86FC] hover:bg-[#A374E8] 
                   transition-colors text-white font-medium"
        >
          Next →
        </button>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-[#E0E0E0]">
          How would you like to learn?
        </h3>
        <p className="text-sm text-gray-400">
          Adjust the tone to match your learning style
        </p>
      </div>

      {/* Tone Level Display */}
      <motion.div 
        key={safeToneLevel}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="neumorphic p-6 rounded-xl text-center space-y-4"
      >
        {/* Image */}
        <div className="relative w-full max-w-[280px] h-[160px] mx-auto rounded-lg overflow-hidden neumorphic-inset">
          <Image
            src={`/images/level2/${safeToneLevel}.png`}
            alt={`Learning style - Level ${safeToneLevel}`}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Label */}
        <div className="space-y-1">
          <h4 className={`text-2xl font-bold transition-colors duration-300 ${getToneLevelColor(safeToneLevel)}`}>
            {getToneLevelLabel(safeToneLevel)}
          </h4>
          {safeToneLevel === 1 && (
            <p className="text-xs text-gray-400">Recommended for serious learning</p>
          )}
          {safeToneLevel === 2 && (
            <p className="text-xs text-gray-400">Still practical and useful</p>
          )}
          {safeToneLevel >= 4 && safeToneLevel <= 6 && (
            <p className="text-xs text-gray-400">Getting less practical...</p>
          )}
          {safeToneLevel >= 7 && (
            <p className="text-xs text-red-400">Proceed with caution</p>
          )}
        </div>

        {/* Tone Level Number */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-gray-400">Tone Level:</span>
          <span className={`text-3xl font-bold ${getToneLevelColor(safeToneLevel)}`}>
            {safeToneLevel}
          </span>
          <span className="text-sm text-gray-400">/ 10</span>
        </div>
      </motion.div>

      {/* Slider */}
      <div className="space-y-3">
        <div className="relative">
          <input
            type="range"
            min="1"
            max="10"
            value={safeToneLevel}
            onChange={(e) => setCurrentToneLevel(parseInt(e.target.value))}
            onTouchStart={() => {
              // setIsDragging(true); // This line is removed
            }}
            onTouchEnd={() => {
              // setIsDragging(false); // This line is removed
            }}
            onMouseDown={() => {
              // setIsDragging(true); // This line is removed
            }}
            onMouseUp={() => {
              // setIsDragging(false); // This line is removed
            }}
            className="w-full h-4 rounded-full appearance-none cursor-pointer bg-gray-800
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
              [&::-webkit-slider-thumb]:from-blue-500 [&::-webkit-slider-thumb]:to-purple-500
              [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_20px_rgba(59,130,246,0.5)]
              [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200
              [&::-webkit-slider-thumb]:hover:shadow-[0_0_30px_rgba(59,130,246,0.7)]
              [&::-moz-range-thumb]:w-8 [&::-moz-range-thumb]:h-8 [&::-moz-range-thumb]:rounded-full 
              [&::-moz-range-thumb]:bg-gradient-to-r [&::-moz-range-thumb]:from-blue-500 
              [&::-moz-range-thumb]:to-purple-500 [&::-moz-range-thumb]:cursor-pointer 
              [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
            style={{
              background: `linear-gradient(to right, 
                #10b981 0%, 
                #3b82f6 30%, 
                #eab308 60%, 
                #ef4444 100%)`
            }}
          />
        </div>
        <div className="flex justify-between px-1 text-xs">
          <span className="text-green-400">Serious</span>
          <span className="text-yellow-400">Funny</span>
          <span className="text-red-400">Chaos</span>
        </div>
      </div>

      {/* Pre-generation warning */}
      <div className="neumorphic rounded-xl p-4 border border-blue-500/30 bg-blue-50/10">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-blue-400 mb-1">Before we generate your set</p>
            <p className="text-gray-300 leading-relaxed">
              The next step will generate your flashcards, which takes 2-5 minutes. 
              Please keep this app open and visible during the entire process.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="neumorphic-button px-6 py-3 text-[#BDBDBD] rounded-xl"
        >
          ← Back
        </button>
        <button
          onClick={() => onNext(safeToneLevel)}
          className="px-6 py-3 rounded-xl bg-[#BB86FC] hover:bg-[#A374E8] 
                   transition-colors text-white font-medium"
        >
          Generate Set →
        </button>
      </div>
    </div>
  );
} 
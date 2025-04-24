import React, { useState } from 'react';
import { Slider } from '../ui/slider';

export function ToneStep({ value, onNext, onBack }: { 
  value: number, 
  onNext: (tone: number) => void,
  onBack: () => void
}) {
  const [tone, setTone] = useState(value ?? 50);

  const preview = tone <= 30 ? {
    label: "Serious",
    thai: "ขอกาแฟร้อนหนึ่งแก้ว",
    english: "One hot coffee, please.",
    mnemonic: "Think of ordering coffee in a business meeting."
  } : tone >= 70 ? {
    label: "Playful",
    thai: "ขอกาแฟร้อนหนึ่งแก้ว",
    english: "One hot coffee, please.",
    mnemonic: "Imagine a coffee-loving elephant doing a happy dance while ordering!"
  } : {
    label: "Balanced",
    thai: "ขอกาแฟร้อนหนึ่งแก้ว",
    english: "One hot coffee, please.",
    mnemonic: "Picture yourself confidently ordering coffee with a friendly smile."
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">
          🎭 How would you like to learn?
        </h3>
        <p className="text-gray-400">
          Choose between serious, practical mnemonics or fun, memorable ones.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-6">
          <span className="text-gray-400 text-sm w-20">Serious & Practical</span>
          <Slider
            value={[tone]}
            onValueChange={([newTone]) => setTone(newTone)}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-gray-400 text-sm w-20 text-right">Fun & Memorable</span>
        </div>

        <div className="neumorphic p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {tone <= 30 ? '🎯' : tone >= 70 ? '🎪' : '🎭'}
            </span>
            <h4 className="text-lg font-semibold text-white">
              {preview.label} Style Example
            </h4>
          </div>
          
          <div className="space-y-3">
            <p className="text-2xl text-blue-400">{preview.thai}</p>
            <p className="text-lg text-gray-300">{preview.english}</p>
            <div className="text-sm text-gray-500">
              <span className="text-gray-400">Mnemonic:</span> {preview.mnemonic}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="neumorphic-button bg-[#2a2a2a] hover:bg-[#333333] text-white px-8 py-3"
        >
          Back
        </button>
        <button
          className="neumorphic-button bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
          onClick={() => onNext(tone)}
        >
          Next
        </button>
      </div>
    </div>
  );
} 
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
    <div className="space-y-5 px-2">
      <div className="space-y-2.5">
        <h3 className="text-base font-medium text-white">
          How would you like to learn?
        </h3>
        <p className="text-xs text-gray-400">
          Choose between serious, practical mnemonics or fun, memorable ones.
        </p>
      </div>

      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-xs w-20">Serious & Practical</span>
          <Slider
            value={[tone]}
            onValueChange={([newTone]) => setTone(newTone)}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-gray-400 text-xs w-20 text-right">Fun & Memorable</span>
        </div>

        <div className="bg-[#1e1e1e] rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-white">
            {preview.label} Style Example
          </h4>
          
          <div className="space-y-2">
            <p className="text-blue-400 text-base">{preview.thai}</p>
            <p className="text-gray-300 text-sm">{preview.english}</p>
            <div className="text-xs text-gray-500">
              <span className="text-gray-400">Mnemonic:</span> {preview.mnemonic}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-3">
        <button
          onClick={onBack}
          className="rounded-full bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-400 px-4 py-1.5 text-xs"
        >
          Back
        </button>
        <button
          className="rounded-full bg-blue-600/90 hover:bg-blue-600 text-white px-4 py-1.5 text-xs"
          onClick={() => onNext(tone)}
        >
          Next
        </button>
      </div>
    </div>
  );
} 
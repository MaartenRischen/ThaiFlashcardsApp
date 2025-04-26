import React, { useState } from 'react';
import Image from 'next/image';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

const styles = [
  {
    label: 'Serious & Practical',
    value: 0,
    image: 'A',
    preview: {
      label: 'Serious',
      thai: 'ขอกาแฟร้อนหนึ่งแก้ว',
      english: 'One hot coffee, please.',
      mnemonic: 'Think of ordering coffee in a business meeting.'
    }
  },
  {
    label: 'Balanced',
    value: 1,
    image: 'B',
    preview: {
      label: 'Balanced',
      thai: 'ขอกาแฟร้อนหนึ่งแก้ว',
      english: 'One hot coffee, please.',
      mnemonic: 'Picture yourself confidently ordering coffee with a friendly smile.'
    }
  },
  {
    label: 'Absolutely Ridiculous',
    value: 2,
    image: 'C',
    preview: {
      label: 'Ridiculous',
      thai: 'ขอกาแฟร้อนหนึ่งแก้ว',
      english: 'One hot coffee, please.',
      mnemonic: 'Imagine a coffee-loving elephant doing a happy dance while ordering!'
    }
  }
];

export function ToneStep({ value, onNext, onBack }: { 
  value: number, 
  onNext: (tone: number) => void,
  onBack: () => void
}) {
  // Map value to style index
  const initialIndex = value <= 30 ? 0 : value >= 70 ? 2 : 1;
  const [selected, setSelected] = useState<number | null>(initialIndex);

  const handleSelect = (idx: number) => setSelected(idx);

  const selectedStyle = selected !== null ? styles[selected] : styles[1];

  return (
    <div className="space-y-5 px-2">
      <div className="space-y-2.5 text-center">
        <h3 className="text-base font-medium text-white">
          How would you like to learn?
        </h3>
        <p className="text-xs text-gray-400">
          Choose between serious, practical{' '}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="underline text-blue-300 hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
              >
                mnemonics
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-gray-800 text-white border-gray-700" side="top" align="center">
              <div className="p-2">
                <h4 className="font-semibold text-blue-400 mb-1">What's a mnemonic?</h4>
                <p className="text-sm text-gray-200 mb-2">
                  A mnemonic is a memory aid—a trick or story that helps you remember something more easily.
                </p>
                <p className="text-xs text-gray-400">
                  The app's name, <span className="font-semibold text-yellow-300">Donkey Bridge</span>, is a literal translation of the Dutch word <span className="italic">"ezelsbruggetje"</span>, which means mnemonic!
                </p>
              </div>
            </PopoverContent>
          </Popover>
          {' '}or fun, memorable ones.
        </p>
      </div>

      {/* Learning Style Image */}
      <div className="flex justify-center">
        <div className="relative w-full max-w-[300px] h-[160px] rounded-lg overflow-hidden border border-blue-900/30">
          <Image
            src={`/images/serious/${selectedStyle.image}.png`}
            alt={`${selectedStyle.label} learning style illustration`}
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* Choice Buttons - horizontal */}
      <div className="flex flex-row gap-3">
        {styles.map((style, idx) => (
          <button
            key={style.label}
            type="button"
            onClick={() => handleSelect(idx)}
            className={`flex-1 rounded-lg border-2 px-4 py-4 text-base font-semibold transition-all relative
              ${selected === idx
                ? 'bg-blue-600/90 text-white border-blue-500 shadow-md'
                : 'bg-blue-900/30 text-blue-300 border-blue-600/30 hover:bg-blue-800/40'}
            `}
          >
            {style.label}
          </button>
        ))}
      </div>

      {/* Preview Example */}
      <div className="bg-[#1e1e1e] rounded-lg p-4 space-y-3 text-center">
        <h4 className="text-sm font-medium text-white">
          {selectedStyle.preview.label} Style Example
        </h4>
        <div className="space-y-2">
          <p className="text-blue-400 text-base">{selectedStyle.preview.thai}</p>
          <p className="text-gray-300 text-sm">{selectedStyle.preview.english}</p>
          <div className="text-xs text-gray-500">
            <span className="text-gray-400">Mnemonic:</span> {selectedStyle.preview.mnemonic}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-3">
        <button
          onClick={onBack}
          className="neumorphic-button text-blue-400"
        >
          Back
        </button>
        <button
          className="neumorphic-button text-blue-400"
          onClick={() => selected !== null && onNext(selected === 0 ? 0 : selected === 2 ? 100 : 50)}
          disabled={selected === null}
        >
          Next
        </button>
      </div>
    </div>
  );
} 
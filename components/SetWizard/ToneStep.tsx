import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

// Map slider values (1-10) to tone categories
const getToneFromValue = (value: number): 'serious' | 'balanced' | 'absolutely ridiculous' => {
  if (value <= 3) return 'serious';
  if (value <= 7) return 'balanced';
  return 'absolutely ridiculous';
};

const getValueFromTone = (tone: 'serious' | 'balanced' | 'absolutely ridiculous'): number => {
  switch (tone) {
    case 'serious': return 2;
    case 'balanced': return 5;
    case 'absolutely ridiculous': return 9;
  }
};

const getLabelFromValue = (value: number): string => {
  switch (value) {
    case 1: return '1/10 Serious & practical';
    case 2: return '2/10 Balanced';
    case 3: return '3/10 A bit of fun involved';
    case 4: return '4/10 Party time';
    case 5: return '5/10 Ehm...';
    case 6: return '6/10 Oh shit';
    case 7: return '7/10 Oh well';
    case 8: return '8/10 You sure about that?';
    case 9: return '9/10 Heeeheeeheheheeeeeeheheheee';
    case 10: return '10/10 ̷̡̹͙͚͕̦̖̼̬̺̹͍̟͔͗̏͗͐͘͘͠E̶̡̩̟̳̪͖̼͎͚͍̖͖͈̖̥̒͑̍̊̈́͐̾̑͂̽͘͠R̷̛̦̯̖͎̼̯̙̳̟͗̇̀̍͒͌̋͝R̸̡͇̞͕̖̩̯̺̜̲͌̈́̽͗̋̅͆͑̾̊͑͜͠͠͝ͅƠ̵̻͍͖͖͕̳̜̹̰͓̞̠̈́̾͋̀̀̑͝R̴̢̨̢̜̥̥̭͚̺̖̮̻̜̐̍̎̀͗̈́̎̏̈́̆̄̈́͜͝ͅ ̶̛̬̮͕̙͕͚͖̹̻̦͋̇̓͐̑̆́̋̿̚0̷͈͚̍͋̈́̀̽̎̌̑̓͘͜x̵̦̖͇̖̼̺͚̤͎̆͋͋̐͂̔̃͛̾͘ͅD̶̨͔͎̬̪̎̋̒̆̃̌̀͒͗̓͌̚͝ͅ3̷̨͕̜̍́́̃́̿͑̅͑͑̑͜͠Ȁ̶̛̹͙̺͖͈͚͓̅̀̾́͋̋͆̈́͜͝D̷̢̛̛̻̹͎̲͔̭̤̮̟͗͂̏̈́̈́̀͊̎̚̚:̸̡̼̪̘̙̥͉̭́̍̓̈́̅̈́̌̾̃̓̎͘͜͠ ̸̧̧̛̻̹̲̟̜̺̱̯͇̲̙̬̯̘̭̤̞̯̐͗̈́̄̆̅̒͛͛';
    default: return '1/10 Serious & practical';
  }
};

const examples = {
  serious: {
    thai: 'ขอกาแฟร้อนหนึ่งแก้ว',
    english: 'One hot coffee, please.',
    mnemonic: 'Think of ordering coffee in a business meeting.'
  },
  balanced: {
    thai: 'ขอกาแฟร้อนหนึ่งแก้ว',
    english: 'One hot coffee, please.',
    mnemonic: 'Picture yourself confidently ordering coffee with a friendly smile.'
  },
  'absolutely ridiculous': {
    thai: 'ขอกาแฟร้อนหนึ่งแก้ว',
    english: 'One hot coffee, please.',
    mnemonic: 'Imagine a coffee-loving elephant doing a happy dance while ordering!'
  }
};

export function ToneStep({ value, onNext, onBack }: { 
  value: 'serious' | 'balanced' | 'absolutely ridiculous',
  onNext: (tone: 'serious' | 'balanced' | 'absolutely ridiculous') => void,
  onBack: () => void
}) {
  const [sliderValue, setSliderValue] = useState(getValueFromTone(value));
  const [isDragging, setIsDragging] = useState(false);

  // Handle touch events for better mobile experience
  useEffect(() => {
    const handleTouchEnd = () => setIsDragging(false);
    document.addEventListener('touchend', handleTouchEnd);
    return () => document.removeEventListener('touchend', handleTouchEnd);
  }, []);

  const currentTone = getToneFromValue(sliderValue);
  const currentExample = examples[currentTone];

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
                <h4 className="font-semibold text-blue-400 mb-1">What&apos;s a mnemonic?</h4>
                <p className="text-sm text-gray-200 mb-2">
                  A mnemonic is a memory aid—a trick or story that helps you remember something more easily.
                </p>
                <p className="text-xs text-gray-400">
                  The app&apos;s name, <span className="font-semibold text-yellow-300">Donkey Bridge</span>, is a literal translation of the Dutch word <span className="italic">&quot;ezelsbruggetje&quot;</span>, which means mnemonic!
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
            src={`/images/level2/${sliderValue}.png`}
            alt={`Learning style illustration - Level ${sliderValue}`}
            fill
            className={`object-cover transition-opacity duration-300 ${isDragging ? 'opacity-100' : 'opacity-100'}`}
            priority
          />
        </div>
      </div>

      {/* Style Label */}
      <div className="text-center">
        <h4 className="text-lg font-semibold text-blue-400 min-h-[3rem] transition-all duration-300">
          {getLabelFromValue(sliderValue)}
        </h4>
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <input
          type="range"
          min="1"
          max="10"
          value={sliderValue}
          onChange={(e) => setSliderValue(parseInt(e.target.value))}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-blue-900/30
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 
            [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 
            [&::-webkit-slider-thumb]:border-blue-400 [&::-webkit-slider-thumb]:shadow-lg
            [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full 
            [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:cursor-pointer 
            [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-blue-400
            [&::-moz-range-thumb]:shadow-lg"
        />
        <div className="flex justify-between px-1 text-xs text-gray-400">
          <span>1/10</span>
          <span>10/10</span>
        </div>
      </div>

      {/* Preview Example */}
      <div className="bg-[#1e1e1e] rounded-lg p-4 space-y-3 text-center">
        <h4 className="text-sm font-medium text-white">
          {getLabelFromValue(sliderValue)} Style Example
        </h4>
        <div className="space-y-2">
          <p className="text-blue-400 text-base">{currentExample.thai}</p>
          <p className="text-gray-300 text-sm">{currentExample.english}</p>
          <div className="text-xs text-gray-500">
            <span className="text-gray-400">Mnemonic:</span> {currentExample.mnemonic}
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
          onClick={() => onNext(currentTone)}
        >
          Next
        </button>
      </div>
    </div>
  );
} 
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

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
    case 10: return '̷̛̤̖̯͕̭͙̏̀̏̑̔̆͝Ǫ̶̬̩͇̼͖͖͈̯̳͎͛̀̐͌̅̿̈́̏̾̏̽̎H̶̼̹͓̩̥͈̞̫̯͋̓̄́̓̽̈́̈́̈́͛̎͒̿͜H̴̘͎̗̮̱̗̰̱͓̪̘͛̅̅̐͌̑͆̆̐͐̈́͌̚O̴̖̥̺͎̰̰̠͙̹̔̑̆͆͋̀̐̄̈́͝ͅI̴̢̛̩͔̺͓̯̯̟̱͎͓̾̃̅̈́̍͋̒̔̚͜͠͠͝͝Ḋ̵̻͓̹̼̳̻̼̼̥̳͍͛̈́̑̆̈́̈́̅͜͝͝͠͝Ǫ̶͔̯̟͙̪͗̆͛̍̓̒̔̒̎̄̈́̅͜͝͠N̵̢̢̩̫͚̪̦̥̳̯͚̺̍̏͂͗̌̍̿̾̿́̓͌͛͝K̷̨̨̟̺͔̻̮̯̰̤̬͇̟̙̆͆͗̀̈́̔̅͒͛͊͘͝͠I̶̡̢̡̛͔͎͍̤̤̪͍͙̜͚̓̀͋́̈́̈́̿͂̈́̐͘͘͜E';
    default: return 'Textbook realism';
  }
};

const examples = {
  1: {
    thai: 'ลาอยู่บนสะพาน',
    thaiMasculine: 'ลาอยู่บนสะพานครับ',
    thaiFeminine: 'ลาอยู่บนสะพานค่ะ',
    english: 'The donkey is on the bridge',
    pronunciation: 'laa yuu bon sa-paan',
    mnemonic: 'Think "laa" (donkey) on "sa-paan" (bridge) - simple and straightforward!'
  },
  2: {
    thai: 'ดูสิ! ลาอยู่บนสะพาน!',
    thaiMasculine: 'ดูสิ! ลาอยู่บนสะพานครับ!',
    thaiFeminine: 'ดูสิ! ลาอยู่บนสะพานค่ะ!',
    english: 'Look! The donkey is on the bridge!',
    pronunciation: 'duu si! laa yuu bon sa-paan!',
    mnemonic: 'Think "duu si" like "Do see!" - you\'re pointing out the donkey!'
  },
  3: {
    thai: 'นั่นลาบนสะพานชัดๆเลย ถ้าฉันเคยเห็นมาก่อน!',
    thaiMasculine: 'นั่นลาบนสะพานชัดๆเลยครับ ถ้าฉันเคยเห็นมาก่อน!',
    thaiFeminine: 'นั่นลาบนสะพานชัดๆเลยค่ะ ถ้าฉันเคยเห็นมาก่อน!',
    english: 'That\'s a donkey on a bridge if I\'ve ever seen one!',
    pronunciation: 'nan laa bon sa-paan chat chat loei, taa chan koei hen maa gorn!',
    mnemonic: 'Think "chat chat" like "got that!" - you\'re absolutely certain about the donkey!'
  },
  4: {
    thai: 'นั่นลาตลกจริงๆบนสะพานเลย',
    thaiMasculine: 'นั่นลาตลกจริงๆบนสะพานเลยครับ',
    thaiFeminine: 'นั่นลาตลกจริงๆบนสะพานเลยค่ะ',
    english: 'That\'s one actually funny donkey on a bridge',
    pronunciation: 'nan laa ta-lok jing jing bon sa-paan loei',
    mnemonic: 'Think "ta-lok" like "talk-laugh" - this donkey is genuinely amusing!'
  },
  5: {
    thai: 'เฮ้ยยย ไอ้หนุ่มลา! สบายดีบนสะพานนั้นปะเพื่อนนน?',
    thaiMasculine: 'เฮ้ยยย ไอ้หนุ่มลา! สบายดีบนสะพานนั้นปะเพื่อนนนครับ?',
    thaiFeminine: 'เฮ้ยยย ไอ้หนุ่มลา! สบายดีบนสะพานนั้นปะเพื่อนนนค่ะ?',
    english: 'Heeyyy donkey dude! You good on that bridge duude?',
    pronunciation: 'heyyy ai noom laa! sa-baai dee bon sa-paan nan pa pueaan?',
    mnemonic: 'Think "ai noom" for "dude" and stretch "pueaan" like "duuude" - super casual!'
  },
  6: {
    thai: 'ลาบินออกไปจากสะพานแล้ว',
    thaiMasculine: 'ลาบินออกไปจากสะพานแล้วครับ',
    thaiFeminine: 'ลาบินออกไปจากสะพานแล้วค่ะ',
    english: 'The donkey took off from the bridge',
    pronunciation: 'laa bin ork pai jaak sa-paan laew',
    mnemonic: 'Think "bin ork" like "been orc" - but it means flying away!'
  },
  7: {
    thai: 'ลาคือสะพาน ถ้าคุณคิดให้ดีๆ',
    thaiMasculine: 'ลาคือสะพาน ถ้าคุณคิดให้ดีๆครับ',
    thaiFeminine: 'ลาคือสะพาน ถ้าคุณคิดให้ดีๆค่ะ',
    english: 'Donkeys are bridges if you really think about it',
    pronunciation: 'laa kuue sa-paan taa kun kit hai dee dee',
    mnemonic: 'Think "kuue" as "is" and "kit hai dee dee" like "deep thinking" - philosophical donkeys!'
  },
  8: {
    thai: 'ในจักรวาลหลายมิติ ลาปกครองทฤษฎีคำหลายความหมาย',
    thaiMasculine: 'ในจักรวาลหลายมิติ ลาปกครองทฤษฎีคำหลายความหมายครับ',
    thaiFeminine: 'ในจักรวาลหลายมิติ ลาปกครองทฤษฎีคำหลายความหมายค่ะ',
    english: 'Within multiverses, donkeys rule the multiple words theory.',
    pronunciation: 'nai jak-ra-waan laai mi-ti, laa pok-krong trit-sa-dee kam laai kwaam-maai',
    mnemonic: 'Think "jak-ra-waan" for "universe" and "trit-sa-dee" for "theory" - cosmic donkey physics!'
  },
  9: {
    thai: 'ลา, ลาเหลา, ลูกกุญแจประตู และลิง ลาลาลาลา',
    thaiMasculine: 'ลา, ลาเหลา, ลูกกุญแจประตู และลิง ลาลาลาลาครับ',
    thaiFeminine: 'ลา, ลาเหลา, ลูกกุญแจประตู และลิง ลาลาลาลาค่ะ',
    english: 'Donkeys, dorkeys, door keys and monkeys lalalalala',
    pronunciation: 'laa, laa-lao, look-kun-jae pra-dtuu lae ling la-la-la-la',
    mnemonic: 'Think sing-song "la-la-la" and "look-kun-jae" for door keys - pure chaotic silliness!'
  },
  10: {
    thai: 'า̶̬̩͇̼͖͖͈̯̳͎͛̀̐͌̅̿̈́̏̾̏̽̎',
    thaiMasculine: 'า̶̬̩͇̼͖͖͈̯̳͎͛̀̐͌̅̿̈́̏̾̏̽̎ครับ',
    thaiFeminine: 'า̶̬̩͇̼͖͖͈̯̳͎͛̀̐͌̅̿̈́̏̾̏̽̎ค่ะ',
    english: 'า̶̬̩͇̼͖͖͈̯̳͎͛̀̐͌̅̿̈́̏̾̏̽̎',
    pronunciation: 'า̶̬̩͇̼͖͖͈̯̳͎͛̀̐͌̅̿̈́̏̾̏̽̎',
    mnemonic: 'า̶̬̩͇̼͖͖͈̯̳͎͛̀̐͌̅̿̈́̏̾̏̽̎'
  }
} as const;

type ExampleKey = keyof typeof examples;

export function ToneStep({ toneLevel, onNext, onBack }: { 
  toneLevel: number,
  onNext: (toneLevel: number) => void,
  onBack: () => void
}) {
  const [currentToneLevel, setCurrentToneLevel] = useState(toneLevel);
  const [isDragging, setIsDragging] = useState(false);

  // Handle touch events for better mobile experience
  useEffect(() => {
    const handleTouchEnd = () => setIsDragging(false);
    document.addEventListener('touchend', handleTouchEnd);
    return () => document.removeEventListener('touchend', handleTouchEnd);
  }, []);

  // Ensure currentToneLevel is within valid range and is a number
  const safeToneLevel = Math.max(1, Math.min(10, Number(currentToneLevel) || 1)) as ExampleKey;
  const currentExample = examples[safeToneLevel];

  return (
    <div className="space-y-5 px-2">
      <div className="space-y-2.5 text-center">
        <h3 className="text-base font-medium text-white">
          How would you like to learn?
        </h3>
      </div>

      {/* Learning Style Image */}
      <div className="flex justify-center">
        <div className="relative w-full max-w-[300px] h-[160px] rounded-lg overflow-hidden border border-blue-900/30">
          <Image
            src={`/images/level2/${safeToneLevel}.png`}
            alt={`Learning style illustration - Tone Level ${safeToneLevel}`}
            fill
            className={`object-cover transition-opacity duration-300 ${isDragging ? 'opacity-100' : 'opacity-100'}`}
            priority
          />
        </div>
      </div>

      {/* Style Label */}
      <div className="text-center">
        <h4 className="text-lg font-semibold text-blue-400 min-h-[3rem] transition-all duration-300">
          {getToneLevelLabel(safeToneLevel)}
        </h4>
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <input
          type="range"
          min="1"
          max="10"
          value={safeToneLevel}
          onChange={(e) => setCurrentToneLevel(parseInt(e.target.value))}
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
          <span>Tone Level: {safeToneLevel}/10</span>
          <span>10/10</span>
        </div>
      </div>

      {/* Preview Example */}
      <div className="bg-[#1e1e1e] rounded-lg p-4 space-y-3">
        <h4 className="text-sm font-medium text-white text-center">
          Style Example
        </h4>
        <div className="space-y-3">
          {/* English Translation */}
          <p className="text-gray-300 text-sm text-center">
            {currentExample.english}
          </p>

          {/* Thai Text */}
          <p className="text-blue-400 text-base text-center">{currentExample.thai}</p>
          
          {/* Pronunciation Guide */}
          <p className="text-gray-500 text-sm text-center italic">
            {currentExample.pronunciation}
          </p>

          {/* Mnemonic */}
          <p className="text-xs text-gray-500 text-center">
            {currentExample.mnemonic}
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between space-x-4">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-2 text-sm font-medium text-blue-400 bg-transparent border border-blue-400 rounded-lg hover:bg-blue-400/10 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => onNext(safeToneLevel)}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
} 
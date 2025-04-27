import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

const getLabelFromValue = (value: number): string => {
  switch (value) {
    case 1: return 'Serious & practical';
    case 2: return 'Balanced';
    case 3: return 'A bit of fun involved';
    case 4: return 'Party time';
    case 5: return 'Ehm...';
    case 6: return 'Oh shit';
    case 7: return 'Oh well';
    case 8: return 'You sure about that?';
    case 9: return 'Heeeheeeheheheeeeeeheheheee';
    case 10: return '̷̛̤̖̯͕̭͙̏̀̏̑̔̆͝Ǫ̶̬̩͇̼͖͖͈̯̳͎͛̀̐͌̅̿̈́̏̾̏̽̎H̶̼̹͓̩̥͈̞̫̯͋̓̄́̓̽̈́̈́̈́͛̎͒̿͜H̴̘͎̗̮̱̗̰̱͓̪̘͛̅̅̐͌̑͆̆̐͐̈́͌̚O̴̖̥̺͎̰̰̠͙̹̔̑̆͆͋̀̐̄̈́͝ͅI̴̢̛̩͔̺͓̯̯̟̱͎͓̾̃̅̈́̍͋̒̔̚͜͠͠͝͝Ḋ̵̻͓̹̼̳̻̼̼̥̳͍͛̈́̑̆̈́̈́̅͜͝͝͠͝Ǫ̶͔̯̟͙̪͗̆͛̍̓̒̔̒̎̄̈́̅͜͝͠N̵̢̢̩̫͚̪̦̥̳̯͚̺̍̏͂͗̌̍̿̾̿́̓͌͛͝K̷̨̨̟̺͔̻̮̯̰̤̬͇̟̙̆͆͗̀̈́̔̅͒͛͊͘͝͠I̶̡̢̡̛͔͎͍̤̤̪͍͙̜͚̓̀͋́̈́̈́̿͂̈́̐͘͘͜E̵͈̪̩͚͍͓͈͓̦͕͖̥͂̎̐̋̾̋̾̈́͐͐̔̔̓̔͜';
    default: return 'Serious & practical';
  }
};

const examples = {
  1: {
    thai: 'ลาอยู่บนสะพาน',
    thaiMasculine: 'ลาอยู่บนสะพานครับ',
    thaiFeminine: 'ลาอยู่บนสะพานค่ะ',
    english: 'The donkey is on the bridge.',
    pronunciation: 'laa yuu bon sa-paan',
    mnemonic: 'Think "laa" like "la-la" - the donkey standing quietly!'
  },
  2: {
    thai: 'เฮ้! ลาอยู่บนสะพาน!',
    thaiMasculine: 'เฮ้! ลาอยู่บนสะพานครับ!',
    thaiFeminine: 'เฮ้! ลาอยู่บนสะพานค่ะ!',
    english: 'Hey! The donkey is on the bridge!',
    pronunciation: 'hey! laa yuu bon sa-paan!',
    mnemonic: 'Think "hey!" - excitement is building!'
  },
  3: {
    thai: 'ลาตัวนั้นเต้นอยู่บนสะพาน!',
    thaiMasculine: 'ลาตัวนั้นเต้นอยู่บนสะพานครับ!',
    thaiFeminine: 'ลาตัวนั้นเต้นอยู่บนสะพานค่ะ!',
    english: 'That donkey there... dances on that bridge!',
    pronunciation: 'laa dtua nan dten yuu bon sa-paan!',
    mnemonic: 'Think "dten" like "dancing" - getting groovy!'
  },
  4: {
    thai: 'ลาทำอึบนสะพานปาร์ตี้',
    thaiMasculine: 'ลาทำอึบนสะพานปาร์ตี้ครับ',
    thaiFeminine: 'ลาทำอึบนสะพานปาร์ตี้ค่ะ',
    english: 'Donkey dude be doing a doodoo on the party bridge.',
    pronunciation: 'laa tam ue bon sa-paan paa-dtee',
    mnemonic: 'Think "tam ue" like "tummy ooops" - party time got messy!'
  },
  5: {
    thai: 'ลาตลกกับเป็ดน้อยทำอะไรบางอย่างจริงๆนะ ใช่ไหม?',
    thaiMasculine: 'ลาตลกกับเป็ดน้อยทำอะไรบางอย่างจริงๆนะครับ ใช่ไหม?',
    thaiFeminine: 'ลาตลกกับเป็ดน้อยทำอะไรบางอย่างจริงๆนะคะ ใช่ไหม?',
    english: 'The clonkey (clown donkey) and his buddy ducky do the deed indeed, do they?',
    pronunciation: 'laa dta-lok gap bped noi tam a-rai baang yaang jing jing na, chai mai?',
    mnemonic: 'Think "dta-lok" like "the lock" - but nothing is locked down anymore!'
  },
  6: {
    thai: 'ลาตลก เป็ดน้อย และแม่ของพวกเขาบินออกจากสะพาน โอ้มายก้อด เฮ้นี่!',
    thaiMasculine: 'ลาตลก เป็ดน้อย และแม่ของพวกเขาบินออกจากสะพาน โอ้มายก้อด เฮ้นี่ครับ!',
    thaiFeminine: 'ลาตลก เป็ดน้อย และแม่ของพวกเขาบินออกจากสะพาน โอ้มายก้อด เฮ้นี่ค่ะ!',
    english: 'The clonkey, his buddy ducky and their moother fly off the bridge omg. Hey now.',
    pronunciation: 'laa dta-lok, bped noi, lae mae kong puak kao bin ork jaak sa-paan, oh-my-god, hey nee!',
    mnemonic: 'Think "bin ork" like "been orc" - but flying not fighting!'
  },
  7: {
    thai: 'ชีวิตลาตลกมันฟังกี้ ขอเงินฉันสิ เอ้ย ลิงฉัน โอเคเพื่อน?',
    thaiMasculine: 'ชีวิตลาตลกมันฟังกี้ ขอเงินฉันสิ เอ้ย ลิงฉัน โอเคเพื่อนครับ?',
    thaiFeminine: 'ชีวิตลาตลกมันฟังกี้ ขอเงินฉันสิ เอ้ย ลิงฉัน โอเคเพื่อนค่ะ?',
    english: 'Clonkey donkey life is fonkey give me my monkey I mean money ok buddy?',
    pronunciation: 'chee-wit laa dta-lok man fun-kee kor ngern chan si, oei, ling chan, ok buddy?',
    mnemonic: 'Think "fun-kee" like "funky" - everything\'s getting wild!'
  },
  8: {
    thai: 'เย่ เย่ เย่ เอ้า ลาที่รัก เธอทำหรือทำอึ ฉันไม่รู้ที่ตำรวจนี่',
    thaiMasculine: 'เย่ เย่ เย่ เอ้า ลาที่รัก เธอทำหรือทำอึ ฉันไม่รู้ที่ตำรวจนี่ครับ',
    thaiFeminine: 'เย่ เย่ เย่ เอ้า ลาที่รัก เธอทำหรือทำอึ ฉันไม่รู้ที่ตำรวจนี่ค่ะ',
    english: 'Yeah yeah yeah now well hey dear donkey do you do or dodo cause I don\'t know at this popo',
    pronunciation: 'yay yay yay ao laa tee rak ter tam rue tam ue chan mai roo tee tam-ruat nee',
    mnemonic: 'Think "tam-ruat" like "tumbling rat" - everything\'s spinning!'
  },
  9: {
    thai: 'ฮี่ฮ่ะฮี่ฮ่ะฮี่ฮ่ะฮี่ฮ่ะฮี่ฮ่ะฮี่',
    thaiMasculine: 'ฮี่ฮ่ะฮี่ฮ่ะฮี่ฮ่ะฮี่ฮ่ะฮี่ฮ่ะฮี่ครับ',
    thaiFeminine: 'ฮี่ฮ่ะฮี่ฮ่ะฮี่ฮ่ะฮี่ฮ่ะฮี่ฮ่ะฮี่ค่ะ',
    english: 'Heeeheheheeeheheheheheheheheeeee',
    pronunciation: 'hee-ha-hee-ha-hee-ha-hee',
    mnemonic: 'Think "hee-ha" like "heehaw" - but way more chaotic!'
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

export function ToneStep({ value, onNext, onBack }: { 
  value: number,
  onNext: (value: number) => void,
  onBack: () => void
}) {
  const [sliderValue, setSliderValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);

  // Handle touch events for better mobile experience
  useEffect(() => {
    const handleTouchEnd = () => setIsDragging(false);
    document.addEventListener('touchend', handleTouchEnd);
    return () => document.removeEventListener('touchend', handleTouchEnd);
  }, []);

  // Ensure sliderValue is within valid range and is a number
  const safeSliderValue = Math.max(1, Math.min(10, Number(sliderValue) || 1)) as ExampleKey;
  const currentExample = examples[safeSliderValue];

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
            src={`/images/level2/${safeSliderValue}.png`}
            alt={`Learning style illustration - Level ${safeSliderValue}`}
            fill
            className={`object-cover transition-opacity duration-300 ${isDragging ? 'opacity-100' : 'opacity-100'}`}
            priority
          />
        </div>
      </div>

      {/* Style Label */}
      <div className="text-center">
        <h4 className="text-lg font-semibold text-blue-400 min-h-[3rem] transition-all duration-300">
          {getLabelFromValue(safeSliderValue)}
        </h4>
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <input
          type="range"
          min="1"
          max="10"
          value={safeSliderValue}
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
            <span className="text-gray-400">Mnemonic:</span> {currentExample.mnemonic}
          </p>
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
          onClick={() => onNext(safeSliderValue)}
        >
          Next
        </button>
      </div>
    </div>
  );
} 
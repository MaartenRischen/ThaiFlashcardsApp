import React, { useState } from 'react';

export function ToneStep({ value, onNext }: { value: number, onNext: (tone: number) => void }) {
  const [tone, setTone] = useState(value ?? 50);

  // Example previews
  const preview = tone < 30
    ? {
        label: 'Serious/Practical',
        thai: 'ขอข้าวผัดหนึ่งจานครับ',
        english: 'One plate of fried rice, please.',
        mnemonic: 'ข้าว (khao) = rice, ผัด (pad) = fried',
      }
    : tone > 70
    ? {
        label: 'Ridiculous/Comedic',
        thai: 'ขอข้าวผัดที่บินได้หนึ่งจานนะ!',
        english: 'One plate of flying fried rice, please!',
        mnemonic: 'Imagine your rice flying off the plate!',
      }
    : {
        label: 'Balanced',
        thai: 'ขอข้าวผัดอร่อยๆ หนึ่งจานครับ',
        english: 'One plate of delicious fried rice, please.',
        mnemonic: 'Think of tasty rice you want to order.',
      };

  return (
    <div className="space-y-6 p-4">
      <div className="text-lg font-semibold text-blue-700 mb-2">🎭 How serious or playful do you want your learning to be?</div>
      <div className="flex items-center gap-4">
        <span className="text-gray-500">Serious</span>
        <input
          type="range"
          min={0}
          max={100}
          value={tone}
          onChange={e => setTone(Number(e.target.value))}
          className="flex-1 accent-blue-600"
        />
        <span className="text-gray-500">Ridiculous</span>
      </div>
      <div className="mt-4 p-4 border rounded bg-gray-50">
        <div className="font-bold text-blue-700 mb-1">{preview.label} Example</div>
        <div className="text-xl mb-1">{preview.thai}</div>
        <div className="text-gray-700 mb-1">{preview.english}</div>
        <div className="text-sm text-gray-500">Mnemonic: {preview.mnemonic}</div>
      </div>
      <div className="flex gap-4 mt-6">
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700"
          onClick={() => onNext(tone)}
        >
          Next
        </button>
      </div>
    </div>
  );
} 
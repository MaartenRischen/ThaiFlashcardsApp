'use client';

import { useState } from 'react';
import { elevenLabsTTS, ALTERNATIVE_VOICES } from '../lib/elevenlabs-tts';

export default function TestElevenLabs() {
  const [text, setText] = useState('สวัสดีครับ ผมชื่อสมชาย');
  const [isMale, setIsMale] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceId, setVoiceId] = useState<string>('');

  const handleSpeak = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await elevenLabsTTS.speak(
        text, 
        isMale,
        voiceId ? { voiceId } : {}
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetVoices = async () => {
    try {
      const voices = await elevenLabsTTS.getVoices();
      console.log('Available voices:', voices);
      alert(`Found ${voices.length} voices. Check console for details.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch voices');
    }
  };

  const handleGetSubscription = async () => {
    try {
      const info = await elevenLabsTTS.getSubscriptionInfo();
      console.log('Subscription info:', info);
      if (info) {
        alert(`Character count: ${info.character_count}/${info.character_limit}. Check console for full details.`);
      } else {
        alert('Failed to fetch subscription info');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription info');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">ElevenLabs TTS Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Text to speak:</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-2 border rounded"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Voice Gender:</label>
            <div className="space-x-4">
              <label>
                <input
                  type="radio"
                  checked={isMale}
                  onChange={() => setIsMale(true)}
                  className="mr-1"
                />
                Male
              </label>
              <label>
                <input
                  type="radio"
                  checked={!isMale}
                  onChange={() => setIsMale(false)}
                  className="mr-1"
                />
                Female
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Custom Voice ID (optional):
            </label>
            <select
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Default ({isMale ? 'Adam' : 'Rachel'})</option>
              <optgroup label="Male Voices">
                {Object.entries(ALTERNATIVE_VOICES.male).map(([name, id]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </optgroup>
              <optgroup label="Female Voices">
                {Object.entries(ALTERNATIVE_VOICES.female).map(([name, id]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded">
              Error: {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSpeak}
              disabled={isLoading || !text}
              className={`px-4 py-2 rounded font-medium ${
                isLoading || !text
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isLoading ? 'Speaking...' : 'Speak'}
            </button>

            <button
              onClick={handleGetVoices}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Get Voices
            </button>

            <button
              onClick={handleGetSubscription}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Check Subscription
            </button>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 p-4 rounded">
          <h2 className="font-semibold mb-2">Test Phrases:</h2>
          <div className="space-y-2 text-sm">
            <button
              onClick={() => setText('สวัสดีครับ ผมชื่อสมชาย')}
              className="block text-left hover:text-blue-600"
            >
              สวัสดีครับ ผมชื่อสมชาย (Hello, my name is Somchai - Male)
            </button>
            <button
              onClick={() => setText('สวัสดีค่ะ ดิฉันชื่อมาลี')}
              className="block text-left hover:text-blue-600"
            >
              สวัสดีค่ะ ดิฉันชื่อมาลี (Hello, my name is Malee - Female)
            </button>
            <button
              onClick={() => setText('อาหารไทยอร่อยมาก')}
              className="block text-left hover:text-blue-600"
            >
              อาหารไทยอร่อยมาก (Thai food is very delicious)
            </button>
            <button
              onClick={() => setText('ขอบคุณมากครับ')}
              className="block text-left hover:text-blue-600"
            >
              ขอบคุณมากครับ (Thank you very much - Male)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
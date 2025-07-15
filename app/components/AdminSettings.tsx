import React, { useState, useEffect } from 'react';
import { Switch } from "@/app/components/ui/switch";
import { ttsService } from '../lib/tts-service';
import { elevenLabsTTS } from '../lib/elevenlabs-tts';

interface AdminSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ isOpen, onClose }) => {
  const [useElevenLabs, setUseElevenLabs] = useState(true);
  const [testText, setTestText] = useState('สวัสดีครับ ผมกำลังทดสอบเสียง');
  const [isMale, setIsMale] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  
  useEffect(() => {
    // Get current TTS provider setting
    const currentProvider = ttsService.getProvider();
    setUseElevenLabs(currentProvider === 'elevenlabs');
    
    // Fetch subscription info if using ElevenLabs
    if (currentProvider === 'elevenlabs') {
      fetchSubscriptionInfo();
    }
  }, [isOpen]);
  
  const fetchSubscriptionInfo = async () => {
    try {
      const info = await elevenLabsTTS.getSubscriptionInfo();
      setSubscriptionInfo(info);
    } catch (error) {
      console.error('Failed to fetch subscription info:', error);
    }
  };
  
  const handleProviderToggle = (checked: boolean) => {
    setUseElevenLabs(checked);
    ttsService.setProvider(checked ? 'elevenlabs' : 'browser');
  };
  
  const handleTestVoice = async () => {
    if (!ttsService) {
      console.error('TTS service not initialized');
      return;
    }
    
    setIsTesting(true);
    
    try {
      await ttsService.speak({
        text: testText,
        genderValue: isMale,
        onStart: () => console.log('Test voice started'),
        onEnd: () => {
          console.log('Test voice ended');
          setIsTesting(false);
        },
        onError: (error) => {
          console.error('Test voice error:', error);
          setIsTesting(false);
        }
      });
    } catch (error) {
      console.error('Test voice error:', error);
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Admin Settings</h2>
        
        {/* TTS Provider Toggle */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">
              Text-to-Speech Provider
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Browser</span>
              <Switch
                checked={useElevenLabs}
                onCheckedChange={handleProviderToggle}
              />
              <span className="text-sm text-gray-500">ElevenLabs</span>
            </div>
          </div>
          
          {useElevenLabs && subscriptionInfo && (
            <div className="mt-2 p-3 bg-blue-50 rounded text-sm">
              <p className="font-medium">ElevenLabs Usage:</p>
              <p>
                {subscriptionInfo.character_count.toLocaleString()} / {subscriptionInfo.character_limit.toLocaleString()} characters
              </p>
              <p className="text-xs text-gray-600 mt-1">
                ({Math.round((subscriptionInfo.character_count / subscriptionInfo.character_limit) * 100)}% used)
              </p>
            </div>
          )}
          
          {!useElevenLabs && (
            <div className="mt-2 p-3 bg-yellow-50 rounded text-sm">
              <p className="text-yellow-800">
                Using browser TTS with pitch adjustment for male voices.
              </p>
            </div>
          )}
        </div>
        
        {/* Voice Test Section */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Test Voice</h3>
          
          <input
            type="text"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="w-full p-2 border rounded mb-2"
            placeholder="Enter test text..."
          />
          
          <div className="flex items-center space-x-4 mb-2">
            <label className="flex items-center">
              <input
                type="radio"
                checked={isMale}
                onChange={() => setIsMale(true)}
                className="mr-1"
              />
              <span className="text-sm">Male</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={!isMale}
                onChange={() => setIsMale(false)}
                className="mr-1"
              />
              <span className="text-sm">Female</span>
            </label>
          </div>
          
          <button
            onClick={handleTestVoice}
            disabled={isTesting || !testText}
            className={`px-4 py-2 rounded text-sm ${
              isTesting || !testText
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isTesting ? 'Testing...' : 'Test Voice'}
          </button>
        </div>
        
        {/* Buttons */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings; 
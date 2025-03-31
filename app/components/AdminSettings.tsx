import React, { useState, useEffect } from 'react';
import { Switch } from "@/app/components/ui/switch";
import { ttsService } from '../lib/tts-service';

interface AdminSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('browser');
  const [testVoice, setTestVoice] = useState('');
  const [voices, setVoices] = useState<string[]>([]);
  const [isMale, setIsMale] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  
  useEffect(() => {
    // Load API key from localStorage
    const savedApiKey = localStorage.getItem('ttsApiKey') || '';
    setApiKey(savedApiKey);
    
    // Load current provider
    const savedProvider = localStorage.getItem('ttsProvider') || 'browser';
    setProvider(savedProvider);
    
    // Load available voices
    loadVoices();
  }, [isOpen]);
  
  const loadVoices = async () => {
    try {
      const voiceList = await ttsService.getVoices();
      setVoices(voiceList);
    } catch (error) {
      console.error('Error loading voices:', error);
    }
  };
  
  const handleSave = () => {
    // Save API key to localStorage
    if (apiKey) {
      localStorage.setItem('ttsApiKey', apiKey);
      
      // Reload the page to initialize with new API key
      window.location.reload();
    }
    
    onClose();
  };
  
  const handleProviderChange = (checked: boolean) => {
    const newProvider = checked ? 'googleCloud' : 'browser';
    setProvider(newProvider);
    localStorage.setItem('ttsProvider', newProvider);
    ttsService.useProvider(newProvider);
  };
  
  const handleTestVoice = async () => {
    setIsPlaying(true);
    
    try {
      await ttsService.speak({
        text: testVoice || 'สวัสดีครับ ทดสอบเสียง',
        isMale,
        onEnd: () => setIsPlaying(false),
        onError: () => setIsPlaying(false)
      });
    } catch (error) {
      console.error('Test voice error:', error);
      setIsPlaying(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="neumorphic max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">TTS Admin Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Google Cloud TTS API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="neumorphic-input w-full p-2 rounded-sm"
              placeholder="Paste your Google Cloud API key here"
            />
            <p className="text-xs text-gray-400 mt-1">
              Get a key from <a href="https://cloud.google.com/text-to-speech" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google Cloud Console</a>
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Use Premium TTS</span>
            <Switch 
              checked={provider === 'googleCloud'} 
              onCheckedChange={handleProviderChange} 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Test Voice
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={testVoice}
                onChange={(e) => setTestVoice(e.target.value)}
                className="neumorphic-input flex-1 p-2 rounded-sm"
                placeholder="Enter Thai text to test"
              />
              <button
                onClick={handleTestVoice}
                disabled={isPlaying}
                className="neumorphic-button"
              >
                {isPlaying ? 'Playing...' : 'Test'}
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-gray-300 text-sm">♀</span>
              <Switch checked={isMale} onCheckedChange={setIsMale} />
              <span className="text-gray-300 text-sm">♂</span>
            </div>
            <span className="text-xs text-gray-400">Test with {isMale ? 'Male' : 'Female'} voice</span>
          </div>
          
          <div className="text-center mt-6">
            <button
              onClick={handleSave}
              className="neumorphic-button text-blue-400 px-6 py-2"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings; 
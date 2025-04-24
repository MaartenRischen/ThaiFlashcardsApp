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
  const [isMale, setIsMale] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  
  useEffect(() => {
    // Load API key from localStorage (if you still want to use it for Google as a fallback/option?)
    // Or potentially adapt this for AWS keys if needed, though .env.local is better.
    const savedApiKey = localStorage.getItem('ttsApiKey') || ''; 
    setApiKey(savedApiKey);
    
    // Determine provider based on AWS initialization status (or localStorage if needed)
    // This logic might need refinement based on how you want to manage providers now
    const awsInitialized = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID && process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY;
    setProvider(awsInitialized ? 'awsPolly' : 'browser');
    
    // Remove call to loadVoices
    // loadVoices();
  }, [isOpen]);
  
  // Remove loadVoices function
  // const loadVoices = async () => { ... };
  
  const handleSave = () => {
    // This save logic likely needs adjustment if primarily using AWS via .env.local
    // Maybe remove the API key field if not used for Google anymore?
    if (apiKey) {
      localStorage.setItem('ttsApiKey', apiKey);
    }
    // No page reload needed if using .env.local for AWS
    // window.location.reload();
    onClose();
  };
  
  // Remove provider change handler (controlled by AWS env vars primarily now)
  // const handleProviderChange = (checked: boolean) => { ... };
  
  const handleTestVoice = async () => {
    if (!ttsService) {
      alert('TTS Service not available');
      return;
    }
    try {
      setIsTesting(true);
      // Use genderValue: isMale for the test call (true is male, false is female)
      await ttsService.speak({
        text: testVoice || 'สวัสดีครับ ทดสอบเสียง', // Default Thai test phrase
        genderValue: isMale, // Use genderValue matching the isMale state
        onEnd: () => setIsTesting(false),
        onError: (err: unknown) => {
          console.error("TTS Test Error:", err);
          const message =
            typeof err === "object" && err && "message" in err && typeof (err as { message?: unknown }).message === "string"
              ? (err as { message: string }).message
              : String(err);
          alert(`TTS Test Error: ${message}`);
          setIsTesting(false);
        }
      });
    } catch (error: unknown) {
      console.error("TTS Test Error:", error);
      let message = 'Unknown error';
      if (typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
        message = (error as { message: string }).message;
      } else {
        message = String(error);
      }
      alert(`TTS Test Error: ${message}`);
      setIsTesting(false);
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
            <span>Use Premium TTS (AWS)</span>
            <Switch 
              checked={provider === 'awsPolly'}
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
                disabled={isTesting}
                className="neumorphic-button"
              >
                {isTesting ? 'Testing...' : 'Test'}
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
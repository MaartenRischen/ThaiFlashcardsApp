import React, { useState } from 'react';
import { Switch } from "@/app/components/ui/switch";
import { ttsService } from '../lib/tts-service';

interface AdminSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ isOpen, onClose }) => {
  const [testText, setTestText] = useState('สวัสดีครับ ผมกำลังทดสอบเสียง');
  const [isMale, setIsMale] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  
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
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Admin Settings</h2>
        
        {/* TTS Info */}
        <div className="mb-6">
          <div className="p-3 bg-blue-50 rounded">
            <p className="font-medium text-sm">Voice Provider: Microsoft Azure</p>
            <p className="text-xs text-gray-600 mt-1">
              Using native Thai voices for authentic pronunciation
            </p>
          </div>
          
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            {showInstructions ? 'Hide' : 'Show'} Azure Setup Instructions
          </button>
          
          {showInstructions && (
            <div className="mt-2 p-3 bg-gray-50 rounded text-xs">
              <p className="font-medium mb-1">To enable Azure TTS:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Get Azure Speech Service credentials</li>
                <li>Edit app/lib/azure-tts.ts</li>
                <li>Replace AZURE_SPEECH_KEY and AZURE_SPEECH_REGION</li>
                <li>Restart the application</li>
              </ol>
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
              <span className="text-sm">Male (Niwat)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={!isMale}
                onChange={() => setIsMale(false)}
                className="mr-1"
              />
              <span className="text-sm">Female (Premwadee)</span>
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
        
        {/* Voice Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded text-xs">
          <p className="font-medium mb-1">Thai Voice Information:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Male: Niwat - Natural Thai male voice</li>
            <li>Female: Premwadee - Natural Thai female voice</li>
            <li>Alternative: Achara - Another Thai female option</li>
            <li>Fallback: Browser TTS if Azure unavailable</li>
          </ul>
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
'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ImageTestPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs(prevLogs => [...prevLogs, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const testIdeogram = async () => {
    try {
      setError(null);
      setIsLoading(true);
      addLog('Starting Ideogram API test...');

      const response = await fetch('/api/test-ideogram');
      const data = await response.json();

      if (data.success && data.imageUrl) {
        addLog('Ideogram test successful!');
        addLog(`Generated image URL: ${data.imageUrl}`);
        setImageUrl(data.imageUrl);
      } else {
        addLog(`Ideogram test failed: ${data.error}`);
        setError(`Ideogram API Error: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      addLog(`Error testing Ideogram: ${err}`);
      setError(`Error: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Image Loading Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">API Tests</h2>
          
          <div className="space-y-4">
            <div>
              <button
                onClick={testIdeogram}
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {isLoading ? 'Testing...' : 'Test Ideogram API'}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <div className="mt-4">
            <h3 className="font-semibold">Logs:</h3>
            <div className="bg-black text-green-400 p-3 rounded-lg h-64 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs yet. Run a test to see logs.</div>
              ) : (
                logs.map((log, i) => <div key={i}>{log}</div>)
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Image Preview</h2>
          
          <div className="relative w-full aspect-video bg-gray-200 rounded-lg overflow-hidden">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt="Generated image"
                fill
                unoptimized={true}
                style={{ objectFit: 'cover' }}
                onError={() => {
                  addLog('Error loading image!');
                  setError('Image failed to load');
                }}
                onLoad={() => addLog('Image loaded successfully!')}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No image generated yet
              </div>
            )}
          </div>
          
          {imageUrl && (
            <div className="mt-4">
              <h3 className="font-semibold">Image URL:</h3>
              <div className="bg-gray-200 p-2 rounded break-all text-xs">
                {imageUrl}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
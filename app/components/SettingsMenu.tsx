'use client';

import { useState, useRef } from 'react';
import { exportUserData, importUserData } from '../utils/storage';

export default function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await importUserData(file);
      setImportSuccess(true);
      setImportError(null);
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (error) {
      setImportError('Error importing data. Please check your file format.');
      setTimeout(() => setImportError(null), 3000);
    }
  };

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-colors duration-200 z-50"
        title="Settings"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 bg-gray-800 rounded-lg shadow-xl p-4 w-72 border border-gray-700 z-50">
          <h3 className="text-lg font-bold mb-4 text-white">Settings</h3>
          
          <div className="space-y-4">
            <div>
              <button
                onClick={exportUserData}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-200"
              >
                Export Data
              </button>
              <p className="text-sm text-gray-400 mt-1">
                Download your progress and notes
              </p>
            </div>

            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors duration-200"
              >
                Import Data
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
              <p className="text-sm text-gray-400 mt-1">
                Restore from backup file
              </p>
            </div>

            {importError && (
              <p className="text-red-500 text-sm">{importError}</p>
            )}
            {importSuccess && (
              <p className="text-green-500 text-sm">Data imported successfully!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 
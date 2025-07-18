'use client';

import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { Copy, CheckCircle } from 'lucide-react';

export function UserInfo() {
  const { user } = useUser();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const handleCopy = async () => {
    if (user.id) {
      await navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 bg-[#2C2C2C] border border-[#404040] rounded-lg p-3 shadow-lg max-w-sm">
      <div className="text-xs text-gray-400 mb-1">Current User</div>
      <div className="text-sm text-[#E0E0E0] mb-2">
        {user.username || user.firstName || 'User'}
      </div>
      <div className="flex items-center gap-2">
        <code className="text-xs bg-[#1f1f1f] px-2 py-1 rounded font-mono text-[#A9C4FC]">
          {user.id}
        </code>
        <button
          onClick={handleCopy}
          className="p-1 hover:bg-[#404040] rounded transition-colors"
          title="Copy User ID"
        >
          {copied ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {user.emailAddresses?.[0]?.emailAddress}
      </div>
    </div>
  );
} 
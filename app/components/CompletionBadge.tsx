'use client';

import React from 'react';

interface CompletionBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function CompletionBadge({ size = 'md', className = '' }: CompletionBadgeProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg'
  };

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        ${className}
        bg-gradient-to-br from-yellow-400 to-amber-500 
        rounded-full flex items-center justify-center 
        shadow-lg animate-pulse-slow
        ring-2 ring-yellow-300 ring-offset-2 ring-offset-gray-900
      `}
      title="Set Completed - All cards mastered!"
    >
      <span className="text-gray-900 font-bold">★</span>
    </div>
  );
}

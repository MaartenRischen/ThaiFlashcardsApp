'use client';

import React from 'react';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { Trash2, BookOpen, Download, Layers } from 'lucide-react';
import { getToneLabel } from '@/app/lib/utils';

// Define a more specific type for the set prop
interface GallerySet {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  cardCount: number;
  author?: string;
  llmBrand?: string;
  llmModel?: string;
  seriousnessLevel?: number;
  proficiencyLevel?: string;
  specificTopics?: string;
  publishedAt: string;
}

interface GallerySetCardProps {
  set: GallerySet;
  importingSetId: string | null;
  contextIsLoading: boolean;
  handleImport: (id: string) => void;
  handleViewCards: (id: string) => void;
  onDelete?: (id: string) => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  showCheckbox?: boolean;
}

const GallerySetCard: React.FC<GallerySetCardProps> = ({ 
  set, 
  importingSetId, 
  contextIsLoading, 
  handleImport, 
  handleViewCards, 
  onDelete,
  isSelected = false,
  onToggleSelect,
  showCheckbox = false
}) => {
  const imgUrl = set.imageUrl || '/images/default-set-logo.png';
  const username = set.author && set.author.trim() !== '' ? set.author : 'Anonymous';
  const { user } = useUser();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress;
  const isAdmin = userEmail === 'maartenrischen@protonmail.com';

  return (
    <div className={`bg-indigo-900/30 rounded-lg border ${isSelected ? 'border-[#A9C4FC] ring-2 ring-[#A9C4FC]/50' : 'border-indigo-800/30'} p-3 flex flex-col relative transition-all`}>
      {/* Selection checkbox for admin */}
      {showCheckbox && (
        <div className="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-4 h-4 text-[#A9C4FC] bg-[#232336] border-[#33335a] rounded focus:ring-[#A9C4FC] focus:ring-2"
          />
        </div>
      )}
      
      {/* Delete button for admin */}
      {isAdmin && onDelete && (
        <button
          onClick={() => {
            if (window.confirm(`Are you sure you want to delete "${set.title}"? This action cannot be undone.`)) {
              onDelete(set.id);
            }
          }}
          className="absolute top-2 right-2 p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors"
          title="Delete set"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
      
      <Image
        src={imgUrl}
        alt={`${set.title} logo`}
        width={100}
        height={100}
        className="w-full h-32 object-cover rounded-lg mb-3"
      />
      <h3 className="font-medium text-sm mb-1 text-indigo-100">{set.title}</h3>
      {set.description && (
        <p className="text-xs text-indigo-200 mb-2 line-clamp-2">{set.description}</p>
      )}
      <div className="mt-auto">
        <div className="text-xs text-indigo-300/90 space-y-1 mb-3">
          <div className="flex items-center gap-1">
            {getToneLabel(set.seriousnessLevel)}
          </div>
          <div className="flex items-center gap-1">
            <Layers className="h-3 w-3" />
            <span>{set.cardCount} cards</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleViewCards(set.id)}
            className="flex-1 px-3 py-1.5 bg-indigo-700/30 hover:bg-indigo-700/40 text-indigo-200 rounded-md text-xs font-medium transition flex items-center justify-center gap-1 border border-indigo-600/30"
          >
            <BookOpen className="h-3 w-3" />
            View
          </button>
          <button
            onClick={() => handleImport(set.id)}
            disabled={importingSetId === set.id || contextIsLoading}
            className="flex-1 px-3 py-1.5 bg-[#A9C4FC]/20 hover:bg-[#A9C4FC]/30 text-[#A9C4FC] rounded-md text-xs font-medium transition flex items-center justify-center gap-1 border border-[#A9C4FC]/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importingSetId === set.id ? (
              <span className="inline-block h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
            {importingSetId === set.id ? 'Importing...' : 'Import'}
          </button>
        </div>
        <div className="text-xs text-indigo-400 mt-2">
          by {username}
        </div>
      </div>
    </div>
  );
};

export default GallerySetCard; 
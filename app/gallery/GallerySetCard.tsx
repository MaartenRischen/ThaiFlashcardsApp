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
    <div className={`neumorphic rounded-lg ${isSelected ? 'ring-2 ring-[#BB86FC]' : ''} p-3 flex flex-col relative transition-all`}>
      {/* Selection checkbox for admin */}
      {showCheckbox && (
        <div className="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-4 h-4 text-[#BB86FC] bg-[#3C3C3C] border-[#404040] rounded focus:ring-[#BB86FC] focus:ring-2"
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
      
      <div className="relative w-full h-32 rounded-lg overflow-hidden mb-3 neumorphic-inset">
        <Image
          src={imgUrl}
          alt={`${set.title} logo`}
          fill
          className="object-cover"
        />
      </div>
      
      <h3 className="font-medium text-sm mb-1 text-[#E0E0E0]">{set.title}</h3>
      {set.description && (
        <p className="text-xs text-[#BDBDBD] mb-2 line-clamp-2">{set.description}</p>
      )}
      <div className="mt-auto">
        <div className="text-xs text-[#BDBDBD] space-y-1 mb-3">
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
            className="flex-1 neumorphic-button px-3 py-1.5 text-xs font-medium flex items-center justify-center gap-1"
          >
            <BookOpen className="h-3 w-3" />
            View
          </button>
          <button
            onClick={() => handleImport(set.id)}
            disabled={importingSetId === set.id || contextIsLoading}
            className="flex-1 neumorphic-button px-3 py-1.5 text-xs font-medium flex items-center justify-center gap-1 text-[#BB86FC] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importingSetId === set.id ? (
              <span className="inline-block h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
            {importingSetId === set.id ? 'Importing...' : 'Import'}
          </button>
        </div>
        <div className="text-xs text-[#8B8B8B] mt-2">
          by {username}
        </div>
      </div>
    </div>
  );
};

export default GallerySetCard; 
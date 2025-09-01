'use client';

import React from 'react';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { Trash2, BookOpen, Download, Layers, Star, User } from 'lucide-react';
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

  // Get proficiency level display
  const getProficiencyDisplay = (level?: string) => {
    if (!level) return null;
    const levelMap: Record<string, { label: string; color: string }> = {
      'Complete Beginner': { label: 'Beginner', color: 'text-green-400' },
      'Basic Understanding': { label: 'Basic', color: 'text-blue-400' },
      'Intermediate': { label: 'Intermediate', color: 'text-yellow-400' },
      'Advanced': { label: 'Advanced', color: 'text-orange-400' },
      'Native/Fluent': { label: 'Expert', color: 'text-purple-400' }
    };
    const display = levelMap[level] || { label: level, color: 'text-gray-400' };
    return (
      <span className={`${display.color} font-medium`}>
        {display.label}
      </span>
    );
  };

  return (
    <div className={`bg-[#1A1A1A] border border-[#333] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ${isSelected ? 'ring-2 ring-[#BB86FC] ring-offset-2 ring-offset-[#1A1A1A]' : 'hover:border-[#444]'}`}>
      {/* Selection checkbox for admin */}
      {showCheckbox && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-4 h-4 text-[#BB86FC] bg-[#2A2A2A] border-[#444] rounded focus:ring-[#BB86FC] focus:ring-2"
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
          className="absolute top-3 right-3 p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors z-10"
          title="Delete set"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
      
      {/* Image with overlay gradient */}
      <div className="relative w-full h-40 overflow-hidden">
        <Image
          src={imgUrl}
          alt={`${set.title} logo`}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent opacity-80" />
        
        {/* Card count badge */}
        <div className="absolute bottom-3 left-3 bg-[#1A1A1A]/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-[#333]">
          <div className="flex items-center gap-1 text-xs text-[#E0E0E0]">
            <Layers className="h-3 w-3" />
            <span>{set.cardCount} cards</span>
          </div>
        </div>
      </div>
      
      {/* Content area */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-bold text-lg text-[#E0E0E0] leading-tight line-clamp-2">
          {set.title}
        </h3>
        
        {/* Description - only show if different from title */}
        {set.description && set.description !== set.title && (
          <p className="text-sm text-[#BDBDBD] line-clamp-2 leading-relaxed">
            {set.description}
          </p>
        )}
        
        {/* Metadata badges */}
        <div className="flex flex-wrap gap-3 text-xs text-[#BDBDBD]">
          <div className="flex items-center gap-1">
            <span className="text-[#8B8B8B]">Tone level:</span>
            {getToneLabel(set.seriousnessLevel)}
          </div>
          
          {getProficiencyDisplay(set.proficiencyLevel) && (
            <div className="flex items-center gap-1">
              <span className="text-[#8B8B8B]">Proficiency level:</span>
              {getProficiencyDisplay(set.proficiencyLevel)}
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => handleViewCards(set.id)}
            className="flex-1 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-[#E0E0E0] px-3 py-2 text-sm font-medium rounded-lg border border-[#444] hover:border-[#555] transition-all flex items-center justify-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            View
          </button>
          <button
            onClick={() => handleImport(set.id)}
            disabled={importingSetId === set.id || contextIsLoading}
            className="flex-1 bg-[#BB86FC] hover:bg-[#A66EFC] text-[#1A1A1A] px-3 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importingSetId === set.id ? (
              <span className="inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {importingSetId === set.id ? 'Importing...' : 'Import'}
          </button>
        </div>
        
        {/* Author info - more prominent */}
        <div className="bg-[#2A2A2A] border border-[#444] rounded-lg p-3 mt-3">
          <div className="flex items-center gap-2 text-sm text-[#E0E0E0]">
            <User className="h-4 w-4 text-[#BB86FC]" />
            <span className="font-medium">Created by:</span>
            <span className="text-[#BB86FC] font-semibold">{username}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GallerySetCard; 
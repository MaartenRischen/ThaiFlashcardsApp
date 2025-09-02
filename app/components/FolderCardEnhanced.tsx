'use client';

import React from 'react';
import Image from 'next/image';
import { Folder } from '@/app/lib/storage/folders';
import { MoreVertical, Edit3, Trash2, FolderIcon, Palette } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FolderCardEnhancedProps {
  folder: Folder;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCustomize?: () => void;
}

// Predefined color themes
const folderThemes = [
  { primary: '#A9C4FC', secondary: '#8BA5E8', glow: 'rgba(169, 196, 252, 0.3)' }, // Blue
  { primary: '#FCA9A9', secondary: '#E88B8B', glow: 'rgba(252, 169, 169, 0.3)' }, // Red
  { primary: '#A9FCA9', secondary: '#8BE88B', glow: 'rgba(169, 252, 169, 0.3)' }, // Green
  { primary: '#FCFCA9', secondary: '#E8E88B', glow: 'rgba(252, 252, 169, 0.3)' }, // Yellow
  { primary: '#FCA9FC', secondary: '#E88BE8', glow: 'rgba(252, 169, 252, 0.3)' }, // Pink
  { primary: '#A9FCFC', secondary: '#8BE8E8', glow: 'rgba(169, 252, 252, 0.3)' }, // Cyan
  { primary: '#DCA9FC', secondary: '#C88BE8', glow: 'rgba(220, 169, 252, 0.3)' }, // Purple
  { primary: '#FCBFA9', secondary: '#E8A38B', glow: 'rgba(252, 191, 169, 0.3)' }, // Orange
];

export default function FolderCardEnhanced({ 
  folder, 
  onClick, 
  onEdit, 
  onDelete,
  onCustomize 
}: FolderCardEnhancedProps) {
  // Get theme based on folder name or custom property
  const getTheme = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return folderThemes[Math.abs(hash) % folderThemes.length];
  };

  const theme = getTheme(folder.name);

  return (
    <div
      onClick={onClick}
      className="relative group cursor-pointer transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
    >
      {/* Main Card */}
      <div className="relative overflow-hidden h-full bg-[#2C2C2C]/40 backdrop-blur-sm rounded-xl border border-[#404040]/30 hover:bg-[#2C2C2C]/60 hover:border-[#404040]/50 transition-all duration-300 hover:shadow-2xl">
        {/* Glow Effect */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at center, ${theme.glow} 0%, transparent 70%)`
          }}
        />
        
        {/* Background with image or gradient */}
        <div className="aspect-[4/3] relative overflow-hidden">
          {folder.previewImages && folder.previewImages.length > 0 ? (
            <>
              <Image
                src={folder.previewImages[0]}
                alt=""
                fill
                className="object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-300"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#1F1F1F]/40 via-[#1F1F1F]/60 to-[#1F1F1F]/90" />
            </>
          ) : (
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                background: `linear-gradient(135deg, ${theme.primary}20 0%, ${theme.secondary}20 100%)`
              }}
            />
          )}
          
          {/* Animated Folder Icon (show spinner if setCount not yet known) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Animated rings */}
              <div 
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700"
                style={{ 
                  width: '120px', 
                  height: '120px',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: `radial-gradient(circle, transparent 40%, ${theme.primary}20 60%, transparent 70%)`
                }}
              >
                <div className="absolute inset-0 animate-ping" />
              </div>
              
              {/* Icon container */}
              <div 
                className="relative p-4 rounded-2xl transition-all duration-300 group-hover:scale-110"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}30, ${theme.secondary}30)`,
                  boxShadow: `0 8px 32px ${theme.glow}`
                }}
              >
                {typeof folder.setCount === 'number' && folder.setCount > 0 ? (
                  <FolderIcon 
                    size={48} 
                    style={{ color: theme.primary }} 
                    className="drop-shadow-2xl transition-all duration-300 group-hover:rotate-3"
                  />
                ) : (
                  <div className="h-12 w-12 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${theme.primary}` }} />
                )}
              </div>
            </div>
          </div>

          {/* Set Count Badge */}
          <div className="absolute top-3 left-3">
            <div 
              className="px-3 py-1 rounded-full backdrop-blur-md border shadow-lg transition-all duration-300 group-hover:scale-110"
              style={{ 
                backgroundColor: `${theme.primary}15`,
                borderColor: `${theme.primary}40`
              }}
            >
              <span className="text-sm font-bold" style={{ color: theme.primary }}>
                {typeof folder.setCount === 'number' ? folder.setCount : 0} {folder.setCount === 1 ? 'set' : 'sets'}
              </span>
            </div>
          </div>

          {/* Default Badge */}
          {folder.isDefault && (
            <div className="absolute top-3 right-3">
              <div 
                className="px-3 py-1 rounded-full backdrop-blur-md border shadow-lg"
                style={{ 
                  backgroundColor: `${theme.secondary}15`,
                  borderColor: `${theme.secondary}40`
                }}
              >
                <span className="text-xs font-bold" style={{ color: theme.secondary }}>
                  DEFAULT
                </span>
              </div>
            </div>
          )}

          {/* Action Menu */}
          {!folder.isDefault && (onEdit || onDelete || onCustomize) && (
            <div className="absolute bottom-3 right-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-lg bg-[#1F1F1F]/60 backdrop-blur-md border border-[#404040]/30 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#1F1F1F]/80"
                  >
                    <MoreVertical size={16} className="text-[#BDBDBD]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="bg-[#2C2C2C]/95 backdrop-blur-md border-[#404040]/50 text-white"
                >
                  {onEdit && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                      }}
                      className="text-[#E0E0E0] hover:bg-[#3C3C3C]/50 cursor-pointer"
                    >
                      <Edit3 size={14} className="mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onCustomize && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onCustomize();
                      }}
                      className="text-[#E0E0E0] hover:bg-[#3C3C3C]/50 cursor-pointer"
                    >
                      <Palette size={14} className="mr-2" />
                      Customize
                    </DropdownMenuItem>
                  )}
                  {(onEdit || onCustomize) && onDelete && <DropdownMenuSeparator className="bg-[#404040]/50" />}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="text-red-400 hover:bg-[#3C3C3C]/50 hover:text-red-300 cursor-pointer"
                    >
                      <Trash2 size={14} className="mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Folder Info */}
        <div className="p-4 bg-[#1F1F1F]/30 backdrop-blur-sm">
          <h3 className="font-bold text-lg text-[#E0E0E0] leading-tight line-clamp-2 group-hover:text-white transition-colors duration-300">
            {folder.name}
          </h3>
          {folder.description && (
            <p className="text-sm text-[#BDBDBD]/80 mt-1 leading-relaxed line-clamp-2 group-hover:text-[#BDBDBD] transition-colors duration-300">
              {folder.description}
            </p>
          )}
          
          {/* Progress indicator (if we add progress tracking later) */}
          <div className="mt-3 h-1 bg-[#2C2C2C]/50 rounded-full overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: '0%', // This could be dynamic based on completion
                background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

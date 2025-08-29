'use client';

import React from 'react';
import Image from 'next/image';
import { Folder } from '@/app/lib/storage/folders';
import { MoreVertical, Edit3, Trash2, FolderIcon } from 'lucide-react';

interface FolderCardProps {
  folder: Folder;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function FolderCard({ folder, onClick, onEdit, onDelete }: FolderCardProps) {
  const [showMenu, setShowMenu] = React.useState(false);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onEdit?.();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onDelete?.();
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setShowMenu(false);
    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenu]);

  // Generate a color based on folder name for variety
  const getAccentColor = (name: string) => {
    const colors = ['#A9C4FC', '#FCA9A9', '#A9FCA9', '#FCFCA9', '#FCA9FC', '#A9FCFC'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const accentColor = getAccentColor(folder.name);

  return (
    <div
      onClick={onClick}
      className="relative group cursor-pointer transition-all duration-200 transform hover:scale-105"
    >
      {/* Main Card with transparency */}
      <div className="relative overflow-hidden h-full bg-[#2C2C2C]/40 backdrop-blur-sm rounded-xl border border-[#404040]/30 hover:bg-[#2C2C2C]/60 hover:border-[#404040]/50 transition-all duration-200">
        {/* Background with single image */}
        <div className="aspect-[4/3] relative overflow-hidden">
          {/* Background image - only first one */}
          {folder.previewImages && folder.previewImages.length > 0 ? (
            <>
              <Image
                src={folder.previewImages[0]}
                alt=""
                fill
                className="object-cover opacity-30"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#1F1F1F]/40 via-[#1F1F1F]/60 to-[#1F1F1F]/90" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#2C2C2C]/20 to-[#1F1F1F]/40" />
          )}
          
          {/* Folder Icon - centered */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 blur-2xl opacity-20" style={{ backgroundColor: accentColor }} />
              <FolderIcon size={64} style={{ color: accentColor }} className="drop-shadow-2xl" />
            </div>
          </div>

          {/* Set Count Badge - more transparent */}
          <div className="absolute top-3 left-3">
            <div className="px-3 py-1 rounded-full bg-[#1F1F1F]/60 backdrop-blur-md border border-[#404040]/30">
              <span className="text-sm font-bold text-[#E0E0E0]">
                {folder.setCount} {folder.setCount === 1 ? 'set' : 'sets'}
              </span>
            </div>
          </div>

          {/* Default Badge */}
          {folder.isDefault && (
            <div className="absolute top-3 right-3">
              <div className="px-3 py-1 rounded-full backdrop-blur-md border" style={{ 
                backgroundColor: `${accentColor}15`,
                borderColor: `${accentColor}40`
              }}>
                <span className="text-xs font-bold" style={{ color: accentColor }}>DEFAULT</span>
              </div>
            </div>
          )}

          {/* Menu Button for non-default folders */}
          {!folder.isDefault && (onEdit || onDelete) && (
            <div className="absolute bottom-3 right-3">
              <button
                onClick={handleMenuClick}
                className="p-2 rounded-lg bg-[#1F1F1F]/60 backdrop-blur-md border border-[#404040]/30 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#1F1F1F]/80"
              >
                <MoreVertical size={16} className="text-[#BDBDBD]" />
              </button>
              
              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-36 rounded-lg bg-[#2C2C2C]/95 backdrop-blur-md border border-[#404040]/50 shadow-xl overflow-hidden z-10">
                  {onEdit && (
                    <button
                      onClick={handleEditClick}
                      className="w-full px-4 py-2.5 text-left text-sm text-[#E0E0E0] hover:bg-[#3C3C3C]/50 flex items-center gap-2 transition-colors"
                    >
                      <Edit3 size={14} />
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={handleDeleteClick}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-[#3C3C3C]/50 flex items-center gap-2 transition-colors"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Folder Info - semi-transparent background */}
        <div className="p-4 bg-[#1F1F1F]/30 backdrop-blur-sm">
          <h3 className="font-bold text-lg text-[#E0E0E0] leading-tight">
            {folder.name}
          </h3>
          {folder.description && (
            <p className="text-sm text-[#BDBDBD]/80 mt-1 leading-relaxed">
              {folder.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
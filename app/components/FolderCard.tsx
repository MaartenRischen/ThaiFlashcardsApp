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
      {/* Main Card */}
      <div className="neumorphic-card-static hover:neumorphic-card-static group-hover:border-[#505050] group-hover:bg-[#323232] relative overflow-hidden h-full">
        {/* Background Pattern with Images */}
        <div className="aspect-[4/3] relative bg-gradient-to-br from-[#2C2C2C] to-[#1F1F1F] overflow-hidden">
          {/* Background images collage */}
          {folder.previewImages && folder.previewImages.length > 0 && (
            <div className="absolute inset-0 grid grid-cols-2 gap-[1px] opacity-20">
              {folder.previewImages.slice(0, 4).map((img, idx) => (
                <div key={idx} className="relative overflow-hidden">
                  <Image
                    src={img}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, 12.5vw"
                  />
                </div>
              ))}
              <div className="absolute inset-0 bg-gradient-to-b from-[#1F1F1F]/60 via-[#1F1F1F]/80 to-[#1F1F1F]/95" />
            </div>
          )}
          
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl" style={{ backgroundColor: accentColor }} />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl" style={{ backgroundColor: accentColor }} />
          </div>
          
          {/* Folder Icon - Larger and more prominent */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 blur-xl opacity-30" style={{ backgroundColor: accentColor }} />
              <div className="relative p-5 rounded-2xl bg-[#2C2C2C]/90 backdrop-blur-sm border border-[#404040]/50 shadow-xl">
                <FolderIcon size={56} style={{ color: accentColor }} />
              </div>
            </div>
          </div>

          {/* Set Count Badge - More prominent */}
          <div className="absolute top-3 left-3">
            <div className="px-4 py-1.5 rounded-full bg-[#1F1F1F]/95 backdrop-blur-sm border border-[#404040]/50 shadow-lg">
              <span className="text-sm font-bold text-[#E0E0E0]">
                {folder.setCount} {folder.setCount === 1 ? 'set' : 'sets'}
              </span>
            </div>
          </div>

          {/* Default Badge */}
          {folder.isDefault && (
            <div className="absolute top-3 right-3">
              <div className="px-3 py-1.5 rounded-full backdrop-blur-sm border shadow-lg" style={{ 
                backgroundColor: `${accentColor}20`,
                borderColor: `${accentColor}50`
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
                className="p-2.5 rounded-lg bg-[#1F1F1F]/95 backdrop-blur-sm border border-[#404040]/50 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#2C2C2C]/95 shadow-lg"
              >
                <MoreVertical size={18} className="text-[#BDBDBD]" />
              </button>
              
              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-36 rounded-lg bg-[#2C2C2C] border border-[#404040] shadow-xl overflow-hidden z-10">
                  {onEdit && (
                    <button
                      onClick={handleEditClick}
                      className="w-full px-4 py-3 text-left text-sm text-[#E0E0E0] hover:bg-[#3C3C3C] flex items-center gap-2 transition-colors"
                    >
                      <Edit3 size={14} />
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={handleDeleteClick}
                      className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-[#3C3C3C] flex items-center gap-2 transition-colors"
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

        {/* Folder Info - Allow text wrapping */}
        <div className="p-4">
          <h3 className="font-bold text-lg text-[#E0E0E0] leading-tight">
            {folder.name}
          </h3>
          {folder.description && (
            <p className="text-sm text-[#BDBDBD] mt-1 leading-relaxed">
              {folder.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
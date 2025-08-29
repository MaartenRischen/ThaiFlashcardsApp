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

  return (
    <div
      onClick={onClick}
      className="relative group cursor-pointer transition-all duration-200"
    >
      {/* Main Card */}
      <div className="neumorphic-card-static hover:neumorphic-card-static group-hover:border-[#505050] group-hover:bg-[#323232] relative overflow-hidden">
        {/* Background Pattern or Image */}
        <div className="aspect-[4/3] relative bg-gradient-to-br from-[#2C2C2C] to-[#1F1F1F]">
          {folder.previewImages && folder.previewImages.length > 0 ? (
            <div className="absolute inset-0 opacity-30">
              <Image
                src={folder.previewImages[0]}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1F1F1F] via-[#1F1F1F]/80 to-transparent" />
            </div>
          ) : null}
          
          {/* Folder Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-4 rounded-2xl bg-[#1F1F1F]/80 backdrop-blur-sm border border-[#404040]/50">
              <FolderIcon size={48} className="text-[#A9C4FC]" />
            </div>
          </div>

          {/* Set Count Badge */}
          <div className="absolute top-3 left-3">
            <div className="px-3 py-1 rounded-full bg-[#1F1F1F]/90 backdrop-blur-sm border border-[#404040]/50">
              <span className="text-sm font-medium text-[#E0E0E0]">
                {folder.setCount} {folder.setCount === 1 ? 'set' : 'sets'}
              </span>
            </div>
          </div>

          {/* Default Badge */}
          {folder.isDefault && (
            <div className="absolute top-3 right-3">
              <div className="px-3 py-1 rounded-full bg-[#A9C4FC]/20 backdrop-blur-sm border border-[#A9C4FC]/30">
                <span className="text-xs font-medium text-[#A9C4FC]">Default</span>
              </div>
            </div>
          )}

          {/* Menu Button for non-default folders */}
          {!folder.isDefault && (onEdit || onDelete) && (
            <div className="absolute top-3 right-3">
              <button
                onClick={handleMenuClick}
                className="p-2 rounded-lg bg-[#1F1F1F]/90 backdrop-blur-sm border border-[#404040]/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-[#2C2C2C]/90"
              >
                <MoreVertical size={16} className="text-[#BDBDBD]" />
              </button>
              
              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 mt-1 w-36 rounded-lg bg-[#2C2C2C] border border-[#404040] shadow-lg overflow-hidden z-10">
                  {onEdit && (
                    <button
                      onClick={handleEditClick}
                      className="w-full px-4 py-2 text-left text-sm text-[#E0E0E0] hover:bg-[#3C3C3C] flex items-center gap-2"
                    >
                      <Edit3 size={14} />
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={handleDeleteClick}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-[#3C3C3C] flex items-center gap-2"
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

        {/* Folder Info */}
        <div className="p-4">
          <h3 className="font-semibold text-lg text-[#E0E0E0] truncate mb-1">
            {folder.name}
          </h3>
          {folder.description && (
            <p className="text-sm text-[#BDBDBD] line-clamp-2">
              {folder.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
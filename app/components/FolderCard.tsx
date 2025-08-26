'use client';

import React from 'react';
import { Folder } from '@/app/lib/storage/folders';

interface FolderCardProps {
  folder: Folder;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function FolderCard({ folder, onClick, onEdit, onDelete }: FolderCardProps) {
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <div
      onClick={onClick}
      className="relative group cursor-pointer transition-all duration-200 hover:scale-105"
    >
      {/* Folder Image Collage */}
      <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
        {folder.previewImages && folder.previewImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-0.5 h-full">
            {folder.previewImages.length === 1 ? (
              <img
                src={folder.previewImages[0]}
                alt={folder.name}
                className="w-full h-full object-cover col-span-2"
              />
            ) : folder.previewImages.length === 2 ? (
              <>
                <img
                  src={folder.previewImages[0]}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <img
                  src={folder.previewImages[1]}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </>
            ) : folder.previewImages.length === 3 ? (
              <>
                <img
                  src={folder.previewImages[0]}
                  alt=""
                  className="w-full h-full object-cover col-span-2"
                />
                <img
                  src={folder.previewImages[1]}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <img
                  src={folder.previewImages[2]}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </>
            ) : (
              // 4 images
              folder.previewImages.slice(0, 4).map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ))
            )}
          </div>
        ) : (
          // Empty folder placeholder
          <div className="flex items-center justify-center h-full">
            <svg
              className="w-16 h-16 text-gray-400 dark:text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </div>
        )}
        
        {/* Folder icon overlay for better recognition */}
        <div className="absolute top-2 left-2 bg-white/90 dark:bg-gray-900/90 rounded-md p-1">
          <svg
            className="w-5 h-5 text-gray-700 dark:text-gray-300"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
        </div>
      </div>

      {/* Folder Info */}
      <div className="mt-3">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
          {folder.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {folder.setCount} {folder.setCount === 1 ? 'set' : 'sets'}
        </p>
        {folder.description && (
          <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-1">
            {folder.description}
          </p>
        )}
      </div>

      {/* Action buttons for non-default folders */}
      {!folder.isDefault && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          {onEdit && (
            <button
              onClick={handleEditClick}
              className="bg-white/90 dark:bg-gray-900/90 rounded-md p-1.5 hover:bg-white dark:hover:bg-gray-900 transition-colors"
              title="Edit folder"
            >
              <svg
                className="w-4 h-4 text-gray-700 dark:text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDeleteClick}
              className="bg-white/90 dark:bg-gray-900/90 rounded-md p-1.5 hover:bg-white dark:hover:bg-gray-900 transition-colors"
              title="Delete folder"
            >
              <svg
                className="w-4 h-4 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Default folder badge */}
      {folder.isDefault && (
        <div className="absolute bottom-2 right-2">
          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
            Default
          </span>
        </div>
      )}
    </div>
  );
}

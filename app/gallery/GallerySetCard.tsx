import React from 'react';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { Trash2, BookOpen, Download, Layers } from 'lucide-react';

// Define a more specific type for the set prop
interface GallerySet {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  toneLevel?: number;
  proficiencyLevel?: string;
  createdAt?: string | Date;
  timestamp?: string | Date;
  author?: string;
  cardCount?: number;
}

interface GallerySetCardProps {
  set: GallerySet;
  importingSetId: string | null;
  contextIsLoading: boolean;
  handleImport: (setId: string) => void;
  handleViewCards: (setId: string) => void;
  onDelete?: (setId: string) => void;
}

const GallerySetCard: React.FC<GallerySetCardProps> = ({ set, importingSetId, contextIsLoading, handleImport, handleViewCards, onDelete }) => {
  const imgUrl = set.imageUrl || '/images/default-set-logo.png';
  const username = set.author && set.author.trim() !== '' ? set.author : 'Anonymous';
  const { user } = useUser();
  const userId = user?.id;
  const isAdmin = userId === 'user_2w7FgmYkPXUKYesPpqgxeAF7C1h';

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete the set '${set.title}'? This cannot be undone.`)) {
      onDelete && onDelete(set.id);
    }
  };

  return (
    <div className="group bg-[#1a1a1a] border border-gray-800/30 rounded-xl overflow-hidden hover:border-blue-600/50 hover:shadow-md hover:shadow-blue-900/10 transition-all flex flex-col">
      <div className="relative w-full aspect-[16/9] bg-[#111] overflow-hidden rounded-t-xl">
        {set.imageUrl ? (
          <Image
            src={imgUrl}
            alt={set.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (target.src !== '/images/default-set-logo.png') {
                target.src = '/images/default-set-logo.png';
              }
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <BookOpen className="h-10 w-10 text-gray-700" />
          </div>
        )}
        {isAdmin && (
          <button
            className="absolute top-2 right-2 bg-red-700/80 hover:bg-red-800 text-white rounded-full p-1.5 z-10 shadow"
            title="Delete set"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="font-medium text-sm text-white line-clamp-3 group-hover:text-blue-400 transition-colors">
          {set.title}
        </h3>

        {set.proficiencyLevel && (
          <div className="text-xs text-gray-400 flex flex-wrap gap-x-2 -mt-1">
            <span>Level: <span className="font-medium text-[#A9C4FC]">{set.proficiencyLevel}</span></span>
            {set.toneLevel !== undefined && (
              <span>Tone Level: <span className="font-medium text-[#A9C4FC]">{set.toneLevel}/10</span></span>
            )}
          </div>
        )}
        
        <p className="text-xs text-gray-400 mt-0.5">{set.cardCount || 0} cards</p>
        
        {/* Card Actions: Import and Cards icon buttons side by side */}
        <div className="mt-auto flex justify-center gap-2">
          <div className="flex flex-col items-center">
            <button
              onClick={() => handleViewCards(set.id)}
              disabled={importingSetId === set.id || contextIsLoading}
              className="p-2.5 rounded-full bg-gray-700 hover:bg-gray-800 text-white transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              title="View Cards"
            >
              <Layers className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-400 mt-1">View Cards</span>
          </div>

          <div className="flex flex-col items-center">
            <button
              onClick={() => handleImport(set.id)}
              disabled={importingSetId === set.id || contextIsLoading}
              className="p-2.5 rounded-full bg-gray-700 hover:bg-gray-800 text-white transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              title="Import Set"
            >
              {importingSetId === set.id ? (
                <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </button>
            <span className="text-xs text-gray-400 mt-1">Import</span>
          </div>
        </div>

        <div className="text-xs text-blue-400/70 mt-4 text-center">
          User Set by: {username}
        </div>
      </div>
    </div>
  );
};

export default GallerySetCard; 
import React from 'react';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { Trash2, BookOpen } from 'lucide-react';

// Define a more specific type for the set prop
interface GallerySet {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  seriousnessLevel?: number;
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
    <div className="group bg-[#1a1a1a] border border-gray-800/30 rounded-lg overflow-hidden hover:border-blue-600/50 hover:shadow-md hover:shadow-blue-900/10 transition-all flex flex-col">
      <div className="relative w-full aspect-[16/9] bg-[#111] overflow-hidden">
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
        <h3 className="font-medium text-sm text-white mb-1 line-clamp-3 min-h-[3.6rem] group-hover:text-blue-400 transition-colors text-center">
          {set.title}
        </h3>
        
        <div className="text-blue-400 text-sm font-medium mb-2 text-center">
          User Set by: {username}
        </div>

        {set.proficiencyLevel && (
          <p className="text-xs text-blue-400/80 text-center mb-1">
            Proficiency: <span className="font-medium text-blue-300">{set.proficiencyLevel}</span>
          </p>
        )}
        
        {set.seriousnessLevel !== undefined && (
          <p className="text-xs text-blue-400/80 text-center mb-3">
            Ridiculousness: <span className="font-medium text-blue-300">{set.seriousnessLevel} / 10</span>
          </p>
        )}
        
        <div className="mt-auto flex gap-2 justify-center">
          <button
            className="neumorphic-button-secondary text-blue-300 hover:text-blue-200 px-3 py-1 text-xs"
            onClick={() => handleViewCards(set.id)}
            disabled={importingSetId === set.id || contextIsLoading}
          >
            View Cards
          </button>

          <button
            className={`neumorphic-button text-blue-300 hover:text-blue-200 px-3 py-1 text-xs ${importingSetId === set.id ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => handleImport(set.id)}
            disabled={importingSetId === set.id || contextIsLoading}
          >
            {importingSetId === set.id ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GallerySetCard; 
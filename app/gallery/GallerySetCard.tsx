import React from 'react';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { Trash2 } from 'lucide-react';

// Define a more specific type for the set prop
interface GallerySet {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  seriousnessLevel?: number;
  createdAt?: string | Date;
  timestamp?: string | Date; // Assuming timestamp might exist
  author?: string;
  cardCount?: number;
  // Add any other expected properties based on usage
}

interface GallerySetCardProps {
  set: GallerySet;
  importingSetId: string | null;
  contextIsLoading: boolean;
  handleImport: (setId: string) => void;
  handleViewCards: (setId: string) => void;
  onDelete?: (setId: string) => void; // Optional delete handler
}

const GallerySetCard: React.FC<GallerySetCardProps> = ({ set, importingSetId, contextIsLoading, handleImport, handleViewCards, onDelete }) => {
  // Image fallback
  const imgUrl = set.imageUrl || '/images/default-set-logo.png';
  // Get username with proper fallback
  const username = set.author && set.author.trim() !== '' ? set.author : 'Anonymous';
  const { user } = useUser();
  // Debug: log user object and id
  // console.log('GallerySetCard user:', user);
  const userId = user?.id;
  // console.log('GallerySetCard userId for admin check:', userId);
  // WARNING: Hardcoding admin ID is insecure, replace with proper role check if needed
  const isAdmin = userId === 'user_2w7FgmYkPXUKYesPpqgxeAF7C1h';

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete the set '${set.title}'? This cannot be undone.`)) {
      onDelete && onDelete(set.id);
    }
  };

  return (
    <div className="bg-indigo-950/30 border border-indigo-800/30 rounded-lg overflow-hidden hover:border-indigo-600/50 hover:shadow-md hover:shadow-indigo-900/20 transition-all flex flex-col relative">
      {/* REMOVE Proficiency Badge */}
      {/* {set.proficiencyLevel && (
        <span className="absolute top-2 left-2 z-10 bg-blue-700/90 text-white text-[10px] leading-tight font-semibold px-2 py-1 rounded-full shadow whitespace-nowrap">
          {set.proficiencyLevel}
        </span>
      )} */}
      {/* Set Image */}
      <div className="relative w-full aspect-[16/9] bg-indigo-950/50 overflow-hidden">
        <Image
          src={imgUrl}
          alt={set.title}
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (target.src !== '/images/default-set-logo.png') {
              target.src = '/images/default-set-logo.png';
            }
          }}
        />
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
        {/* Set Name */}
        <h3 className="font-medium text-sm text-indigo-200 mb-1 line-clamp-2 hover:text-indigo-300 transition-colors text-center">
          {set.title}
        </h3>
        
        {/* Author label */}
        <div className="text-indigo-400 text-sm font-medium mb-2 text-center">
          User Set by: {username}
        </div>

        {/* Card Count (Optional but useful) */}
        {set.cardCount !== undefined && (
            <p className="text-xs text-indigo-400/80 text-center mb-3">{set.cardCount} cards</p>
        )}
        
        {/* Action Buttons */}
        <div className="mt-auto flex gap-2 justify-center">
          {/* View Cards button */}
          <button
            className="neumorphic-button-secondary text-indigo-300 hover:text-indigo-200 px-3 py-1 text-xs"
            onClick={() => handleViewCards(set.id)}
            disabled={importingSetId === set.id || contextIsLoading}
          >
            View Cards
          </button>

          {/* Import button */}
          <button
            className={`neumorphic-button text-indigo-300 hover:text-indigo-200 px-3 py-1 text-xs ${importingSetId === set.id ? 'opacity-50 cursor-not-allowed' : ''}`}
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
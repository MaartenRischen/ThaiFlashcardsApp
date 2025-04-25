import React from 'react';
import Image from 'next/image';

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
}

const GallerySetCard: React.FC<GallerySetCardProps> = ({ set, importingSetId, contextIsLoading, handleImport }) => {
  // Image fallback
  const imgUrl = set.imageUrl || '/images/default-set-logo.png';
  // Get username with proper fallback
  const username = set.author && set.author.trim() !== '' ? set.author : 'Anonymous';

  return (
    <div className="bg-indigo-950/30 border border-indigo-800/30 rounded-lg overflow-hidden hover:border-indigo-600/50 hover:shadow-md hover:shadow-indigo-900/20 transition-all flex flex-col">
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
        
        {/* Import button */}
        <button 
          className={`neumorphic-button text-indigo-300 hover:text-indigo-200 px-4 py-1 mt-auto ${importingSetId === set.id ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => handleImport(set.id)}
          disabled={importingSetId === set.id || contextIsLoading}
        >
          {importingSetId === set.id ? 'Importing...' : 'Import'}
        </button>
      </div>
    </div>
  );
};

export default GallerySetCard; 
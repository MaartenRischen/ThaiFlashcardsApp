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
  proficiencyLevel?: string;
  ridiculousness?: string;
  topics?: string[];
  // Add any other expected properties based on usage
}

interface GallerySetCardProps {
  set: GallerySet;
  importingSetId: string | null;
  contextIsLoading: boolean;
  handleImport: (setId: string) => void;
  isAdmin?: boolean;
}

const GallerySetCard: React.FC<GallerySetCardProps> = ({ set, importingSetId, contextIsLoading, handleImport, isAdmin }) => {
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
        
        {/* Badges */}
        <div className="flex flex-wrap gap-1 justify-center mb-2">
          {set.proficiencyLevel && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-900/60 text-blue-200 border border-blue-700">
              {set.proficiencyLevel}
            </span>
          )}
          {set.ridiculousness && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${set.ridiculousness === 'Serious' ? 'bg-gray-800/60 text-gray-200 border-gray-700' : set.ridiculousness === 'Balanced' ? 'bg-yellow-900/60 text-yellow-200 border-yellow-700' : 'bg-pink-900/60 text-pink-200 border-pink-700'}`}>{set.ridiculousness}</span>
          )}
          {(set.topics || []).map(topic => (
            <span key={topic} className="px-2 py-0.5 rounded-full text-xs bg-indigo-800/40 text-indigo-100 border border-indigo-700">
              {topic}
            </span>
          ))}
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
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
  // Ridiculousness calculation (0-100)
  const ridiculousness = typeof set.seriousnessLevel === 'number' ? 100 - set.seriousnessLevel : null;
  // Date
  const date = set.createdAt ? new Date(set.createdAt).toLocaleDateString() : (set.timestamp ? new Date(set.timestamp).toLocaleDateString() : '-');
  // Image fallback
  const imgUrl = set.imageUrl || '/images/default-set-logo.png';
  // Username only
  const username = set.author || 'Anonymous';
  // Card count
  const cardCount = set.cardCount || 0;

  return (
    <div className="relative bg-gray-900 rounded-xl p-4 flex flex-col shadow-lg border border-gray-800">
      {/* Set Image */}
      <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden mb-3 bg-gray-800">
        <Image
          src={imgUrl}
          alt={set.title}
          className="object-cover w-full h-full"
          width={320}
          height={180}
          onError={ev => {
            const target = ev.currentTarget;
            if (target.src !== '/images/default-set-logo.png') {
              target.src = '/images/default-set-logo.png';
            }
          }}
        />
      </div>
      {/* Set Name */}
      <div className="font-bold text-lg text-white mb-1 text-center line-clamp-3 break-words whitespace-pre-line">{set.title}</div>
      {/* Made by: username only */}
      <div className="text-xs text-gray-400 mb-1 text-center">
        Made by: {username}
      </div>
      {/* Description */}
      <div className="text-sm text-gray-300 mb-3 text-center break-words whitespace-pre-line">{set.description || '-'}</div>
      {/* Ridiculousness Gas Meter */}
      <div className="flex items-center justify-center mb-3">
        <span className="text-xs text-gray-400 mr-2">Ridiculousness</span>
        <div className="relative w-32 h-4 bg-gray-700 rounded-full overflow-hidden flex items-center">
          <div
            className="h-4 rounded-full transition-all duration-300"
            style={{
              width: `${ridiculousness !== null ? ridiculousness : 0}%`,
              background: `linear-gradient(90deg, #facc15 0%, #ef4444 100%)`,
              minWidth: '8px',
            }}
          ></div>
        </div>
        <span className="text-xs text-gray-400 ml-2">{ridiculousness !== null ? `${ridiculousness}%` : '-'}</span>
      </div>
      {/* Card count */}
      <div className="text-xs text-gray-400 mb-2 text-center">{cardCount} cards</div>
      {/* Meta info */}
      <div className="flex justify-between text-xs text-gray-500 mt-auto pt-2 border-t border-gray-800">
        <span>{date}</span>
      </div>
      {/* Import button */}
      <button 
        className={`neumorphic-button text-green-400 px-4 py-1 mt-4 ${importingSetId === set.id ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => handleImport(set.id)}
        disabled={importingSetId === set.id || contextIsLoading}
      >
        {importingSetId === set.id ? 'Importing...' : 'Import'}
      </button>
    </div>
  );
};

export default GallerySetCard; 
'use client';

import React from 'react';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { Trash2, BookOpen, Download, Layers } from 'lucide-react';
import { getToneLabel } from '@/app/lib/utils';

// Define a more specific type for the set prop
interface GallerySet {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  cardCount: number;
  author?: string;
  llmBrand?: string;
  llmModel?: string;
  seriousnessLevel?: number;
  proficiencyLevel?: string;
  specificTopics?: string;
  publishedAt: string;
}

interface GallerySetCardProps {
  set: GallerySet;
  importingSetId: string | null;
  contextIsLoading: boolean;
  handleImport: (id: string) => void;
  handleViewCards: (id: string) => void;
  onDelete?: (id: string) => void;
}

const GallerySetCard: React.FC<GallerySetCardProps> = ({ set, importingSetId, contextIsLoading, handleImport, handleViewCards, onDelete }) => {
  const imgUrl = set.imageUrl || '/images/default-set-logo.png';
  const username = set.author && set.author.trim() !== '' ? set.author : 'Anonymous';
  const { user } = useUser();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress;
  const isAdmin = userEmail === 'maartenrischen@protonmail.com';

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete the set '${set.title}'? This cannot be undone.`)) {
      onDelete && onDelete(set.id);
    }
  };

  return (
    <div className="relative bg-gray-900 rounded-xl p-3 flex flex-col shadow-lg border border-gray-800 cursor-pointer hover:ring-2 hover:ring-[#A9C4FC] transition">
      {/* Set Image */}
      <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden mb-2 bg-[#2C2C2C]">
        {set.imageUrl ? (
          <Image
            src={imgUrl}
            alt={set.title}
            className="object-contain"
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized={true}
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
            className="absolute top-3 right-3 bg-red-700/80 hover:bg-red-800 text-white rounded-full p-1.5 z-10 shadow"
            title="Delete set"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="flex-grow flex flex-col">
        <h3 className="text-base font-medium text-gray-200 group-hover:text-white transition-colors line-clamp-3 mb-1" title={set.title}>
          {set.title}
        </h3>
        <div className="text-xs text-blue-400/70 mb-1">
          User Set by: {username}
        </div>
        {set.publishedAt && (
          <div className="text-xs text-gray-500 mb-1">
            {(() => {
              const date = typeof set.publishedAt === 'string' ? new Date(set.publishedAt) : set.publishedAt;
              return date ? date.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
            })()}
          </div>
        )}

        <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap gap-x-2">
          {set.proficiencyLevel && (
            <span>Level: <span className="font-medium text-[#A9C4FC]">{set.proficiencyLevel}</span></span>
          )}
          {set.seriousnessLevel !== undefined && (
            <span>Tone: <span className="font-medium text-[#A9C4FC]">{getToneLabel(set.seriousnessLevel)}</span></span>
          )}
        </div>
        
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
      </div>
    </div>
  );
};

export default GallerySetCard; 
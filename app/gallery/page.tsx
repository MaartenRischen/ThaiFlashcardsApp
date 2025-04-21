"use client";
import React, { useEffect, useState } from 'react';
import { useSet } from '@/app/context/SetContext';
import { Phrase } from '@/app/lib/set-generator';

export default function GalleryPage() {
  const { availableSets, addSet, isLoading: contextIsLoading } = useSet();
  const [sets, setSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importingSetId, setImportingSetId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/api/gallery')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch gallery sets');
        return res.json();
      })
      .then(data => {
        setSets(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Unknown error');
        setLoading(false);
      });
  }, []);

  const handleImport = async (setId: string) => {
    setImportingSetId(setId);
    setImportError(null);

    if (availableSets.some(set => set.id === setId)) {
      alert('This set has already been imported or exists in your collection.');
      setImportingSetId(null);
      return;
    }

    try {
      const res = await fetch(`/api/gallery/${setId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch set details');
      }
      const fullSetData = await res.json();

      const { id, title, description, phrases, imageUrl, cardCount, llmBrand, llmModel, seriousnessLevel, specificTopics, timestamp, createdAt, ...rest } = fullSetData;
      
      const setData = {
        name: title,
        description: description,
        specificTopics: specificTopics,
        seriousnessLevel: seriousnessLevel,
        imageUrl: imageUrl,
        llmBrand: llmBrand,
        llmModel: llmModel,
        source: 'gallery_import',
        ...rest
      };

      const phrasesArr = phrases as Phrase[];

      const newSetId = await addSet(setData, phrasesArr);

      if (newSetId) {
        alert(`Set '${title}' imported successfully!`);
      } else {
        throw new Error('Failed to import set via context');
      }

    } catch (err: any) { 
      console.error("Import error:", err);
      setImportError(err.message || 'An unknown error occurred during import.');
      alert(`Import failed: ${err.message || 'Unknown error'}`);
    } finally {
      setImportingSetId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#181818] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-white mb-6">User Gallery</h1>
        <p className="text-center text-gray-400 mb-8">
          Browse and import sets created by the Donkey Bridge community!
        </p>
        {loading && (
          <div className="text-center text-gray-400 py-12">Loading sets...</div>
        )}
        {error && (
          <div className="text-center text-red-400 py-12">{error}</div>
        )}
        {!loading && !error && sets.length === 0 && (
          <div className="text-center text-gray-500 py-12">No sets have been published yet. Be the first to publish a set!</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {sets.map(set => {
            // Ridiculousness calculation
            const ridiculousness = typeof set.seriousnessLevel === 'number' ? `${100 - set.seriousnessLevel}%` : '-';
            // Date
            const date = set.createdAt ? new Date(set.createdAt).toLocaleDateString() : (set.timestamp ? new Date(set.timestamp).toLocaleDateString() : '-');
            // AI model/brand
            const aiInfo = (set.llmBrand || set.llmModel)
              ? `Generated using ${set.llmBrand ? set.llmBrand.charAt(0).toUpperCase() + set.llmBrand.slice(1) : ''}${set.llmBrand && set.llmModel ? ' ' : ''}${set.llmModel || ''} AI`
              : null;
            // Image fallback
            const imgUrl = set.imageUrl || '/images/default-set-logo.png';
            return (
              <div key={set.id} className="relative bg-gray-900 rounded-xl p-4 flex flex-col shadow-lg border border-gray-800">
                {/* Set Image */}
                <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden mb-3 bg-gray-800">
                  <img
                    src={imgUrl}
                    alt={set.title}
                    className="object-cover w-full h-full"
                    onError={ev => {
                      const target = ev.currentTarget;
                      if (target.src !== '/images/default-set-logo.png') {
                        target.src = '/images/default-set-logo.png';
                      }
                    }}
                  />
                </div>
                {/* Set Name */}
                <div className="font-bold text-lg text-white mb-1 truncate text-center">{set.title}</div>
                {/* Made by: username and LLM model */}
                <div className="text-xs text-gray-400 mb-1 text-center">
                  Made by: {set.author || 'Anonymous'}{set.llmModel ? ` and ${set.llmModel}` : ''}
                </div>
                {/* Topics/Description */}
                <div className="text-sm text-gray-300 mb-1 truncate">{set.description || '-'}</div>
                {/* Ridiculousness */}
                <div className="text-xs text-gray-400 mb-2">Ridiculousness: {ridiculousness}</div>
                {/* Progress Bar (always 0 for gallery) */}
                <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                  <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: `0%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>0 learned</span>
                  <span>{set.cardCount || '-'} total</span>
                  <span>0%</span>
                </div>
                {/* Meta info */}
                <div className="flex justify-between text-xs text-gray-500 mt-auto pt-2 border-t border-gray-800">
                  <span>#Cards: {set.cardCount || '-'}</span>
                  <span>{date}</span>
                </div>
                {/* AI model/brand note */}
                {aiInfo && (
                  <div className="text-xs text-gray-500 italic mt-1 text-center">{aiInfo}</div>
                )}
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
          })}
        </div>
      </div>
    </div>
  );
} 
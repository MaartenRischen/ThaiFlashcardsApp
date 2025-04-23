"use client";
import React, { useEffect, useState } from 'react';
import { useSet } from '@/app/context/SetContext';
import { Phrase } from '@/app/lib/set-generator';
import GallerySetCard from './GallerySetCard';

export default function GalleryPage() {
  const { availableSets, addSet, isLoading: contextIsLoading } = useSet();
  const [sets, setSets] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importingSetId, setImportingSetId] = useState<string | null>(null);

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

      const { title, description, phrases, imageUrl, llmBrand, llmModel, seriousnessLevel, specificTopics, ...rest } = fullSetData;
      
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
        {sets.length === 0 ? (
          <div className="text-gray-400 text-center mt-8">No sets found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mt-6">
            {sets.map((set) => (
              <GallerySetCard
                key={(set as any).id}
                set={set as any}
                importingSetId={importingSetId}
                contextIsLoading={contextIsLoading}
                handleImport={handleImport}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
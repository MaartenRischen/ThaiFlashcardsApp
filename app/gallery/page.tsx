"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { useSet } from '@/app/context/SetContext';
import { Phrase } from '@/app/lib/set-generator';
import GallerySetCard from './GallerySetCard';
import { GalleryHorizontal, Loader2 } from 'lucide-react';

interface GallerySet {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  seriousnessLevel?: number;
  createdAt?: string | Date;
  timestamp?: string | Date;
  author?: string;
  cardCount?: number;
  specificTopics?: string;
}

export default function GalleryPage() {
  const { availableSets, addSet, isLoading: contextIsLoading } = useSet();
  const [sets, setSets] = useState<GallerySet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importingSetId, setImportingSetId] = useState<string | null>(null);

  // --- Search/Filter State ---
  const [search, setSearch] = useState('');
  const [selectedProficiency, setSelectedProficiency] = useState<string | null>(null);
  const [selectedRidiculousness, setSelectedRidiculousness] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'Newest' | 'Oldest'>('Newest');

  // --- Extract unique topics from sets ---
  const allTopics = useMemo(() => {
    const topics = new Set<string>();
    sets.forEach(set => {
      if (set.specificTopics) {
        set.specificTopics.split(',').map((t: string) => t.trim()).forEach((t: string) => topics.add(t));
      }
    });
    return Array.from(topics).filter(Boolean);
  }, [sets]);

  // --- Filtering Logic ---
  const filteredSets = useMemo(() => {
    let filtered = sets;
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter(set =>
        set.title?.toLowerCase().includes(s) ||
        set.description?.toLowerCase().includes(s)
      );
    }
    if (selectedProficiency) {
      filtered = filtered.filter(set =>
        set.seriousnessLevel !== undefined &&
        (set.seriousnessLevel === null || set.seriousnessLevel === undefined ||
         set.seriousnessLevel.toString().toLowerCase() === selectedProficiency.toLowerCase() ||
         (set.title && set.title.toLowerCase().includes(selectedProficiency.toLowerCase()))
        )
      );
    }
    if (selectedRidiculousness) {
      filtered = filtered.filter(set =>
        set.seriousnessLevel !== undefined &&
        (set.seriousnessLevel === null || set.seriousnessLevel === undefined ||
         set.seriousnessLevel.toString().toLowerCase() === selectedRidiculousness.toLowerCase() ||
         (set.title && set.title.toLowerCase().includes(selectedRidiculousness.toLowerCase()))
        )
      );
    }
    if (selectedTopics.length > 0) {
      filtered = filtered.filter(set =>
        set.specificTopics && selectedTopics.every(topic => set.specificTopics?.includes(topic))
      );
    }
    if (sortOrder === 'Newest') {
      filtered = filtered.slice().sort((a, b) => {
        const aDate = new Date(a.createdAt || 0).getTime();
        const bDate = new Date(b.createdAt || 0).getTime();
        return bDate - aDate;
      });
    } else {
      filtered = filtered.slice().sort((a, b) => {
        const aDate = new Date(a.createdAt || 0).getTime();
        const bDate = new Date(b.createdAt || 0).getTime();
        return aDate - bDate;
      });
    }
    return filtered;
  }, [sets, search, selectedProficiency, selectedRidiculousness, selectedTopics, sortOrder]);

  // --- Proficiency, Ridiculousness, and Sort Options ---
  const proficiencyOptions = ['Beginner', 'Intermediate', 'Advanced', 'Fluent', 'God Mode'];
  const ridiculousnessOptions = ['Serious', 'Balanced', 'Ridiculous'];
  const sortOptions = ['Newest', 'Oldest'];

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/api/gallery')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch gallery sets');
        return res.json();
      })
      .then(data => {
        console.log('Gallery sets data:', data);
        // Log each set's author to debug
        data.forEach((set: GallerySet, index: number) => {
          console.log(`Set ${index} - Title: ${set.title}, Author: '${set.author}'`);
        });
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

    } catch (err: unknown) {
      console.error("Import error:", err);
      const message = (err instanceof Error) ? err.message : 'Unknown error';
      alert(`Import failed: ${message}`);
    } finally {
      setImportingSetId(null);
    }
  };

  const handleDelete = async (setId: string) => {
    try {
      const res = await fetch(`/api/gallery/${setId}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete set');
      }
      setSets(prev => prev.filter(set => set.id !== setId));
      alert('Set deleted successfully.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert('Delete failed: ' + message);
    }
  };

  return (
    <div className="container max-w-5xl py-8 bg-indigo-950/20 rounded-lg my-4">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <GalleryHorizontal className="h-5 w-5 text-indigo-400" />
          <h1 className="text-xl font-medium text-indigo-400">User Gallery</h1>
        </div>
      </div>
      {/* --- Search/Filter UI --- */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <input
            type="text"
            className="bg-indigo-900/40 border border-indigo-700/40 rounded-md px-3 py-2 text-indigo-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-72"
            placeholder="Search sets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-indigo-300 text-xs font-medium">Proficiency:</span>
            {proficiencyOptions.map(opt => (
              <button
                key={opt}
                className={`px-3 py-1 rounded-full text-xs border transition-all ${selectedProficiency === opt ? 'bg-blue-600/90 text-white border-blue-500' : 'bg-transparent text-indigo-200 border-indigo-700/40 hover:bg-blue-900/30'}`}
                onClick={() => setSelectedProficiency(selectedProficiency === opt ? null : opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-indigo-300 text-xs font-medium">Ridiculousness:</span>
          {ridiculousnessOptions.map(opt => (
            <button
              key={opt}
              className={`px-3 py-1 rounded-full text-xs border transition-all ${selectedRidiculousness === opt ? 'bg-blue-600/90 text-white border-blue-500' : 'bg-transparent text-indigo-200 border-indigo-700/40 hover:bg-blue-900/30'}`}
              onClick={() => setSelectedRidiculousness(selectedRidiculousness === opt ? null : opt)}
            >
              {opt}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-indigo-300 text-xs font-medium">Topics:</span>
          {allTopics.map(topic => (
            <button
              key={topic}
              className={`px-3 py-1 rounded-full text-xs border transition-all ${selectedTopics.includes(topic) ? 'bg-blue-600/90 text-white border-blue-500' : 'bg-transparent text-indigo-200 border-indigo-700/40 hover:bg-blue-900/30'}`}
              onClick={() => setSelectedTopics(selectedTopics.includes(topic) ? selectedTopics.filter(t => t !== topic) : [...selectedTopics, topic])}
            >
              {topic}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-indigo-300 text-xs font-medium">Sort:</span>
          <select
            className="bg-indigo-900/40 border border-indigo-700/40 rounded-md px-2 py-1 text-indigo-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as 'Newest' | 'Oldest')}
          >
            {sortOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-sm text-indigo-200 mb-6 -mt-4">
        Browse and import sets created by the Donkey Bridge community
      </p>
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-md text-red-400 text-sm mb-4">
          {error}
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600/90" />
        </div>
      ) : filteredSets.length === 0 ? (
        <div className="bg-indigo-900/30 rounded-lg border border-indigo-800/30 p-6 text-center">
          <div className="flex justify-center mb-4">
            <GalleryHorizontal className="h-12 w-12 text-indigo-400/70" />
          </div>
          <h3 className="text-base font-medium mb-2 text-indigo-400">No gallery sets found</h3>
          <p className="text-sm text-indigo-300 mb-5">
            No sets have been published to the gallery yet. You can publish your own sets from the My Sets page!
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSets.map((set) => (
            <GallerySetCard
              key={set.id}
              set={set}
              importingSetId={importingSetId}
              contextIsLoading={contextIsLoading}
              handleImport={handleImport}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
} 
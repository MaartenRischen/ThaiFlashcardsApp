"use client";
import React, { useEffect, useState } from 'react';
import { useSet } from '@/app/context/SetContext';
import { Phrase } from '@/app/lib/set-generator';
import GallerySetCard from './GallerySetCard';
import { GalleryHorizontal, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface GallerySet {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  seriousnessLevel?: number;
  proficiencyLevel?: string;
  topics?: string[];
  ridiculousness?: string;
  createdAt?: string | Date;
  timestamp?: string | Date;
  author?: string;
  cardCount?: number;
}

const PROFICIENCY_LEVELS = [
  'Beginner', 'Intermediate', 'Advanced', 'Fluent', 'God Mode'
];
const RIDICULOUSNESS_LEVELS = [
  'Serious', 'Balanced', 'Ridiculous'
];

export default function GalleryPage() {
  const { availableSets, addSet, isLoading: contextIsLoading } = useSet();
  const [sets, setSets] = useState<GallerySet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importingSetId, setImportingSetId] = useState<string | null>(null);
  const { data: session } = useSession();
  const isAdmin = session?.user?.email === 'rischenme@gmail.com';

  // --- Filter State ---
  const [search, setSearch] = useState('');
  const [selectedProficiency, setSelectedProficiency] = useState<string[]>([]);
  const [selectedRidiculousness, setSelectedRidiculousness] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'title'>('newest');

  // --- Extract all unique topics from sets ---
  const allTopics = Array.from(new Set(sets.flatMap(s => s.topics || []))).sort();

  // --- Filtering Logic ---
  const filteredSets = sets.filter(set => {
    // Search
    const searchLower = search.toLowerCase();
    const matchesSearch =
      set.title?.toLowerCase().includes(searchLower) ||
      set.description?.toLowerCase().includes(searchLower) ||
      (set.topics || []).some(t => t.toLowerCase().includes(searchLower));
    if (search && !matchesSearch) return false;
    // Proficiency
    if (selectedProficiency.length > 0 && !selectedProficiency.includes(set.proficiencyLevel || '')) return false;
    // Ridiculousness
    if (selectedRidiculousness.length > 0 && !selectedRidiculousness.includes(set.ridiculousness || '')) return false;
    // Topics
    if (selectedTopics.length > 0 && !set.topics?.some(t => selectedTopics.includes(t))) return false;
    return true;
  });

  // --- Sorting ---
  const sortedSets = [...filteredSets].sort((a, b) => {
    if (sortBy === 'newest') {
      return (new Date(b.createdAt || b.timestamp || 0).getTime()) - (new Date(a.createdAt || a.timestamp || 0).getTime());
    } else {
      return (a.title || '').localeCompare(b.title || '');
    }
  });

  // --- Group by proficiency ---
  const setsByProficiency: Record<string, GallerySet[]> = {};
  PROFICIENCY_LEVELS.forEach(level => {
    setsByProficiency[level] = sortedSets.filter(set => set.proficiencyLevel === level);
  });

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

  return (
    <div className="container max-w-5xl py-8 bg-indigo-950/20 rounded-lg my-4">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <GalleryHorizontal className="h-5 w-5 text-indigo-400" />
          <h1 className="text-xl font-medium text-indigo-400">User Gallery</h1>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <input
          type="text"
          placeholder="Search sets..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 rounded bg-indigo-900/40 text-indigo-100 border border-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-auto min-w-[220px]"
        />
        {/* Proficiency Chips */}
        <div className="flex flex-wrap gap-1 items-center">
          <span className="text-xs text-indigo-300 mr-1">Proficiency:</span>
          {PROFICIENCY_LEVELS.map(level => (
            <button
              key={level}
              type="button"
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all
                ${selectedProficiency.includes(level)
                  ? 'bg-blue-600 text-white border-blue-500 shadow'
                  : 'bg-indigo-900/40 text-indigo-200 border-indigo-700 hover:bg-blue-900/40'}`}
              onClick={() => setSelectedProficiency(selectedProficiency.includes(level)
                ? selectedProficiency.filter(l => l !== level)
                : [...selectedProficiency, level])}
              aria-pressed={selectedProficiency.includes(level)}
            >
              {level}
            </button>
          ))}
        </div>
        {/* Ridiculousness Chips */}
        <div className="flex flex-wrap gap-1 items-center">
          <span className="text-xs text-indigo-300 mr-1">Ridiculousness:</span>
          {RIDICULOUSNESS_LEVELS.map(level => (
            <button
              key={level}
              type="button"
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all
                ${selectedRidiculousness.includes(level)
                  ? (level === 'Serious' ? 'bg-gray-800 text-white border-gray-600' : level === 'Balanced' ? 'bg-yellow-700 text-white border-yellow-500' : 'bg-pink-700 text-white border-pink-500')
                  : 'bg-indigo-900/40 text-indigo-200 border-indigo-700 hover:bg-blue-900/40'}`}
              onClick={() => setSelectedRidiculousness(selectedRidiculousness.includes(level)
                ? selectedRidiculousness.filter(l => l !== level)
                : [...selectedRidiculousness, level])}
              aria-pressed={selectedRidiculousness.includes(level)}
            >
              {level}
            </button>
          ))}
        </div>
        {/* Topics Chips */}
        <div className="flex flex-wrap gap-1 items-center max-w-full">
          <span className="text-xs text-indigo-300 mr-1">Topics:</span>
          {allTopics.map(topic => (
            <button
              key={topic}
              type="button"
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all truncate max-w-[120px]
                ${selectedTopics.includes(topic)
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                  : 'bg-indigo-900/40 text-indigo-200 border-indigo-700 hover:bg-blue-900/40'}`}
              onClick={() => setSelectedTopics(selectedTopics.includes(topic)
                ? selectedTopics.filter(t => t !== topic)
                : [...selectedTopics, topic])}
              aria-pressed={selectedTopics.includes(topic)}
              title={topic}
            >
              {topic}
            </button>
          ))}
        </div>
        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as 'newest' | 'title')}
          className="px-2 py-1 rounded bg-indigo-900/40 text-indigo-100 border border-indigo-800 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="title">Title (A-Z)</option>
        </select>
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
      ) : (
        <div>
          {PROFICIENCY_LEVELS.map(level => (
            setsByProficiency[level].length > 0 && (
              <div key={level} className="mb-10">
                <h2 className="text-lg font-semibold text-blue-300 mb-3">{level}</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {setsByProficiency[level].map((set) => (
                    <GallerySetCard
                      key={set.id}
                      set={set}
                      importingSetId={importingSetId}
                      contextIsLoading={contextIsLoading}
                      handleImport={handleImport}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              </div>
            )
          ))}
          {Object.values(setsByProficiency).every(arr => arr.length === 0) && (
            <div className="bg-indigo-900/30 rounded-lg border border-indigo-800/30 p-6 text-center">
              <div className="flex justify-center mb-4">
                <GalleryHorizontal className="h-12 w-12 text-indigo-400/70" />
              </div>
              <h3 className="text-base font-medium mb-2 text-indigo-400">No gallery sets found</h3>
              <p className="text-sm text-indigo-300 mb-5">
                No sets match your filters. Try adjusting your search or filter options.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
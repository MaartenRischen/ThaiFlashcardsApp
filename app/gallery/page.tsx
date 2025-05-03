"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { useSet } from '@/app/context/SetContext';
import { Phrase } from '@/app/lib/set-generator';
import GallerySetCard from './GallerySetCard';
import { GalleryHorizontal, Loader2 } from 'lucide-react';
// Import a modal component (we'll create this next)
import CardViewerModal from './CardViewerModal';

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
  specificTopics?: string;
}

// Define a type for the full set data including phrases
interface FullGallerySet extends GallerySet {
  phrases: Phrase[];
  // Include other fields fetched from the API if needed
  llmBrand?: string;
  llmModel?: string;
}

interface DisplaySet extends Omit<GallerySet, 'phrases' | 'createdAt'> {
  id: string;
  createdAt: Date; // Keep as Date object for sorting
  phraseCount: number;
  generationMeta?: { imageUrl?: string | null } | null; 
  userId: string;
}

export default function GalleryPage() {
  const { availableSets, addSet, isLoading: contextIsLoading } = useSet();
  const [sets, setSets] = useState<DisplaySet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importingSetId, setImportingSetId] = useState<string | null>(null);

  // --- State for Card Viewer --- 
  const [viewingSet, setViewingSet] = useState<FullGallerySet | null>(null); // Store the full set data
  const [isCardViewerOpen, setIsCardViewerOpen] = useState(false);
  const [cardViewLoading, setCardViewLoading] = useState(false);
  const [cardViewError, setCardViewError] = useState<string | null>(null);

  // --- Search/Filter State ---
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'Newest' | 'Oldest' | 'Most Cards' | 'Highest Rated'>('Newest');
  const [proficiencyFilter, setProficiencyFilter] = useState<string>('All');
  const [authorFilter, setAuthorFilter] = useState<string>('All');

  // --- Filtering Logic ---
  const sortOptions = ['Newest', 'Oldest', 'Most Cards', 'Highest Rated'];
  
  // Move proficiencyLevels into useMemo
  const proficiencyLevels = useMemo(() => [
    'All',
    'Complete Beginner',
    'Basic Understanding',
    'Intermediate',
    'Advanced',
    'Native/Fluent',
    'God Mode'
  ], []); // Empty dependency array since this never changes

  // Get unique authors from sets
  const authors = useMemo(() => {
    const uniqueAuthors = new Set(sets.map(set => set.author || 'Anonymous').filter(Boolean));
    return ['All', ...Array.from(uniqueAuthors)].sort((a, b) => {
      if (a === 'All') return -1;
      if (b === 'All') return 1;
      return a.localeCompare(b);
    });
  }, [sets]);

  const filteredSets = useMemo(() => {
    // Move mapProficiencyLevel inside useMemo
    const mapProficiencyLevel = (level: string | undefined): string => {
      if (!level) return 'Complete Beginner';
      
      const normalizedLevel = level.toLowerCase().trim();
      
      // Direct matches
      if (proficiencyLevels.some(l => l.toLowerCase() === normalizedLevel)) {
        return level;
      }

      // Mapping logic for non-standard values
      if (normalizedLevel.includes('beginner') || normalizedLevel.includes('basic')) {
        return normalizedLevel.includes('complete') ? 'Complete Beginner' : 'Basic Understanding';
      }
      if (normalizedLevel.includes('intermediate')) return 'Intermediate';
      if (normalizedLevel.includes('advanced')) return 'Advanced';
      if (normalizedLevel.includes('native') || normalizedLevel.includes('fluent')) return 'Native/Fluent';
      if (normalizedLevel.includes('god')) return 'God Mode';

      // Default to Complete Beginner if no match
      return 'Complete Beginner';
    };

    let filtered = sets;

    // Text search
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter(set =>
        set.title?.toLowerCase().includes(s) ||
        set.description?.toLowerCase().includes(s) ||
        set.specificTopics?.toLowerCase().includes(s)
      );
    }

    // Proficiency filter
    if (proficiencyFilter !== 'All') {
      filtered = filtered.filter(set => 
        mapProficiencyLevel(set.proficiencyLevel) === proficiencyFilter
      );
    }

    // Author filter
    if (authorFilter !== 'All') {
      filtered = filtered.filter(set => 
        (set.author || 'Anonymous') === authorFilter
      );
    }

    // Sorting
    filtered = filtered.slice().sort((a, b) => {
      switch (sortOrder) {
        case 'Newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'Oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'Most Cards':
          return (b.cardCount || 0) - (a.cardCount || 0);
        case 'Highest Rated':
          // TODO: Implement rating system
          return 0;
        default:
          return 0;
      }
    });

    return filtered;
  }, [sets, search, sortOrder, proficiencyFilter, authorFilter, proficiencyLevels]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/api/gallery')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch gallery sets');
        return res.json();
      })
      .then(data => {
        // Map publishedAt to createdAt and fix cardCount for all sets
        const mapped = data.map((set: GallerySet & { publishedAt?: string | Date; phraseCount?: number }) => ({
          ...set,
          createdAt: set.publishedAt || set.createdAt,
          cardCount: set.cardCount ?? set.phraseCount ?? 0,
        }));
        setSets(mapped);
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

  // --- Function to handle viewing cards ---
  const handleViewCards = async (setId: string) => {
    setCardViewLoading(true);
    setCardViewError(null);
    setViewingSet(null); // Clear previous set
    setIsCardViewerOpen(true);

    try {
      const res = await fetch(`/api/gallery/${setId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch set details for viewing');
      }
      const fullSetData: FullGallerySet = await res.json();
      setViewingSet(fullSetData); // Store the full set data
    } catch (err: unknown) {
      console.error("View Cards error:", err);
      const message = (err instanceof Error) ? err.message : 'Unknown error fetching cards';
      setCardViewError(message);
      // Keep modal open to show error maybe? Or close it?
      // setIsCardViewerOpen(false); 
    } finally {
      setCardViewLoading(false);
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

  // --- Function to close the modal ---
  const handleCloseCardViewer = () => {
    setIsCardViewerOpen(false);
    setViewingSet(null); // Clear set data when closing
    setCardViewError(null);
  };

  return (
    <div className="container max-w-5xl py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-medium text-indigo-400">User Gallery</h1>
        
        {/* Search and Filter Controls */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search sets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="neumorphic-input rounded-xl px-4 py-2 text-sm bg-[#232336] border border-[#33335a] text-indigo-100 placeholder-indigo-400/60 focus:outline-none focus:ring-2 focus:ring-[#A9C4FC] focus:border-[#A9C4FC] transition shadow-sm"
          />
          
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
            className="neumorphic-select rounded-xl px-4 py-2 text-sm bg-[#232336] border border-[#33335a] text-indigo-100 focus:outline-none focus:ring-2 focus:ring-[#A9C4FC] focus:border-[#A9C4FC] transition shadow-sm"
          >
            {sortOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          
          <select
            value={proficiencyFilter}
            onChange={(e) => setProficiencyFilter(e.target.value)}
            className="neumorphic-select rounded-xl px-4 py-2 text-sm bg-[#232336] border border-[#33335a] text-indigo-100 focus:outline-none focus:ring-2 focus:ring-[#A9C4FC] focus:border-[#A9C4FC] transition shadow-sm"
          >
            {proficiencyLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          
          <select
            value={authorFilter}
            onChange={(e) => setAuthorFilter(e.target.value)}
            className="neumorphic-select rounded-xl px-4 py-2 text-sm bg-[#232336] border border-[#33335a] text-indigo-100 focus:outline-none focus:ring-2 focus:ring-[#A9C4FC] focus:border-[#A9C4FC] transition shadow-sm"
          >
            {authors.map(author => (
              <option key={author} value={author}>{author}</option>
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
              handleViewCards={handleViewCards}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* --- Render Card Viewer Modal --- */}
      {isCardViewerOpen && (
        <CardViewerModal 
          set={viewingSet} 
          isLoading={cardViewLoading} 
          error={cardViewError} 
          onClose={handleCloseCardViewer} 
        />
      )}
    </div>
  );
} 
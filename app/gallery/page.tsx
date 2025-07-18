"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { useSet } from '@/app/context/SetContext';
import { Phrase } from '@/app/lib/set-generator';
import GallerySetCard from './GallerySetCard';
import { GalleryHorizontal, Loader2, Trash2 } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
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
  publishedAt: string; // Required for GallerySetCard
  phraseCount: number;
  cardCount: number; // Make cardCount required
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

  // --- State for Bulk Delete ---
  const [selectedSets, setSelectedSets] = useState<Set<string>>(new Set());
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const { user } = useUser();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress;
  const isAdmin = userEmail === 'maartenrischen@protonmail.com';

  // --- Search/Filter State ---
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'Newest' | 'Oldest' | 'Most Cards' | 'Highest Rated'>('Newest');
  const [authorFilter, setAuthorFilter] = useState<string>('All');

  // --- Filtering Logic ---
  const sortOptions = ['Newest', 'Oldest', 'Most Cards', 'Highest Rated'];
  
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
          return 0;
        default:
          return 0;
      }
    });

    return filtered;
  }, [sets, search, sortOrder, authorFilter]);

  // Function to fetch gallery sets
  const fetchSets = () => {
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
          publishedAt: String(set.publishedAt || set.createdAt || new Date().toISOString()), // Ensure publishedAt is always a string
          cardCount: set.cardCount ?? set.phraseCount ?? 0,
        }));
        setSets(mapped);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Unknown error');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSets();
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

  const handleToggleSelect = (setId: string) => {
    setSelectedSets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(setId)) {
        newSet.delete(setId);
      } else {
        newSet.add(setId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedSets.size === filteredSets.length) {
      setSelectedSets(new Set());
    } else {
      setSelectedSets(new Set(filteredSets.map(s => s.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSets.size === 0) return;

    const confirmation = window.confirm(`Are you sure you want to delete ${selectedSets.size} set(s)? This action cannot be undone.`);
    if (!confirmation) return;

    setIsDeletingBulk(true);
    let successCount = 0;
    let failCount = 0;

    for (const setId of Array.from(selectedSets)) {
      try {
        const response = await fetch(`/api/gallery/${setId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`Error deleting set ${setId}:`, error);
        failCount++;
      }
    }

    // Refresh the sets list
    fetchSets();
    setSelectedSets(new Set());
    setIsDeletingBulk(false);

    if (failCount > 0) {
      alert(`Deleted ${successCount} set(s) successfully. ${failCount} set(s) failed to delete.`);
    } else {
      alert(`Successfully deleted ${successCount} set(s).`);
    }
  };

  // --- Function to close the modal ---
  const handleCloseCardViewer = () => {
    setIsCardViewerOpen(false);
    setViewingSet(null); // Clear set data when closing
    setCardViewError(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {isAdmin && selectedSets.size > 0 && (
        <div className="mb-4 p-3 neumorphic rounded-lg flex items-center justify-between bg-red-900/10 border-red-800/30">
          <span className="text-sm text-red-400">
            {selectedSets.size} set{selectedSets.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedSets(new Set())}
              className="px-3 py-1.5 text-sm text-red-400/70 hover:text-red-400 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isDeletingBulk}
              className="neumorphic-button px-4 py-1.5 text-sm text-red-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isDeletingBulk ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Selected
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search sets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="neumorphic-input w-full mb-4"
        />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-[#E0E0E0]">Gallery</h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {isAdmin && filteredSets.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="neumorphic-button rounded-xl px-4 py-2 text-sm bg-[#3C3C3C] border border-[#404040] text-[#E0E0E0] hover:bg-[#4C4C4C] transition"
              >
                {selectedSets.size === filteredSets.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
              className="neumorphic-input rounded-xl px-4 py-2 text-sm bg-[#3C3C3C] border border-[#404040] text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#BB86FC] focus:border-[#BB86FC] transition"
            >
              {sortOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <select
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              className="neumorphic-input rounded-xl px-4 py-2 text-sm bg-[#3C3C3C] border border-[#404040] text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#BB86FC] focus:border-[#BB86FC] transition"
            >
              {authors.map(author => (
                <option key={author} value={author}>{author}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <p className="text-sm text-[#BDBDBD] mb-6 -mt-6">
        Browse and import sets created by the Donkey Bridge community
      </p>

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-md text-red-400 text-sm mb-4">
          {error}
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-[#BB86FC]" />
        </div>
      ) : filteredSets.length === 0 ? (
        <div className="neumorphic rounded-lg p-6 text-center">
          <div className="flex justify-center mb-4">
            <GalleryHorizontal className="h-12 w-12 text-[#BDBDBD]" />
          </div>
          <h3 className="text-base font-medium mb-2 text-[#E0E0E0]">No gallery sets found</h3>
          <p className="text-sm text-[#BDBDBD] mb-5">
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
              isSelected={selectedSets.has(set.id)}
              onToggleSelect={isAdmin ? () => handleToggleSelect(set.id) : undefined}
              showCheckbox={isAdmin}
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
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

  // Debug logging for admin check
  console.log('Gallery Page - User:', user);
  console.log('Gallery Page - User Email:', userEmail);
  console.log('Gallery Page - Is Admin:', isAdmin);

  // --- Search/Filter State ---
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'Newest' | 'Oldest' | 'Most Cards' | 'Highest Rated'>('Newest');
  const [authorFilter, setAuthorFilter] = useState<string>('All');

  // Dynamic filter (field + operator + value)
  type FieldType = 'string' | 'number' | 'date';
  const filterableFields = useMemo(() => [
    { key: 'title' as keyof DisplaySet | 'proficiencyLevel' | 'seriousnessLevel' | 'publishedAt', label: 'Title', type: 'string' as FieldType },
    { key: 'description' as keyof DisplaySet | 'proficiencyLevel' | 'seriousnessLevel' | 'publishedAt', label: 'Description', type: 'string' as FieldType },
    { key: 'author' as keyof DisplaySet | 'proficiencyLevel' | 'seriousnessLevel' | 'publishedAt', label: 'Author', type: 'string' as FieldType },
    { key: 'proficiencyLevel' as keyof DisplaySet | 'proficiencyLevel' | 'seriousnessLevel' | 'publishedAt', label: 'Proficiency Level', type: 'string' as FieldType },
    { key: 'seriousnessLevel' as keyof DisplaySet | 'proficiencyLevel' | 'seriousnessLevel' | 'publishedAt', label: 'Tone Level (number)', type: 'number' as FieldType },
    { key: 'cardCount' as keyof DisplaySet | 'proficiencyLevel' | 'seriousnessLevel' | 'publishedAt', label: 'Card Count', type: 'number' as FieldType },
    { key: 'phraseCount' as keyof DisplaySet | 'proficiencyLevel' | 'seriousnessLevel' | 'publishedAt', label: 'Phrase Count', type: 'number' as FieldType },
    { key: 'llmBrand' as keyof DisplaySet, label: 'LLM Brand', type: 'string' as FieldType },
    { key: 'llmModel' as keyof DisplaySet, label: 'LLM Model', type: 'string' as FieldType },
    { key: 'publishedAt' as keyof DisplaySet | 'proficiencyLevel' | 'seriousnessLevel' | 'publishedAt', label: 'Published At', type: 'date' as FieldType },
  ], []);
  const [filterKey, setFilterKey] = useState<string>('');
  const [filterOp, setFilterOp] = useState<'contains' | 'eq' | 'gte' | 'lte'>('contains');
  const [filterValue, setFilterValue] = useState<string>('');

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

    // Text search across many fields
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter(set => {
        const haystack = [
          set.title,
          set.description,
          set.author,
          set.proficiencyLevel,
          String(set.seriousnessLevel ?? ''),
          set.specificTopics,
          (set as unknown as Record<string, unknown>).llmBrand,
          (set as unknown as Record<string, unknown>).llmModel,
          set.publishedAt,
          String(set.cardCount ?? ''),
          String(set.phraseCount ?? ''),
          set.id,
        ]
          .filter(Boolean)
          .join(' | ')
          .toLowerCase();
        return haystack.includes(s);
      });
    }

    // Author filter
    if (authorFilter !== 'All') {
      filtered = filtered.filter(set => (set.author || 'Anonymous') === authorFilter);
    }

    // Dynamic filter
    if (filterKey && filterValue.trim()) {
      const field = filterableFields.find(f => f.key === (filterKey as keyof DisplaySet | 'proficiencyLevel' | 'seriousnessLevel' | 'publishedAt'));
      const v = filterValue.trim();
      if (field) {
        filtered = filtered.filter(set => {
          let value: unknown;
          if (field.key === 'publishedAt') {
            value = set.publishedAt ? new Date(set.publishedAt) : null;
          } else if (field.key === 'proficiencyLevel') {
            value = (set as unknown as Record<string, unknown>).proficiencyLevel ?? '';
          } else if (field.key === 'seriousnessLevel') {
            value = (set as unknown as Record<string, unknown>).seriousnessLevel ?? null;
          } else {
            value = (set as unknown as Record<string, unknown>)[field.key as keyof DisplaySet];
          }

          if (field.type === 'string') {
            const text = String(value ?? '').toLowerCase();
            if (filterOp === 'eq') return text === v.toLowerCase();
            return text.includes(v.toLowerCase());
          }

          if (field.type === 'number') {
            const num = Number(value);
            const target = Number(v);
            if (Number.isNaN(target)) return true; // ignore invalid input
            if (filterOp === 'eq') return num === target;
            if (filterOp === 'gte') return num >= target;
            if (filterOp === 'lte') return num <= target;
            return true;
          }

          if (field.type === 'date') {
            const dateVal = value instanceof Date ? value : (value ? new Date(String(value)) : null);
            const target = new Date(v);
            if (!dateVal || isNaN(target.getTime())) return true;
            if (filterOp === 'eq') return dateVal.toDateString() === target.toDateString();
            if (filterOp === 'gte') return dateVal.getTime() >= target.getTime();
            if (filterOp === 'lte') return dateVal.getTime() <= target.getTime();
            return true;
          }

          return true;
        });
      }
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
  }, [sets, search, sortOrder, authorFilter, filterKey, filterOp, filterValue]);

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
        // Ensure data is an array
        if (!Array.isArray(data)) {
          console.error('Gallery API returned non-array data:', data);
          setError('Invalid data format received from server');
          setLoading(false);
          return;
        }
        
        // Map publishedAt to createdAt and fix cardCount for all sets
        const mapped = data.map((set: GallerySet & { publishedAt?: string | Date; phraseCount?: number }) => ({
          ...set,
          createdAt: new Date(set.publishedAt || set.createdAt || new Date()),
          publishedAt: String(set.publishedAt || set.createdAt || new Date().toISOString()), // Ensure publishedAt is always a string
          cardCount: set.cardCount ?? set.phraseCount ?? 0,
          phraseCount: set.phraseCount ?? set.cardCount ?? 0, // Ensure phraseCount is always a number
          userId: set.author || 'anonymous', // Use author as userId or fallback to 'anonymous'
        }));
        setSets(mapped);
        setLoading(false);
      })
      .catch(err => {
        console.error('Gallery fetch error:', err);
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
    <div className="max-w-7xl mx-auto p-6">
      {isAdmin && selectedSets.size > 0 && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-800/40 rounded-xl flex items-center justify-between">
          <span className="text-sm text-red-400 font-medium">
            {selectedSets.size} set{selectedSets.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedSets(new Set())}
              className="px-4 py-2 text-sm text-red-400/70 hover:text-red-400 transition-colors rounded-lg hover:bg-red-900/20"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isDeletingBulk}
              className="px-4 py-2 text-sm text-red-400 bg-red-900/30 hover:bg-red-900/50 border border-red-800/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
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
      
      {/* Header Section */}
      <div className="mb-8">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-[#E0E0E0] mb-3">Public Sets</h1>
          <p className="text-lg text-[#BDBDBD] max-w-2xl mx-auto">
            Browse and import sets created by the Donkey Bridge community
          </p>
        </div>
        
        {/* Search and Filters */}
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search sets by title, description, or topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#444] rounded-xl text-[#E0E0E0] placeholder-[#8B8B8B] focus:outline-none focus:ring-2 focus:ring-[#BB86FC] focus:border-[#BB86FC] transition-all"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isAdmin && filteredSets.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 bg-[#3C3C3C] border border-[#555] text-[#E0E0E0] rounded-lg hover:bg-[#4C4C4C] transition-colors text-sm font-medium"
              >
                {selectedSets.size === filteredSets.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
              className="px-4 py-2 bg-[#2A2A2A] border border-[#444] text-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BB86FC] focus:border-[#BB86FC] transition-all text-sm"
            >
              {sortOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <select
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              className="px-4 py-2 bg-[#2A2A2A] border border-[#444] text-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BB86FC] focus:border-[#BB86FC] transition-all text-sm"
            >
              {authors.map(author => (
                <option key={author} value={author}>{author}</option>
              ))}
            </select>
          </div>

          {/* Dynamic filter row */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <select
              value={filterKey}
              onChange={(e) => {
                const key = e.target.value;
                setFilterKey(key);
                // Adjust default operator by field type
                const field = filterableFields.find(f => f.key === (key as keyof DisplaySet | 'proficiencyLevel' | 'seriousnessLevel' | 'publishedAt'));
                if (field?.type === 'string') setFilterOp('contains');
                else setFilterOp('eq');
              }}
              className="px-4 py-2 bg-[#2A2A2A] border border-[#444] text-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BB86FC] focus:border-[#BB86FC] transition-all text-sm"
            >
              <option value="">Filter by (any field)</option>
              {filterableFields.map(f => (
                <option key={String(f.key)} value={String(f.key)}>{f.label}</option>
              ))}
            </select>

            <select
              value={filterOp}
              onChange={(e) => setFilterOp(e.target.value as 'contains' | 'eq' | 'gte' | 'lte')}
              className="px-4 py-2 bg-[#2A2A2A] border border-[#444] text-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BB86FC] focus:border-[#BB86FC] transition-all text-sm"
            >
              {(() => {
                const field = filterableFields.find(f => f.key === (filterKey as keyof DisplaySet | 'proficiencyLevel' | 'seriousnessLevel' | 'publishedAt'));
                if (!field || field.type === 'string') {
                  return (
                    <>
                      <option value="contains">contains</option>
                      <option value="eq">equals</option>
                    </>
                  );
                }
                if (field.type === 'number' || field.type === 'date') {
                  return (
                    <>
                      <option value="eq">equals</option>
                      <option value="gte">≥</option>
                      <option value="lte">≤</option>
                    </>
                  );
                }
                return null;
              })()}
            </select>

            {(() => {
              const field = filterableFields.find(f => f.key === (filterKey as keyof DisplaySet | 'proficiencyLevel' | 'seriousnessLevel' | 'publishedAt'));
              const inputType = field?.type === 'number' ? 'number' : (field?.type === 'date' ? 'date' : 'text');
              return (
                <input
                  type={inputType}
                  placeholder="Value"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="w-full sm:w-64 px-4 py-2 bg-[#2A2A2A] border border-[#444] text-[#E0E0E0] rounded-lg placeholder-[#8B8B8B] focus:outline-none focus:ring-2 focus:ring-[#BB86FC] focus:border-[#BB86FC] transition-all text-sm"
                />
              );
            })()}

            {(filterKey || filterValue) && (
              <button
                onClick={() => { setFilterKey(''); setFilterOp('contains'); setFilterValue(''); }}
                className="px-4 py-2 bg-[#3C3C3C] border border-[#555] text-[#E0E0E0] rounded-lg hover:bg-[#4C4C4C] transition-colors text-sm"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-4xl mx-auto p-4 bg-red-900/20 border border-red-700/40 rounded-xl text-red-400 text-sm mb-6">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#BB86FC] mx-auto mb-4" />
            <p className="text-[#BDBDBD]">Loading public sets...</p>
          </div>
        </div>
      ) : filteredSets.length === 0 ? (
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="bg-[#2A2A2A] border border-[#444] rounded-xl p-8">
            <div className="flex justify-center mb-6">
              <GalleryHorizontal className="h-16 w-16 text-[#8B8B8B]" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-[#E0E0E0]">No gallery sets found</h3>
            <p className="text-[#BDBDBD] mb-6">
              Try adjusting your search or filters.
            </p>
            <div className="text-sm text-[#8B8B8B]">
              Sets published to the gallery become available to the entire community for learning and inspiration.
            </div>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
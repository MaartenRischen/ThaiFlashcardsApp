'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { ExampleSentence } from '../../lib/set-generator';

interface Phrase {
  id: string;
  english: string;
  thai: string;
  thaiMasculine?: string;
  thaiFeminine?: string;
  pronunciation?: string;
  mnemonic?: string | null;
  examples?: ExampleSentence[];
}

interface SharedSet {
  id: string;
  name: string;
  cleverTitle?: string | null;
  phrases: Phrase[];
  imageUrl?: string | null;
  seriousnessLevel?: number | null;
}

export default function ShareSetPage({ params }: { params: { shareId: string } }) {
  const shareId = params.shareId;
  const { userId, isSignedIn } = useAuth();

  const [setData, setSetData] = useState<SharedSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  useEffect(() => {
    const fetchSet = async () => {
      try {
        const res = await fetch(`/api/share/${shareId}`);
        if (!res.ok) throw new Error('Set not found');
        const data = await res.json();
        setSetData(data.set as SharedSet);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchSet();
  }, [shareId]);

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    try {
      const res = await fetch(`/api/share/${shareId}`, { method: 'POST' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Import failed');
      }
      setImported(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || 'Unknown error');
    } finally {
      setImporting(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-400">{error}</div>;
  if (!setData) return null;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">{setData.cleverTitle || setData.name}</h1>
      <p className="text-gray-400 mb-4">{setData.phrases.length} cards</p>
      <div className="space-y-4 mb-6">
        {setData.phrases.map((p, idx) => (
          <div key={p.id} className="border border-gray-700 p-3 rounded">
            <p className="font-semibold">
              {idx + 1}. {p.english}
            </p>
            <p className="text-purple-300">{p.thai}</p>
          </div>
        ))}
      </div>
      {isSignedIn && !imported && (
        <button
          onClick={handleImport}
          className="neumorphic-button text-green-400 px-4 py-2"
          disabled={importing}
        >
          {importing ? 'Importing...' : 'Import this set'}
        </button>
      )}
      {imported && <p className="text-green-400 mt-3">Imported! Check your sets.</p>}
      {error && <p className="text-red-400 mt-3">{error}</p>}
    </div>
  );
} 
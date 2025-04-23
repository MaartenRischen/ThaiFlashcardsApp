"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from 'next/image';

interface PublicSet {
  id: string;
  shareId: string;
  name: string;
  cleverTitle?: string;
  level?: string;
  goals?: string[];
  specificTopics?: string;
  imageUrl?: string;
  seriousnessLevel?: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  phraseCount: number;
}

export default function PublicSetsPage() {
  const [sets, setSets] = useState<PublicSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSets = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/public-sets");
        if (!res.ok) throw new Error("Failed to fetch public sets");
        const data = await res.json();
        setSets(data.sets || []);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchSets();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">🌏 Public Flashcard Sets</h1>
      {loading && <div className="text-center py-8">Loading public sets…</div>}
      {error && <div className="text-center text-red-500 py-8">{error}</div>}
      {!loading && !error && sets.length === 0 && (
        <div className="text-center text-gray-400 py-8">No public sets found yet.</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {sets.map(set => (
          <div key={set.id} className="bg-gray-900 rounded-xl shadow-lg p-5 flex flex-col items-center border border-gray-800">
            <div className="w-full h-40 mb-4 relative flex items-center justify-center bg-gray-800 rounded-lg overflow-hidden">
              <Image
                src={set.imageUrl || '/images/default-set-logo.png'}
                alt={set.cleverTitle || set.name}
                width={640}
                height={360}
                className="object-cover w-full h-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/default-set-logo.png';
                }}
              />
            </div>
            <h2 className="text-xl font-semibold mb-1 text-center">{set.name}</h2>
            {set.cleverTitle && <div className="text-sm text-gray-400 mb-2 text-center">{set.cleverTitle}</div>}
            <div className="text-xs text-gray-500 mb-2">{set.level ? `Level: ${set.level}` : ""}</div>
            <div className="text-xs text-gray-500 mb-2">{set.phraseCount} cards</div>
            <Link href={`/share/${set.shareId}`} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">View / Import</Link>
          </div>
        ))}
      </div>
    </div>
  );
} 
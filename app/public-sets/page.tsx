"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
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
      } catch (err: unknown) {
        const message = (err instanceof Error) ? err.message :
                        (typeof err === 'string') ? err :
                        (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: unknown }).message === 'string') ? (err as { message: string }).message :
                        'Failed to fetch public sets';
        setError(message);
        console.error("Error fetching public sets:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSets();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-6 neumorphic-button px-4 py-2 rounded-xl flex items-center gap-2 text-[#E0E0E0] hover:text-[#BB86FC] transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>
      
      <h1 className="text-4xl font-bold mb-6 text-center text-[#E0E0E0]">🌏 Public Flashcard Sets</h1>
      {loading && <div className="text-center py-8 text-[#E0E0E0]">Loading public sets…</div>}
      {error && <div className="text-center text-red-400 py-8">{error}</div>}
      {!loading && !error && sets.length === 0 && (
        <div className="text-center text-[#BDBDBD] py-8">No public sets found yet.</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {sets.map(set => (
          <div key={set.id} className="bg-[#2C2C2C] rounded-xl shadow-lg p-6 flex flex-col items-center border border-[#404040] transition-all duration-200 hover:border-[#BB86FC]/30">
            <div className="w-full h-40 mb-4 relative flex items-center justify-center bg-[#3C3C3C] rounded-xl overflow-hidden">
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
            <h2 className="text-xl font-semibold mb-1 text-center text-[#E0E0E0]">{set.name}</h2>
            {set.cleverTitle && <div className="text-sm text-[#BDBDBD] mb-2 text-center">{set.cleverTitle}</div>}
            <div className="text-xs text-[#BDBDBD] mb-2">{set.level ? `Level: ${set.level}` : ""}</div>
            <div className="text-xs text-[#BDBDBD] mb-2">{set.phraseCount} cards</div>
            <Link href={`/share/${set.shareId}`} className="mt-2 px-4 py-2 bg-gradient-to-r from-[#BB86FC] to-[#A374E8] hover:from-[#A374E8] hover:to-[#9B6DD0] text-white rounded-xl font-medium transition-all duration-200">View / Import</Link>
          </div>
        ))}
      </div>
    </div>
  );
} 
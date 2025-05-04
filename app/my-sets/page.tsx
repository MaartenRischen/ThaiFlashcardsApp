"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useSession } from 'next-auth/react';
import { Loader2, Plus, BookOpen, Settings, Trash2, Send, Layers } from "lucide-react";
import { useSet } from '@/app/context/SetContext';
import { SetMetaData } from '@/app/lib/storage';
import { Badge } from "@/components/ui/badge";

export default function SetManagerPage() {
  const router = useRouter();
  const { status } = useSession();
  const { availableSets, deleteSet, isLoading } = useSet();
  const [sets, setSets] = useState<SetMetaData[]>([]);
  const [search] = useState("");
  const [filter] = useState("all");
  const [publishingSetId, setPublishingSetId] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [router, status]);

  // Fetch user's sets
  useEffect(() => {
    if (status === "authenticated") {
      setSets(availableSets || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, availableSets]);

  // Filter sets based on search and filter criteria
  const filteredSets = useMemo(() => {
    return sets.filter((set) => {
      const nameMatch = set.name.toLowerCase().includes(search.toLowerCase());
      const levelMatch = filter === "all" || set.level === filter;
      return nameMatch && levelMatch;
    });
  }, [sets, search, filter]);

  const handlePublish = async (setId: string) => {
    setPublishingSetId(setId);
    try {
      // TODO: Implement publish functionality
      router.push(`/publish/${setId}`);
    } catch (error) {
      console.error('Error publishing set:', error);
    } finally {
      setPublishingSetId(null);
    }
  };

  const handleViewCards = (setId: string) => {
    router.push(`/cards/${setId}`);
  };

  if (status === "loading") {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600/90" />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-400" />
          <h1 className="text-xl font-medium text-blue-400">My Sets</h1>
        </div>
        <Button 
          asChild
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2 text-sm flex items-center gap-1"
        >
          <Link href="/set-wizard-start">
            <Plus className="h-4 w-4" />
            <span>Create New Set</span>
          </Link>
        </Button>
      </div>
      
      <p className="text-sm text-gray-300 mb-6 -mt-4">
        Manage your flashcard sets and track your learning progress
      </p>
      
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600/90" />
        </div>
      ) : sets.length === 0 ? (
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-800/30 p-6 text-center">
          <div className="flex justify-center mb-4">
            <BookOpen className="h-12 w-12 text-blue-400/70" />
          </div>
          <h3 className="text-base font-medium mb-2 text-blue-400">No flashcard sets found</h3>
          <p className="text-sm text-gray-400 mb-5">
            You haven&apos;t created any flashcard sets yet. Create your first set to start learning Thai!
          </p>
          <Button 
            asChild
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2 text-sm"
          >
            <Link href="/set-wizard-start">Create Your First Set</Link>
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSets.map((set) => (
            <div key={set.id} className="group bg-[#1a1a1a] border border-gray-800/30 rounded-lg overflow-hidden hover:border-blue-600/50 hover:shadow-md hover:shadow-blue-900/10 transition-all flex flex-col">
              <Link href={`/?setId=${set.id}`} className="block">
                <div className="relative h-40 w-full overflow-hidden">
                  {set.imageUrl ? (
                    <Image
                      src={set.imageUrl}
                      alt={`Image for ${set.name}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No Image</span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex-grow">
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-blue-400 transition-colors">{set.name}</h3>
                  <Badge variant="outline" className={`text-xs ${set.level === 'complete beginner' ? 'border-green-500/50 text-green-400' : 'border-gray-600 text-gray-400'}`}>
                    {set.level}
                  </Badge>
                  <p className="text-sm text-gray-500 mt-2">{set.phraseCount} cards</p>
                </div>
              </Link>
              <div className="p-4 pt-0 mt-auto flex justify-end gap-2">
                <button
                  onClick={() => handleViewCards(set.id)}
                  className="p-2.5 rounded-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition flex items-center justify-center"
                  title="Study Set"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </button>
                <button
                  onClick={() => handlePublish(set.id)}
                  className="p-2.5 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 transition flex items-center justify-center"
                  title="Set Options"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
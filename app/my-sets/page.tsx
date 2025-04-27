"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useSession } from 'next-auth/react';
import { Loader2, Plus, BookOpen, Settings } from "lucide-react";

type FlashcardSet = {
  id: string;
  name: string;
  level?: string;
  createdAt: string;
  source: string;
  imageUrl?: string;
  _count?: {
    phrases: number;
  };
};

export default function SetManagerPage() {
  const router = useRouter();
  const { status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [router, status]);

  // Fetch user's sets
  useEffect(() => {
    if (status === "authenticated") {
      fetchUserSets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const fetchUserSets = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/flashcard-sets", {
        method: "GET",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch flashcard sets");
      }

      const data = await response.json();
      setSets(data.sets);
    } catch (error) {
      console.error("Error fetching sets:", error);
      setError("Failed to load your flashcard sets");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600/90" />
      </div>
    );
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "default":
        return "Default";
      case "generated":
        return "AI Generated";
      case "wizard":
        return "AI Generated";
      case "import":
        return "Imported";
      default:
        return source;
    }
  };

  const getBadgeColor = (source: string) => {
    switch (source) {
      case "default":
        return "bg-gray-500/20 text-gray-300";
      case "generated":
      case "wizard":
        return "bg-blue-600/20 text-blue-400";
      case "import":
        return "bg-green-600/20 text-green-400";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

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
      
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-md text-red-400 text-sm mb-4">
          {error}
        </div>
      )}
      
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
          {sets.map((set) => (
            <Link
              key={set.id}
              href={`/?setId=${set.id}`}
              className="group bg-[#1a1a1a] border border-gray-800/30 rounded-lg overflow-hidden hover:border-blue-600/50 hover:shadow-md hover:shadow-blue-900/10 transition-all flex flex-col"
            >
              <div className="relative w-full aspect-[16/9] bg-[#111] overflow-hidden">
                {set.imageUrl ? (
                  <Image
                    src={set.imageUrl}
                    alt={set.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/default-set-logo.png';
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <BookOpen className="h-10 w-10 text-gray-700" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getBadgeColor(set.source)}`}>
                    {getSourceLabel(set.source)}
                  </span>
                </div>
              </div>
              
              <div className="p-4 flex-grow flex flex-col">
                {/* Set Name */}
                <h3 className="font-medium text-sm text-white mb-1 line-clamp-3 min-h-[3.6rem] group-hover:text-blue-400 transition-colors text-center">
                  {set.name}
                </h3>
                
                {/* Author label */}
                <div className="text-blue-400 text-sm font-medium mb-2 text-center">
                  {set.source === "default" ? "System Set" : "My Set"}
                </div>

                {/* Proficiency Level */}
                {set.level && (
                  <p className="text-xs text-blue-400/80 text-center mb-1">
                    Proficiency: <span className="font-medium text-blue-300">
                      {(() => {
                        // Convert lowercase level to Title Case for display
                        const level = set.level;
                        switch(level) {
                          case 'complete beginner': return 'Complete Beginner';
                          case 'basic understanding': return 'Basic Understanding';
                          case 'intermediate': return 'Intermediate';
                          case 'advanced': return 'Advanced';
                          case 'native/fluent': return 'Native/Fluent';
                          case 'god mode': return 'God Mode';
                          default: return level; // Fallback to whatever is stored
                        }
                      })()}
                    </span>
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 
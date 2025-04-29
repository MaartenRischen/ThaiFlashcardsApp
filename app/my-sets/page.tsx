"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useSession } from 'next-auth/react';
import { Loader2, Plus, BookOpen, Settings, Trash2 } from "lucide-react";
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
                      layout="fill"
                      objectFit="cover"
                      className="group-hover:scale-105 transition-transform duration-300"
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
              <div className="p-4 pt-0 mt-auto flex justify-end space-x-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteSet(set.id)}
                  className="bg-red-900/50 hover:bg-red-900/80 border border-red-700/50 hover:border-red-600 text-red-300"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
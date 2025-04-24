"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from 'next-auth/react';

type FlashcardSet = {
  id: string;
  name: string;
  level?: string;
  createdAt: string;
  source: string;
  _count?: {
    phrases: number;
  };
};

export default function MySetsPage() {
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
        <p>Loading...</p>
      </div>
    );
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "default":
        return "Default";
      case "wizard":
        return "AI Generated";
      case "import":
        return "Imported";
      default:
        return source;
    }
  };

  return (
    <div className="container max-w-5xl py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Flashcard Sets</h1>
          <p className="text-gray-500 mt-2">
            Manage and practice with your saved flashcard sets
          </p>
        </div>
        <Button asChild>
          <Link href="/set-wizard-start">Create New Set</Link>
        </Button>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600 mb-6">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <p>Loading your flashcard sets...</p>
        </div>
      ) : sets.length === 0 ? (
        <div className="bg-card rounded-lg border p-8 text-center">
          <h3 className="text-lg font-medium mb-2">No flashcard sets found</h3>
          <p className="text-gray-500 mb-6">
            You haven&apos;t created any flashcard sets yet. Create your first set to start learning Thai!
          </p>
          <Button asChild>
            <Link href="/set-wizard-start">Create Your First Set</Link>
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {sets.map((set) => (
            <Link
              key={set.id}
              href={`/?setId=${set.id}`}
              className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg mb-1">{set.name}</h3>
                  <p className="text-sm text-gray-500">
                    {set._count?.phrases || 0} cards • {set.level || "Not specified"}
                  </p>
                </div>
                <span className="text-xs bg-secondary px-2 py-1 rounded">
                  {getSourceLabel(set.source)}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Created on {new Date(set.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 
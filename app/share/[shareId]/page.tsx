'use client';

import { useEffect, useState } from 'react';
import { useAuth, SignInButton } from '@clerk/nextjs';
import { ExampleSentence } from '../../lib/set-generator';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Download, ChevronRight, Users, Clock, BookOpen, X, Check } from 'lucide-react';

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
  const router = useRouter();

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
      const res = await fetch(`/api/share/${shareId}`, { 
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Import failed');
      }
      setImported(true);
      // Redirect to home page after successful import
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || 'Unknown error');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#A9C4FC] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#E0E0E0]">Loading flashcard set...</p>
        </div>
      </div>
    );
  }

  if (error && !setData) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-[#1F1F1F] border-[#404040]">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-[#E0E0E0] mb-2">Set Not Found</h2>
            <p className="text-[#BDBDBD]">{error}</p>
            <Button 
              className="mt-6"
              onClick={() => router.push('/')}
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!setData) return null;

  const previewPhrases = setData.phrases.slice(0, 5);
  const hasMorePhrases = setData.phrases.length > 5;

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1F1F1F] to-[#0F0F0F] border-b border-[#404040]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-6">
            <Image
              src="/images/donkey-bridge-logo.png"
              alt="DonkeyBridge"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-xl font-bold text-[#E0E0E0]">DonkeyBridge</span>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#E0E0E0] mb-4">
                {setData.cleverTitle || setData.name}
              </h1>
              <p className="text-[#BDBDBD] mb-6">
                A Thai language flashcard set shared with you
              </p>
              
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-[#A9C4FC]">
                  <BookOpen className="w-4 h-4" />
                  <span>{setData.phrases.length} flashcards</span>
                </div>
                <div className="flex items-center gap-2 text-[#A9C4FC]">
                  <Clock className="w-4 h-4" />
                  <span>~{Math.ceil(setData.phrases.length * 2)} min to learn</span>
                </div>
                {setData.seriousnessLevel !== null && (
                  <div className="flex items-center gap-2 text-[#A9C4FC]">
                    <Sparkles className="w-4 h-4" />
                    <span>Level {setData.seriousnessLevel}</span>
                  </div>
                )}
              </div>
            </div>
            
            {setData.imageUrl && (
              <div className="relative h-64 md:h-80 rounded-xl overflow-hidden">
                <Image
                  src={setData.imageUrl}
                  alt={setData.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-transparent to-transparent" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Flashcard Preview */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-[#E0E0E0] mb-6">Preview</h2>
            
            <div className="space-y-4">
              {previewPhrases.map((phrase, idx) => (
                <Card key={phrase.id} className="bg-[#1F1F1F] border-[#404040] hover:border-[#A9C4FC] transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#A9C4FC]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-[#A9C4FC]">{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-semibold text-[#E0E0E0] mb-2">
                          {phrase.english}
                        </p>
                        <p className="text-xl text-[#A9C4FC] mb-1">
                          {phrase.thai}
                        </p>
                        {phrase.pronunciation && (
                          <p className="text-sm text-[#BDBDBD] italic">
                            {phrase.pronunciation}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {hasMorePhrases && (
              <div className="mt-6 text-center">
                <p className="text-[#BDBDBD] mb-4">
                  + {setData.phrases.length - 5} more flashcards
                </p>
                {!isSignedIn && (
                  <p className="text-sm text-[#757575]">
                    Sign in to view and import all flashcards
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card className="bg-[#1F1F1F] border-[#404040]">
                <CardContent className="p-6">
                  {isSignedIn ? (
                    <>
                      {!imported ? (
                        <>
                          <h3 className="text-lg font-bold text-[#E0E0E0] mb-4">
                            Add to Your Library
                          </h3>
                          <p className="text-sm text-[#BDBDBD] mb-6">
                            Import this set to start learning Thai with spaced repetition and audio support.
                          </p>
                          <Button
                            onClick={handleImport}
                            disabled={importing}
                            className="w-full bg-[#A9C4FC] hover:bg-[#8FB3FA] text-black font-bold"
                            size="lg"
                          >
                            {importing ? (
                              <>Importing...</>
                            ) : (
                              <>
                                <Download className="w-5 h-5 mr-2" />
                                Import This Set
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <div className="text-center">
                          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-green-500" />
                          </div>
                          <h3 className="text-lg font-bold text-[#E0E0E0] mb-2">
                            Successfully Imported!
                          </h3>
                          <p className="text-sm text-[#BDBDBD] mb-4">
                            The set has been added to your library.
                          </p>
                          <p className="text-xs text-[#757575]">
                            Redirecting to home...
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-bold text-[#E0E0E0] mb-4">
                        Start Learning Thai Today
                      </h3>
                      <p className="text-sm text-[#BDBDBD] mb-6">
                        Sign in to import this set and access powerful learning features.
                      </p>
                      
                      <SignInButton mode="modal">
                        <Button
                          className="w-full bg-[#A9C4FC] hover:bg-[#8FB3FA] text-black font-bold"
                          size="lg"
                        >
                          Sign In to Import
                          <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                      </SignInButton>
                      
                      <div className="mt-6 space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#A9C4FC]/20 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-4 h-4 text-[#A9C4FC]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#E0E0E0]">Smart Spaced Repetition</p>
                            <p className="text-xs text-[#757575]">Learn efficiently with our proven algorithm</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#A9C4FC]/20 flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-[#A9C4FC]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#E0E0E0]">Community Sets</p>
                            <p className="text-xs text-[#757575]">Access thousands of shared flashcards</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#A9C4FC]/20 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-4 h-4 text-[#A9C4FC]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#E0E0E0]">Create Your Own</p>
                            <p className="text-xs text-[#757575]">Build and share custom flashcard sets</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {error && (
                    <div className="mt-4 p-3 bg-red-500/20 rounded-lg">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
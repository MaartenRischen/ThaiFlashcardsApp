'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Phrase, ExampleSentence } from '../data/phrases';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import Link from 'next/link';
import { useToast } from '../components/ui/use-toast';
import { generateExampleSentence, generateMnemonicOptions } from '../lib/gemini';

// Component for displaying and editing a flashcard
const CardEditor = ({ 
  phrase, 
  onUpdate, 
  onClose, 
  seriousnessLevel = 80 // Default to highly funny (80% ridiculous)
}: { 
  phrase: Phrase, 
  onUpdate: (updatedPhrase: Phrase) => void, 
  onClose: () => void,
  seriousnessLevel?: number
}) => {
  const [isGeneratingExample, setIsGeneratingExample] = useState(false);
  const [isGeneratingMnemonic, setIsGeneratingMnemonic] = useState(false);
  const [generatedExample, setGeneratedExample] = useState<ExampleSentence | null>(null);
  const [mnemonicOptions, setMnemonicOptions] = useState<string[]>([]);
  const { toast } = useToast();

  const generateExample = async () => {
    setIsGeneratingExample(true);
    try {
      const example = await generateExampleSentence(phrase.thai, phrase.english);
      if (!example.error) {
        setGeneratedExample(example);
      } else {
        toast({
          title: "Error",
          description: "Failed to generate example. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error generating example:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingExample(false);
    }
  };

  const generateMnemonics = async () => {
    setIsGeneratingMnemonic(true);
    try {
      const result = await generateMnemonicOptions(phrase.thai, phrase.english, seriousnessLevel, 3);
      if (result.options) {
        setMnemonicOptions(result.options);
      } else {
        toast({
          title: "Error",
          description: "Failed to generate mnemonics. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error generating mnemonics:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingMnemonic(false);
    }
  };

  const saveExample = () => {
    if (generatedExample) {
      const updatedPhrase = {
        ...phrase,
        examples: [...(phrase.examples || []), generatedExample]
      };
      onUpdate(updatedPhrase);
      toast({
        title: "Success",
        description: "Example added to flashcard."
      });
    }
  };

  const saveMnemonic = (mnemonic: string) => {
    const updatedPhrase = {
      ...phrase,
      mnemonic
    };
    onUpdate(updatedPhrase);
    toast({
      title: "Success",
      description: "Mnemonic added to flashcard."
    });
  };

  return (
    <Card className="p-6 w-full max-w-3xl mx-auto mb-4">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between">
          <h3 className="text-xl font-bold">{phrase.english}</h3>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-semibold">Thai:</p>
            <p className="text-lg">{phrase.thai}</p>
            <p className="text-sm text-muted-foreground">{phrase.pronunciation}</p>
          </div>
          <div>
            <p className="font-semibold">Gender Forms:</p>
            <p className="text-sm">♂ {phrase.thaiMasculine || phrase.thai}</p>
            <p className="text-sm">♀ {phrase.thaiFeminine || phrase.thai}</p>
          </div>
        </div>

        {/* Current mnemonic display */}
        <div>
          <p className="font-semibold">Current Mnemonic:</p>
          {phrase.mnemonic ? (
            <p className="italic">{phrase.mnemonic}</p>
          ) : (
            <p className="text-muted-foreground">No mnemonic available</p>
          )}
        </div>

        {/* Current examples display */}
        <div>
          <p className="font-semibold">Current Examples:</p>
          {phrase.examples && phrase.examples.length > 0 ? (
            <ul className="list-disc pl-5">
              {phrase.examples.map((example, i) => (
                <li key={i} className="mb-2">
                  <p>{example.thai}</p>
                  <p className="text-sm">{example.pronunciation}</p>
                  <p className="text-sm text-muted-foreground">{example.translation}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No examples available</p>
          )}
        </div>

        {/* Generate Example section */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">Add Funny Example</h4>
          <Button 
            onClick={generateExample} 
            disabled={isGeneratingExample}
            className="mb-4"
          >
            {isGeneratingExample ? "Generating..." : "Generate Funny Example"}
          </Button>

          {generatedExample && (
            <div className="border p-3 rounded-md mb-4">
              <p>{generatedExample.thai}</p>
              <p className="text-sm">{generatedExample.pronunciation}</p>
              <p className="text-sm text-muted-foreground">{generatedExample.translation}</p>
              <Button onClick={saveExample} className="mt-2">Add This Example</Button>
            </div>
          )}
        </div>

        {/* Generate Mnemonic section */}
        {!phrase.mnemonic && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Add Mnemonic</h4>
            <Button 
              onClick={generateMnemonics} 
              disabled={isGeneratingMnemonic}
              className="mb-4"
            >
              {isGeneratingMnemonic ? "Generating..." : "Generate Mnemonics"}
            </Button>

            {mnemonicOptions.length > 0 && (
              <div className="space-y-3">
                {mnemonicOptions.map((mnemonic, i) => (
                  <div key={i} className="border p-3 rounded-md">
                    <p className="italic">{mnemonic}</p>
                    <Button onClick={() => saveMnemonic(mnemonic)} size="sm" className="mt-2">
                      Use This Mnemonic
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default function ExampleWizardPage() {
  const { data: session } = useSession();
  const [flashcardSets, setFlashcardSets] = useState<any[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>('');
  const [selectedSet, setSelectedSet] = useState<any | null>(null);
  const [filteredPhrases, setFilteredPhrases] = useState<Phrase[]>([]);
  const [filterOption, setFilterOption] = useState<'all' | 'missing-examples' | 'missing-mnemonics'>('all');
  const [editingPhrase, setEditingPhrase] = useState<Phrase | null>(null);
  const [seriousnessLevel, setSeriousnessLevel] = useState<number>(80); // Default to 80% ridiculous
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's flashcard sets
  useEffect(() => {
    const fetchSets = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/flashcard-sets');
        if (response.ok) {
          const data = await response.json();
          setFlashcardSets(data.sets || []);
        } else {
          console.error('Failed to fetch flashcard sets');
          toast({
            title: "Error",
            description: "Failed to load your flashcard sets.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching flashcard sets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchSets();
    } else {
      // For non-authenticated users, try to load sets from localStorage
      try {
        const localSets = localStorage.getItem('flashcardSets');
        if (localSets) {
          setFlashcardSets(JSON.parse(localSets));
        }
      } catch (error) {
        console.error('Error loading sets from localStorage:', error);
      }
      setIsLoading(false);
    }
  }, [session, toast]);

  // Load selected set details
  useEffect(() => {
    if (!selectedSetId) {
      setSelectedSet(null);
      setFilteredPhrases([]);
      return;
    }

    const fetchSetDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/flashcard-sets/${selectedSetId}`);
        if (response.ok) {
          const data = await response.json();
          setSelectedSet(data.set);
          applyFilter(data.set.phrases, filterOption);
        } else {
          console.error('Failed to fetch set details');
          toast({
            title: "Error",
            description: "Failed to load the selected flashcard set.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching set details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session && selectedSetId) {
      fetchSetDetails();
    } else if (selectedSetId) {
      // For non-authenticated users, find the set in local storage
      const set = flashcardSets.find(set => set.id === selectedSetId);
      if (set) {
        setSelectedSet(set);
        applyFilter(set.phrases, filterOption);
      }
      setIsLoading(false);
    }
  }, [selectedSetId, session, filterOption, flashcardSets, toast]);

  // Apply filter to phrases
  const applyFilter = (phrases: Phrase[], filter: 'all' | 'missing-examples' | 'missing-mnemonics') => {
    if (!phrases) return;
    
    let filtered: Phrase[] = [...phrases];
    
    if (filter === 'missing-examples') {
      filtered = phrases.filter(phrase => !phrase.examples || phrase.examples.length === 0);
    } else if (filter === 'missing-mnemonics') {
      filtered = phrases.filter(phrase => !phrase.mnemonic);
    }
    
    setFilteredPhrases(filtered);
  };

  // Update phrase with new example or mnemonic
  const handleUpdatePhrase = async (updatedPhrase: Phrase) => {
    if (!selectedSet) return;

    // Create updated set
    const updatedPhrases = selectedSet.phrases.map((p: Phrase) => 
      p.english === updatedPhrase.english ? updatedPhrase : p
    );
    
    const updatedSet = {
      ...selectedSet,
      phrases: updatedPhrases
    };

    // Save to backend if authenticated
    if (session) {
      try {
        const response = await fetch(`/api/flashcard-sets/${selectedSetId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ set: updatedSet }),
        });

        if (!response.ok) {
          throw new Error('Failed to update set');
        }
      } catch (error) {
        console.error('Error updating set:', error);
        toast({
          title: "Error",
          description: "Failed to save changes. Please try again.",
          variant: "destructive"
        });
        return;
      }
    } else {
      // Save to localStorage for non-authenticated users
      try {
        const updatedSets = flashcardSets.map(set => 
          set.id === selectedSetId ? updatedSet : set
        );
        localStorage.setItem('flashcardSets', JSON.stringify(updatedSets));
        setFlashcardSets(updatedSets);
      } catch (error) {
        console.error('Error saving to localStorage:', error);
        toast({
          title: "Error",
          description: "Failed to save changes locally.",
          variant: "destructive"
        });
        return;
      }
    }

    // Update local state
    setSelectedSet(updatedSet);
    applyFilter(updatedPhrases, filterOption);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Example Wizard</h1>
      <p className="mb-6 text-lg">
        Add funny and unexpected examples to your flashcards! This wizard helps you generate examples
        and mnemonics for your existing flashcard sets. 
      </p>

      {!session && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
          <p className="text-yellow-700">
            You are using Example Wizard without an account. Your changes will be saved locally in your browser.
            <Link href="/login" className="underline ml-2">Log in</Link> or 
            <Link href="/register" className="underline ml-2">create an account</Link> to save your progress to the cloud.
          </p>
        </div>
      )}

      {/* Set selection */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Step 1: Select a Flashcard Set</h2>
        {isLoading ? (
          <p>Loading sets...</p>
        ) : flashcardSets.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {flashcardSets.map((set) => (
              <Card 
                key={set.id} 
                className={`p-4 cursor-pointer ${selectedSetId === set.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                onClick={() => setSelectedSetId(set.id)}
              >
                <h3 className="text-lg font-medium">{set.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {set.phrases?.length || 0} cards | {set.level || 'Mixed'} level
                </p>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="mb-4">You don't have any flashcard sets yet.</p>
            <Link href="/set-wizard">
              <Button>Create Your First Set</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Set editing */}
      {selectedSet && (
        <>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Step 2: Select Filter Options</h2>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <h3 className="text-lg mb-2">Filter Cards</h3>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={filterOption === 'all' ? 'default' : 'outline'}
                    onClick={() => {
                      setFilterOption('all');
                      applyFilter(selectedSet.phrases, 'all');
                    }}
                  >
                    All Cards ({selectedSet.phrases?.length || 0})
                  </Button>
                  <Button 
                    variant={filterOption === 'missing-examples' ? 'default' : 'outline'}
                    onClick={() => {
                      setFilterOption('missing-examples');
                      applyFilter(selectedSet.phrases, 'missing-examples');
                    }}
                  >
                    Missing Examples
                  </Button>
                  <Button 
                    variant={filterOption === 'missing-mnemonics' ? 'default' : 'outline'}
                    onClick={() => {
                      setFilterOption('missing-mnemonics');
                      applyFilter(selectedSet.phrases, 'missing-mnemonics');
                    }}
                  >
                    Missing Mnemonics
                  </Button>
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg mb-2">Humor Level: {seriousnessLevel}% Ridiculous</h3>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={seriousnessLevel} 
                  onChange={(e) => setSeriousnessLevel(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Serious</span>
                  <span>Mild</span>
                  <span>Funny</span>
                  <span>Absurd</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Step 3: Edit Cards</h2>
            
            {filteredPhrases.length === 0 ? (
              <p className="text-center py-8">No cards match your filter criteria. Try changing the filter options.</p>
            ) : (
              <>
                {editingPhrase ? (
                  <CardEditor 
                    phrase={editingPhrase} 
                    onUpdate={handleUpdatePhrase} 
                    onClose={() => setEditingPhrase(null)}
                    seriousnessLevel={seriousnessLevel}
                  />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredPhrases.map((phrase, index) => (
                      <Card 
                        key={index} 
                        className="p-4 cursor-pointer hover:shadow-md"
                        onClick={() => setEditingPhrase(phrase)}
                      >
                        <h3 className="text-lg font-medium">{phrase.english}</h3>
                        <p className="text-md">{phrase.thai}</p>
                        <p className="text-sm text-muted-foreground">{phrase.pronunciation}</p>
                        
                        <div className="flex gap-2 mt-2">
                          {(!phrase.examples || phrase.examples.length === 0) && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">No examples</span>
                          )}
                          {!phrase.mnemonic && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">No mnemonic</span>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
} 
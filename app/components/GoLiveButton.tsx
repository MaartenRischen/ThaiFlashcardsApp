'use client';

import React, { useState } from 'react';
import { Globe, Loader2, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useUser } from '@clerk/nextjs';

interface GoLiveButtonProps {
  setId: string;
  setName: string;
  className?: string;
  variant?: 'default' | 'ghost' | 'outline' | 'prominent';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function GoLiveButton({ setId, setName, className, variant = 'ghost', size = 'sm' }: GoLiveButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(false);
  const [title, setTitle] = useState(setName);
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  
  const { user } = useUser();

  React.useEffect(() => {
    if (user) {
      setAuthor(user.fullName || user.firstName || 'Anonymous');
    }
  }, [user]);

  const handleGoLive = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title for your set');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/publish-set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          setId,
          title: title.trim(),
          description: description.trim() || undefined,
          author: author.trim() || 'Anonymous'
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to publish set');
      }

      const _result = await response.json();
      
      setPublished(true);
      toast.success('🎉 Your set is now live in the public gallery!');
      
      // Close dialog after a short delay
      setTimeout(() => {
        setIsOpen(false);
        setPublished(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error publishing set:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to publish set');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setIsOpen(false);
      setPublished(false);
    }
  };

  return (
    <>
      {variant === 'prominent' ? (
        <div className="relative group">
          {/* Glow effect behind button */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#10B981] to-[#059669] rounded-full blur opacity-50 group-hover:opacity-75 transition-opacity" />
          
          {/* Actual button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
            disabled={loading}
            className={cn(
              "relative px-4 py-2.5 bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold rounded-full",
              "shadow-lg hover:shadow-xl transform group-hover:scale-105 transition-all duration-200",
              "border border-white/30",
              "flex items-center gap-2",
              className
            )}
            title="Publish this set to the public gallery!"
          >
            {/* Sparkle icon */}
            <div className="absolute -top-2 -right-2">
              <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse drop-shadow-[0_0_6px_rgba(252,211,77,0.6)]" />
            </div>
            
            <Globe className="h-4 w-4 text-white" />
            <span className="text-sm font-bold whitespace-nowrap">Publish</span>
            
            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
          </button>
        </div>
      ) : (
        <Button
          variant={variant}
          size={size}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          disabled={loading}
          className={cn(
            "transition-all",
            size === 'icon' && "h-8 w-8",
            className
          )}
          title="Publish this set to the public gallery"
        >
          <Globe className={size === 'icon' ? "h-4 w-4" : "h-4 w-4 mr-1"} />
          {size !== 'icon' && 'Publish'}
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-500" />
              Publish to Public Gallery
            </DialogTitle>
            <DialogDescription>
              Share your flashcard set with the DonkeyBridge community! Your set will be visible to all users in the public gallery.
            </DialogDescription>
          </DialogHeader>

          {!published ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a catchy title for your set"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what makes this set special..."
                  rows={3}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Your name or 'Anonymous'"
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGoLive}
                  disabled={loading || !title.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4 mr-2" />
                      Publish
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-600 mb-2">
                🎉 Published Successfully!
              </h3>
              <p className="text-sm text-gray-600">
                Your set is now live in the public gallery for everyone to discover and learn from.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

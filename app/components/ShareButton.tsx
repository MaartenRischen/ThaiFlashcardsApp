'use client';

import React, { useState } from 'react';
import { Share2, Copy, Mail, Check, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  setId: string;
  setName: string;
  className?: string;
  variant?: 'default' | 'ghost' | 'outline' | 'prominent';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ShareButton({ setId, setName, className, variant = 'ghost', size = 'sm' }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/flashcard-sets/${setId}/share`, { 
        method: 'POST',
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('Failed to generate share link');
      }
      
      const data = await res.json();
      if (!data.shareId) {
        throw new Error('No shareId returned');
      }
      
      const url = `${window.location.origin}/share/${data.shareId}`;
      setShareUrl(url);
      setIsOpen(true);
    } catch (error) {
      toast.error('Failed to generate share link');
      console.error('Share error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleEmail = () => {
    if (!shareUrl) return;
    
    const subject = encodeURIComponent(`Check out this Thai flashcard set: ${setName}`);
    const body = encodeURIComponent(
      `I thought you might be interested in this Thai flashcard set!\n\n` +
      `Set: ${setName}\n\n` +
      `You can view and import it here:\n${shareUrl}\n\n` +
      `Happy learning!`
    );
    
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <>
      {variant === 'prominent' ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleShare();
          }}
          disabled={loading}
          className={cn(
            "px-3 py-1.5 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white font-semibold rounded-full",
            "shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200",
            "flex items-center gap-2",
            className
          )}
          title="Share this set with friends!"
        >
          <Heart className="h-3.5 w-3.5 text-white" />
          <span className="text-xs font-semibold whitespace-nowrap">Send to a Friend!</span>
          <Share2 className="h-3.5 w-3.5" />
        </button>
      ) : (
        <Button
          variant={variant}
          size={size}
          onClick={(e) => {
            e.stopPropagation();
            handleShare();
          }}
          disabled={loading}
          className={cn(
            "transition-all",
            size === 'icon' && "h-8 w-8",
            className
          )}
          title="Share this set"
        >
          <Share2 className={size === 'icon' ? "h-4 w-4" : "h-4 w-4 mr-1"} />
          {size !== 'icon' && 'Share'}
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share "{setName}"</DialogTitle>
            <DialogDescription>
              Anyone with this link can view and import this flashcard set.
            </DialogDescription>
          </DialogHeader>
          
          {shareUrl ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  readOnly
                  value={shareUrl}
                  className="font-mono text-sm"
                />
                <Button 
                  type="button" 
                  size="sm"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="sr-only">Copy link</span>
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleEmail}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email Link
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">
                This link will remain active indefinitely. Recipients can import the set to their own account after signing in.
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Generating share link...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

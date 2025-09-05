"use client";
import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

interface StarRatingProps {
  publishedSetId?: string;
  flashcardSetId?: string;
  averageRating?: number;
  ratingCount?: number;
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  isDefaultSet?: boolean;
}

export function StarRating({ 
  publishedSetId,
  flashcardSetId, 
  averageRating = 0, 
  ratingCount = 0, 
  size = 'medium',
  interactive = true,
  onRatingChange,
  isDefaultSet = false
}: StarRatingProps) {
  const { user } = useUser();
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };
  
  const starSize = sizeClasses[size];
  
  // Fetch user's rating
  useEffect(() => {
    if (user && interactive && !isDefaultSet) {
      const params = publishedSetId ? `publishedSetId=${publishedSetId}` : `flashcardSetId=${flashcardSetId}`;
      fetch(`/api/ratings?${params}`)
        .then(res => res.json())
        .then(data => {
          if (data.rating) {
            setUserRating(data.rating);
          }
        })
        .catch(err => console.error('Error fetching rating:', err));
    }
  }, [publishedSetId, flashcardSetId, user, interactive, isDefaultSet]);
  
  const handleRating = async (rating: number) => {
    if (!user || !interactive || isLoading || isDefaultSet) return;
    
    setIsLoading(true);
    try {
      const body = publishedSetId 
        ? { publishedSetId, rating }
        : { flashcardSetId, rating };
        
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        setUserRating(rating);
        onRatingChange?.(rating);
      }
    } catch (err) {
      console.error('Error saving rating:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const displayRating = hoveredRating || userRating || averageRating;
  
  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= displayRating;
          const isUserRated = userRating !== null && star <= userRating;
          
          return (
            <button
              key={star}
              onClick={() => handleRating(star)}
              onMouseEnter={() => interactive && user && setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(null)}
              disabled={!user || !interactive || isLoading}
              className={`
                transition-all duration-200
                ${interactive && user ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}
                ${isLoading ? 'opacity-50' : ''}
              `}
              title={interactive && !user ? "Sign in to rate" : `Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              <Star
                className={`${starSize} transition-colors ${
                  filled 
                    ? isUserRated 
                      ? 'fill-[#BB86FC] text-[#BB86FC]' 
                      : 'fill-yellow-500 text-yellow-500'
                    : 'text-gray-400'
                }`}
              />
            </button>
          );
        })}
      </div>
      
      <div className="flex items-center gap-2 text-xs text-gray-400">
        {averageRating > 0 && (
          <span>{averageRating.toFixed(1)}</span>
        )}
        {ratingCount > 0 && (
          <span>({ratingCount} rating{ratingCount !== 1 ? 's' : ''})</span>
        )}
        {userRating !== null && (
          <span className="text-[#BB86FC]">Your rating: {userRating}</span>
        )}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { ShareButton } from './ShareButton';
import { GoLiveButton } from './GoLiveButton';
import { BookOpen, Layers, Sparkles } from 'lucide-react';
import { getToneLabel } from '@/app/lib/utils';
import { SetMetaData } from '@/app/lib/storage/types';
import { LazyImage } from './LazyImage';
import { getThumbnailUrl } from '@/app/lib/image-utils';
import { StarRating } from './StarRating';

interface MySetCardProps {
  set: SetMetaData;
  onLoadSet: (id: string) => void;
  onPreview: (id: string) => void;
  isLoading?: boolean;
  currentSetId?: string | null;
}

const MySetCard: React.FC<MySetCardProps> = ({ 
  set, 
  onLoadSet, 
  onPreview,
  isLoading = false,
  currentSetId
}) => {
  const computeDefaultImageUrl = (): string => {
    const originalId = set.id.includes('__') ? set.id.split('__')[0] : set.id;
    if (originalId === 'default') {
      return getThumbnailUrl('/images/defaultnew.png');
    }
    // Common words: 01..10
    if (originalId.startsWith('default-common-words-') || originalId.startsWith('common-words-')) {
      const n = originalId.replace('default-common-words-', '').replace('common-words-', '');
      const padded = String(parseInt(n, 10)).padStart(2, '0');
      return getThumbnailUrl(`/images/defaults/default-common-words-${padded}.png`);
    }
    // Common sentences: 1..10 (no pad)
    if (originalId.startsWith('default-common-sentences-') || originalId.startsWith('common-sentences-')) {
      const n = originalId.replace('default-common-sentences-', '').replace('common-sentences-', '');
      return getThumbnailUrl(`/images/defaults/default-common-sentences-${n}.png`);
    }
    // Map other canonical default sets to thailand images
    const thailandMap: Record<string, string> = {
      'numbers-1-10': '01',
      'basic-colors': '02',
      'days-of-week': '03',
      'family-members': '04',
      'months-of-year': '05',
      'body-parts': '06',
      'animals': '07',
      'thai-proverbs': '08',
      'clothing': '09',
      'transportation': '10',
      'food-and-drinks': '11',
    };
    const baseId = originalId.replace('default-', '');
    const idx = thailandMap[baseId];
    if (idx) {
      return getThumbnailUrl(`/images/defaults/default-thailand-${idx}.png`);
    }
    // Fallback
    return getThumbnailUrl('/images/default-set-logo.png');
  };

  // Always use imageUrl if provided
  const imgUrl = set.imageUrl || computeDefaultImageUrl();
  const isCurrentSet = currentSetId === set.id;
  const canPublish = set.source !== 'default' && !set.id.startsWith('default-');

  // Get proficiency level display
  const getProficiencyDisplay = (level?: string) => {
    if (!level) return null;
    const levelMap: Record<string, { label: string; color: string }> = {
      'Complete Beginner': { label: 'Beginner', color: 'text-green-400' },
      'complete beginner': { label: 'Beginner', color: 'text-green-400' },
      'Basic Understanding': { label: 'Basic', color: 'text-blue-400' },
      'basic understanding': { label: 'Basic', color: 'text-blue-400' },
      'Intermediate': { label: 'Intermediate', color: 'text-yellow-400' },
      'intermediate': { label: 'Intermediate', color: 'text-yellow-400' },
      'Advanced': { label: 'Advanced', color: 'text-orange-400' },
      'advanced': { label: 'Advanced', color: 'text-orange-400' },
      'Native/Fluent': { label: 'Expert', color: 'text-purple-400' },
      'native speaker': { label: 'Expert', color: 'text-purple-400' },
      'fluent': { label: 'Expert', color: 'text-purple-400' },
      'expert': { label: 'Expert', color: 'text-purple-400' },
      'god mode': { label: 'God Mode', color: 'text-red-400' }
    };
    const display = levelMap[level] || { label: level, color: 'text-gray-400' };
    return (
      <span className={`${display.color} font-medium`}>
        {display.label}
      </span>
    );
  };

  return (
    <div className={`relative bg-[#1A1A1A] border ${isCurrentSet ? 'border-[#BB86FC] ring-2 ring-[#BB86FC]/30' : 'border-[#333]'} rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:border-[#444]`}>
      {/* Send to a Friend button positioned on image */}
      <div className="absolute top-3 right-3 z-20">
        <ShareButton
          setId={set.id}
          setName={set.name}
          variant="prominent"
          className="scale-75 origin-top-right"
        />
      </div>
      
      {/* Image with overlay gradient */}
      <div className="relative w-full h-40 overflow-hidden">
        <LazyImage
          src={imgUrl}
          alt={`${set.name} logo`}
          className="absolute inset-0 w-full h-full object-cover"
          loadFullImage={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent opacity-80" />
        
        {/* Card count badge */}
        <div className="absolute bottom-3 left-3 bg-[#1A1A1A]/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-[#333]">
          <div className="flex items-center gap-1 text-xs text-[#E0E0E0]">
            <Layers className="h-3 w-3" />
            <span>{set.phraseCount} cards</span>
          </div>
        </div>

        {/* Current set indicator */}
        {isCurrentSet && (
          <div className="absolute top-3 left-3 bg-[#BB86FC]/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-white" />
            <span className="text-xs font-bold text-white">Current</span>
          </div>
        )}
      </div>
      
      {/* Content area */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-bold text-lg text-[#E0E0E0] leading-tight">
          {set.name}
        </h3>
        
        {/* Rating - only show for non-default sets */}
        {canPublish && (
          <StarRating
            flashcardSetId={set.id}
            size="small"
            interactive={true}
            isDefaultSet={set.source === 'default' || set.id.startsWith('default-')}
          />
        )}
        
        {/* Metadata badges */}
        <div className="flex flex-wrap gap-3 text-xs text-[#BDBDBD] pt-2">
          <div className="flex items-center gap-1">
            <span className="text-[#8B8B8B]">Tone level:</span>
            {getToneLabel(typeof set.seriousnessLevel === "number" ? set.seriousnessLevel : null)}
          </div>
          
          {getProficiencyDisplay(set.level) && (
            <div className="flex items-center gap-1">
              <span className="text-[#8B8B8B]">Proficiency level:</span>
              {getProficiencyDisplay(set.level)}
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onPreview(set.id)}
            className="flex-1 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-[#E0E0E0] px-3 py-2 text-sm font-medium rounded-lg border border-[#444] hover:border-[#555] transition-all flex items-center justify-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Preview
          </button>
          <button
            onClick={() => onLoadSet(set.id)}
            disabled={isLoading || isCurrentSet}
            className={`flex-1 ${isCurrentSet ? 'bg-[#BB86FC]/20 text-[#BB86FC] border-[#BB86FC]/30' : 'bg-[#BB86FC] hover:bg-[#A66EFC] text-[#1A1A1A]'} px-3 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${!isCurrentSet && 'animate-glow'}`}
          >
            {isLoading ? (
              <span className="inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isLoading ? 'Loading...' : isCurrentSet ? 'Current Set' : 'Load Set'}
          </button>
        </div>

        {/* Publish button for custom sets */}
        {canPublish && (
          <div className="pt-1">
            <GoLiveButton
              setId={set.id}
              setName={set.name}
              variant="default"
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MySetCard;

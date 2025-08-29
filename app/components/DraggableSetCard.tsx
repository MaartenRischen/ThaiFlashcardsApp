'use client';

import React from 'react';
import { useDrag } from 'react-dnd';
import { SetMetaData } from '@/app/lib/storage';
import Image from 'next/image';
import SetCompletionBadge from './SetCompletionBadge';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

interface DraggableSetCardProps {
  set: SetMetaData;
  isDragging?: boolean;
  isSelected?: boolean;
  isActive?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  children: React.ReactNode;
}

export const ItemTypes = {
  SET: 'set'
};

export function DraggableSetCard({ 
  set, 
  isDragging = false,
  isSelected = false,
  isActive = false,
  onDragStart,
  onDragEnd,
  children 
}: DraggableSetCardProps) {
  const [{ opacity }, dragRef] = useDrag(
    () => ({
      type: ItemTypes.SET,
      item: { set },
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 0.5 : 1,
      }),
      begin: () => onDragStart?.(),
      end: () => onDragEnd?.(),
    }),
    [set]
  );

  return (
    <div 
      ref={dragRef} 
      style={{ opacity }} 
      className={cn(
        "relative group cursor-move",
        isDragging && "cursor-grabbing"
      )}
    >
      {/* Drag Handle */}
      <div className="absolute top-3 left-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="p-2 rounded-lg bg-[#1F1F1F]/80 backdrop-blur-sm">
          <GripVertical size={16} className="text-[#BDBDBD]" />
        </div>
      </div>
      
      {children}
    </div>
  );
}

'use client';

import React from 'react';
import { Folder, FileQuestion, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  type: 'folders' | 'sets' | 'search';
  onAction?: () => void;
  actionText?: string;
}

export function EmptyState({ type, onAction, actionText }: EmptyStateProps) {
  const config = {
    folders: {
      icon: Folder,
      title: "No folders yet",
      description: "Create your first folder to organize your flashcard sets",
      actionIcon: Plus,
      defaultActionText: "Create Folder"
    },
    sets: {
      icon: FileQuestion,
      title: "This folder is empty",
      description: "Move some sets here or create new ones to get started",
      actionIcon: Plus,
      defaultActionText: "Add Sets"
    },
    search: {
      icon: Search,
      title: "No results found",
      description: "Try adjusting your search or filters",
      actionIcon: null,
      defaultActionText: null
    }
  };

  const { icon: Icon, title, description, actionIcon: ActionIcon, defaultActionText } = config[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-6 rounded-full bg-[#2C2C2C]/40 backdrop-blur-sm border border-[#404040]/30 mb-6">
        <Icon size={48} className="text-[#BDBDBD]/60" />
      </div>
      
      <h3 className="text-xl font-semibold text-[#E0E0E0] mb-2">{title}</h3>
      <p className="text-[#BDBDBD] text-center max-w-md mb-8">{description}</p>
      
      {onAction && (actionText || defaultActionText) && (
        <Button
          onClick={onAction}
          className="bg-[#A9C4FC] hover:bg-[#A9C4FC]/90 text-[#121212] font-medium"
        >
          {ActionIcon && <ActionIcon size={18} className="mr-2" />}
          {actionText || defaultActionText}
        </Button>
      )}
    </div>
  );
}

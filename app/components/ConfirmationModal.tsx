'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Trash2, FolderX } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  icon?: 'delete' | 'folder-delete' | 'warning';
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  icon = 'warning'
}: ConfirmationModalProps) {
  const getIcon = () => {
    const iconClass = variant === 'danger' ? 'text-red-400' : 'text-yellow-400';
    const iconSize = 24;
    
    switch (icon) {
      case 'delete':
        return <Trash2 size={iconSize} className={iconClass} />;
      case 'folder-delete':
        return <FolderX size={iconSize} className={iconClass} />;
      default:
        return <AlertTriangle size={iconSize} className={iconClass} />;
    }
  };

  const getButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600 text-black';
      default:
        return 'bg-[#A9C4FC] hover:bg-[#A9C4FC]/90 text-[#121212]';
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-[#1F1F1F] border-[#404040] text-white max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-[#2C2C2C] border border-[#404040]">
              {getIcon()}
            </div>
            <AlertDialogTitle className="text-xl font-bold text-[#E0E0E0] flex-1">
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-[#BDBDBD] mt-4 text-base leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel 
            onClick={onClose}
            className="bg-transparent border-[#404040] text-[#E0E0E0] hover:bg-[#2C2C2C]/50 hover:text-[#E0E0E0]"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={getButtonClass()}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/app/components/ui/switch";
import { useSet } from '@/app/context/SetContext';
import { Upload } from 'lucide-react';
import { getToneLabel } from '@/app/lib/utils';
import type { Phrase } from '@/app/lib/set-generator';
import type { PhraseProgressData, SetMetaData } from '@/app/lib/storage';
import { useUser } from '@clerk/nextjs';

interface CombinedOptionsModalProps {
  // ... existing props ...
}

export function SetManagerModal({ isOpen, onClose }: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { availableSets, switchSet, activeSetId } = useSet();
  const { user } = useUser(); // Get user data
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  // ... rest of the existing code ... 
} 
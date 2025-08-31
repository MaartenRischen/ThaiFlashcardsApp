import { useEffect, useState } from 'react';
import { usePreloader } from '@/app/context/PreloaderContext';
import { SetMetaData, SetProgress } from '@/app/lib/storage';
import { Phrase } from '@/app/lib/generation/types';

export function usePreloadedSets() {
  const { preloadedData, isLoading } = usePreloader();
  const [sets, setSets] = useState<SetMetaData[]>([]);
  
  useEffect(() => {
    if (!isLoading && preloadedData) {
      setSets(preloadedData.sets);
    }
  }, [isLoading, preloadedData]);
  
  return { sets, isLoading };
}

export function usePreloadedSetContent(setId: string | null) {
  const { preloadedData, isLoading } = usePreloader();
  const [content, setContent] = useState<Phrase[]>([]);
  const [progress, setProgress] = useState<SetProgress>({});
  
  useEffect(() => {
    if (!isLoading && preloadedData && setId) {
      setContent(preloadedData.setContents[setId] || []);
      setProgress(preloadedData.setProgress[setId] || {});
    }
  }, [isLoading, preloadedData, setId]);
  
  return { content, progress, isLoading };
}

export function usePreloadedMnemonics(setId: string | null) {
  const { preloadedData, isLoading } = usePreloader();
  const [mnemonics, setMnemonics] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (!isLoading && preloadedData && setId) {
      setMnemonics(preloadedData.userMnemonics[setId] || {});
    }
  }, [isLoading, preloadedData, setId]);
  
  return { mnemonics, isLoading };
}

export function usePreloadedFolders() {
  const { preloadedData, isLoading } = usePreloader();
  
  return {
    folders: preloadedData?.folders || [],
    isLoading
  };
}

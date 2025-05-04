import React from 'react';
import { useSet } from '@/app/context/SetContext'; // Import useSet hook
import { Layers, Grid, Plus, Settings, HelpCircle, GalleryHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Update props for combined settings modal
interface FlashcardHeaderProps {
  setShowHowItWorks: (show: boolean) => void;
  onOpenSettings: () => void;
  onOpenSetManager: () => void;
  onOpenCards: () => void;
  onOpenSetWizard: () => void;
}

export function FlashcardHeader({
  setShowHowItWorks,
  onOpenSettings,
  onOpenSetManager,
  onOpenCards,
  onOpenSetWizard,
}: FlashcardHeaderProps) {
  // Access the active set metadata to get the image URL
  const { availableSets, activeSetId } = useSet();
  
  // Find the active set metadata (removed type assertion)
  const activeSet = availableSets.find(set => set.id === activeSetId);
  
  // Get the image URL (use new monthly Thailand image for default set, fallback to old logo)
  let setImageUrl = activeSet?.imageUrl;
  if (!setImageUrl && activeSet?.id === 'default') {
    setImageUrl = '/images/defaultnew.png';
  }
  setImageUrl = setImageUrl || '/images/defaultnew.png';

  const router = useRouter();

  return (
    <div className="bg-[#1F1F1F] border-b border-[#404040] flex flex-col">
      {/* Full-width Ideogram set image (16:9 aspect ratio) */}
      <div className="w-full flex items-center justify-center py-2 relative mt-2 bg-[#121212]">
        <div className="w-full max-w-lg aspect-[16/9] rounded-xl overflow-hidden relative border border-[#404040] bg-[#2C2C2C]">
          {/* Overlay (Top) */}
          <div
            className="absolute top-0 left-0 right-0 z-20 flex flex-col items-center pointer-events-none"
            style={{ paddingTop: '4px' }}
          >
            <div
              className="bg-[#1F1F1F]/90 backdrop-blur-sm px-0 py-0.5 text-[#E0E0E0] text-base font-semibold shadow-none border-b border-[#404040] w-full max-w-2xl mx-auto text-center"
              style={{
                letterSpacing: '0.04em',
                maxWidth: '100%',
                textAlign: 'center',
                fontWeight: 600,
                lineHeight: 1.1,
                paddingBottom: 0,
              }}
            >
              Donkey Bridge
            </div>
          </div>
          <Image
            src={setImageUrl}
            alt={`${activeSet?.name || 'Set'} image`}
            className="w-full h-full object-contain"
            key={activeSetId}
            width={640}
            height={360}
            style={{ objectFit: 'contain', objectPosition: 'center' }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/images/defaultnew.png';
            }}
          />
          {/* Set Title Overlay at Bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 z-30 flex flex-col items-center pointer-events-none"
            style={{ paddingBottom: '4px' }}
          >
            <div
              className="bg-[#1F1F1F]/90 backdrop-blur-sm px-2 py-0.5 text-[#E0E0E0] text-xs font-semibold shadow-none border-t border-[#404040] w-full max-w-2xl mx-auto text-center"
              style={{
                letterSpacing: '0.02em',
                maxWidth: '100%',
                textAlign: 'center',
                fontWeight: 600,
                lineHeight: 1.1,
                paddingTop: 0,
              }}
            >
              {activeSet?.cleverTitle || activeSet?.name || ''}
            </div>
          </div>
        </div>
      </div>
      {/* Navigation Buttons */}
      <div className="px-4 py-3 w-full bg-[#121212]">
        <div className="flex flex-row items-center w-full justify-between gap-x-3">
          {/* Create! */}
          <div className="flex flex-col items-center">
            <button
              onClick={onOpenSetWizard}
              className="relative neumorphic-icon-button text-xl rounded-xl bg-[#3C3C3C] hover:bg-[#3d4a3d] text-[#22c55e] before:absolute before:inset-0 before:rounded-xl before:shadow-[0_0_20px_10px_rgba(34,197,94,0.15)] before:pointer-events-none"
              style={{
                boxShadow: '0 0 20px rgba(34, 197, 94, 0.2), 0 0 40px rgba(255, 255, 255, 0.1)',
              }}
              title="Create!"
              aria-label="Create!"
            >
              <Plus size={28} />
            </button>
            <span className="block text-xs text-[#BDBDBD] mt-1 text-center">Create!</span>
          </div>
          {/* Gallery */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => router.push('/gallery')}
              className="relative neumorphic-icon-button text-xl rounded-xl bg-[#3C3C3C] hover:bg-[#3d3c44] text-[#BB86FC] before:absolute before:inset-0 before:rounded-xl before:shadow-[0_0_20px_10px_rgba(187,134,252,0.15)] before:pointer-events-none"
              style={{
                boxShadow: '0 0 20px rgba(187, 134, 252, 0.2), 0 0 40px rgba(255, 255, 255, 0.1)',
              }}
              title="User Gallery"
              aria-label="User Gallery"
            >
              <GalleryHorizontal />
            </button>
            <span className="block text-xs text-[#BDBDBD] mt-1 text-center">Gallery</span>
          </div>
          {/* Divider */}
          <div className="h-12 w-px bg-[#404040]/50 mx-1" />
          {/* Set Manager */}
          <div className="flex flex-col items-center">
            <button
              onClick={onOpenSetManager}
              className="relative neumorphic-icon-button text-xl rounded-xl bg-[#3C3C3C] hover:bg-[#3d3c44] text-[#2563EB] before:absolute before:inset-0 before:rounded-xl before:shadow-[0_0_20px_10px_rgba(37,99,235,0.15)] before:pointer-events-none"
              style={{
                boxShadow: '0 0 20px rgba(37, 99, 235, 0.2), 0 0 40px rgba(255, 255, 255, 0.1)',
              }}
              title="My Sets"
              aria-label="My Sets"
            >
              <Grid />
            </button>
            <span className="block text-xs text-[#BDBDBD] mt-1 text-center">My Sets</span>
          </div>
          {/* Cards */}
          <div className="flex flex-col items-center">
            <button
              onClick={onOpenCards}
              className="relative neumorphic-icon-button text-xl rounded-xl bg-[#3C3C3C] hover:bg-[#3d3c44] text-[#2563EB] before:absolute before:inset-0 before:rounded-xl before:shadow-[0_0_20px_10px_rgba(37,99,235,0.15)] before:pointer-events-none"
              style={{
                boxShadow: '0 0 20px rgba(37, 99, 235, 0.2), 0 0 40px rgba(255, 255, 255, 0.1)',
              }}
              title="Cards"
              aria-label="Cards"
            >
              <Layers />
            </button>
            <span className="block text-xs text-[#BDBDBD] mt-1 text-center">Current</span>
          </div>
          {/* Divider */}
          <div className="h-12 w-px bg-[#404040]/50 mx-1" />
          {/* Settings */}
          <div className="flex flex-col items-center">
            <button
              onClick={onOpenSettings}
              className="neumorphic-icon-button text-xl rounded-xl"
              title="Settings"
              aria-label="Settings"
            >
              <Settings />
            </button>
            <span className="block text-xs text-[#BDBDBD] mt-1 text-center">Settings</span>
          </div>
          {/* Help */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => setShowHowItWorks(true)}
              className="neumorphic-icon-button text-xl rounded-xl"
              title="Help"
              aria-label="Help"
            >
              <HelpCircle />
            </button>
            <span className="block text-xs text-[#BDBDBD] mt-1 text-center">Help</span>
          </div>
        </div>
      </div>
    </div>
  );
} 
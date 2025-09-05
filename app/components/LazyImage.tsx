'use client';

import { useState, useEffect } from 'react';
import { getThumbnailUrl } from '@/app/lib/image-utils';

interface LazyImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  loadFullImage?: boolean; // Whether to load the full image or just show thumbnail
}

export function LazyImage({ src, alt, className, loadFullImage = false }: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setImageSrc('/images/default-set-logo.png');
      setIsLoading(false);
      return;
    }

    // If already a thumbnail, use as-is, otherwise get thumbnail
    const thumbnailUrl = src.includes('/thumbnails/') ? src : getThumbnailUrl(src);
    setImageSrc(thumbnailUrl);
    setIsLoading(false);

    // If requested, load full image in background
    if (loadFullImage && !src.includes('/thumbnails/')) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src); // Switch to full image once loaded
      };
      img.onerror = () => {
        // Keep showing thumbnail on error
        console.warn(`Failed to load full image: ${src}`);
      };
      img.src = src;
    }
  }, [src, loadFullImage]);

  if (error) {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center`}>
        <span className="text-gray-500">Image not found</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`${className} bg-gray-200 animate-pulse`} />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}

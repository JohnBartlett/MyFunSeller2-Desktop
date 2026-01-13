import { useEffect, useState } from 'react';
import type { Image } from '../../../shared/types';

export function useItemImage(image?: Image): string | null {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!image) {
      setImageUrl(null);
      return;
    }

    const imagePath = image.processed_path || image.original_path;
    if (!imagePath) {
      setImageUrl(null);
      return;
    }

    // For Electron, we need to handle file paths correctly
    // On Windows, the path might be like C:\Users\...
    // We need to convert it to a proper file:/// URL or use a data URL

    // Simple approach: try direct file path first
    // In development, this should work with the file:// protocol
    const normalizedPath = imagePath.replace(/\\/g, '/');
    setImageUrl(`file:///${normalizedPath}`);

  }, [image]);

  return imageUrl;
}

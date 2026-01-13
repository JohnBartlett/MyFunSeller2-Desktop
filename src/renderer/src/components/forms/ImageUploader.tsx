import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Star, Image as ImageIcon, Loader2 } from 'lucide-react';

export interface UploadedImage {
  id: string;
  file?: File;
  preview: string;
  isPrimary: boolean;
  name: string;
  size: number;
  processing?: boolean;
  processed?: boolean;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  disabled?: boolean;
}

export function ImageUploader({
  images,
  onImagesChange,
  maxFiles = 10,
  maxSizeMB = 5,
  disabled = false,
}: ImageUploaderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const remainingSlots = maxFiles - images.length;
      const filesToAdd = acceptedFiles.slice(0, remainingSlots);

      const newImages: UploadedImage[] = filesToAdd.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        file,
        preview: URL.createObjectURL(file),
        isPrimary: images.length === 0 && index === 0, // First image is primary
        name: file.name,
        size: file.size,
        processing: false,
        processed: false,
      }));

      onImagesChange([...images, ...newImages]);
    },
    [images, maxFiles, onImagesChange]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
    },
    maxSize: maxSizeMB * 1024 * 1024,
    maxFiles: maxFiles - images.length,
    disabled: disabled || images.length >= maxFiles,
  });

  const removeImage = (id: string) => {
    const updatedImages = images.filter((img) => img.id !== id);

    // If removed image was primary, make first image primary
    if (updatedImages.length > 0) {
      const wasPrimary = images.find((img) => img.id === id)?.isPrimary;
      if (wasPrimary) {
        updatedImages[0].isPrimary = true;
      }
    }

    onImagesChange(updatedImages);
  };

  const setPrimaryImage = (id: string) => {
    const updatedImages = images.map((img) => ({
      ...img,
      isPrimary: img.id === id,
    }));
    onImagesChange(updatedImages);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updatedImages = [...images];
    const draggedImage = updatedImages[draggedIndex];
    updatedImages.splice(draggedIndex, 1);
    updatedImages.splice(index, 0, draggedImage);

    setDraggedIndex(index);
    onImagesChange(updatedImages);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable={!disabled}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative group rounded-lg overflow-hidden border-2 ${
                image.isPrimary
                  ? 'border-primary'
                  : 'border-border'
              } ${draggedIndex === index ? 'opacity-50' : ''} ${
                disabled ? 'cursor-not-allowed' : 'cursor-move'
              }`}
            >
              {/* Image Preview */}
              <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                {image.processing ? (
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-xs text-muted-foreground mt-2">Processing...</p>
                  </div>
                ) : (
                  <img
                    src={image.preview}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Primary Badge */}
              {image.isPrimary && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  <span>Primary</span>
                </div>
              )}

              {/* Action Buttons */}
              {!disabled && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {!image.isPrimary && (
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(image.id)}
                      className="p-1.5 bg-white/90 hover:bg-white rounded shadow-md"
                      title="Set as primary"
                    >
                      <Star className="w-4 h-4 text-gray-700" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded shadow-md"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Image Info */}
              <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="truncate font-medium">{image.name}</p>
                <p className="text-white/80">{formatFileSize(image.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      {images.length < maxFiles && !disabled && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-accent'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center">
            {isDragActive ? (
              <>
                <Upload className="w-12 h-12 text-primary mb-3" />
                <p className="text-lg font-medium text-foreground">Drop images here...</p>
              </>
            ) : (
              <>
                <ImageIcon className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-lg font-medium text-foreground mb-2">
                  Drag & drop images here
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to select files
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                  <Upload className="w-4 h-4" />
                  <span>Choose Files</span>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  {images.length > 0
                    ? `${images.length} of ${maxFiles} images uploaded`
                    : `Upload up to ${maxFiles} images (max ${maxSizeMB}MB each)`}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error Messages */}
      {fileRejections.length > 0 && (
        <div className="rounded-lg bg-red-500/10 border border-red-500 p-4">
          <p className="text-sm font-medium text-red-600 mb-2">
            Some files were rejected:
          </p>
          <ul className="text-sm text-red-600 list-disc list-inside space-y-1">
            {fileRejections.map(({ file, errors }) => (
              <li key={file.name}>
                {file.name} - {errors.map((e) => e.message).join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Info Message */}
      {images.length === 0 && (
        <div className="rounded-lg bg-blue-500/10 border border-blue-500 p-4">
          <p className="text-sm text-blue-600">
            <strong>Tip:</strong> The first image you upload will be set as the primary image. You can change this later by clicking the star icon on any image.
          </p>
        </div>
      )}
    </div>
  );
}

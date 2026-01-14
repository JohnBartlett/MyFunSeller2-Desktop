import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { Input, Textarea, Select } from '../ui/FormField';
import { ImageUploader, type UploadedImage } from './ImageUploader';
import {
  itemSchema,
  type ItemFormData,
  ITEM_CATEGORIES,
  CONDITION_OPTIONS,
} from '../../lib/validations/item.schema';
import type { Item } from '../../../../shared/types';
import { showSuccess, showError, showInfo } from '../../lib/toast';

interface ItemFormProps {
  item?: Item;
  existingImages?: UploadedImage[];
  onSubmit: (data: ItemFormData, images: UploadedImage[]) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ItemForm({ item, existingImages, onSubmit, onCancel, isLoading }: ItemFormProps) {
  const [images, setImages] = useState<UploadedImage[]>(existingImages || []);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isClaudeConfigured, setIsClaudeConfigured] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    getValues,
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: item
      ? {
          title: item.title,
          description: item.description || '',
          category: item.category,
          condition: item.condition,
          price: item.price,
          currency: item.currency || 'USD',
          quantity: item.quantity || 1,
          cost: item.cost,
          sku: item.sku || '',
          brand: item.brand || '',
          size: item.size || '',
          color: item.color || '',
          weight: item.weight,
        }
      : {
          currency: 'USD',
          quantity: 1,
          condition: 'good',
        },
  });

  useEffect(() => {
    if (item) {
      reset({
        title: item.title,
        description: item.description || '',
        category: item.category,
        condition: item.condition,
        price: item.price,
        currency: item.currency || 'USD',
        quantity: item.quantity || 1,
        cost: item.cost,
        sku: item.sku || '',
        brand: item.brand || '',
        size: item.size || '',
        color: item.color || '',
        weight: item.weight,
      });
    }
  }, [item, reset]);

  useEffect(() => {
    if (existingImages) {
      setImages(existingImages);
    }
  }, [existingImages]);

  // Check if Claude is configured on mount
  useEffect(() => {
    window.api.claude.isConfigured().then((response: any) => {
      if (response.success && response.data) {
        setIsClaudeConfigured(true);
      }
    });
  }, []);

  const handleFormSubmit = async (data: ItemFormData) => {
    try {
      await onSubmit(data, images);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleAutoFill = async () => {
    if (images.length === 0) {
      showInfo('Please upload at least one image first');
      return;
    }

    if (!isClaudeConfigured) {
      showError('Claude AI is not configured. Please add your ANTHROPIC_API_KEY to the .env file.');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Get file paths from images - Electron adds path property to File objects
      const imagePaths = images
        .filter(img => img.file)
        .map(img => {
          const file = img.file as any;
          return file.path || file.webkitRelativePath;
        })
        .filter(Boolean);

      console.log('Image paths for AI analysis:', imagePaths);

      if (imagePaths.length === 0) {
        showError('No valid image files found. Files may not have paths.');
        return;
      }

      const response: any = await window.api.claude.analyzeImages(imagePaths);

      if (!response.success) {
        throw new Error(response.error || 'Failed to analyze images');
      }

      const analysis = response.data;

      // Fill in the form fields
      setValue('title', analysis.title);
      setValue('description', analysis.description);
      setValue('category', analysis.category);
      setValue('condition', analysis.condition);
      setValue('price', analysis.price);

      if (analysis.brand) setValue('brand', analysis.brand);
      if (analysis.color) setValue('color', analysis.color);
      if (analysis.size) setValue('size', analysis.size);
      if (analysis.weight) setValue('weight', analysis.weight);

      setHasAnalyzed(true);
      showSuccess(`Auto-filled with ${analysis.confidence}% confidence!`);
    } catch (error: any) {
      console.error('Failed to analyze images:', error);
      showError(error.message || 'Failed to analyze images. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReAnalyze = async () => {
    if (images.length === 0) {
      showInfo('Please upload at least one image first');
      return;
    }

    if (!isClaudeConfigured) {
      showError('Claude AI is not configured. Please add your ANTHROPIC_API_KEY to the .env file.');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Get current form values as corrections
      const currentValues = getValues();
      const userCorrections: any = {};

      if (currentValues.title) userCorrections.title = currentValues.title;
      if (currentValues.description) userCorrections.description = currentValues.description;
      if (currentValues.category) userCorrections.category = currentValues.category;
      if (currentValues.condition) userCorrections.condition = currentValues.condition;
      if (currentValues.price) userCorrections.price = currentValues.price;
      if (currentValues.brand) userCorrections.brand = currentValues.brand;
      if (currentValues.color) userCorrections.color = currentValues.color;
      if (currentValues.size) userCorrections.size = currentValues.size;
      if (currentValues.weight) userCorrections.weight = currentValues.weight;

      // Get file paths from images - Electron adds path property to File objects
      const imagePaths = images
        .filter(img => img.file)
        .map(img => {
          const file = img.file as any;
          return file.path || file.webkitRelativePath;
        })
        .filter(Boolean);

      console.log('Image paths for re-analysis:', imagePaths);

      if (imagePaths.length === 0) {
        showError('No valid image files found. Files may not have paths.');
        return;
      }

      const response: any = await window.api.claude.analyzeImages(imagePaths, userCorrections);

      if (!response.success) {
        throw new Error(response.error || 'Failed to re-analyze images');
      }

      const analysis = response.data;

      // Update form fields with refined analysis, but preserve user corrections
      // Only update fields that the user didn't provide (were empty)
      if (!userCorrections.title || userCorrections.title.trim() === '') {
        setValue('title', analysis.title);
      } else {
        setValue('title', userCorrections.title); // Keep user's correction
      }

      if (!userCorrections.description || userCorrections.description.trim() === '') {
        setValue('description', analysis.description);
      } else {
        setValue('description', userCorrections.description); // Keep user's correction
      }

      if (!userCorrections.category) {
        setValue('category', analysis.category);
      } else {
        setValue('category', userCorrections.category); // Keep user's correction
      }

      if (!userCorrections.condition) {
        setValue('condition', analysis.condition);
      } else {
        setValue('condition', userCorrections.condition); // Keep user's correction
      }

      if (!userCorrections.price) {
        setValue('price', analysis.price);
      } else {
        setValue('price', userCorrections.price); // Keep user's correction
      }

      // For optional fields, update only if AI provides something and user didn't
      if (analysis.brand && (!userCorrections.brand || userCorrections.brand.trim() === '')) {
        setValue('brand', analysis.brand);
      } else if (userCorrections.brand) {
        setValue('brand', userCorrections.brand);
      }

      if (analysis.color && (!userCorrections.color || userCorrections.color.trim() === '')) {
        setValue('color', analysis.color);
      } else if (userCorrections.color) {
        setValue('color', userCorrections.color);
      }

      if (analysis.size && (!userCorrections.size || userCorrections.size.trim() === '')) {
        setValue('size', analysis.size);
      } else if (userCorrections.size) {
        setValue('size', userCorrections.size);
      }

      if (analysis.weight && !userCorrections.weight) {
        setValue('weight', analysis.weight);
      } else if (userCorrections.weight) {
        setValue('weight', userCorrections.weight);
      }

      showSuccess(`Re-analyzed with ${analysis.confidence}% confidence!`);
    } catch (error: any) {
      console.error('Failed to re-analyze images:', error);
      showError(error.message || 'Failed to re-analyze images. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h2 className="text-2xl font-bold text-foreground">
          {item ? 'Edit Item' : 'Add New Item'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-6 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Title"
              name="title"
              placeholder="Enter item title"
              register={register}
              error={errors.title}
              required
              className="md:col-span-2"
            />

            <Textarea
              label="Description"
              name="description"
              placeholder="Describe your item..."
              register={register}
              error={errors.description}
              rows={3}
              className="md:col-span-2"
            />

            <Select
              label="Category"
              name="category"
              options={ITEM_CATEGORIES}
              register={register}
              error={errors.category}
              required
            />

            <Select
              label="Condition"
              name="condition"
              options={CONDITION_OPTIONS}
              register={register}
              error={errors.condition}
              required
            />
          </div>
        </div>

        {/* Pricing */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Pricing</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Price"
              name="price"
              type="number"
              step="0.01"
              placeholder="0.00"
              register={register}
              error={errors.price}
              required
            />

            <Input
              label="Cost (Optional)"
              name="cost"
              type="number"
              step="0.01"
              placeholder="0.00"
              register={register}
              error={errors.cost}
            />

            <Input
              label="Quantity"
              name="quantity"
              type="number"
              placeholder="1"
              register={register}
              error={errors.quantity}
              required
            />
          </div>
        </div>

        {/* Item Details */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Item Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="SKU (Optional)"
              name="sku"
              placeholder="Item SKU or ID"
              register={register}
              error={errors.sku}
            />

            <Input
              label="Brand (Optional)"
              name="brand"
              placeholder="Brand name"
              register={register}
              error={errors.brand}
            />

            <Input
              label="Size (Optional)"
              name="size"
              placeholder="e.g., M, L, XL"
              register={register}
              error={errors.size}
            />

            <Input
              label="Color (Optional)"
              name="color"
              placeholder="Item color"
              register={register}
              error={errors.color}
            />

            <Input
              label="Weight (Optional)"
              name="weight"
              type="number"
              step="0.1"
              placeholder="Weight in lbs"
              register={register}
              error={errors.weight}
            />
          </div>
        </div>

        {/* Images */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Images</h3>
            {images.length > 0 && isClaudeConfigured && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAutoFill}
                  disabled={isAnalyzing || isSubmitting || isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Auto-fill with AI</span>
                    </>
                  )}
                </button>
                {hasAnalyzed && (
                  <button
                    type="button"
                    onClick={handleReAnalyze}
                    disabled={isAnalyzing || isSubmitting || isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Re-analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Re-analyze</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
          <ImageUploader
            images={images}
            onImagesChange={setImages}
            maxFiles={10}
            maxSizeMB={5}
            disabled={isSubmitting || isLoading}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting || isLoading}
          className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting || isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>{item ? 'Update Item' : 'Create Item'}</span>
          )}
        </button>
      </div>
    </form>
  );
}

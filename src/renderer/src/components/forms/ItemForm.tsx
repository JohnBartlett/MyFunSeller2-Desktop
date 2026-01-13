import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { Input, Textarea, Select } from '../ui/FormField';
import {
  itemSchema,
  type ItemFormData,
  ITEM_CATEGORIES,
  CONDITION_OPTIONS,
} from '../../lib/validations/item.schema';
import type { Item } from '../../../../shared/types';

interface ItemFormProps {
  item?: Item;
  onSubmit: (data: ItemFormData) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ItemForm({ item, onSubmit, onCancel, isLoading }: ItemFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
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

  const handleFormSubmit = async (data: ItemFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
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
              placeholder="0.00"
              register={register}
              error={errors.price}
              required
            />

            <Input
              label="Cost (Optional)"
              name="cost"
              type="number"
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
              placeholder="Weight in lbs"
              register={register}
              error={errors.weight}
            />
          </div>
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

import React, { useEffect, useState } from 'react';
import { Package, Plus, Search, Pencil, Trash2 } from 'lucide-react';
import type { Item, Image } from '../../../shared/types';
import { Modal } from '../components/ui/Modal';
import { ItemForm } from '../components/forms/ItemForm';
import type { ItemFormData } from '../lib/validations/item.schema';
import type { UploadedImage } from '../components/forms/ImageUploader';

interface ItemWithImage extends Item {
  primaryImage?: Image;
}

export function Items(): JSX.Element {
  const [items, setItems] = useState<ItemWithImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const allItems = await window.api.items.findAll();

      // Load primary image for each item
      const itemsWithImages = await Promise.all(
        allItems.map(async (item) => {
          if (item.id) {
            try {
              const primaryImage = await window.api.images.getPrimary(item.id);
              return { ...item, primaryImage };
            } catch (error) {
              // No primary image found, that's okay
              return item;
            }
          }
          return item;
        })
      );

      setItems(itemsWithImages);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (data: ItemFormData, images: UploadedImage[]) => {
    setIsSubmitting(true);
    try {
      // Create the item first
      const createdItem = await window.api.items.create({
        ...data,
        // Convert empty strings to undefined
        description: data.description || undefined,
        sku: data.sku || undefined,
        brand: data.brand || undefined,
        size: data.size || undefined,
        color: data.color || undefined,
        cost: data.cost || undefined,
        weight: data.weight || undefined,
      });

      // If there are images, process and save them
      if (images.length > 0 && createdItem.id) {
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          if (img.file) {
            try {
              // Save original image
              const savedPath = await window.api.imageProcessor.saveOriginal(img.file.path);

              // Create image record in database
              await window.api.images.create({
                item_id: createdItem.id,
                original_path: savedPath,
                file_name: img.name,
                file_size: img.size,
                display_order: i,
                is_primary: img.isPrimary,
                processing_status: 'pending',
              });
            } catch (imageError) {
              console.error('Failed to save image:', imageError);
              // Continue with other images even if one fails
            }
          }
        }
      }

      await loadItems();
      setIsFormOpen(false);
      setEditingItem(undefined);
    } catch (error) {
      console.error('Failed to create item:', error);
      alert('Failed to create item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateItem = async (data: ItemFormData, images: UploadedImage[]) => {
    if (!editingItem?.id) return;

    setIsSubmitting(true);
    try {
      await window.api.items.update(editingItem.id, {
        ...data,
        description: data.description || undefined,
        sku: data.sku || undefined,
        brand: data.brand || undefined,
        size: data.size || undefined,
        color: data.color || undefined,
        cost: data.cost || undefined,
        weight: data.weight || undefined,
      });

      // Handle new images (only process images with files)
      const newImages = images.filter(img => img.file);
      if (newImages.length > 0) {
        for (let i = 0; i < newImages.length; i++) {
          const img = newImages[i];
          if (img.file) {
            try {
              const savedPath = await window.api.imageProcessor.saveOriginal(img.file.path);

              await window.api.images.create({
                item_id: editingItem.id,
                original_path: savedPath,
                file_name: img.name,
                file_size: img.size,
                display_order: i,
                is_primary: img.isPrimary,
                processing_status: 'pending',
              });
            } catch (imageError) {
              console.error('Failed to save image:', imageError);
            }
          }
        }
      }

      await loadItems();
      setIsFormOpen(false);
      setEditingItem(undefined);
    } catch (error) {
      console.error('Failed to update item:', error);
      alert('Failed to update item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await window.api.items.delete(id);
      await loadItems();
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  const openCreateForm = () => {
    setEditingItem(undefined);
    setIsFormOpen(true);
  };

  const openEditForm = (item: Item) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingItem(undefined);
  };

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Items</h1>
          <p className="text-muted-foreground mt-2">
            Manage your inventory items
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {searchQuery ? 'No items found' : 'No items yet'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Get started by creating your first item'}
          </p>
          {!searchQuery && (
            <button
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Add Your First Item</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group"
            >
              {/* Item Image */}
              <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
                {item.primaryImage?.processed_path || item.primaryImage?.original_path ? (
                  <img
                    src={`file:///${(item.primaryImage.processed_path || item.primaryImage.original_path).replace(/\\/g, '/')}`}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      console.error('Failed to load image:', item.primaryImage);
                      e.currentTarget.style.display = 'none';
                      const placeholder = e.currentTarget.parentElement?.querySelector('.package-icon');
                      if (placeholder) placeholder.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <Package
                  className={`package-icon w-12 h-12 text-muted-foreground ${item.primaryImage ? 'hidden' : ''}`}
                />

                {/* Action Buttons (shown on hover) */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                  <button
                    onClick={() => openEditForm(item)}
                    className="p-2 bg-white/90 backdrop-blur-sm text-gray-900 rounded-lg hover:bg-white transition-colors shadow-md"
                    title="Edit item"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => item.id && handleDeleteItem(item.id)}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Item Info */}
              <div className="p-4">
                <h3 className="font-semibold text-foreground truncate mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {item.category}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-foreground">
                    ${item.price.toFixed(2)}
                  </span>
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded capitalize">
                    {item.condition.replace('_', ' ')}
                  </span>
                </div>
                {item.quantity && item.quantity > 1 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Qty: {item.quantity}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Item Form Modal */}
      <Modal isOpen={isFormOpen} onClose={closeForm} size="lg">
        <ItemForm
          item={editingItem}
          onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
          onCancel={closeForm}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}

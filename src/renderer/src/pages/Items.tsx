import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Search, Pencil, Trash2, RefreshCw } from 'lucide-react';
import type { Item, Image } from '../../../shared/types';
import { Modal } from '../components/ui/Modal';
import { ItemForm } from '../components/forms/ItemForm';
import type { ItemFormData } from '../lib/validations/item.schema';
import type { UploadedImage } from '../components/forms/ImageUploader';
import { showSuccess, showError, showConfirm } from '../lib/toast';

interface ItemWithImage extends Item {
  primaryImage?: Image;
}

export function Items(): JSX.Element {
  const navigate = useNavigate();
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
      setLoading(true);
      console.log('Loading items...');

      const response: any = await window.api.items.findAll();
      console.log('Items response:', response);

      const allItems = response.success ? response.data : [];
      console.log('All items:', allItems);

      // Debug: Check ALL images for each item
      for (const item of allItems) {
        if (item.id) {
          const allImagesResponse: any = await window.api.images.findByItemId(item.id);
          console.log(`ALL images for item ${item.id}:`, allImagesResponse);
        }
      }

      // Load primary image for each item
      const itemsWithImages = await Promise.all(
        allItems.map(async (item: any) => {
          if (item.id) {
            try {
              const imageResponse: any = await window.api.images.getPrimary(item.id);
              console.log(`Primary image for item ${item.id}:`, imageResponse);
              const primaryImage = imageResponse.success ? imageResponse.data : undefined;

              // If we have a primary image, load it as a data URL for display
              if (primaryImage) {
                try {
                  const imagePath = primaryImage.processed_path || primaryImage.original_path;
                  console.log(`Loading image for display from: ${imagePath}`);
                  const dataUrlResponse: any = await window.api.imageProcessor.loadForDisplay(imagePath);
                  if (dataUrlResponse.success) {
                    primaryImage.dataUrl = dataUrlResponse.data;
                    console.log(`Loaded data URL for item ${item.id}, length: ${dataUrlResponse.data.length}`);
                  } else {
                    console.error(`Failed to load data URL for item ${item.id}:`, dataUrlResponse.error);
                  }
                } catch (error) {
                  console.error(`Error loading image for item ${item.id}:`, error);
                }
              }

              return { ...item, primaryImage };
            } catch (error) {
              // No primary image found, that's okay
              console.log(`No primary image for item ${item.id}`);
              return item;
            }
          }
          return item;
        })
      );

      console.log('Items with images:', itemsWithImages);
      setItems(itemsWithImages);
    } catch (error) {
      console.error('Failed to load items:', error);
      showError('Failed to load items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (data: ItemFormData, images: UploadedImage[]) => {
    setIsSubmitting(true);
    try {
      // Create the item first
      const response: any = await window.api.items.create({
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

      const createdItem = response.success ? response.data : response;
      console.log('Created item response:', response);
      console.log('Created item:', createdItem);
      console.log('Created item ID:', createdItem.id);
      console.log('Images to process:', images.length);
      console.log('Condition check: images.length > 0 =', images.length > 0, ', createdItem.id =', createdItem.id);

      // If there are images, process and save them
      if (images.length > 0 && createdItem.id) {
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          console.log('Processing image:', {
            name: img.name,
            hasFile: !!img.file,
            filePath: img.file?.path || (img.file as any)?.path,
            isPrimary: img.isPrimary
          });

          if (img.file) {
            try {
              // Get the file path - Electron adds a path property to File objects
              const filePath = (img.file as any).path || img.file.path;
              if (!filePath) {
                console.error('No file path found for image:', img.name);
                continue;
              }

              console.log('Saving image with path:', filePath);

              // Save original image
              const savedPathResponse: any = await window.api.imageProcessor.saveOriginal(filePath);
              const savedPath = savedPathResponse.success ? savedPathResponse.data : savedPathResponse;
              console.log('Image saved response:', savedPathResponse);
              console.log('Image saved to path:', savedPath);

              // Create image record in database
              const createImageResponse: any = await window.api.images.create({
                item_id: createdItem.id,
                original_path: savedPath,
                file_name: img.name,
                file_size: img.size,
                display_order: i,
                is_primary: img.isPrimary,
                processing_status: 'pending',
              });
              console.log('Image record created response:', createImageResponse);
              console.log('Image record ID:', createImageResponse.success ? createImageResponse.data?.id : 'FAILED');
            } catch (imageError) {
              console.error('Failed to save image:', imageError);
              // Continue with other images even if one fails
            }
          } else {
            console.log('Skipping image (no file):', img.name);
          }
        }
      } else {
        console.log('No images to process or no item ID');
      }

      await loadItems();
      setIsFormOpen(false);
      setEditingItem(undefined);
      showSuccess('Item created successfully!');
    } catch (error) {
      console.error('Failed to create item:', error);
      showError('Failed to create item. Please try again.');
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
              const filePath = (img.file as any).path || img.file.path;
              const savedPathResponse: any = await window.api.imageProcessor.saveOriginal(filePath);
              const savedPath = savedPathResponse.success ? savedPathResponse.data : savedPathResponse;

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
      showSuccess('Item updated successfully!');
    } catch (error) {
      console.error('Failed to update item:', error);
      showError('Failed to update item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    const confirmed = await showConfirm(
      'Are you sure you want to delete this item?',
      {
        description: 'This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    );

    if (!confirmed) return;

    try {
      await window.api.items.delete(id);
      await loadItems();
      showSuccess('Item deleted successfully!');
    } catch (error) {
      console.error('Failed to delete item:', error);
      showError('Failed to delete item. Please try again.');
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
        <div className="flex gap-2">
          <button
            onClick={() => loadItems()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-foreground rounded-lg hover:bg-accent/80 transition-colors font-medium disabled:opacity-50"
            title="Refresh items"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Add Item</span>
          </button>
        </div>
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
              onClick={() => item.id && navigate(`/items/${item.id}`)}
              className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
            >
              {/* Item Image */}
              <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
                {item.primaryImage?.dataUrl ? (
                  <img
                    src={item.primaryImage.dataUrl}
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
                  className={`package-icon w-12 h-12 text-muted-foreground ${item.primaryImage?.dataUrl ? 'hidden' : ''}`}
                />

                {/* Action Buttons (shown on hover) */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditForm(item);
                    }}
                    className="p-2 bg-white/90 backdrop-blur-sm text-gray-900 rounded-lg hover:bg-white transition-colors shadow-md"
                    title="Edit item"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      item.id && handleDeleteItem(item.id);
                    }}
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

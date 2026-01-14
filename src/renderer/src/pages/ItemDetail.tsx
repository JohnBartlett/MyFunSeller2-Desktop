import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Package,
  Calendar,
  Tag,
  DollarSign,
  Box,
  Ruler,
  Weight,
  Palette,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import type { Item, Image, Listing, Platform } from '../../../shared/types';
import { Modal } from '../components/ui/Modal';
import { ItemForm } from '../components/forms/ItemForm';
import type { ItemFormData } from '../lib/validations/item.schema';
import type { UploadedImage } from '../components/forms/ImageUploader';
import { showSuccess, showError, showConfirm } from '../lib/toast';

interface ItemWithImages extends Item {
  images: Image[];
  listings: Listing[];
  platforms: Record<number, Platform>;
}

export function ItemDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<ItemWithImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      loadItem(parseInt(id, 10));
    }
  }, [id]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;

      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        navigateLightbox('prev');
      } else if (e.key === 'ArrowRight') {
        navigateLightbox('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex, item?.images.length]);

  const loadItem = async (itemId: number) => {
    try {
      setLoading(true);

      // Load item
      const itemResponse: any = await window.api.items.findById(itemId);
      const itemData = itemResponse.success ? itemResponse.data : itemResponse;
      if (!itemData) {
        throw new Error('Item not found');
      }

      // Load images
      const imagesResponse: any = await window.api.images.findByItemId(itemId);
      const images = imagesResponse.success ? imagesResponse.data : [];
      const sortedImages = images.sort((a: any, b: any) => a.display_order - b.display_order);

      // Load listings
      const listingsResponse: any = await window.api.listings.findByItemId(itemId);
      const listings = listingsResponse.success ? listingsResponse.data : [];

      // Load all platforms
      const platformsResponse: any = await window.api.platforms.findAll();
      const allPlatforms = platformsResponse.success ? platformsResponse.data : [];
      const platformsMap = allPlatforms.reduce((acc: any, platform: any) => {
        if (platform.id) {
          acc[platform.id] = platform;
        }
        return acc;
      }, {} as Record<number, Platform>);

      setItem({
        ...itemData,
        images: sortedImages,
        listings,
        platforms: platformsMap,
      });
    } catch (error) {
      console.error('Failed to load item:', error);
      showError('Failed to load item. Please try again.');
      navigate('/items');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = async (data: ItemFormData, images: UploadedImage[]) => {
    if (!item?.id) return;

    setIsSubmitting(true);
    try {
      await window.api.items.update(item.id, {
        ...data,
        description: data.description || undefined,
        sku: data.sku || undefined,
        brand: data.brand || undefined,
        size: data.size || undefined,
        color: data.color || undefined,
        cost: data.cost || undefined,
        weight: data.weight || undefined,
      });

      // Handle new images
      const newImages = images.filter(img => img.file);
      if (newImages.length > 0) {
        for (let i = 0; i < newImages.length; i++) {
          const img = newImages[i];
          if (img.file) {
            try {
              const savedPath = await window.api.imageProcessor.saveOriginal(img.file.path);
              await window.api.images.create({
                item_id: item.id,
                original_path: savedPath,
                file_name: img.name,
                file_size: img.size,
                display_order: item.images.length + i,
                is_primary: img.isPrimary && item.images.length === 0,
                processing_status: 'pending',
              });
            } catch (imageError) {
              console.error('Failed to save image:', imageError);
            }
          }
        }
      }

      await loadItem(item.id);
      setIsEditModalOpen(false);
      showSuccess('Item updated successfully!');
    } catch (error) {
      console.error('Failed to update item:', error);
      showError('Failed to update item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!item?.id) return;

    const confirmed = await showConfirm(
      `Are you sure you want to delete "${item.title}"?`,
      {
        description: 'This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    );

    if (!confirmed) return;

    try {
      await window.api.items.delete(item.id);
      showSuccess('Item deleted successfully!');
      navigate('/items');
    } catch (error) {
      console.error('Failed to delete item:', error);
      showError('Failed to delete item. Please try again.');
    }
  };

  const getImageUrl = (image: Image): string => {
    const path = image.processed_path || image.original_path;
    return `file:///${path.replace(/\\/g, '/')}`;
  };

  const convertImagesToUploadedImages = (images: Image[]): UploadedImage[] => {
    return images.map((img) => ({
      id: String(img.id),
      preview: getImageUrl(img),
      isPrimary: img.is_primary,
      name: img.file_name,
      size: img.file_size,
      processing: false,
      processed: img.processing_status === 'completed',
    }));
  };

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImageIndex(null);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (selectedImageIndex === null || !item) return;

    if (direction === 'prev') {
      setSelectedImageIndex(
        selectedImageIndex > 0 ? selectedImageIndex - 1 : item.images.length - 1
      );
    } else {
      setSelectedImageIndex(
        selectedImageIndex < item.images.length - 1 ? selectedImageIndex + 1 : 0
      );
    }
  };

  const getListingStatusColor = (status: Listing['status']): string => {
    const colors: Record<Listing['status'], string> = {
      draft: 'bg-gray-100 text-gray-700',
      scheduled: 'bg-blue-100 text-blue-700',
      posting: 'bg-yellow-100 text-yellow-700',
      active: 'bg-green-100 text-green-700',
      sold: 'bg-purple-100 text-purple-700',
      expired: 'bg-orange-100 text-orange-700',
      failed: 'bg-red-100 text-red-700',
      deleted: 'bg-gray-100 text-gray-500',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">Item not found</h2>
          <button
            onClick={() => navigate('/items')}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Back to Items
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/items')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Items</span>
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={handleDeleteItem}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Images */}
        <div>
          {/* Main Image */}
          <div className="bg-card border border-border rounded-lg overflow-hidden mb-4">
            <div className="aspect-square bg-muted flex items-center justify-center relative">
              {item.images.length > 0 ? (
                <>
                  <img
                    src={getImageUrl(item.images[0])}
                    alt={item.title}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => openLightbox(0)}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-lg text-sm">
                    Click to enlarge
                  </div>
                </>
              ) : (
                <Package className="w-24 h-24 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Image Thumbnails */}
          {item.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {item.images.map((image, index) => (
                <button
                  key={image.id || index}
                  onClick={() => openLightbox(index)}
                  className="aspect-square bg-muted border-2 border-border hover:border-primary rounded-lg overflow-hidden transition-colors"
                >
                  <img
                    src={getImageUrl(image)}
                    alt={`${item.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  {image.is_primary && (
                    <div className="absolute top-1 left-1 bg-yellow-400 text-yellow-900 px-1 text-xs rounded">
                      Primary
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{item.title}</h1>
            <div className="flex items-center gap-3 text-muted-foreground mb-4">
              <span className="text-sm">{item.category}</span>
              <span className="text-sm">•</span>
              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded capitalize">
                {item.condition.replace('_', ' ')}
              </span>
            </div>
            <div className="text-4xl font-bold text-foreground mb-6">
              ${item.price.toFixed(2)}
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{item.description}</p>
            </div>
          )}

          {/* Item Details Grid */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-4">Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Box className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium text-foreground">{item.quantity}</p>
                </div>
              </div>

              {item.sku && (
                <div className="flex items-start gap-2">
                  <Tag className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">SKU</p>
                    <p className="font-medium text-foreground">{item.sku}</p>
                  </div>
                </div>
              )}

              {item.brand && (
                <div className="flex items-start gap-2">
                  <ShoppingBag className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Brand</p>
                    <p className="font-medium text-foreground">{item.brand}</p>
                  </div>
                </div>
              )}

              {item.size && (
                <div className="flex items-start gap-2">
                  <Ruler className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Size</p>
                    <p className="font-medium text-foreground">{item.size}</p>
                  </div>
                </div>
              )}

              {item.color && (
                <div className="flex items-start gap-2">
                  <Palette className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Color</p>
                    <p className="font-medium text-foreground">{item.color}</p>
                  </div>
                </div>
              )}

              {item.weight && (
                <div className="flex items-start gap-2">
                  <Weight className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Weight</p>
                    <p className="font-medium text-foreground">{item.weight} lbs</p>
                  </div>
                </div>
              )}

              {item.cost && (
                <div className="flex items-start gap-2">
                  <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cost</p>
                    <p className="font-medium text-foreground">${item.cost.toFixed(2)}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium text-foreground">{formatDate(item.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Listings */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-4">Platform Listings</h3>
            {item.listings.length > 0 ? (
              <div className="space-y-3">
                {item.listings.map((listing) => {
                  const platform = item.platforms[listing.platform_id];
                  return (
                    <div
                      key={listing.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {platform?.display_name || 'Unknown Platform'}
                        </p>
                        {listing.posted_at && (
                          <p className="text-sm text-muted-foreground">
                            Posted: {formatDate(listing.posted_at)}
                          </p>
                        )}
                        {listing.external_url && (
                          <a
                            href={listing.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            View Listing →
                          </a>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded capitalize ${getListingStatusColor(listing.status)}`}
                        >
                          {listing.status}
                        </span>
                        {listing.status === 'active' && (
                          <div className="text-xs text-muted-foreground space-x-2">
                            {listing.view_count > 0 && <span>{listing.view_count} views</span>}
                            {listing.like_count > 0 && <span>{listing.like_count} likes</span>}
                            {listing.message_count > 0 && (
                              <span>{listing.message_count} messages</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No listings yet. Post this item to a platform to get started.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImageIndex !== null && item.images[selectedImageIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {item.images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox('prev');
                }}
                className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox('next');
                }}
                className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <div className="max-w-7xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={getImageUrl(item.images[selectedImageIndex])}
              alt={`${item.title} ${selectedImageIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <p className="text-white text-center mt-4">
              Image {selectedImageIndex + 1} of {item.images.length}
            </p>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} size="lg">
        <ItemForm
          item={item}
          existingImages={item ? convertImagesToUploadedImages(item.images) : undefined}
          onSubmit={handleUpdateItem}
          onCancel={() => setIsEditModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}

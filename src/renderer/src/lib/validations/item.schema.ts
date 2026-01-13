import { z } from 'zod';

export const itemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor'], {
    required_error: 'Condition is required',
  }),
  price: z.number().min(0, 'Price must be greater than 0').or(z.string().transform((val) => parseFloat(val))),
  currency: z.string().default('USD'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1).or(z.string().transform((val) => parseInt(val))),
  cost: z.number().min(0).optional().or(z.string().transform((val) => val ? parseFloat(val) : undefined)),
  sku: z.string().optional(),
  brand: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  weight: z.number().min(0).optional().or(z.string().transform((val) => val ? parseFloat(val) : undefined)),
  dimensions: z.object({
    length: z.number().min(0),
    width: z.number().min(0),
    height: z.number().min(0),
    unit: z.enum(['in', 'cm']),
  }).optional(),
  tags: z.array(z.string()).optional(),
});

export type ItemFormData = z.infer<typeof itemSchema>;

// Categories list
export const ITEM_CATEGORIES = [
  'Clothing',
  'Shoes',
  'Accessories',
  'Electronics',
  'Home & Garden',
  'Toys & Games',
  'Sports & Outdoors',
  'Books & Media',
  'Art & Collectibles',
  'Jewelry',
  'Beauty & Personal Care',
  'Automotive',
  'Other',
] as const;

// Condition options
export const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
] as const;

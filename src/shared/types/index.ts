// Item Types
export interface Item {
  id?: number;
  title: string;
  description?: string;
  category: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  price: number;
  currency: string;
  quantity: number;
  cost?: number;
  sku?: string;
  brand?: string;
  size?: string;
  color?: string;
  weight?: number;
  dimensions?: Dimensions;
  tags?: string[];
  custom_fields?: Record<string, any>;
  template_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: 'in' | 'cm';
}

// Image Types
export interface Image {
  id?: number;
  item_id: number;
  original_path: string;
  processed_path?: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  display_order: number;
  is_primary: boolean;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_options?: ProcessingOptions;
  created_at?: string;
}

export interface ProcessingOptions {
  resize?: { width: number; height: number; fit?: 'cover' | 'contain' | 'fill' };
  watermark?: { imagePath: string; position: 'center' | 'bottom-right' };
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  removeExif?: boolean;
  crop?: { x: number; y: number; width: number; height: number };
  rotate?: number;
  brightness?: number;
  contrast?: number;
}

// Platform Types
export interface Platform {
  id?: number;
  name: string;
  display_name: string;
  is_enabled: boolean;
  auth_type: 'oauth' | 'credentials' | 'playwright';
  auth_data?: string; // Encrypted JSON
  automation_type: 'api' | 'playwright';
  rate_limits?: RateLimits;
  image_requirements?: ImageRequirements;
  required_fields?: string[];
  config?: Record<string, any>;
  last_sync?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RateLimits {
  daily_posts: number;
  interval_minutes: number;
}

export interface ImageRequirements {
  max_count: number;
  max_size_mb: number;
  formats: string[];
  dimensions?: {
    max_width: number;
    max_height: number;
    min_width?: number;
    min_height?: number;
  };
}

// Listing Types
export interface Listing {
  id?: number;
  item_id: number;
  platform_id: number;
  external_id?: string;
  external_url?: string;
  status: 'draft' | 'scheduled' | 'posting' | 'active' | 'sold' | 'expired' | 'failed' | 'deleted';
  title: string;
  description?: string;
  price: number;
  scheduled_for?: string;
  posted_at?: string;
  expires_at?: string;
  error_message?: string;
  retry_count: number;
  view_count: number;
  like_count: number;
  message_count: number;
  platform_specific_data?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

// Analytics Types
export interface AnalyticsEvent {
  id?: number;
  listing_id: number;
  event_type: string;
  event_data?: Record<string, any>;
  recorded_at?: string;
}

// Template Types
export interface Template {
  id?: number;
  name: string;
  category: string;
  default_values: Record<string, any>;
  custom_fields?: Record<string, any>;
  description?: string;
  use_count: number;
  created_at?: string;
  updated_at?: string;
}

// Scheduled Job Types
export interface ScheduledJob {
  id?: number;
  job_id: string;
  job_type: string;
  listing_id?: number;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled';
  scheduled_for: string;
  started_at?: string;
  completed_at?: string;
  error?: string;
  attempts: number;
  created_at?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

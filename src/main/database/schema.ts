import Database from 'better-sqlite3';

export const createSchema = (db: Database.Database): void => {
  // Items Table: Core item data
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      condition TEXT CHECK(condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
      price REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      quantity INTEGER DEFAULT 1,
      cost REAL,
      sku TEXT UNIQUE,
      brand TEXT,
      size TEXT,
      color TEXT,
      weight REAL,
      dimensions TEXT,
      tags TEXT,
      custom_fields TEXT,
      template_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
    CREATE INDEX IF NOT EXISTS idx_items_template ON items(template_id);
  `);

  // Images Table: Photo management
  db.exec(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      original_path TEXT NOT NULL,
      processed_path TEXT,
      file_name TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      width INTEGER,
      height INTEGER,
      display_order INTEGER DEFAULT 0,
      is_primary BOOLEAN DEFAULT FALSE,
      processing_status TEXT CHECK(processing_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
      processing_options TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_images_item ON images(item_id);
  `);

  // Platforms Table: Platform configurations
  db.exec(`
    CREATE TABLE IF NOT EXISTS platforms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      is_enabled BOOLEAN DEFAULT TRUE,
      auth_type TEXT CHECK(auth_type IN ('oauth', 'credentials', 'playwright')),
      auth_data TEXT,
      automation_type TEXT CHECK(automation_type IN ('api', 'playwright')),
      rate_limits TEXT,
      image_requirements TEXT,
      required_fields TEXT,
      config TEXT,
      last_sync DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Listings Table: Posted items across platforms
  db.exec(`
    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      platform_id INTEGER NOT NULL,
      external_id TEXT,
      external_url TEXT,
      status TEXT CHECK(status IN ('draft', 'scheduled', 'posting', 'active', 'sold', 'expired', 'failed', 'deleted')) DEFAULT 'draft',
      title TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      scheduled_for DATETIME,
      posted_at DATETIME,
      expires_at DATETIME,
      error_message TEXT,
      retry_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      message_count INTEGER DEFAULT 0,
      platform_specific_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
      FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE,
      UNIQUE(item_id, platform_id)
    );

    CREATE INDEX IF NOT EXISTS idx_listings_item ON listings(item_id);
    CREATE INDEX IF NOT EXISTS idx_listings_platform ON listings(platform_id);
    CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
    CREATE INDEX IF NOT EXISTS idx_listings_scheduled ON listings(scheduled_for);
  `);

  // Analytics Events Table: Track engagement
  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      event_data TEXT,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_analytics_listing ON analytics_events(listing_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
  `);

  // Templates Table: Reusable item configurations
  db.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      default_values TEXT NOT NULL,
      custom_fields TEXT,
      description TEXT,
      use_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Scheduled Jobs Table: BullMQ job tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS scheduled_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id TEXT UNIQUE NOT NULL,
      job_type TEXT NOT NULL,
      listing_id INTEGER,
      status TEXT CHECK(status IN ('pending', 'active', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
      scheduled_for DATETIME NOT NULL,
      started_at DATETIME,
      completed_at DATETIME,
      error TEXT,
      attempts INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_status ON scheduled_jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_scheduled ON scheduled_jobs(scheduled_for);
  `);

  // Insert default platforms
  insertDefaultPlatforms(db);
};

const insertDefaultPlatforms = (db: Database.Database): void => {
  const checkPlatform = db.prepare('SELECT COUNT(*) as count FROM platforms WHERE name = ?');
  const insertPlatform = db.prepare(`
    INSERT INTO platforms (name, display_name, auth_type, automation_type, rate_limits, image_requirements, required_fields, config)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const platforms = [
    {
      name: 'facebook_marketplace',
      display_name: 'Facebook Marketplace',
      auth_type: 'playwright',
      automation_type: 'playwright',
      rate_limits: JSON.stringify({ daily_posts: 50, interval_minutes: 5 }),
      image_requirements: JSON.stringify({ max_count: 10, max_size_mb: 5, formats: ['jpg', 'png'], dimensions: { max_width: 1200, max_height: 1200 } }),
      required_fields: JSON.stringify(['title', 'price', 'category', 'location', 'description']),
      config: JSON.stringify({ base_url: 'https://www.facebook.com/marketplace' })
    }
  ];

  for (const platform of platforms) {
    const result = checkPlatform.get(platform.name) as { count: number };
    if (result.count === 0) {
      insertPlatform.run(
        platform.name,
        platform.display_name,
        platform.auth_type,
        platform.automation_type,
        platform.rate_limits,
        platform.image_requirements,
        platform.required_fields,
        platform.config
      );
    }
  }
};

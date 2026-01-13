import Database from 'better-sqlite3';
import { Listing } from '../../../shared/types';

export class ListingsRepository {
  constructor(private db: Database.Database) {}

  create(listing: Omit<Listing, 'id' | 'created_at' | 'updated_at'>): Listing {
    const stmt = this.db.prepare(`
      INSERT INTO listings (
        item_id, platform_id, external_id, external_url, status, title, description,
        price, scheduled_for, posted_at, expires_at, error_message, retry_count,
        view_count, like_count, message_count, platform_specific_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      listing.item_id,
      listing.platform_id,
      listing.external_id || null,
      listing.external_url || null,
      listing.status || 'draft',
      listing.title,
      listing.description || null,
      listing.price,
      listing.scheduled_for || null,
      listing.posted_at || null,
      listing.expires_at || null,
      listing.error_message || null,
      listing.retry_count || 0,
      listing.view_count || 0,
      listing.like_count || 0,
      listing.message_count || 0,
      listing.platform_specific_data ? JSON.stringify(listing.platform_specific_data) : null
    );

    return this.findById(info.lastInsertRowid as number)!;
  }

  findById(id: number): Listing | undefined {
    const stmt = this.db.prepare('SELECT * FROM listings WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.mapRowToListing(row) : undefined;
  }

  findByItemId(itemId: number): Listing[] {
    const stmt = this.db.prepare('SELECT * FROM listings WHERE item_id = ? ORDER BY created_at DESC');
    const rows = stmt.all(itemId) as any[];
    return rows.map(row => this.mapRowToListing(row));
  }

  findByPlatformId(platformId: number): Listing[] {
    const stmt = this.db.prepare('SELECT * FROM listings WHERE platform_id = ? ORDER BY created_at DESC');
    const rows = stmt.all(platformId) as any[];
    return rows.map(row => this.mapRowToListing(row));
  }

  findByStatus(status: Listing['status']): Listing[] {
    const stmt = this.db.prepare('SELECT * FROM listings WHERE status = ? ORDER BY created_at DESC');
    const rows = stmt.all(status) as any[];
    return rows.map(row => this.mapRowToListing(row));
  }

  findScheduled(beforeDate?: Date): Listing[] {
    const query = beforeDate
      ? 'SELECT * FROM listings WHERE status = ? AND scheduled_for <= ? ORDER BY scheduled_for ASC'
      : 'SELECT * FROM listings WHERE status = ? ORDER BY scheduled_for ASC';

    const stmt = this.db.prepare(query);
    const params = beforeDate ? ['scheduled', beforeDate.toISOString()] : ['scheduled'];
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.mapRowToListing(row));
  }

  findAll(filters?: { status?: string; platformId?: number; itemId?: number }): Listing[] {
    let query = 'SELECT * FROM listings WHERE 1=1';
    const params: any[] = [];

    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters?.platformId) {
      query += ' AND platform_id = ?';
      params.push(filters.platformId);
    }

    if (filters?.itemId) {
      query += ' AND item_id = ?';
      params.push(filters.itemId);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.mapRowToListing(row));
  }

  update(id: number, updates: Partial<Omit<Listing, 'id' | 'item_id' | 'platform_id' | 'created_at'>>): Listing | undefined {
    const fields: string[] = [];
    const values: any[] = [];

    const allowedFields = [
      'external_id', 'external_url', 'status', 'title', 'description', 'price',
      'scheduled_for', 'posted_at', 'expires_at', 'error_message', 'retry_count',
      'view_count', 'like_count', 'message_count', 'platform_specific_data'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = ?`);

        if (key === 'platform_specific_data') {
          values.push(value ? JSON.stringify(value) : null);
        } else {
          values.push(value);
        }
      }
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE listings SET ${fields.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);
    return this.findById(id);
  }

  incrementRetryCount(id: number): boolean {
    const stmt = this.db.prepare('UPDATE listings SET retry_count = retry_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  updateAnalytics(id: number, analytics: { views?: number; likes?: number; messages?: number }): boolean {
    const fields: string[] = [];
    const values: any[] = [];

    if (analytics.views !== undefined) {
      fields.push('view_count = ?');
      values.push(analytics.views);
    }

    if (analytics.likes !== undefined) {
      fields.push('like_count = ?');
      values.push(analytics.likes);
    }

    if (analytics.messages !== undefined) {
      fields.push('message_count = ?');
      values.push(analytics.messages);
    }

    if (fields.length === 0) {
      return false;
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE listings SET ${fields.join(', ')} WHERE id = ?
    `);

    const info = stmt.run(...values);
    return info.changes > 0;
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM listings WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  count(filters?: { status?: string; platformId?: number }): number {
    let query = 'SELECT COUNT(*) as count FROM listings WHERE 1=1';
    const params: any[] = [];

    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters?.platformId) {
      query += ' AND platform_id = ?';
      params.push(filters.platformId);
    }

    const stmt = this.db.prepare(query);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }

  private mapRowToListing(row: any): Listing {
    return {
      id: row.id,
      item_id: row.item_id,
      platform_id: row.platform_id,
      external_id: row.external_id,
      external_url: row.external_url,
      status: row.status,
      title: row.title,
      description: row.description,
      price: row.price,
      scheduled_for: row.scheduled_for,
      posted_at: row.posted_at,
      expires_at: row.expires_at,
      error_message: row.error_message,
      retry_count: row.retry_count,
      view_count: row.view_count,
      like_count: row.like_count,
      message_count: row.message_count,
      platform_specific_data: row.platform_specific_data ? JSON.parse(row.platform_specific_data) : undefined,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}

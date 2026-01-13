import Database from 'better-sqlite3';
import { AnalyticsEvent } from '../../../shared/types';

export class AnalyticsRepository {
  constructor(private db: Database.Database) {}

  create(event: Omit<AnalyticsEvent, 'id' | 'recorded_at'>): AnalyticsEvent {
    const stmt = this.db.prepare(`
      INSERT INTO analytics_events (listing_id, event_type, event_data)
      VALUES (?, ?, ?)
    `);

    const info = stmt.run(
      event.listing_id,
      event.event_type,
      event.event_data ? JSON.stringify(event.event_data) : null
    );

    return this.findById(info.lastInsertRowid as number)!;
  }

  findById(id: number): AnalyticsEvent | undefined {
    const stmt = this.db.prepare('SELECT * FROM analytics_events WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.mapRowToEvent(row) : undefined;
  }

  findByListingId(listingId: number, eventType?: string): AnalyticsEvent[] {
    const query = eventType
      ? 'SELECT * FROM analytics_events WHERE listing_id = ? AND event_type = ? ORDER BY recorded_at DESC'
      : 'SELECT * FROM analytics_events WHERE listing_id = ? ORDER BY recorded_at DESC';

    const stmt = this.db.prepare(query);
    const params = eventType ? [listingId, eventType] : [listingId];
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.mapRowToEvent(row));
  }

  findByEventType(eventType: string, limit?: number): AnalyticsEvent[] {
    const query = limit
      ? 'SELECT * FROM analytics_events WHERE event_type = ? ORDER BY recorded_at DESC LIMIT ?'
      : 'SELECT * FROM analytics_events WHERE event_type = ? ORDER BY recorded_at DESC';

    const stmt = this.db.prepare(query);
    const params = limit ? [eventType, limit] : [eventType];
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.mapRowToEvent(row));
  }

  findInDateRange(startDate: Date, endDate: Date, eventType?: string): AnalyticsEvent[] {
    const query = eventType
      ? 'SELECT * FROM analytics_events WHERE recorded_at BETWEEN ? AND ? AND event_type = ? ORDER BY recorded_at DESC'
      : 'SELECT * FROM analytics_events WHERE recorded_at BETWEEN ? AND ? ORDER BY recorded_at DESC';

    const stmt = this.db.prepare(query);
    const params = eventType
      ? [startDate.toISOString(), endDate.toISOString(), eventType]
      : [startDate.toISOString(), endDate.toISOString()];

    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.mapRowToEvent(row));
  }

  countByEventType(listingId: number, eventType: string): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM analytics_events WHERE listing_id = ? AND event_type = ?');
    const result = stmt.get(listingId, eventType) as { count: number };
    return result.count;
  }

  getEventTypeSummary(listingId: number): Record<string, number> {
    const stmt = this.db.prepare(`
      SELECT event_type, COUNT(*) as count
      FROM analytics_events
      WHERE listing_id = ?
      GROUP BY event_type
    `);

    const rows = stmt.all(listingId) as Array<{ event_type: string; count: number }>;
    const summary: Record<string, number> = {};

    for (const row of rows) {
      summary[row.event_type] = row.count;
    }

    return summary;
  }

  getLatestEvent(listingId: number, eventType?: string): AnalyticsEvent | undefined {
    const query = eventType
      ? 'SELECT * FROM analytics_events WHERE listing_id = ? AND event_type = ? ORDER BY recorded_at DESC LIMIT 1'
      : 'SELECT * FROM analytics_events WHERE listing_id = ? ORDER BY recorded_at DESC LIMIT 1';

    const stmt = this.db.prepare(query);
    const params = eventType ? [listingId, eventType] : [listingId];
    const row = stmt.get(...params) as any;
    return row ? this.mapRowToEvent(row) : undefined;
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM analytics_events WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  deleteByListingId(listingId: number): number {
    const stmt = this.db.prepare('DELETE FROM analytics_events WHERE listing_id = ?');
    const info = stmt.run(listingId);
    return info.changes;
  }

  deleteOlderThan(days: number): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const stmt = this.db.prepare('DELETE FROM analytics_events WHERE recorded_at < ?');
    const info = stmt.run(cutoffDate.toISOString());
    return info.changes;
  }

  private mapRowToEvent(row: any): AnalyticsEvent {
    return {
      id: row.id,
      listing_id: row.listing_id,
      event_type: row.event_type,
      event_data: row.event_data ? JSON.parse(row.event_data) : undefined,
      recorded_at: row.recorded_at
    };
  }
}

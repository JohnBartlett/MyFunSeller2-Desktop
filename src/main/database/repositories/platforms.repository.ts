import Database from 'better-sqlite3';
import { Platform } from '../../../shared/types';

export class PlatformsRepository {
  constructor(private db: Database.Database) {}

  create(platform: Omit<Platform, 'id' | 'created_at' | 'updated_at'>): Platform {
    const stmt = this.db.prepare(`
      INSERT INTO platforms (
        name, display_name, is_enabled, auth_type, auth_data, automation_type,
        rate_limits, image_requirements, required_fields, config, last_sync
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      platform.name,
      platform.display_name,
      platform.is_enabled ? 1 : 0,
      platform.auth_type,
      platform.auth_data || null,
      platform.automation_type,
      platform.rate_limits ? JSON.stringify(platform.rate_limits) : null,
      platform.image_requirements ? JSON.stringify(platform.image_requirements) : null,
      platform.required_fields ? JSON.stringify(platform.required_fields) : null,
      platform.config ? JSON.stringify(platform.config) : null,
      platform.last_sync || null
    );

    return this.findById(info.lastInsertRowid as number)!;
  }

  findById(id: number): Platform | undefined {
    const stmt = this.db.prepare('SELECT * FROM platforms WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.mapRowToPlatform(row) : undefined;
  }

  findByName(name: string): Platform | undefined {
    const stmt = this.db.prepare('SELECT * FROM platforms WHERE name = ?');
    const row = stmt.get(name) as any;
    return row ? this.mapRowToPlatform(row) : undefined;
  }

  findAll(enabledOnly: boolean = false): Platform[] {
    const query = enabledOnly
      ? 'SELECT * FROM platforms WHERE is_enabled = 1 ORDER BY display_name'
      : 'SELECT * FROM platforms ORDER BY display_name';

    const stmt = this.db.prepare(query);
    const rows = stmt.all() as any[];
    return rows.map(row => this.mapRowToPlatform(row));
  }

  update(id: number, updates: Partial<Omit<Platform, 'id' | 'created_at'>>): Platform | undefined {
    const fields: string[] = [];
    const values: any[] = [];

    const allowedFields = [
      'name', 'display_name', 'is_enabled', 'auth_type', 'auth_data', 'automation_type',
      'rate_limits', 'image_requirements', 'required_fields', 'config', 'last_sync'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = ?`);

        if (key === 'is_enabled') {
          values.push(value ? 1 : 0);
        } else if (['rate_limits', 'image_requirements', 'required_fields', 'config'].includes(key)) {
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
      UPDATE platforms SET ${fields.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);
    return this.findById(id);
  }

  updateAuthData(id: number, authData: string): boolean {
    const stmt = this.db.prepare('UPDATE platforms SET auth_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const info = stmt.run(authData, id);
    return info.changes > 0;
  }

  updateLastSync(id: number, syncTime?: Date): boolean {
    const stmt = this.db.prepare('UPDATE platforms SET last_sync = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const info = stmt.run((syncTime || new Date()).toISOString(), id);
    return info.changes > 0;
  }

  toggleEnabled(id: number): boolean {
    const stmt = this.db.prepare('UPDATE platforms SET is_enabled = NOT is_enabled, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM platforms WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  private mapRowToPlatform(row: any): Platform {
    return {
      id: row.id,
      name: row.name,
      display_name: row.display_name,
      is_enabled: Boolean(row.is_enabled),
      auth_type: row.auth_type,
      auth_data: row.auth_data,
      automation_type: row.automation_type,
      rate_limits: row.rate_limits ? JSON.parse(row.rate_limits) : undefined,
      image_requirements: row.image_requirements ? JSON.parse(row.image_requirements) : undefined,
      required_fields: row.required_fields ? JSON.parse(row.required_fields) : undefined,
      config: row.config ? JSON.parse(row.config) : undefined,
      last_sync: row.last_sync,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}

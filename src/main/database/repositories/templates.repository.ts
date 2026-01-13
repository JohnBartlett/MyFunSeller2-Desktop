import Database from 'better-sqlite3';
import { Template } from '../../../shared/types';

export class TemplatesRepository {
  constructor(private db: Database.Database) {}

  create(template: Omit<Template, 'id' | 'use_count' | 'created_at' | 'updated_at'>): Template {
    const stmt = this.db.prepare(`
      INSERT INTO templates (name, category, default_values, custom_fields, description)
      VALUES (?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      template.name,
      template.category,
      JSON.stringify(template.default_values),
      template.custom_fields ? JSON.stringify(template.custom_fields) : null,
      template.description || null
    );

    return this.findById(info.lastInsertRowid as number)!;
  }

  findById(id: number): Template | undefined {
    const stmt = this.db.prepare('SELECT * FROM templates WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.mapRowToTemplate(row) : undefined;
  }

  findByName(name: string): Template | undefined {
    const stmt = this.db.prepare('SELECT * FROM templates WHERE name = ?');
    const row = stmt.get(name) as any;
    return row ? this.mapRowToTemplate(row) : undefined;
  }

  findByCategory(category: string): Template[] {
    const stmt = this.db.prepare('SELECT * FROM templates WHERE category = ? ORDER BY use_count DESC, name');
    const rows = stmt.all(category) as any[];
    return rows.map(row => this.mapRowToTemplate(row));
  }

  findAll(): Template[] {
    const stmt = this.db.prepare('SELECT * FROM templates ORDER BY use_count DESC, name');
    const rows = stmt.all() as any[];
    return rows.map(row => this.mapRowToTemplate(row));
  }

  getMostUsed(limit: number = 10): Template[] {
    const stmt = this.db.prepare('SELECT * FROM templates ORDER BY use_count DESC, name LIMIT ?');
    const rows = stmt.all(limit) as any[];
    return rows.map(row => this.mapRowToTemplate(row));
  }

  update(id: number, updates: Partial<Omit<Template, 'id' | 'use_count' | 'created_at'>>): Template | undefined {
    const fields: string[] = [];
    const values: any[] = [];

    const allowedFields = ['name', 'category', 'default_values', 'custom_fields', 'description'];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = ?`);

        if (key === 'default_values' || key === 'custom_fields') {
          values.push(JSON.stringify(value));
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
      UPDATE templates SET ${fields.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);
    return this.findById(id);
  }

  incrementUseCount(id: number): boolean {
    const stmt = this.db.prepare('UPDATE templates SET use_count = use_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM templates WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  count(category?: string): number {
    const query = category
      ? 'SELECT COUNT(*) as count FROM templates WHERE category = ?'
      : 'SELECT COUNT(*) as count FROM templates';

    const stmt = this.db.prepare(query);
    const result = category ? stmt.get(category) : stmt.get();
    return (result as { count: number }).count;
  }

  private mapRowToTemplate(row: any): Template {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      default_values: JSON.parse(row.default_values),
      custom_fields: row.custom_fields ? JSON.parse(row.custom_fields) : undefined,
      description: row.description,
      use_count: row.use_count,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}

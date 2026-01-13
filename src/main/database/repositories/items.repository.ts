import Database from 'better-sqlite3';
import { Item } from '../../../shared/types';

export class ItemsRepository {
  constructor(private db: Database.Database) {}

  create(item: Omit<Item, 'id' | 'created_at' | 'updated_at'>): Item {
    const stmt = this.db.prepare(`
      INSERT INTO items (
        title, description, category, condition, price, currency, quantity,
        cost, sku, brand, size, color, weight, dimensions, tags, custom_fields, template_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      item.title,
      item.description || null,
      item.category,
      item.condition,
      item.price,
      item.currency || 'USD',
      item.quantity || 1,
      item.cost || null,
      item.sku || null,
      item.brand || null,
      item.size || null,
      item.color || null,
      item.weight || null,
      item.dimensions ? JSON.stringify(item.dimensions) : null,
      item.tags ? JSON.stringify(item.tags) : null,
      item.custom_fields ? JSON.stringify(item.custom_fields) : null,
      item.template_id || null
    );

    return this.findById(info.lastInsertRowid as number)!;
  }

  findById(id: number): Item | undefined {
    const stmt = this.db.prepare('SELECT * FROM items WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.mapRowToItem(row) : undefined;
  }

  findAll(filters?: { category?: string; condition?: string; search?: string }): Item[] {
    let query = 'SELECT * FROM items WHERE 1=1';
    const params: any[] = [];

    if (filters?.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters?.condition) {
      query += ' AND condition = ?';
      params.push(filters.condition);
    }

    if (filters?.search) {
      query += ' AND (title LIKE ? OR description LIKE ? OR sku LIKE ?)';
      const searchParam = `%${filters.search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.mapRowToItem(row));
  }

  update(id: number, updates: Partial<Omit<Item, 'id' | 'created_at'>>): Item | undefined {
    const fields: string[] = [];
    const values: any[] = [];

    const allowedFields = [
      'title', 'description', 'category', 'condition', 'price', 'currency',
      'quantity', 'cost', 'sku', 'brand', 'size', 'color', 'weight',
      'dimensions', 'tags', 'custom_fields', 'template_id'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = ?`);

        if (key === 'dimensions' || key === 'tags' || key === 'custom_fields') {
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
      UPDATE items SET ${fields.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);
    return this.findById(id);
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM items WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  count(filters?: { category?: string; condition?: string }): number {
    let query = 'SELECT COUNT(*) as count FROM items WHERE 1=1';
    const params: any[] = [];

    if (filters?.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters?.condition) {
      query += ' AND condition = ?';
      params.push(filters.condition);
    }

    const stmt = this.db.prepare(query);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }

  private mapRowToItem(row: any): Item {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      condition: row.condition,
      price: row.price,
      currency: row.currency,
      quantity: row.quantity,
      cost: row.cost,
      sku: row.sku,
      brand: row.brand,
      size: row.size,
      color: row.color,
      weight: row.weight,
      dimensions: row.dimensions ? JSON.parse(row.dimensions) : undefined,
      tags: row.tags ? JSON.parse(row.tags) : undefined,
      custom_fields: row.custom_fields ? JSON.parse(row.custom_fields) : undefined,
      template_id: row.template_id,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}

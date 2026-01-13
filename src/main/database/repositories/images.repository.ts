import Database from 'better-sqlite3';
import { Image } from '../../../shared/types';

export class ImagesRepository {
  constructor(private db: Database.Database) {}

  create(image: Omit<Image, 'id' | 'created_at'>): Image {
    const stmt = this.db.prepare(`
      INSERT INTO images (
        item_id, original_path, processed_path, file_name, file_size, mime_type,
        width, height, display_order, is_primary, processing_status, processing_options
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      image.item_id,
      image.original_path,
      image.processed_path || null,
      image.file_name,
      image.file_size || null,
      image.mime_type || null,
      image.width || null,
      image.height || null,
      image.display_order || 0,
      image.is_primary ? 1 : 0,
      image.processing_status || 'pending',
      image.processing_options ? JSON.stringify(image.processing_options) : null
    );

    return this.findById(info.lastInsertRowid as number)!;
  }

  findById(id: number): Image | undefined {
    const stmt = this.db.prepare('SELECT * FROM images WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.mapRowToImage(row) : undefined;
  }

  findByItemId(itemId: number): Image[] {
    const stmt = this.db.prepare('SELECT * FROM images WHERE item_id = ? ORDER BY display_order, id');
    const rows = stmt.all(itemId) as any[];
    return rows.map(row => this.mapRowToImage(row));
  }

  getPrimaryImage(itemId: number): Image | undefined {
    const stmt = this.db.prepare('SELECT * FROM images WHERE item_id = ? AND is_primary = 1 LIMIT 1');
    const row = stmt.get(itemId) as any;
    return row ? this.mapRowToImage(row) : undefined;
  }

  update(id: number, updates: Partial<Omit<Image, 'id' | 'item_id' | 'created_at'>>): Image | undefined {
    const fields: string[] = [];
    const values: any[] = [];

    const allowedFields = [
      'original_path', 'processed_path', 'file_name', 'file_size', 'mime_type',
      'width', 'height', 'display_order', 'is_primary', 'processing_status', 'processing_options'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = ?`);

        if (key === 'is_primary') {
          values.push(value ? 1 : 0);
        } else if (key === 'processing_options') {
          values.push(value ? JSON.stringify(value) : null);
        } else {
          values.push(value);
        }
      }
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE images SET ${fields.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);
    return this.findById(id);
  }

  setPrimaryImage(itemId: number, imageId: number): boolean {
    const transaction = this.db.transaction(() => {
      // Unset all primary images for this item
      this.db.prepare('UPDATE images SET is_primary = 0 WHERE item_id = ?').run(itemId);

      // Set the specified image as primary
      const info = this.db.prepare('UPDATE images SET is_primary = 1 WHERE id = ? AND item_id = ?').run(imageId, itemId);

      return info.changes > 0;
    });

    return transaction();
  }

  reorderImages(itemId: number, imageIds: number[]): boolean {
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare('UPDATE images SET display_order = ? WHERE id = ? AND item_id = ?');

      for (let i = 0; i < imageIds.length; i++) {
        stmt.run(i, imageIds[i], itemId);
      }
    });

    transaction();
    return true;
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM images WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  deleteByItemId(itemId: number): number {
    const stmt = this.db.prepare('DELETE FROM images WHERE item_id = ?');
    const info = stmt.run(itemId);
    return info.changes;
  }

  private mapRowToImage(row: any): Image {
    return {
      id: row.id,
      item_id: row.item_id,
      original_path: row.original_path,
      processed_path: row.processed_path,
      file_name: row.file_name,
      file_size: row.file_size,
      mime_type: row.mime_type,
      width: row.width,
      height: row.height,
      display_order: row.display_order,
      is_primary: Boolean(row.is_primary),
      processing_status: row.processing_status,
      processing_options: row.processing_options ? JSON.parse(row.processing_options) : undefined,
      created_at: row.created_at
    };
  }
}

import { supabase } from '../lib/supabase/client';
import type { Database } from '../lib/supabase/types';

type TableName = keyof Database['public']['Tables'];

export interface ListOptions {
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  page?: number;
  pageSize?: number;
  search?: { column: string; query: string };
}

export interface ListResult<T> {
  data: T[];
  count: number | null;
}

export class BaseService<T extends TableName> {
  constructor(protected tableName: T) {}

  // Types for this table
  protected get table() {
    return supabase.from(this.tableName);
  }

  async getById(id: string) {
    const { data, error } = await this.table.select('*').eq('id' as any, id).single();
    if (error) throw error;
    return data;
  }

  async list(options: ListOptions = {}): Promise<ListResult<any>> {
    let query = this.table.select('*', { count: 'exact' });
    if (options.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      }
    }
    if (options.search) {
      query = query.ilike(options.search.column, `%${options.search.query}%`);
    }
    if (options.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? false });
    }
    const pageSize = options.pageSize ?? 20;
    const page = options.page ?? 0;
    query = query.range(page * pageSize, (page + 1) * pageSize - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data ?? [], count };
  }

  async create(record: Database['public']['Tables'][T]['Insert']) {
    const { data, error } = await this.table.insert(record as any).select().single();
    if (error) throw error;
    return data;
  }

  async update(id: string, record: Database['public']['Tables'][T]['Update']) {
    const { data, error } = await this.table.update(record as any).eq('id' as any, id).select().single();
    if (error) throw error;
    return data;
  }

  async upsert(record: Database['public']['Tables'][T]['Insert'], conflictColumns?: string) {
    const { data, error } = await this.table
      .upsert(record as any, conflictColumns ? { onConflict: conflictColumns } : undefined)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async delete(id: string) {
    const { error } = await this.table.delete().eq('id' as any, id);
    if (error) throw error;
  }
}

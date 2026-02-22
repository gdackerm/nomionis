import { useCallback, useEffect, useState } from 'react';
import type { Database } from '../lib/supabase/types';
import type { BaseService } from '../services/base';

type TableName = keyof Database['public']['Tables'];

interface UseSupabaseQueryResult<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSupabaseQuery<T extends TableName>(
  service: BaseService<T>,
  id: string | undefined
): UseSupabaseQueryResult<Database['public']['Tables'][T]['Row']> {
  const [data, setData] = useState<Database['public']['Tables'][T]['Row'] | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!id) {
      setData(undefined);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await service.getById(id);
      setData(result as unknown as Database['public']['Tables'][T]['Row']);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [service, id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

interface UseSupabaseListResult<T> {
  data: T[];
  count: number | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSupabaseList<T extends TableName>(
  service: BaseService<T>,
  options?: {
    filters?: Record<string, unknown>;
    orderBy?: { column: string; ascending?: boolean };
    page?: number;
    pageSize?: number;
    search?: { column: string; query: string };
  }
): UseSupabaseListResult<Database['public']['Tables'][T]['Row']> {
  const [data, setData] = useState<Database['public']['Tables'][T]['Row'][]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const serializedOptions = JSON.stringify(options);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await service.list(options);
      setData(result.data as unknown as Database['public']['Tables'][T]['Row'][]);
      setCount(result.count);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, serializedOptions]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, count, loading, error, refetch: fetch };
}

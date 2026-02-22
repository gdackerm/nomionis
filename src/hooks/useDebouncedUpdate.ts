import { useDebouncedCallback } from '@mantine/hooks';
import type { Database } from '../lib/supabase/types';
import type { BaseService } from '../services/base';

type TableName = keyof Database['public']['Tables'];

export const DEFAULT_SAVE_TIMEOUT_MS = 500;

export function useDebouncedUpdate<T extends TableName>(
  service: BaseService<T>,
  timeoutMs: number = DEFAULT_SAVE_TIMEOUT_MS
): (id: string, payload: Database['public']['Tables'][T]['Update']) => void {
  const debouncedCallback = useDebouncedCallback(
    async (id: string, payload: Database['public']['Tables'][T]['Update']) => {
      await service.update(id, payload);
    },
    timeoutMs
  );

  return (id: string, payload: Database['public']['Tables'][T]['Update']) => {
    debouncedCallback(id, payload);
  };
}

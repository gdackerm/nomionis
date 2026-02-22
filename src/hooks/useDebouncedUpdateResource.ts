import { useDebouncedCallback } from '@mantine/hooks';
import type { Database } from '../lib/supabase/types';
import type { BaseService } from '../services/base';

type TableName = keyof Database['public']['Tables'];

export const DEFAULT_SAVE_TIMEOUT_MS = 500;

/**
 * Hook that provides a debounced update for any Supabase table.
 * Drop-in replacement for the old Medplum version.
 */
export function useDebouncedUpdateResource<T extends TableName>(
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

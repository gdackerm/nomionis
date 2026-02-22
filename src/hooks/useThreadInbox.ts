import { useState, useEffect, useCallback } from 'react';
import type { Tables } from '../lib/supabase/types';
import { communicationService } from '../services/communication.service';

type Communication = Tables<'communications'>;

export interface UseThreadInboxOptions {
  filters?: Record<string, unknown>;
  threadId: string | undefined;
}

export interface UseThreadInboxReturn {
  loading: boolean;
  error: Error | null;
  threadMessages: [Communication, Communication | undefined][];
  selectedThread: Communication | undefined;
  total: number | undefined;
  addThreadMessage: (message: Communication) => void;
  handleThreadStatusChange: (newStatus: string) => Promise<void>;
  refreshThreadMessages: () => Promise<void>;
}

export function useThreadInbox({ filters, threadId }: UseThreadInboxOptions): UseThreadInboxReturn {
  const [loading, setLoading] = useState(true);
  const [threadMessages, setThreadMessages] = useState<[Communication, Communication | undefined][]>([]);
  const [selectedThread, setSelectedThread] = useState<Communication | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState<number | undefined>(undefined);

  const fetchAllCommunications = useCallback(async (): Promise<void> => {
    try {
      const threads = await communicationService.getThreads(filters as any);
      // Build thread pairs: [parent, lastReply]
      const threadPairs: [Communication, Communication | undefined][] = threads.map(
        (thread: Communication) => [thread, undefined] as [Communication, Communication | undefined]
      );
      setThreadMessages(threadPairs);
      setTotal(threads.length);
    } catch (err) {
      setError(err as Error);
    }
  }, [filters]);

  useEffect(() => {
    setLoading(true);
    fetchAllCommunications()
      .catch((err: Error) => setError(err))
      .finally(() => setLoading(false));
  }, [fetchAllCommunications]);

  useEffect(() => {
    const fetchThread = async (): Promise<void> => {
      if (threadId) {
        const thread = threadMessages.find((t) => t[0].id === threadId);
        if (thread) {
          setSelectedThread(thread[0]);
        } else {
          try {
            const communication = await communicationService.getById(threadId);
            if (!communication.parent_id) {
              setSelectedThread(communication);
            } else {
              const parent = await communicationService.getById(communication.parent_id);
              setSelectedThread(parent);
            }
          } catch (err) {
            setError(err as Error);
          }
        }
      } else {
        setSelectedThread(undefined);
      }
    };

    fetchThread().catch((err) => setError(err as Error));
  }, [threadId, threadMessages]);

  const handleThreadStatusChange = async (newStatus: string): Promise<void> => {
    if (!selectedThread) return;
    try {
      const updated = await communicationService.update(selectedThread.id, { status: newStatus });
      setSelectedThread(updated);
      setThreadMessages((prev) =>
        prev.map(([parent, lastMsg]) =>
          parent.id === updated.id ? [updated, lastMsg] : [parent, lastMsg]
        )
      );
    } catch (err) {
      setError(err as Error);
    }
  };

  const addThreadMessage = (message: Communication): void => {
    setThreadMessages((prev) => [[message, undefined], ...prev]);
  };

  return {
    loading,
    error,
    threadMessages,
    selectedThread,
    total,
    addThreadMessage,
    handleThreadStatusChange,
    refreshThreadMessages: fetchAllCommunications,
  };
}

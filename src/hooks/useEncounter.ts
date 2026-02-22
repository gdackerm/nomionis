import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { encounterService } from '../services/encounter.service';
import type { Tables } from '../lib/supabase/types';

type Encounter = Tables<'encounters'>;

export function useEncounter(): Encounter | undefined {
  const { encounterId } = useParams();
  const [encounter, setEncounter] = useState<Encounter | undefined>();

  const fetch = useCallback(async () => {
    if (!encounterId) return;
    try {
      const result = await encounterService.getById(encounterId);
      setEncounter(result);
    } catch (err) {
      console.error('Failed to load encounter:', err);
    }
  }, [encounterId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return encounter;
}

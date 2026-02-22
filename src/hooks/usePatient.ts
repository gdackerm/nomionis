import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { patientService } from '../services/patient.service';
import type { Tables } from '../lib/supabase/types';

type Patient = Tables<'patients'>;

type Options = {
  ignoreMissingPatientId?: boolean;
};

export function usePatient(options?: Options): Patient | undefined {
  const { patientId } = useParams();
  const [patient, setPatient] = useState<Patient | undefined>();

  if (!patientId && !options?.ignoreMissingPatientId) {
    throw new Error('Patient ID not found');
  }

  const fetch = useCallback(async () => {
    if (!patientId) return;
    try {
      const result = await patientService.getById(patientId);
      setPatient(result);
    } catch (err) {
      console.error('Failed to load patient:', err);
    }
  }, [patientId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return patient;
}

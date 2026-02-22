import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { Tables } from '../lib/supabase/types';
import { chargeItemService } from '../services/charge-item.service';
import { claimService } from '../services/claim.service';
import { clinicalImpressionService } from '../services/clinical-impression.service';
import { taskService } from '../services/task.service';
import { appointmentService } from '../services/appointment.service';
import { supabase } from '../lib/supabase/client';

type Encounter = Tables<'encounters'>;
type Claim = Tables<'claims'>;
type Task = Tables<'tasks'>;
type ClinicalImpression = Tables<'clinical_impressions'>;
type ChargeItem = Tables<'charge_items'>;
type Appointment = Tables<'appointments'>;
type Practitioner = Tables<'practitioners'>;

export interface EncounterChartHook {
  encounter: Encounter | undefined;
  claim: Claim | undefined;
  practitioner: Practitioner | undefined;
  tasks: Task[];
  clinicalImpression: ClinicalImpression | undefined;
  chargeItems: ChargeItem[];
  appointment: Appointment | undefined;
  setEncounter: Dispatch<SetStateAction<Encounter | undefined>>;
  setClaim: Dispatch<SetStateAction<Claim | undefined>>;
  setPractitioner: Dispatch<SetStateAction<Practitioner | undefined>>;
  setTasks: Dispatch<SetStateAction<Task[]>>;
  setClinicalImpression: Dispatch<SetStateAction<ClinicalImpression | undefined>>;
  setChargeItems: Dispatch<SetStateAction<ChargeItem[]>>;
  setAppointment: Dispatch<SetStateAction<Appointment | undefined>>;
}

export function useEncounterChart(
  encounter: Encounter | undefined
): EncounterChartHook {
  const [encounterState, setEncounter] = useState<Encounter | undefined>(encounter);
  const [claim, setClaim] = useState<Claim | undefined>();
  const [practitioner, setPractitioner] = useState<Practitioner | undefined>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clinicalImpression, setClinicalImpression] = useState<ClinicalImpression | undefined>();
  const [chargeItems, setChargeItems] = useState<ChargeItem[]>([]);
  const [appointment, setAppointment] = useState<Appointment | undefined>();

  const enc = encounter ?? encounterState;
  const encounterId = enc?.id;

  // Fetch tasks for encounter
  const fetchTasks = useCallback(async () => {
    if (!encounterId) return;
    const result = await taskService.getByEncounter(encounterId);
    setTasks(result);
  }, [encounterId]);

  // Fetch clinical impression for encounter
  const fetchClinicalImpression = useCallback(async () => {
    if (!encounterId) return;
    const result = await clinicalImpressionService.list({
      filters: { encounter_id: encounterId },
    });
    setClinicalImpression(result.data[0]);
  }, [encounterId]);

  // Fetch charge items for encounter
  const fetchChargeItems = useCallback(async () => {
    if (!encounterId) return;
    const result = await chargeItemService.list({
      filters: { encounter_id: encounterId },
    });
    setChargeItems(result.data);
  }, [encounterId]);

  // Fetch claim for encounter
  const fetchClaim = useCallback(async () => {
    if (!encounterId) return;
    const result = await claimService.list({
      filters: { encounter_id: encounterId },
    });
    setClaim(result.data[0]);
  }, [encounterId]);

  // Fetch practitioner for encounter
  const fetchPractitioner = useCallback(async () => {
    if (!enc?.practitioner_id) return;
    const { data, error } = await supabase
      .from('practitioners')
      .select('*')
      .eq('id', enc.practitioner_id)
      .single();
    if (!error && data) {
      setPractitioner(data);
    }
  }, [enc?.practitioner_id]);

  // Fetch appointment for encounter
  const fetchAppointment = useCallback(async () => {
    if (!enc?.appointment_id) return;
    const result = await appointmentService.getById(enc.appointment_id);
    setAppointment(result);
  }, [enc?.appointment_id]);

  // Fetch all data when encounter changes
  useEffect(() => {
    if (enc) {
      fetchTasks().catch(console.error);
      fetchClinicalImpression().catch(console.error);
      fetchChargeItems().catch(console.error);
      fetchClaim().catch(console.error);
      fetchPractitioner().catch(console.error);
      fetchAppointment().catch(console.error);
    }
  }, [enc, fetchTasks, fetchClinicalImpression, fetchChargeItems, fetchClaim, fetchPractitioner, fetchAppointment]);

  return {
    encounter: enc,
    claim,
    practitioner,
    tasks,
    clinicalImpression,
    chargeItems,
    appointment,
    setEncounter,
    setClaim,
    setPractitioner,
    setTasks,
    setClinicalImpression,
    setChargeItems,
    setAppointment,
  };
}

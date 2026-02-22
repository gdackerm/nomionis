import type { Tables } from '../lib/supabase/types';
import { encounterService } from '../services/encounter.service';
import { appointmentService } from '../services/appointment.service';

type Encounter = Tables<'encounters'>;
type Appointment = Tables<'appointments'>;

export async function createEncounter(
  organizationId: string,
  patientId: string,
  practitionerId: string,
  start: Date,
  end: Date,
  classCode: string,
  planDefinitionId?: string
): Promise<Encounter> {
  const result = await encounterService.createEncounterWithWorkflow({
    organizationId,
    patientId,
    practitionerId,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    classCode,
    planDefinitionId,
  });
  return result.encounter;
}

export async function updateEncounterStatus(
  encounterId: string,
  appointmentId: string | undefined,
  newStatus: string
): Promise<Encounter> {
  return encounterService.updateStatus(encounterId, newStatus, appointmentId);
}

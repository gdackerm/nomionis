import { supabase } from '../lib/supabase/client';
import { BaseService } from './base';
import type { Database } from '../lib/supabase/types';

type EncounterRow = Database['public']['Tables']['encounters']['Row'];

interface CreateEncounterWithWorkflowParams {
  organizationId: string;
  patientId: string;
  practitionerId: string;
  startTime: string;
  endTime: string;
  classCode?: string;
  planDefinitionId?: string;
}

class EncounterService extends BaseService<'encounters'> {
  constructor() {
    super('encounters');
  }

  async getByPatientId(patientId: string) {
    const { data, error } = await this.table
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async createEncounterWithWorkflow(params: CreateEncounterWithWorkflowParams) {
    const {
      organizationId,
      patientId,
      practitionerId,
      startTime,
      endTime,
      classCode,
      planDefinitionId,
    } = params;

    // Step 1: Create appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        organization_id: organizationId,
        status: 'booked',
        start_time: startTime,
        end_time: endTime,
        patient_id: patientId,
        practitioner_id: practitionerId,
      })
      .select()
      .single();

    if (appointmentError) throw appointmentError;

    // Step 2: Create encounter
    const { data: encounter, error: encounterError } = await this.table
      .insert({
        organization_id: organizationId,
        patient_id: patientId,
        practitioner_id: practitionerId,
        appointment_id: appointment.id,
        status: 'planned',
        class_code: classCode ?? null,
        period_start: startTime,
        period_end: endTime,
      })
      .select()
      .single();

    if (encounterError) throw encounterError;

    // Step 3: Create clinical impression
    const { error: impressionError } = await supabase
      .from('clinical_impressions')
      .insert({
        organization_id: organizationId,
        patient_id: patientId,
        encounter_id: encounter.id,
        status: 'in-progress',
        description: 'Initial clinical impression',
      });

    if (impressionError) throw impressionError;

    // Step 4: If planDefinitionId provided, fetch and apply tasks/charge items
    if (planDefinitionId) {
      const { data: planDefinition } = await supabase
        .from('plan_definitions')
        .select('*')
        .eq('id', planDefinitionId)
        .single();

      if (planDefinition?.actions) {
        // Create tasks from plan definition actions
        const actions = planDefinition.actions as any[];
        for (const action of actions) {
          await supabase.from('tasks').insert({
            organization_id: organizationId,
            status: 'requested',
            intent: 'order',
            patient_id: patientId,
            encounter_id: encounter.id,
            owner_id: practitionerId,
            requester_id: practitionerId,
            description: action.title || action.description || null,
            authored_on: new Date().toISOString(),
          });
        }
      }

      // Create charge item from plan definition extensions if applicable
      if (planDefinition?.extensions) {
        const extensions = planDefinition.extensions as any[];
        const chargeExt = extensions.find(
          (ext: any) =>
            ext.url === 'http://medplum.com/fhir/StructureDefinition/applicable-charge-definition'
        );
        const billingExt = extensions.find(
          (ext: any) =>
            ext.url?.includes('ServiceBillingCode')
        );

        if (chargeExt && billingExt) {
          await supabase.from('charge_items').insert({
            organization_id: organizationId,
            patient_id: patientId,
            encounter_id: encounter.id,
            status: 'planned',
            code: billingExt.valueCodeableConcept ?? null,
            quantity: 1,
            definition_canonical: chargeExt.valueCanonical ?? null,
          });
        }
      }
    }

    return { appointment, encounter };
  }

  async updateStatus(id: string, newStatus: string, appointmentId?: string) {
    const updateData: Database['public']['Tables']['encounters']['Update'] = {
      status: newStatus,
    };

    // Set period timestamps based on status transitions
    if (newStatus === 'in-progress') {
      updateData.period_start = new Date().toISOString();
    } else if (newStatus === 'finished') {
      updateData.period_end = new Date().toISOString();
    }

    const { data: encounter, error } = await this.table
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update related appointment status if provided
    if (appointmentId) {
      let appointmentStatus: string;
      switch (newStatus) {
        case 'cancelled':
          appointmentStatus = 'cancelled';
          break;
        case 'finished':
          appointmentStatus = 'fulfilled';
          break;
        case 'in-progress':
          appointmentStatus = 'checked-in';
          break;
        case 'arrived':
          appointmentStatus = 'arrived';
          break;
        default:
          appointmentStatus = 'booked';
          break;
      }

      await supabase
        .from('appointments')
        .update({ status: appointmentStatus })
        .eq('id', appointmentId);
    }

    return encounter;
  }
}

export const encounterService = new EncounterService();

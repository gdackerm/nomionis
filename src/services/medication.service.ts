import { BaseService } from './base';

class MedicationService extends BaseService<'medication_requests'> {
  constructor() {
    super('medication_requests');
  }

  async getByPatientId(patientId: string) {
    const { data, error } = await this.table
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }
}

export const medicationService = new MedicationService();

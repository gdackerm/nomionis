import { BaseService } from './base';

class ObservationService extends BaseService<'observations'> {
  constructor() {
    super('observations');
  }

  async getByPatientId(patientId: string) {
    const { data, error } = await this.table
      .select('*')
      .eq('patient_id', patientId)
      .order('effective_date', { ascending: false });
    if (error) throw error;
    return data;
  }
}

export const observationService = new ObservationService();

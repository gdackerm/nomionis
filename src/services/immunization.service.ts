import { BaseService } from './base';

class ImmunizationService extends BaseService<'immunizations'> {
  constructor() {
    super('immunizations');
  }

  async getByPatientId(patientId: string) {
    const { data, error } = await this.table
      .select('*')
      .eq('patient_id', patientId)
      .order('occurrence_date', { ascending: false });
    if (error) throw error;
    return data;
  }
}

export const immunizationService = new ImmunizationService();

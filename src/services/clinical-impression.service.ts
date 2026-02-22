import { BaseService } from './base';

class ClinicalImpressionService extends BaseService<'clinical_impressions'> {
  constructor() {
    super('clinical_impressions');
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

export const clinicalImpressionService = new ClinicalImpressionService();

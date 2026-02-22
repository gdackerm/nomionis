import { BaseService } from './base';

class RelatedPersonService extends BaseService<'related_persons'> {
  constructor() {
    super('related_persons');
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

export const relatedPersonService = new RelatedPersonService();

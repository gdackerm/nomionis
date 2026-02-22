import { BaseService } from './base';

class AllergyService extends BaseService<'allergy_intolerances'> {
  constructor() {
    super('allergy_intolerances');
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

export const allergyService = new AllergyService();

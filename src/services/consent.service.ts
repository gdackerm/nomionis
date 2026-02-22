import { BaseService } from './base';

class ConsentService extends BaseService<'consents'> {
  constructor() {
    super('consents');
  }

  async getByPatientId(patientId: string) {
    const { data, error } = await this.table
      .select('*')
      .eq('patient_id', patientId)
      .order('consent_date', { ascending: false });
    if (error) throw error;
    return data;
  }
}

export const consentService = new ConsentService();

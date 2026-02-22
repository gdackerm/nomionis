import { BaseService } from './base';

class ClaimService extends BaseService<'claims'> {
  constructor() {
    super('claims');
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

export const claimService = new ClaimService();

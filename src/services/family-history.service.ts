import { BaseService } from './base';

class FamilyHistoryService extends BaseService<'family_member_histories'> {
  constructor() {
    super('family_member_histories');
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

export const familyHistoryService = new FamilyHistoryService();

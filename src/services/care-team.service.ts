import { BaseService } from './base';

class CareTeamService extends BaseService<'care_teams'> {
  constructor() {
    super('care_teams');
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

export const careTeamService = new CareTeamService();

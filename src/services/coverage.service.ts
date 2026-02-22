import { BaseService } from './base';

class CoverageService extends BaseService<'coverages'> {
  constructor() {
    super('coverages');
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

export const coverageService = new CoverageService();

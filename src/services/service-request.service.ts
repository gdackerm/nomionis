import { BaseService } from './base';

class ServiceRequestService extends BaseService<'service_requests'> {
  constructor() {
    super('service_requests');
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

export const serviceRequestService = new ServiceRequestService();

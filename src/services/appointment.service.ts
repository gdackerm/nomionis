import { BaseService } from './base';

class AppointmentService extends BaseService<'appointments'> {
  constructor() {
    super('appointments');
  }

  async getByPatientId(patientId: string) {
    const { data, error } = await this.table
      .select('*')
      .eq('patient_id', patientId)
      .order('start_time', { ascending: false });
    if (error) throw error;
    return data;
  }
}

export const appointmentService = new AppointmentService();

import { BaseService } from './base';

class ChargeItemService extends BaseService<'charge_items'> {
  constructor() {
    super('charge_items');
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

export const chargeItemService = new ChargeItemService();

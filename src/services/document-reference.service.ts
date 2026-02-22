import { BaseService } from './base';

class DocumentReferenceService extends BaseService<'document_references'> {
  constructor() {
    super('document_references');
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

export const documentReferenceService = new DocumentReferenceService();

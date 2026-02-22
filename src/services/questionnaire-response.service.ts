import { BaseService } from './base';

class QuestionnaireResponseService extends BaseService<'questionnaire_responses'> {
  constructor() {
    super('questionnaire_responses');
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

export const questionnaireResponseService = new QuestionnaireResponseService();

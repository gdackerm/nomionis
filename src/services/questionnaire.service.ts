import { BaseService } from './base';

class QuestionnaireService extends BaseService<'questionnaires'> {
  constructor() {
    super('questionnaires');
  }
}

export const questionnaireService = new QuestionnaireService();

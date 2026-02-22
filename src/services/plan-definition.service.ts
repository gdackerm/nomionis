import { BaseService } from './base';

class PlanDefinitionService extends BaseService<'plan_definitions'> {
  constructor() {
    super('plan_definitions');
  }
}

export const planDefinitionService = new PlanDefinitionService();

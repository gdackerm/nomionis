import { BaseService } from './base';

class ProvenanceService extends BaseService<'provenances'> {
  constructor() {
    super('provenances');
  }
}

export const provenanceService = new ProvenanceService();

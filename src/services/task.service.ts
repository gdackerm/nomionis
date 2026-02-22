import { BaseService } from './base';

class TaskService extends BaseService<'tasks'> {
  constructor() {
    super('tasks');
  }

  async getByEncounter(encounterId: string) {
    const { data, error } = await this.table
      .select('*')
      .eq('encounter_id', encounterId)
      .order('authored_on', { ascending: true });
    if (error) throw error;
    return data;
  }

  async getByOwner(ownerId: string, statuses?: string[]) {
    let query = this.table.select('*').eq('owner_id', ownerId);
    if (statuses && statuses.length > 0) {
      query = query.in('status', statuses);
    }
    query = query.order('authored_on', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
}

export const taskService = new TaskService();

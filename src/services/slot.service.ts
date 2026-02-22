import { BaseService } from './base';

class SlotService extends BaseService<'slots'> {
  constructor() {
    super('slots');
  }

  async getByScheduleAndDateRange(scheduleId: string, start: string, end: string) {
    const { data, error } = await this.table
      .select('*')
      .eq('schedule_id', scheduleId)
      .gte('start_time', start)
      .lte('end_time', end)
      .order('start_time', { ascending: true });
    if (error) throw error;
    return data;
  }
}

export const slotService = new SlotService();

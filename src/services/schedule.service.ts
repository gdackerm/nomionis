import { BaseService } from './base';

class ScheduleService extends BaseService<'schedules'> {
  constructor() {
    super('schedules');
  }
}

export const scheduleService = new ScheduleService();

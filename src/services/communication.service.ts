import { BaseService } from './base';
import type { Database } from '../lib/supabase/types';

type CommunicationInsert = Database['public']['Tables']['communications']['Insert'];

interface ThreadFilters {
  organizationId?: string;
  patientId?: string;
  senderId?: string;
}

class CommunicationService extends BaseService<'communications'> {
  constructor() {
    super('communications');
  }

  async getThreads(filters: ThreadFilters = {}) {
    let query = this.table
      .select('*')
      .is('parent_id', null)
      .order('sent', { ascending: false });

    if (filters.organizationId) {
      query = query.eq('organization_id', filters.organizationId);
    }
    if (filters.patientId) {
      query = query.eq('patient_id', filters.patientId);
    }
    if (filters.senderId) {
      query = query.eq('sender_id', filters.senderId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getReplies(parentId: string) {
    const { data, error } = await this.table
      .select('*')
      .eq('parent_id', parentId)
      .order('sent', { ascending: true });
    if (error) throw error;
    return data;
  }

  async sendMessage(message: CommunicationInsert) {
    return this.create({
      ...message,
      sent: message.sent ?? new Date().toISOString(),
      status: message.status ?? 'completed',
    });
  }
}

export const communicationService = new CommunicationService();

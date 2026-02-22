// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

export type TaskStatus =
  | 'draft'
  | 'requested'
  | 'received'
  | 'accepted'
  | 'rejected'
  | 'ready'
  | 'in-progress'
  | 'on-hold'
  | 'failed'
  | 'completed'
  | 'cancelled'
  | 'entered-in-error';

export type TaskPriority = 'routine' | 'urgent' | 'asap' | 'stat';

export type TaskFilterValue = string;

export enum TaskFilterType {
  STATUS = 'status',
  OWNER = 'owner',
  PERFORMER_TYPE = 'performerType',
  PRIORITY = 'priority',
  PATIENT = 'patient',
}

export const TASK_STATUSES: TaskStatus[] = [
  'draft',
  'requested',
  'received',
  'accepted',
  'rejected',
  'ready',
  'in-progress',
  'on-hold',
  'failed',
  'completed',
];

export const TASK_PRIORITIES: TaskPriority[] = ['routine', 'urgent', 'asap', 'stat'];

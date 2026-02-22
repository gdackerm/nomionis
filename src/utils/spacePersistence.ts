// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

import type { Message } from '../types/spaces';

/**
 * Creates a new conversation topic.
 * Stub: returns a minimal Communication-like object.
 */
export async function createConversationTopic(
  _medplum: any,
  title: string,
  _model: string
): Promise<any> {
  return {
    resourceType: 'Communication',
    id: 'stub-topic-id',
    status: 'in-progress',
    topic: { text: title },
  };
}

/**
 * Saves a message as a Communication resource linked to the topic.
 * Stub: returns a minimal Communication-like object.
 */
export async function saveMessage(
  _medplum: any,
  _topicId: string,
  _message: Message,
  _sequenceNumber: number
): Promise<any> {
  return {
    resourceType: 'Communication',
    id: 'stub-message-id',
    status: 'completed',
  };
}

/**
 * Loads the last messages for a conversation topic.
 * Stub: returns an empty array.
 */
export async function loadConversationMessages(_medplum: any, _topicId: string): Promise<Message[]> {
  return [];
}

/**
 * Loads recent conversation topics.
 * Stub: returns an empty array.
 */
export async function loadRecentTopics(_medplum: any, _limit?: number): Promise<any[]> {
  return [];
}

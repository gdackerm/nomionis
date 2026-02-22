// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

import type { Message } from '../types/spaces';

export interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string | Record<string, unknown>;
  };
}

export interface ExecuteToolCallsResult {
  messages: Message[];
  resourceRefs: string[];
}

export async function executeToolCalls(
  _medplum: any,
  _toolCalls: ToolCall[],
  _onFhirRequest: (request: string) => void
): Promise<ExecuteToolCallsResult> {
  return { messages: [], resourceRefs: [] };
}

export async function sendToBot(
  _medplum: any,
  _botId: any,
  _messages: Message[],
  _model: string
): Promise<{ content?: string; toolCalls?: ToolCall[] }> {
  return { content: 'Feature not available' };
}

export async function sendToBotStreaming(
  _medplum: any,
  _botId: any,
  _messages: Message[],
  _model: string,
  _onChunk: (chunk: string) => void
): Promise<string> {
  return 'Feature not available';
}

export interface ProcessMessageParams {
  medplum: any;
  input: string;
  userMessage: Message;
  currentMessages: Message[];
  currentTopicId: string | undefined;
  selectedModel: string;
  isFirstMessage: boolean;
  setCurrentTopicId: (id: string | undefined) => void;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
  setCurrentFhirRequest: (request: string | undefined) => void;
  onNewTopic: (topic: any) => void;
  onStreamChunk?: (chunk: string) => void;
}

export interface ProcessMessageResult {
  activeTopicId: string | undefined;
  assistantMessage: Message;
  updatedMessages: Message[];
}

export async function processMessage(params: ProcessMessageParams): Promise<ProcessMessageResult> {
  const assistantMessage: Message = {
    role: 'assistant',
    content: 'Feature not available',
  };
  return {
    activeTopicId: params.currentTopicId,
    assistantMessage,
    updatedMessages: [...params.currentMessages, assistantMessage],
  };
}

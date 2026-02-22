// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Paper, Text } from '@mantine/core';
import type { JSX } from 'react';

interface HistoryListProps {
  currentTopicId?: string;
  onSelectTopic: (topicId: string) => void;
  onSelectedItem: (topic: any) => string;
}

export function HistoryList(_props: HistoryListProps): JSX.Element {
  return (
    <Paper p="md">
      <Text>No conversation history</Text>
    </Paper>
  );
}

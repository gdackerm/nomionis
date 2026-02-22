// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Paper, Text } from '@mantine/core';
import type { JSX } from 'react';

interface SpaceInboxProps {
  topic: any;
  onNewTopic: (topic: any) => void;
  onSelectedItem: (topic: any) => string;
  onAdd?: () => void;
}

export function SpacesInbox(_props: SpaceInboxProps): JSX.Element {
  return (
    <Paper p="md">
      <Text>Spaces Inbox - Coming Soon</Text>
    </Paper>
  );
}

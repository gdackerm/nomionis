// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Paper, Text } from '@mantine/core';
import type { JSX } from 'react';

interface LabListItemProps {
  item: any;
  selectedItem: any;
  activeTab: string;
  onItemSelect: (item: any) => string;
}

export function LabListItem(_props: LabListItemProps): JSX.Element {
  return (
    <Paper p="sm">
      <Text size="sm">Lab item</Text>
    </Paper>
  );
}

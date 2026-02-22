// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Paper, Text } from '@mantine/core';
import type { JSX } from 'react';

interface LabOrderDetailsProps {
  order: any;
}

export function LabOrderDetails(_props: LabOrderDetailsProps): JSX.Element {
  return (
    <Paper p="md">
      <Text>Lab Order Details - Coming Soon</Text>
    </Paper>
  );
}

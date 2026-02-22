// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Paper, Text } from '@mantine/core';
import type { JSX } from 'react';

export type PractitionerInputProps = {
  patient: any;
  performingLab?: any;
  error?: any;
};

export function PerformingLabInput(_props: PractitionerInputProps): JSX.Element {
  return (
    <Paper p="md">
      <Text>Performing Lab Input - Coming Soon</Text>
    </Paper>
  );
}

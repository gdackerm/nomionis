// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Paper, Text } from '@mantine/core';
import type { JSX } from 'react';

export type PatientCoverages = { coverage: any; selected: boolean }[];

export type CoverageInputProps = {
  patient: any;
  error?: any;
};

export function CoverageInput(_props: CoverageInputProps): JSX.Element {
  return (
    <Paper p="md">
      <Text>Coverage Input - Coming Soon</Text>
    </Paper>
  );
}

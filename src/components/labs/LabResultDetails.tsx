// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Paper, Text } from '@mantine/core';
import type { JSX } from 'react';

interface LabResultDetailsProps {
  result: any;
  onResultChange?: (result: any) => void;
}

export function LabResultDetails(_props: LabResultDetailsProps): JSX.Element {
  return (
    <Paper p="md">
      <Text>Lab Result Details - Coming Soon</Text>
    </Paper>
  );
}

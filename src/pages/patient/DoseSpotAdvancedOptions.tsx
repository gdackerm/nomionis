// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, Text } from '@mantine/core';
import type { JSX } from 'react';

export function DoseSpotAdvancedOptions({ patientId: _patientId }: { patientId: string }): JSX.Element {
  return (
    <Box p="md">
      <Text c="dimmed">DoseSpot integration not available</Text>
    </Box>
  );
}

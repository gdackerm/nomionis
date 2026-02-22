// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Center, Paper, Text } from '@mantine/core';
import type { JSX } from 'react';

export function PatientSearchPage(): JSX.Element {
  return (
    <Paper shadow="xs" m="md" p="xl">
      <Center>
        <Text size="lg" c="dimmed">
          Resource search not available in this version
        </Text>
      </Center>
    </Paper>
  );
}

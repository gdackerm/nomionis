// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Paper, Text } from '@mantine/core';
import type { JSX } from 'react';

export type TestMetadataCardInputProps = {
  test: any;
  metadata: any;
  error?: any;
};

export function TestMetadataCardInput(_props: TestMetadataCardInputProps): JSX.Element {
  return (
    <Paper p="md">
      <Text>Test Metadata - Coming Soon</Text>
    </Paper>
  );
}

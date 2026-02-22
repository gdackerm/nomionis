// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Paper, Text } from '@mantine/core';
import type { JSX, ReactNode } from 'react';

interface ResourceFormWithRequiredProfileProps {
  defaultValue?: any;
  onSubmit?: (resource: any) => void;
  onDelete?: () => void;
  outcome?: any;
  profileUrl?: string;
  missingProfileMessage?: ReactNode;
  [key: string]: any;
}

export function ResourceFormWithRequiredProfile(_props: ResourceFormWithRequiredProfileProps): JSX.Element {
  return (
    <Paper p="md">
      <Text>Resource Form - Coming Soon</Text>
    </Paper>
  );
}

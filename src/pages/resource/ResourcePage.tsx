// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Paper, Text } from '@mantine/core';
import type { JSX } from 'react';
import { Outlet } from 'react-router';

export function ResourcePage(): JSX.Element | null {
  return (
    <Paper p="md">
      <Text>Resource Page - Coming Soon</Text>
      <Outlet />
    </Paper>
  );
}

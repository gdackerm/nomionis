// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Paper, Text } from '@mantine/core';
import type { JSX } from 'react';

export interface OrderLabsPageProps {
  encounter?: any;
  task?: any;
  tests?: any[];
  performingLab?: any;
  onSubmitLabOrder: (serviceRequest?: any) => void;
}

export function OrderLabsPage(_props: OrderLabsPageProps): JSX.Element {
  return (
    <Paper p="md">
      <Text>Order Labs - Coming Soon</Text>
    </Paper>
  );
}

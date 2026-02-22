// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Paper, Text } from '@mantine/core';
import type { JSX } from 'react';

interface ResourceBoxProps {
  resourceReference: string;
  onClick: (resourceReference: string) => void;
}

export function ResourceBox({ resourceReference, onClick }: ResourceBoxProps): JSX.Element {
  return (
    <Paper withBorder p="sm" onClick={() => onClick(resourceReference)} style={{ cursor: 'pointer' }}>
      <Text size="sm">{resourceReference}</Text>
    </Paper>
  );
}

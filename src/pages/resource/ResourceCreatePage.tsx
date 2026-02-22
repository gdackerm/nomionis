// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Button, Paper, Stack, Text, Title } from '@mantine/core';
import type { JSX } from 'react';
import { useNavigate, useParams } from 'react-router';

export function ResourceCreatePage(): JSX.Element {
  const navigate = useNavigate();
  const { resourceType, patientId } = useParams<{ resourceType?: string; patientId?: string }>();

  return (
    <Paper p="xl" shadow="xs">
      <Stack gap="md">
        <Title order={3}>Resource creation for {resourceType ?? 'unknown resource type'}</Title>
        {patientId && <Text c="dimmed">Patient: {patientId}</Text>}
        <Text>
          Generic resource creation is not yet available. This feature is being migrated to work with
          the new data layer.
        </Text>
        <Button variant="default" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Stack>
    </Paper>
  );
}

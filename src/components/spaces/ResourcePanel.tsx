// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, Text } from '@mantine/core';
import type { JSX } from 'react';
import type { Tables } from '../../lib/supabase/types';
import { EncounterChart } from '../encounter/EncounterChart';
import { TaskDetailPanel } from '../tasks/TaskDetailPanel';

type Task = Tables<'tasks'>;

interface ResourcePanelProps {
  resourceType?: string;
  resourceId?: string;
  task?: Task;
}

export function ResourcePanel(props: ResourcePanelProps): JSX.Element | null {
  const { resourceType, resourceId, task } = props;

  if (task) {
    return (
      <Box p="md" data-testid="resource-panel">
        <TaskDetailPanel task={task} />
      </Box>
    );
  }

  if (resourceType === 'Encounter' && resourceId) {
    return (
      <Box p="md" data-testid="resource-panel">
        <EncounterChart encounterId={resourceId} />
      </Box>
    );
  }

  return (
    <Box p="md" data-testid="resource-panel">
      <Text c="dimmed">Resource panel not available</Text>
    </Box>
  );
}

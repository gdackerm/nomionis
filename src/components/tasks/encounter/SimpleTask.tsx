// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, Stack, Text } from '@mantine/core';
import type { JSX } from 'react';
import type { Tables } from '../../../lib/supabase/types';

interface SimpleTaskProps {
  task: Tables<'tasks'>;
}

export const SimpleTask = ({ task }: SimpleTaskProps): JSX.Element => {
  return (
    <Box p="md">
      <Stack gap="xs">
        {(task.code as any)?.text && (
          <Text fw={500} size="lg">
            {(task.code as any).text}
          </Text>
        )}
        <Text>{task.description}</Text>
        {task.focus_type === 'ServiceRequest' && task.focus_id && (
          <Button component="a" href={`/ServiceRequest/${task.focus_id}`} target="_blank">
            View Service Request
          </Button>
        )}
      </Stack>
    </Box>
  );
};

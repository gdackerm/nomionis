// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { Alert, Box, Code, Loader, Stack, Text, Title } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import type { Tables } from '../../../lib/supabase/types';
import { serviceRequestService } from '../../../services/service-request.service';

interface TaskServiceRequestProps {
  task: Tables<'tasks'>;
}

export const TaskServiceRequest = (props: TaskServiceRequestProps): JSX.Element => {
  const { task } = props;
  const [serviceRequest, setServiceRequest] = useState<Tables<'service_requests'> | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchServiceRequest = async (): Promise<void> => {
      if (task.focus_type !== 'ServiceRequest' || !task.focus_id) {
        return;
      }
      const sr = await serviceRequestService.getById(task.focus_id);
      setServiceRequest(sr as Tables<'service_requests'>);
    };

    setLoading(true);
    setError(undefined);
    fetchServiceRequest()
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load service request');
      })
      .finally(() => setLoading(false));
  }, [task.focus_type, task.focus_id]);

  if (loading) {
    return (
      <Box p="md">
        <Loader size="sm" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
        {error}
      </Alert>
    );
  }

  if (!serviceRequest) {
    return (
      <Box p="md">
        <Text c="dimmed">No service request linked to this task.</Text>
      </Box>
    );
  }

  const taskTitle = (task.code as any)?.text || 'Service Request Task';

  return (
    <Stack p={0}>
      <Stack gap={0}>
        <Title order={4}>{taskTitle}</Title>
      </Stack>

      <Stack gap="sm">
        <Text size="sm">
          <Text component="span" fw={600}>Status:</Text> {serviceRequest.status}
        </Text>
        <Text size="sm">
          <Text component="span" fw={600}>Intent:</Text> {serviceRequest.intent}
        </Text>
        {serviceRequest.code && (
          <Box>
            <Text size="sm" fw={600}>Code:</Text>
            <Code block>{JSON.stringify(serviceRequest.code, null, 2)}</Code>
          </Box>
        )}
        <Text c="dimmed" size="xs">
          Lab ordering integration is not available in this POC. Service request details are shown for reference.
        </Text>
      </Stack>
    </Stack>
  );
};

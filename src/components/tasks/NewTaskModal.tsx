// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Autocomplete, Box, Button, Divider, Grid, Modal, Select, Stack, TextInput, Textarea } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconCircleCheck, IconCircleOff } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import type { JSX } from 'react';
import type { Tables } from '../../lib/supabase/types';
import { normalizeErrorString, formatPatientName, formatHumanName } from '../../lib/utils';
import { useAuth, useCurrentUser } from '../../providers/AuthProvider';
import { taskService } from '../../services/task.service';
import { patientService } from '../../services/patient.service';
import { supabase } from '../../lib/supabase/client';

type Task = Tables<'tasks'>;
type Patient = Tables<'patients'>;
type Practitioner = Tables<'practitioners'>;

export interface NewTaskModalProps {
  opened: boolean;
  onClose: () => void;
  onTaskCreated?: (task: Task) => void;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'requested', label: 'Requested' },
  { value: 'received', label: 'Received' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'ready', label: 'Ready' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function NewTaskModal(props: NewTaskModalProps): JSX.Element {
  const { opened, onClose, onTaskCreated } = props;
  const { organizationId } = useAuth();
  const currentUser = useCurrentUser();

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [intent, setIntent] = useState<string>('order');
  const [status, setStatus] = useState<string>('draft');
  const [dueDate, setDueDate] = useState<Date | null>(null);

  // Patient search
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [patientOptions, setPatientOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);

  // Assignee
  const [assigneeOptions, setAssigneeOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load practitioners for assignee dropdown
  useEffect(() => {
    if (!opened || !organizationId) return;
    supabase
      .from('practitioners')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('active', true)
      .then(({ data }) => {
        if (data) {
          setAssigneeOptions(
            data.map((p: Practitioner) => ({
              value: p.id,
              label: formatHumanName(p.given_name, p.family_name),
            }))
          );
        }
      });
  }, [opened, organizationId]);

  // Search patients
  const searchPatients = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setPatientOptions([]);
        setPatients([]);
        return;
      }
      try {
        const results = await patientService.search(query);
        setPatients(results);
        setPatientOptions(
          results.map((p: Patient) => ({
            value: p.id,
            label: formatPatientName(p),
          }))
        );
      } catch {
        setPatientOptions([]);
        setPatients([]);
      }
    },
    []
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchPatients(patientSearch);
    }, 300);
    return () => clearTimeout(timeout);
  }, [patientSearch, searchPatients]);

  const handleSubmit = async (): Promise<void> => {
    if (!title.trim()) {
      notifications.show({
        color: 'red',
        icon: <IconCircleOff />,
        title: 'Validation Error',
        message: 'Task title is required',
      });
      return;
    }

    if (!organizationId) {
      notifications.show({
        color: 'red',
        icon: <IconCircleOff />,
        title: 'Error',
        message: 'No organization found',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const createdTask = await taskService.create({
        organization_id: organizationId,
        status,
        intent,
        code: { text: title },
        description: description.trim() || null,
        patient_id: selectedPatientId || null,
        owner_id: selectedAssigneeId || null,
        requester_id: currentUser?.id || null,
        authored_on: new Date().toISOString(),
      });

      notifications.show({
        icon: <IconCircleCheck />,
        title: 'Success',
        message: 'Task created successfully',
      });

      onTaskCreated?.(createdTask as Task);
      handleClose();
    } catch (error) {
      notifications.show({
        color: 'red',
        icon: <IconCircleOff />,
        title: 'Error',
        message: normalizeErrorString(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (): void => {
    setTitle('');
    setDescription('');
    setIntent('order');
    setStatus('draft');
    setDueDate(null);
    setSelectedPatientId(null);
    setSelectedAssigneeId(null);
    setPatientSearch('');
    setPatientOptions([]);
    setPatients([]);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      size="xl"
      title="Create New Task"
      styles={{
        body: {
          padding: 0,
          height: '70vh',
        },
      }}
    >
      <Stack h="100%" justify="space-between" gap={0}>
        <Box flex={1} miw={0}>
          <Grid p="md" h="100%">
            <Grid.Col span={6} pr="lg">
              <Stack gap="md" h="100%">
                <Box>
                  <Stack gap="sm">
                    <TextInput
                      label="Title"
                      placeholder="Enter task title"
                      value={title}
                      onChange={(event) => setTitle(event.currentTarget.value)}
                      required
                      size="md"
                    />

                    <Textarea
                      label="Description"
                      placeholder="Enter task description (optional)"
                      value={description}
                      onChange={(event) => setDescription(event.currentTarget.value)}
                      minRows={4}
                      autosize
                      maxRows={8}
                    />
                  </Stack>
                </Box>
              </Stack>
            </Grid.Col>

            <Grid.Col span={6} pl="lg">
              <Stack gap="md" h="100%">
                <Box>
                  <Stack gap="sm">
                    <Select
                      label="Status"
                      data={STATUS_OPTIONS}
                      value={status}
                      onChange={(value) => setStatus(value || 'draft')}
                      required
                    />

                    <DateTimePicker
                      label="Due Date"
                      placeholder="Select due date (optional)"
                      value={dueDate}
                      onChange={(value: string | null) => setDueDate(value ? new Date(value) : null)}
                      clearable
                    />

                    <Autocomplete
                      label="Patient"
                      placeholder="Search for patient"
                      value={patientSearch}
                      onChange={(value) => {
                        setPatientSearch(value);
                        // Check if the user selected a known option
                        const matched = patients.find(
                          (p) => formatPatientName(p) === value
                        );
                        setSelectedPatientId(matched?.id || null);
                      }}
                      data={patientOptions.map((o) => o.label)}
                    />

                    <Select
                      label="Assignee"
                      placeholder="Select assignee (optional)"
                      data={assigneeOptions}
                      value={selectedAssigneeId}
                      onChange={setSelectedAssigneeId}
                      clearable
                      searchable
                    />
                  </Stack>
                </Box>
              </Stack>
            </Grid.Col>
          </Grid>
        </Box>

        <Stack p="md">
          <Divider />
          <Button variant="filled" w="100%" onClick={handleSubmit} loading={isSubmitting}>
            Create Task
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
}

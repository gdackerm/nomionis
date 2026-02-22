// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Autocomplete, Box, Button, Card, Grid, Loader, Modal, Select, Stack, Text, Textarea } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconCircleCheck, IconCircleOff } from '@tabler/icons-react';
import type { JSX } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import type { Tables } from '../../lib/supabase/types';
import { supabase } from '../../lib/supabase/client';
import { formatHumanName, formatPatientName, normalizeErrorString } from '../../lib/utils';
import { taskService } from '../../services/task.service';
import { usePatient } from '../../hooks/usePatient';
import { useCurrentUser } from '../../providers/AuthProvider';
import classes from './TaskDetailsModal.module.css';

type Task = Tables<'tasks'>;
type Practitioner = Tables<'practitioners'>;

const TASK_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'requested', label: 'Requested' },
  { value: 'received', label: 'Received' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'ready', label: 'Ready' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'failed', label: 'Failed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const TaskDetailsModal = (): JSX.Element => {
  const { patientId, encounterId, taskId } = useParams();
  const patient = usePatient();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [task, setTask] = useState<Task | undefined>(undefined);
  const [isOpened, setIsOpened] = useState(true);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | undefined>();
  const [ownerSearchValue, setOwnerSearchValue] = useState<string>('');
  const [practitionerOptions, setPractitionerOptions] = useState<{ value: string; label: string }[]>([]);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [status, setStatus] = useState<string | undefined>();
  const [note, setNote] = useState<string>('');

  // Fetch task
  useEffect(() => {
    const fetchTask = async (): Promise<void> => {
      const result = await taskService.getById(taskId as string);
      const t = result as Task;
      setStatus(t.status);
      setTask(t);
      setSelectedOwnerId(t.owner_id ?? undefined);
      // authored_on is available but restriction_period_end is not in schema;
      // use authored_on as a sensible fallback for display purposes
    };

    fetchTask().catch((err) => {
      notifications.show({
        color: 'red',
        icon: <IconCircleOff />,
        title: 'Error',
        message: normalizeErrorString(err),
      });
    });
  }, [taskId]);

  // Load the current owner name when task loads
  useEffect(() => {
    const loadOwner = async (): Promise<void> => {
      if (!task?.owner_id) return;
      const { data } = await supabase
        .from('practitioners')
        .select('id, given_name, family_name')
        .eq('id', task.owner_id)
        .single();
      if (data) {
        setOwnerSearchValue(formatHumanName(data.given_name, data.family_name));
      }
    };
    loadOwner().catch(console.error);
  }, [task?.owner_id]);

  // Search practitioners for the autocomplete
  const searchPractitioners = useCallback(async (query: string): Promise<void> => {
    if (query.length < 2) {
      setPractitionerOptions([]);
      return;
    }
    const { data } = await supabase
      .from('practitioners')
      .select('id, given_name, family_name')
      .or(`given_name.ilike.%${query}%,family_name.ilike.%${query}%`)
      .limit(10);

    if (data) {
      setPractitionerOptions(
        data.map((p) => ({
          value: p.id,
          label: formatHumanName(p.given_name, p.family_name),
        }))
      );
    }
  }, []);

  useEffect(() => {
    searchPractitioners(ownerSearchValue).catch(console.error);
  }, [ownerSearchValue, searchPractitioners]);

  const handleOnSubmit = async (): Promise<void> => {
    if (!task) {
      return;
    }

    const updatePayload: Record<string, any> = {};

    if (status) {
      updatePayload.status = status;
    }

    if (selectedOwnerId) {
      updatePayload.owner_id = selectedOwnerId;
    }

    // Note: task.note is JSONB in the schema. Append to it if user typed a note.
    const trimmedNote = note.trim();
    if (trimmedNote !== '') {
      const existingNotes = Array.isArray(task.note) ? task.note : [];
      updatePayload.note = [
        ...existingNotes,
        {
          text: trimmedNote,
          author_id: currentUser?.id ?? null,
          time: new Date().toISOString(),
        },
      ];
    }

    try {
      const updatedTask = await taskService.update(task.id, updatePayload);
      notifications.show({
        icon: <IconCircleCheck />,
        title: 'Success',
        message: 'Task updated',
      });
      setTask(updatedTask as Task);
      navigate(`/Patient/${patientId}/Encounter/${encounterId}`)?.catch(console.error);
    } catch {
      notifications.show({
        color: 'red',
        icon: <IconCircleOff />,
        title: 'Error',
        message: 'Failed to update the task.',
      });
    }
  };

  if (!task) {
    return (
      <Box p="xl" style={{ display: 'flex', justifyContent: 'center' }}>
        <Loader />
      </Box>
    );
  }

  return (
    <Modal
      opened={isOpened}
      onClose={() => {
        navigate(-1)?.catch(console.error);
        setIsOpened(false);
      }}
      size="xl"
      styles={{
        body: {
          padding: 0,
          height: '60vh',
        },
      }}
    >
      <Stack h="100%" justify="space-between" gap={0}>
        <Box flex={1} miw={0}>
          <Grid p="md" h="100%">
            <Grid.Col span={6} pr="lg">
              <Stack gap="sm">
                <Card p="md" radius="md" className={classes.taskDetails}>
                  <Stack gap="sm">
                    <Text fz="lg" fw={700}>
                      {(task.code as any)?.text}
                    </Text>
                    {task.description && <Text>{task.description}</Text>}
                    {patient && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Text>View Patient</Text>
                        <Button variant="subtle" component={Link} to={`/Patient/${patient.id}`}>
                          {formatPatientName(patient)}
                        </Button>
                      </div>
                    )}
                  </Stack>
                </Card>

                <Autocomplete
                  label="Assigned to"
                  placeholder="Search practitioners..."
                  value={ownerSearchValue}
                  onChange={(value) => {
                    setOwnerSearchValue(value);
                    // Find matching practitioner and set the id
                    const match = practitionerOptions.find((p) => p.label === value);
                    if (match) {
                      setSelectedOwnerId(match.value);
                    }
                  }}
                  data={practitionerOptions.map((p) => p.label)}
                />

                <DateTimePicker
                  label="Due Date"
                  placeholder="Select due date"
                  value={dueDate}
                  onChange={(value: string | null) => setDueDate(value ? new Date(value) : null)}
                  clearable
                />

                {task.status && (
                  <Select
                    label="Status"
                    data={TASK_STATUS_OPTIONS}
                    value={status}
                    onChange={(value) => {
                      if (value) {
                        setStatus(value);
                      }
                    }}
                  />
                )}
              </Stack>
            </Grid.Col>

            <Grid.Col span={6} pr="md">
              <Stack gap="sm">
                <Text>Note</Text>
                <Text c="dimmed">Optional free form details about this task</Text>
                <Textarea
                  placeholder="Add note to this task"
                  minRows={3}
                  value={note}
                  onChange={(event) => setNote(event.currentTarget.value)}
                />
              </Stack>
            </Grid.Col>
          </Grid>
        </Box>

        <Box className={classes.footer} h={70} p="md">
          <Button variant="filled" onClick={handleOnSubmit}>
            Save Changes
          </Button>
        </Box>
      </Stack>
    </Modal>
  );
};

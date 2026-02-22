// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { PaperProps } from '@mantine/core';
import { Autocomplete, Divider, Flex, Paper, Select, Stack, Text } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import React, { useCallback, useEffect, useState } from 'react';
import type { Tables } from '../../lib/supabase/types';
import { formatHumanName, formatPatientName } from '../../lib/utils';
import { patientService } from '../../services/patient.service';
import { supabase } from '../../lib/supabase/client';

type Task = Tables<'tasks'>;
type Patient = Tables<'patients'>;
type Practitioner = Tables<'practitioners'>;

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

interface TaskPropertiesProps extends PaperProps {
  task: Task;
  onTaskChange: (task: Task) => void;
}

export function TaskProperties(props: TaskPropertiesProps): React.JSX.Element {
  const { task: initialTask, onTaskChange, ...paperProps } = props;
  const [task, setTask] = useState<Task>(initialTask);

  // Patient search state
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [patientOptions, setPatientOptions] = useState<string[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);

  // Owner state
  const [ownerOptions, setOwnerOptions] = useState<{ value: string; label: string }[]>([]);
  const [currentOwnerId, setCurrentOwnerId] = useState<string | null>(task.owner_id);

  useEffect(() => {
    setTask(initialTask);
  }, [initialTask]);

  // Load the current patient name
  useEffect(() => {
    if (task.patient_id) {
      patientService.getById(task.patient_id).then((p) => {
        setCurrentPatient(p as Patient);
        setPatientSearch(formatPatientName(p as Patient));
      }).catch(() => {
        setCurrentPatient(null);
        setPatientSearch('');
      });
    }
  }, [task.patient_id]);

  // Load practitioners for owner/assignee
  useEffect(() => {
    if (!task.organization_id) return;
    supabase
      .from('practitioners')
      .select('*')
      .eq('organization_id', task.organization_id)
      .eq('active', true)
      .then(({ data }) => {
        if (data) {
          setOwnerOptions(
            data.map((p: Practitioner) => ({
              value: p.id,
              label: formatHumanName(p.given_name, p.family_name),
            }))
          );
        }
      });
  }, [task.organization_id]);

  // Search patients with debounce
  const searchPatients = useCallback(async (query: string) => {
    if (query.length < 2) {
      setPatientOptions([]);
      setPatients([]);
      return;
    }
    try {
      const results = await patientService.search(query);
      setPatients(results);
      setPatientOptions(results.map((p: Patient) => formatPatientName(p)));
    } catch {
      setPatientOptions([]);
      setPatients([]);
    }
  }, []);

  const handleStatusChange = async (value: string | null): Promise<void> => {
    if (value) {
      const updatedTask = { ...task, status: value };
      setTask(updatedTask);
      onTaskChange(updatedTask);
    }
  };

  const handleDueDateChange = async (value: string | null): Promise<void> => {
    const updatedTask = { ...task } as any;
    updatedTask.restriction_period_end = value ? new Date(value).toISOString() : null;
    setTask(updatedTask as Task);
    onTaskChange(updatedTask as Task);
  };

  const handleOwnerChange = async (value: string | null): Promise<void> => {
    setCurrentOwnerId(value);
    const updatedTask = { ...task, owner_id: value };
    setTask(updatedTask);
    onTaskChange(updatedTask);
  };

  const handlePatientSearchChange = (value: string): void => {
    setPatientSearch(value);
    // Check if user selected a known patient
    const matched = patients.find((p) => formatPatientName(p) === value);
    if (matched) {
      const updatedTask = { ...task, patient_id: matched.id };
      setTask(updatedTask);
      onTaskChange(updatedTask);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      // Only search if the value doesn't match the current patient
      if (currentPatient && patientSearch === formatPatientName(currentPatient)) return;
      searchPatients(patientSearch);
    }, 300);
    return () => clearTimeout(timeout);
  }, [patientSearch, searchPatients, currentPatient]);

  const dueDate = (task as any).restriction_period_end
    ? new Date((task as any).restriction_period_end)
    : null;

  return (
    <Paper {...paperProps}>
      <Flex direction="column" gap="lg">
        <Stack gap="xs">
          <Select
            key={`${task.status}-${task.id}`}
            label="Status"
            data={STATUS_OPTIONS}
            value={task.status}
            onChange={handleStatusChange}
          />

          <DateTimePicker
            label="Due Date"
            placeholder="Select due date"
            value={dueDate}
            onChange={handleDueDateChange}
            clearable
          />

          <Select
            label="Assignee"
            placeholder="Select assignee"
            data={ownerOptions}
            value={currentOwnerId}
            onChange={handleOwnerChange}
            clearable
            searchable
          />
        </Stack>

        <Divider />

        <Stack gap="xs" pt="md">
          <Autocomplete
            label="Patient"
            placeholder="Search for patient"
            value={patientSearch}
            onChange={handlePatientSearchChange}
            data={patientOptions}
          />

          {task.encounter_id && (
            <Stack gap={0}>
              <Text size="sm" fw={500}>
                Encounter
              </Text>
              <Text size="sm" c="dimmed">
                {task.encounter_id}
              </Text>
            </Stack>
          )}
        </Stack>
      </Flex>
    </Paper>
  );
}

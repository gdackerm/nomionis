// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Badge, Group, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { Link } from 'react-router';
import cx from 'clsx';
import type { Tables } from '../../lib/supabase/types';
import { formatDate, formatHumanName, formatPatientName, getStatusColor } from '../../lib/utils';
import { patientService } from '../../services/patient.service';
import { supabase } from '../../lib/supabase/client';
import classes from './TaskListItem.module.css';

type Task = Tables<'tasks'>;
type Patient = Tables<'patients'>;
type Practitioner = Tables<'practitioners'>;

interface TaskListItemProps {
  task: Task;
  selectedTask: Task | undefined;
  getTaskUri: (task: Task) => string;
}

export function TaskListItem(props: TaskListItemProps): JSX.Element {
  const { task, selectedTask, getTaskUri } = props;
  const isSelected = selectedTask?.id === task.id;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [owner, setOwner] = useState<Practitioner | null>(null);
  const taskFrom = task.authored_on ? `from ${formatDate(task.authored_on)}` : '';
  const taskUrl = getTaskUri(task);

  useEffect(() => {
    if (task.patient_id) {
      patientService.getById(task.patient_id).then(setPatient).catch(() => setPatient(null));
    } else {
      setPatient(null);
    }
  }, [task.patient_id]);

  useEffect(() => {
    if (task.owner_id) {
      supabase
        .from('practitioners')
        .select('*')
        .eq('id', task.owner_id)
        .single()
        .then(({ data }) => setOwner(data), () => setOwner(null));
    } else {
      setOwner(null);
    }
  }, [task.owner_id]);

  return (
    <Link to={taskUrl} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Group
        p="xs"
        align="center"
        wrap="nowrap"
        className={cx(classes.contentContainer, {
          [classes.selected]: isSelected,
        })}
      >
        <Stack gap={0} flex={1}>
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Text fw={700} className={classes.content}>
              {(task.code as any)?.text ?? `Task ${taskFrom}`}
            </Text>
            <Badge variant="light" color={getStatusColor(task.status)}>
              {task.status}
            </Badge>
          </Group>
          <Stack gap={0} c="dimmed">
            {(task as any).restriction_period_end && (
              <Text fw={500}>Due {formatDate((task as any).restriction_period_end)}</Text>
            )}
            {patient && <Text>For: {formatPatientName(patient)}</Text>}
            {owner && (
              <Text size="sm">Assigned to {formatHumanName(owner.given_name, owner.family_name)}</Text>
            )}
          </Stack>
        </Stack>
      </Group>
    </Link>
  );
}

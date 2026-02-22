// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Avatar, Group, Stack, Text } from '@mantine/core';
import type { Tables } from '../../lib/supabase/types';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { formatDateTime, formatPatientName, getInitials } from '../../lib/utils';
import { patientService } from '../../services/patient.service';
import classes from './ChatListItem.module.css';
import cx from 'clsx';

type Communication = Tables<'communications'>;
type Patient = Tables<'patients'>;

interface ChatListItemProps {
  topic: Communication;
  lastCommunication: Communication | undefined;
  isSelected: boolean;
  getThreadUri: (topic: Communication) => string;
}

export const ChatListItem = (props: ChatListItemProps): JSX.Element => {
  const { topic, lastCommunication, isSelected, getThreadUri } = props;
  const [patient, setPatient] = useState<Patient | undefined>(undefined);

  useEffect(() => {
    if (topic.patient_id) {
      patientService
        .getById(topic.patient_id)
        .then((p) => setPatient(p as Patient))
        .catch(console.error);
    }
  }, [topic.patient_id]);

  const patientName = patient ? formatPatientName(patient) : '';
  const lastMsg = lastCommunication?.payload_text;
  const trimmedMsg = lastMsg?.length && lastMsg.length > 100 ? lastMsg.slice(0, 100) + '...' : lastMsg;
  const content = trimmedMsg ? trimmedMsg : 'No messages available';
  const topicName = topic.topic ?? content;
  const initials = patient ? getInitials(patient.given_name, patient.family_name) : '';

  return (
    <Link to={getThreadUri(topic)} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Group
        p="xs"
        align="center"
        wrap="nowrap"
        className={cx(classes.contentContainer, {
          [classes.selected]: isSelected,
        })}
      >
        <Avatar radius="xl" size={36} color="blue">
          {initials}
        </Avatar>
        <Stack gap={0}>
          <Text size="sm" fw={700} truncate="end">
            {patientName}
          </Text>
          <Text size="sm" fw={400} lineClamp={2} className={classes.content}>
            {topicName}
          </Text>
          <Text size="xs" style={{ marginTop: 2 }}>
            {lastCommunication ? formatDateTime(lastCommunication.sent) : ''}
          </Text>
        </Stack>
      </Group>
    </Link>
  );
};

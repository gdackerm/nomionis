import {
  Badge,
  Card,
  Group,
  Loader,
  Stack,
  Text,
  Timeline,
  Title,
} from '@mantine/core';
import { IconStethoscope } from '@tabler/icons-react';
import type { JSX } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import type { Tables } from '../../lib/supabase/types';
import { formatDateTime, getStatusColor } from '../../lib/utils';
import { usePatient } from '../../hooks/usePatient';
import { encounterService } from '../../services/encounter.service';

type Encounter = Tables<'encounters'>;

export function TimelineTab(): JSX.Element {
  const patient = usePatient();
  const navigate = useNavigate();
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEncounters = useCallback(async () => {
    if (!patient?.id) return;
    setLoading(true);
    try {
      const result = await encounterService.getByPatientId(patient.id);
      setEncounters(result);
    } catch (err) {
      console.error('Failed to load encounters:', err);
    } finally {
      setLoading(false);
    }
  }, [patient?.id]);

  useEffect(() => {
    fetchEncounters();
  }, [fetchEncounters]);

  if (!patient) {
    return <Loader />;
  }

  if (loading) {
    return <Loader />;
  }

  if (encounters.length === 0) {
    return (
      <Card p="xl" m="md">
        <Text c="dimmed" ta="center">No encounters recorded yet</Text>
      </Card>
    );
  }

  return (
    <Card p="md" m="md">
      <Title order={4} mb="md">Patient Timeline</Title>
      <Timeline active={0} bulletSize={24} lineWidth={2}>
        {encounters.map((encounter) => (
          <Timeline.Item
            key={encounter.id}
            bullet={<IconStethoscope size={12} />}
            title={
              <Group gap="xs">
                <Text size="sm" fw={500}>
                  {encounter.class_code ?? 'Visit'}
                </Text>
                <Badge size="xs" color={getStatusColor(encounter.status)}>
                  {encounter.status}
                </Badge>
              </Group>
            }
            style={{ cursor: 'pointer' }}
            onClick={() =>
              navigate(`/Patient/${patient.id}/Encounter/${encounter.id}`)?.catch(console.error)
            }
          >
            <Stack gap={2}>
              {encounter.period_start && (
                <Text size="xs" c="dimmed">
                  {formatDateTime(encounter.period_start)}
                  {encounter.period_end ? ` - ${formatDateTime(encounter.period_end)}` : ''}
                </Text>
              )}
              {!encounter.period_start && (
                <Text size="xs" c="dimmed">
                  Created {formatDateTime(encounter.created_at)}
                </Text>
              )}
            </Stack>
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
  );
}

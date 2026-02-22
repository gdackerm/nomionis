import {
  Avatar,
  Badge,
  Card,
  Divider,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import type { JSX } from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { Tables } from '../lib/supabase/types';
import {
  formatAge,
  formatDate,
  formatGender,
  formatHumanName,
  getInitials,
  getStatusColor,
} from '../lib/utils';
import { patientService } from '../services/patient.service';

type Patient = Tables<'patients'>;

interface PatientRelatedData {
  allergies: Tables<'allergy_intolerances'>[];
  conditions: Tables<'conditions'>[];
  medications: Tables<'medication_requests'>[];
  coverages: Tables<'coverages'>[];
}

interface PatientSummaryProps {
  patient: Patient;
}

export function PatientSummary({ patient }: PatientSummaryProps): JSX.Element {
  const [related, setRelated] = useState<PatientRelatedData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRelated = useCallback(async () => {
    setLoading(true);
    try {
      const result = await patientService.getWithRelated(patient.id);
      setRelated({
        allergies: result.allergies,
        conditions: result.conditions,
        medications: result.medications,
        coverages: result.coverages,
      });
    } catch (err) {
      console.error('Failed to load related data:', err);
    } finally {
      setLoading(false);
    }
  }, [patient.id]);

  useEffect(() => {
    fetchRelated();
  }, [fetchRelated]);

  const displayName = formatHumanName(patient.given_name, patient.family_name);
  const initials = getInitials(patient.given_name, patient.family_name);

  return (
    <Card padding="md">
      <Stack gap="sm">
        <Group>
          <Avatar size="lg" radius="xl" color="blue">
            {initials}
          </Avatar>
          <div>
            <Title order={4}>{displayName}</Title>
            <Text size="sm" c="dimmed">
              {formatGender(patient.gender)}
              {patient.birth_date && ` | ${formatDate(patient.birth_date)} (${formatAge(patient.birth_date)})`}
            </Text>
          </div>
        </Group>

        {patient.phone && (
          <Text size="sm">Phone: {patient.phone}</Text>
        )}
        {patient.email && (
          <Text size="sm">Email: {patient.email}</Text>
        )}

        <Divider />

        {loading ? (
          <Loader size="sm" />
        ) : (
          <>
            <SummarySection title="Active Conditions" items={related?.conditions ?? []} renderItem={(c) => c.code_display ?? c.code_value ?? 'Unknown'} />
            <SummarySection title="Allergies" items={related?.allergies ?? []} renderItem={(a) => a.code_display ?? a.code_value ?? 'Unknown'} />
            <SummarySection title="Medications" items={related?.medications ?? []} renderItem={(m) => m.medication_display ?? m.medication_code ?? 'Unknown'} />
            <SummarySection title="Coverage" items={related?.coverages ?? []} renderItem={(c) => {
              const status = c.status ?? 'unknown';
              return (
                <Group gap="xs">
                  <Text size="sm">{c.subscriber_id ?? 'Coverage'}</Text>
                  <Badge size="xs" color={getStatusColor(status)}>{status}</Badge>
                </Group>
              );
            }} />
          </>
        )}
      </Stack>
    </Card>
  );
}

function SummarySection<T>({
  title,
  items,
  renderItem,
}: {
  title: string;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}): JSX.Element {
  return (
    <div>
      <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4}>
        {title}
      </Text>
      {items.length === 0 ? (
        <Text size="sm" c="dimmed">None recorded</Text>
      ) : (
        <Stack gap={2}>
          {items.map((item, i) => (
            <Text size="sm" key={i}>
              {renderItem(item)}
            </Text>
          ))}
        </Stack>
      )}
    </div>
  );
}

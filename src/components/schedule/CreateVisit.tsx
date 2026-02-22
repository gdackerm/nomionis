// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { useState, useMemo, useEffect, useCallback } from 'react';
import type { JSX } from 'react';
import { Autocomplete, Button, Card, Flex, Select, Stack, Text, Title } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { IconAlertSquareRounded, IconCircleCheck, IconCirclePlus } from '@tabler/icons-react';
import classes from './CreateVisit.module.css';
import { createEncounter } from '../../utils/encounter';
import { showErrorNotification } from '../../utils/notifications';
import { useNavigate } from 'react-router';
import { showNotification } from '@mantine/notifications';
import { useAuth } from '../../providers/AuthProvider';
import { patientService } from '../../services/patient.service';
import { planDefinitionService } from '../../services/plan-definition.service';
import { formatPatientName } from '../../lib/utils';
import type { Tables } from '../../lib/supabase/types';
import type { Range } from '../../types/scheduling';

type Patient = Tables<'patients'>;
type PlanDefinition = Tables<'plan_definitions'>;

interface PlanDefinitionAction {
  id?: string;
  title?: string;
}

const ENCOUNTER_CLASS_OPTIONS = [
  { value: 'AMB', label: 'Ambulatory' },
  { value: 'EMER', label: 'Emergency' },
  { value: 'IMP', label: 'Inpatient Encounter' },
  { value: 'ACUTE', label: 'Inpatient Acute' },
  { value: 'NONAC', label: 'Inpatient Non-Acute' },
  { value: 'SS', label: 'Short Stay' },
  { value: 'HH', label: 'Home Health' },
  { value: 'VR', label: 'Virtual' },
];

interface CreateVisitProps {
  appointmentSlot: Range | undefined;
}

export function CreateVisit(props: CreateVisitProps): JSX.Element {
  const { appointmentSlot } = props;
  const [patientId, setPatientId] = useState<string | undefined>();
  const [patientSearchValue, setPatientSearchValue] = useState('');
  const [patientOptions, setPatientOptions] = useState<{ value: string; label: string }[]>([]);
  const [planDefinitionId, setPlanDefinitionId] = useState<string | undefined>();
  const [planDefinitionActions, setPlanDefinitionActions] = useState<PlanDefinitionAction[]>([]);
  const [planDefinitionOptions, setPlanDefinitionOptions] = useState<{ value: string; label: string }[]>([]);
  const [encounterClass, setEncounterClass] = useState<string | null>(null);
  const [start, setStart] = useState<Date | null>(appointmentSlot?.start ?? null);
  const [end, setEnd] = useState<Date | null>(appointmentSlot?.end ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const { organizationId, practitioner } = useAuth();
  const navigate = useNavigate();

  const [formattedDate, formattedSlotTime] = useMemo(() => {
    if (!appointmentSlot) {
      return ['', ''];
    }

    const startDate = new Date(appointmentSlot?.start);
    const endDate = new Date(appointmentSlot?.end);

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    const dateStr = startDate.toLocaleDateString('en-US', options);

    const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: 'numeric', hour12: true };
    const startTimeStr = startDate.toLocaleTimeString('en-US', timeOptions);
    const endTimeStr = endDate.toLocaleTimeString('en-US', timeOptions);

    const formattedTime = `${startTimeStr} – ${endTimeStr}`;
    return [dateStr, formattedTime];
  }, [appointmentSlot]);

  // Load plan definitions on mount
  useEffect(() => {
    const loadPlanDefinitions = async (): Promise<void> => {
      try {
        const result = await planDefinitionService.list({
          filters: { status: 'active' },
        });
        const options = result.data.map((pd: PlanDefinition) => ({
          value: pd.id,
          label: pd.title ?? 'Untitled',
        }));
        setPlanDefinitionOptions(options);
      } catch (err) {
        showErrorNotification(err);
      }
    };
    loadPlanDefinitions().catch(console.error);
  }, []);

  // Search patients when search value changes
  const handlePatientSearch = useCallback(async (query: string): Promise<void> => {
    if (!query.trim()) {
      setPatientOptions([]);
      return;
    }
    try {
      const patients = await patientService.search(query);
      const options = patients.map((p: Patient) => ({
        value: p.id,
        label: formatPatientName(p),
      }));
      setPatientOptions(options);
    } catch (err) {
      showErrorNotification(err);
    }
  }, []);

  const handlePatientSelect = useCallback((value: string): void => {
    setPatientSearchValue(value);
    const selected = patientOptions.find((o) => o.label === value);
    if (selected) {
      setPatientId(selected.value);
    }
  }, [patientOptions]);

  const handlePlanDefinitionChange = useCallback(async (value: string | null): Promise<void> => {
    setPlanDefinitionId(value ?? undefined);
    if (value) {
      try {
        const pd = await planDefinitionService.getById(value);
        const actions = Array.isArray(pd.actions) ? (pd.actions as unknown as PlanDefinitionAction[]) : [];
        setPlanDefinitionActions(actions);
      } catch (err) {
        showErrorNotification(err);
        setPlanDefinitionActions([]);
      }
    } else {
      setPlanDefinitionActions([]);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!patientId || !planDefinitionId || !encounterClass || !start || !end) {
      showNotification({
        color: 'yellow',
        icon: <IconAlertSquareRounded />,
        title: 'Error',
        message: 'Please fill out required fields.',
      });
      return;
    }
    if (!organizationId || !practitioner) {
      showNotification({
        color: 'yellow',
        icon: <IconAlertSquareRounded />,
        title: 'Error',
        message: 'Missing organization or practitioner context.',
      });
      return;
    }
    setIsLoading(true);
    try {
      const encounter = await createEncounter(
        organizationId,
        patientId,
        practitioner.id,
        start,
        end,
        encounterClass,
        planDefinitionId
      );
      showNotification({ icon: <IconCircleCheck />, title: 'Success', message: 'Visit created' });
      navigate(`/Patient/${patientId}/Encounter/${encounter.id}`)?.catch(console.error);
    } catch (err) {
      showErrorNotification(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="md" h="100%" justify="space-between">
        <Stack gap="md" h="100%">
          <Stack gap={0}>
            <Title order={1} fw={500}>
              {formattedDate}
            </Title>
            <Text size="lg">{formattedSlotTime}</Text>
          </Stack>

          <Autocomplete
            label="Patient"
            placeholder="Search patients..."
            data={patientOptions.map((o) => o.label)}
            value={patientSearchValue}
            onChange={(value) => {
              setPatientSearchValue(value);
              handlePatientSearch(value).catch(console.error);
              handlePatientSelect(value);
            }}
            required
          />

          <DateTimePicker
            label="Start Time"
            defaultValue={appointmentSlot?.start}
            required
            onChange={(value: string | null) => {
              setStart(value ? new Date(value) : null);
            }}
          />

          <DateTimePicker
            label="End Time"
            defaultValue={appointmentSlot?.end}
            required
            onChange={(value: string | null) => {
              setEnd(value ? new Date(value) : null);
            }}
          />

          <Select
            label="Class"
            placeholder="Select encounter class"
            data={ENCOUNTER_CLASS_OPTIONS}
            value={encounterClass}
            onChange={setEncounterClass}
            required
          />

          <Select
            label="Care template"
            placeholder="Select a plan definition"
            data={planDefinitionOptions}
            value={planDefinitionId ?? null}
            onChange={(value) => {
              handlePlanDefinitionChange(value).catch(console.error);
            }}
            required
            searchable
          />
        </Stack>

        {planDefinitionActions.length > 0 && (
          <Card className={classes.planDefinition}>
            <Stack gap={0}>
              <Text fw={500}>Included Tasks</Text>
              {planDefinitionActions.map((action, index) => (
                <Text key={action.id ?? index}>- {action.title}</Text>
              ))}
            </Stack>
          </Card>
        )}

        <Button fullWidth mt="xl" type="submit" loading={isLoading} disabled={isLoading}>
          <IconCirclePlus /> <Text ml="xs">Create Visit</Text>
        </Button>
      </Flex>
    </form>
  );
}

// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Autocomplete, Box, Button, Card, Grid, Modal, Select, Stack, Text, TextInput } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { showNotification } from '@mantine/notifications';
import { IconAlertSquareRounded, IconCircleCheck, IconCircleOff } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import type { JSX } from 'react';
import { useNavigate } from 'react-router';
import { usePatient } from '../../hooks/usePatient';
import { useAuth } from '../../providers/AuthProvider';
import type { Tables } from '../../lib/supabase/types';
import { planDefinitionService } from '../../services/plan-definition.service';
import { createEncounter } from '../../utils/encounter';
import classes from './EncounterModal.module.css';

type PlanDefinition = Tables<'plan_definitions'>;

const ENCOUNTER_CLASS_OPTIONS = [
  { value: 'AMB', label: 'Ambulatory' },
  { value: 'EMER', label: 'Emergency' },
  { value: 'IMP', label: 'Inpatient' },
  { value: 'OBSENC', label: 'Observation' },
  { value: 'SS', label: 'Short Stay' },
  { value: 'VR', label: 'Virtual' },
  { value: 'HH', label: 'Home Health' },
];

export const EncounterModal = (): JSX.Element => {
  const navigate = useNavigate();
  const { practitioner, organizationId } = useAuth();
  const patient = usePatient();
  const [isOpen, setIsOpen] = useState(true);
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [encounterClass, setEncounterClass] = useState<string | null>(null);
  const [selectedPlanDefinition, setSelectedPlanDefinition] = useState<PlanDefinition | undefined>();
  const [planDefinitionSearch, setPlanDefinitionSearch] = useState('');
  const [planDefinitions, setPlanDefinitions] = useState<PlanDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPlanDefinitions = useCallback(async () => {
    try {
      const result = await planDefinitionService.list({
        filters: { status: 'active' },
        pageSize: 50,
      });
      setPlanDefinitions(result.data as PlanDefinition[]);
    } catch (err) {
      console.error('Failed to fetch plan definitions:', err);
    }
  }, []);

  useEffect(() => {
    fetchPlanDefinitions();
  }, [fetchPlanDefinitions]);

  const planDefinitionOptions = planDefinitions.map((pd) => pd.title ?? pd.id);

  const handleCreateEncounter = async (): Promise<void> => {
    if (!patient || !encounterClass || !start || !end || !organizationId || !practitioner) {
      showNotification({
        color: 'yellow',
        icon: <IconAlertSquareRounded />,
        title: 'Error',
        message: 'Please fill out required fields.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const encounter = await createEncounter(
        organizationId,
        patient.id,
        practitioner.id,
        new Date(start),
        new Date(end),
        encounterClass,
        selectedPlanDefinition?.id
      );
      showNotification({ icon: <IconCircleCheck />, title: 'Success', message: 'Encounter created' });
      navigate(`/Patient/${patient.id}/Encounter/${encounter.id}`)?.catch(console.error);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      showNotification({ color: 'red', icon: <IconCircleOff />, title: 'Error', message });
    } finally {
      setIsLoading(false);
    }
  };

  const patientDisplayName = patient
    ? `${(patient.given_name ?? []).join(' ')} ${patient.family_name}`.trim()
    : '';

  return (
    <Modal
      opened={isOpen}
      onClose={() => {
        navigate(-1)?.catch(console.error);
        setIsOpen(false);
      }}
      size="60%"
      title="New encounter"
      styles={{ title: { fontSize: '1.125rem', fontWeight: 600 }, body: { padding: 0, height: '60vh' } }}
    >
      <Stack h="100%" justify="space-between" gap={0}>
        <Box flex={1} miw={0}>
          <Grid p="md" h="100%">
            <Grid.Col span={6} pr="md">
              <Stack gap="md">
                <TextInput
                  label="Patient"
                  value={patientDisplayName}
                  disabled={true}
                  required={true}
                />

                <DateTimePicker
                  label="Start Time"
                  required={true}
                  value={start}
                  onChange={setStart}
                />

                <DateTimePicker
                  label="End Time"
                  required={true}
                  value={end}
                  onChange={setEnd}
                />

                <Select
                  label="Class"
                  data={ENCOUNTER_CLASS_OPTIONS}
                  required={true}
                  value={encounterClass}
                  onChange={setEncounterClass}
                  placeholder="Select encounter class"
                />
              </Stack>
            </Grid.Col>

            <Grid.Col span={6}>
              <Card padding="lg" radius="md" className={classes.planDefinition}>
                <Text size="md" fw={500} mb="xs">
                  Apply care template
                </Text>
                <Text size="sm" c="dimmed" mb="lg">
                  You can select a template for the new encounter. Tasks from the template will be automatically added
                  to the encounter.
                </Text>

                <Autocomplete
                  label="Care Template"
                  placeholder="Search plan definitions..."
                  data={planDefinitionOptions}
                  value={planDefinitionSearch}
                  onChange={(value) => {
                    setPlanDefinitionSearch(value);
                    const match = planDefinitions.find((pd) => (pd.title ?? pd.id) === value);
                    setSelectedPlanDefinition(match);
                  }}
                  onOptionSubmit={(value) => {
                    const match = planDefinitions.find((pd) => (pd.title ?? pd.id) === value);
                    setSelectedPlanDefinition(match);
                  }}
                />
              </Card>
            </Grid.Col>
          </Grid>
        </Box>

        <Box className={classes.footer} h={70} p="md">
          <Button fullWidth={false} onClick={handleCreateEncounter} loading={isLoading} disabled={isLoading}>
            Create Encounter
          </Button>
        </Box>
      </Stack>
    </Modal>
  );
};

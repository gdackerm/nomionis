// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Card, Stack, Text } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import type { JSX } from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { Tables } from '../../lib/supabase/types';
import { formatHumanName } from '../../lib/utils';
import { supabase } from '../../lib/supabase/client';
import { Autocomplete } from '@mantine/core';

type Encounter = Tables<'encounters'>;
type Practitioner = Tables<'practitioners'>;

interface VisitDetailsPanelProps {
  practitioner?: Practitioner;
  encounter: Encounter;
  onEncounterChange: (payload: { practitioner_id?: string; period_start?: string; period_end?: string }) => void;
}

export const VisitDetailsPanel = (props: VisitDetailsPanelProps): JSX.Element => {
  const { practitioner, encounter, onEncounterChange } = props;

  const [practitionerSearch, setPractitionerSearch] = useState<string>('');
  const [practitionerOptions, setPractitionerOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedPractitionerLabel, setSelectedPractitionerLabel] = useState<string>('');

  // Initialize the display value from the practitioner prop
  useEffect(() => {
    if (practitioner) {
      const name = formatHumanName(practitioner.given_name, practitioner.family_name);
      setSelectedPractitionerLabel(name);
      setPractitionerSearch(name);
    }
  }, [practitioner]);

  // Search practitioners when search text changes
  const searchPractitioners = useCallback(async (query: string): Promise<void> => {
    if (!query || query.length < 2) {
      setPractitionerOptions([]);
      return;
    }

    const { data, error } = await supabase
      .from('practitioners')
      .select('id, given_name, family_name')
      .or(`family_name.ilike.%${query}%,given_name.ilike.%${query}%`)
      .limit(10);

    if (!error && data) {
      const options = data.map((p) => ({
        value: p.id,
        label: formatHumanName(p.given_name, p.family_name),
      }));
      setPractitionerOptions(options);
    }
  }, []);

  useEffect(() => {
    // Only search if the text has actually changed from the selected value
    if (practitionerSearch !== selectedPractitionerLabel) {
      const timeout = setTimeout(() => {
        searchPractitioners(practitionerSearch).catch(console.error);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [practitionerSearch, selectedPractitionerLabel, searchPractitioners]);

  const handlePractitionerSelect = (value: string): void => {
    const selected = practitionerOptions.find((opt) => opt.label === value);
    if (selected) {
      setSelectedPractitionerLabel(selected.label);
      setPractitionerSearch(selected.label);
      onEncounterChange({ practitioner_id: selected.value });
    }
  };

  const handleCheckinChange = (value: string | null): void => {
    if (!value) return;
    onEncounterChange({ period_start: new Date(value).toISOString() });
  };

  const handleCheckoutChange = (value: string | null): void => {
    if (!value) return;
    onEncounterChange({ period_end: new Date(value).toISOString() });
  };

  return (
    <Stack gap={0}>
      <Text fw={600} size="lg" mb="md">
        Visit Details
      </Text>
      <Card withBorder shadow="sm" p="md">
        <Stack gap="md">
          <Autocomplete
            label="Practitioner"
            placeholder="Search for practitioner"
            value={practitionerSearch}
            onChange={(val) => setPractitionerSearch(val)}
            onOptionSubmit={handlePractitionerSelect}
            data={practitionerOptions.map((opt) => opt.label)}
          />

          <DateTimePicker
            label="Check in"
            placeholder="Select check-in time"
            defaultValue={encounter.period_start ? new Date(encounter.period_start) : undefined}
            onChange={handleCheckinChange}
          />

          <DateTimePicker
            label="Check out"
            placeholder="Select check-out time"
            defaultValue={encounter.period_end ? new Date(encounter.period_end) : undefined}
            onChange={handleCheckoutChange}
          />
        </Stack>
      </Card>
    </Stack>
  );
};

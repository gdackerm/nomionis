// SPDX-FileCopyrightText: Copyright Orangebot, Inc.
// SPDX-License-Identifier: Apache-2.0
import { Button, Group, Select, Stack, TextInput } from '@mantine/core';
import { useCallback, useState } from 'react';
import type { JSX } from 'react';
import type { Tables } from '../../lib/supabase/types';
import { showErrorNotification } from '../../utils/notifications';

type Patient = Tables<'patients'>;
type Encounter = Tables<'encounters'>;

export interface ConditionDialogProps {
  readonly patient: Patient;
  readonly encounter: Encounter;
  readonly onSubmit: (data: {
    code_display: string;
    code_value: string;
    code_system: string;
    clinical_status: string;
  }) => void;
}

export default function ConditionModal(props: ConditionDialogProps): JSX.Element {
  const { onSubmit } = props;
  const [codeDisplay, setCodeDisplay] = useState('');
  const [codeValue, setCodeValue] = useState('');
  const [codeSystem, setCodeSystem] = useState('http://hl7.org/fhir/sid/icd-10-cm');
  const [clinicalStatus, setClinicalStatus] = useState('active');

  const handleSubmit = useCallback(() => {
    if (!codeDisplay && !codeValue) {
      showErrorNotification('Please enter a diagnosis code and display name');
      return;
    }

    onSubmit({
      code_display: codeDisplay,
      code_value: codeValue,
      code_system: codeSystem,
      clinical_status: clinicalStatus,
    });
  }, [codeDisplay, codeValue, codeSystem, clinicalStatus, onSubmit]);

  return (
    <Stack gap="md">
      <TextInput
        label="ICD-10 Code"
        placeholder="Enter ICD-10 code (e.g. J06.9)"
        required
        value={codeValue}
        onChange={(e) => setCodeValue(e.currentTarget.value)}
      />

      <TextInput
        label="Display Name"
        placeholder="Enter diagnosis description"
        required
        value={codeDisplay}
        onChange={(e) => setCodeDisplay(e.currentTarget.value)}
      />

      <TextInput
        label="Code System"
        placeholder="Code system URI"
        value={codeSystem}
        onChange={(e) => setCodeSystem(e.currentTarget.value)}
      />

      <Select
        label="Clinical Status"
        data={[
          { value: 'active', label: 'Active' },
          { value: 'recurrence', label: 'Recurrence' },
          { value: 'relapse', label: 'Relapse' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'remission', label: 'Remission' },
          { value: 'resolved', label: 'Resolved' },
        ]}
        value={clinicalStatus}
        onChange={(value) => setClinicalStatus(value ?? 'active')}
        required
      />

      <Group justify="flex-end" gap={4} mt="md">
        <Button onClick={handleSubmit}>Save</Button>
      </Group>
    </Stack>
  );
}

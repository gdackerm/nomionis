// SPDX-FileCopyrightText: Copyright Orangebot, Inc.
// SPDX-License-Identifier: Apache-2.0
import { Button, Flex, Modal, Card, Stack, Text, TextInput, Select, Group } from '@mantine/core';
import { useEffect, useState, useCallback } from 'react';
import type { JSX } from 'react';
import { IconX } from '@tabler/icons-react';
import type { Tables, Json } from '../../lib/supabase/types';
import { conditionService } from '../../services/condition.service';
import { encounterService } from '../../services/encounter.service';
import { useAuth } from '../../providers/AuthProvider';
import { showErrorNotification } from '../../utils/notifications';

type Condition = Tables<'conditions'>;
type Patient = Tables<'patients'>;
type Encounter = Tables<'encounters'>;

interface DiagnosisOrder {
  condition_id: string;
  rank: number;
}

interface ConditionListProps {
  patient: Patient;
  encounter: Encounter;
  conditions: Condition[] | undefined;
  setConditions: (conditions: Condition[]) => void;
  onDiagnosisChange: (diagnosisOrder: DiagnosisOrder[]) => void;
}

export const ConditionList = (props: ConditionListProps): JSX.Element => {
  const { patient, encounter, conditions, setConditions, onDiagnosisChange } = props;
  const { organizationId } = useAuth();
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    const fetchConditions = async (): Promise<void> => {
      if (!encounter) {
        return;
      }

      try {
        // Conditions are linked via encounter_id foreign key
        const result = await conditionService.list({
          filters: { encounter_id: encounter.id },
        });
        const conditionsResult = result.data as Condition[];

        if (conditionsResult.length > 0) {
          // Diagnosis ordering is stored in encounter.clinical_data JSONB
          const clinicalData = encounter.clinical_data as any;
          const diagnosisOrder: DiagnosisOrder[] = clinicalData?.diagnosis_order ?? [];

          if (diagnosisOrder.length > 0) {
            const orderMap = new Map<string, number>();
            diagnosisOrder.forEach((d: DiagnosisOrder) => {
              orderMap.set(d.condition_id, d.rank);
            });

            conditionsResult.sort((a, b) => {
              const aRank = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
              const bRank = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
              return aRank - bRank;
            });
          }

          setConditions(conditionsResult);
        } else {
          setConditions([]);
        }
      } catch (err) {
        showErrorNotification(err);
      }
    };

    fetchConditions();
  }, [encounter, setConditions]);

  /*
   * Re-orders the conditions in the conditions array and updates the diagnosis ordering.
   */
  const handleUpdateDiagnosis = async (condition: Condition, value: string): Promise<void> => {
    if (!conditions || conditions.length === 0 || !encounter) {
      return;
    }

    const newRank = Number(value);
    const maxAllowedRank = conditions.length;
    const validRank = Math.max(1, Math.min(newRank, maxAllowedRank));

    const updatedConditions = [...conditions];
    const conditionIndex = updatedConditions.findIndex((c) => c.id === condition.id);

    if (conditionIndex === -1) {
      return;
    }

    const conditionToMove = updatedConditions.splice(conditionIndex, 1)[0];
    updatedConditions.splice(validRank - 1, 0, conditionToMove);
    setConditions(updatedConditions);
    onDiagnosisChange(
      updatedConditions.map((c, index) => ({
        condition_id: c.id,
        rank: index + 1,
      }))
    );
  };

  const handleRemoveDiagnosis = async (condition: Condition): Promise<void> => {
    if (!conditions) {
      return;
    }

    try {
      await conditionService.delete(condition.id);
      const remaining = conditions.filter((c) => c.id !== condition.id);
      setConditions(remaining);
      onDiagnosisChange(
        remaining.map((c, index) => ({
          condition_id: c.id,
          rank: index + 1,
        }))
      );
    } catch (err) {
      showErrorNotification(err);
    }
  };

  const handleConditionSubmit = async (newConditionData: {
    code_display: string;
    code_value: string;
    code_system: string;
    clinical_status: string;
  }): Promise<void> => {
    if (!organizationId) {
      showErrorNotification('Organization not found');
      return;
    }

    try {
      const code: Json = {
        coding: [
          {
            system: newConditionData.code_system,
            code: newConditionData.code_value,
            display: newConditionData.code_display,
          },
        ],
      };

      const newCondition = await conditionService.create({
        organization_id: organizationId,
        patient_id: patient.id,
        encounter_id: encounter.id,
        code_system: newConditionData.code_system,
        code_value: newConditionData.code_value,
        code_display: newConditionData.code_display,
        clinical_status: newConditionData.clinical_status || 'active',
        code,
      });

      const created = newCondition as Condition;
      const updatedConditions = [...(conditions || []), created];
      setConditions(updatedConditions);
      onDiagnosisChange(
        updatedConditions.map((c, index) => ({
          condition_id: c.id,
          rank: index + 1,
        }))
      );
    } catch (err) {
      showErrorNotification(err);
    } finally {
      setOpened(false);
    }
  };

  return (
    <>
      <Stack gap={0}>
        <Text fw={600} size="lg" mb="md">
          Diagnosis
        </Text>

        <Card withBorder shadow="sm">
          <Stack gap="md">
            {conditions &&
              conditions.length > 0 &&
              conditions.map((condition, idx) => (
                <ConditionItem
                  key={condition.id ?? idx}
                  condition={condition}
                  rank={idx + 1}
                  total={conditions.length}
                  onChange={handleUpdateDiagnosis}
                  onRemove={handleRemoveDiagnosis}
                />
              ))}

            <Flex>
              <Button onClick={() => setOpened(true)}>Add Diagnosis</Button>
            </Flex>
          </Stack>
        </Card>
      </Stack>
      <Modal opened={opened} onClose={() => setOpened(false)} title="Add Diagnosis">
        <ConditionModal onSubmit={handleConditionSubmit} />
      </Modal>
    </>
  );
};

// ─── Inline ConditionItem ────────────────────────────────────────────

interface ConditionItemProps {
  condition: Condition;
  rank: number;
  total: number;
  onChange?: (condition: Condition, value: string) => void;
  onRemove?: (condition: Condition) => void;
}

function ConditionItem(props: ConditionItemProps): JSX.Element {
  const { condition, rank, total, onChange, onRemove } = props;

  const displayText =
    condition.code_display ||
    (condition.code as any)?.coding?.[0]?.display ||
    '';

  return (
    <Flex justify="space-between">
      <Group>
        <Group>
          <Select
            w={80}
            value={rank.toString()}
            data={Array.from({ length: total }, (_, i) => (i + 1).toString())}
            onChange={(value) => {
              if (value) {
                onChange?.(condition, value);
              }
            }}
          />
          <Text>{displayText}</Text>
        </Group>
      </Group>
      <Button
        variant="subtle"
        color="gray"
        size="compact-sm"
        onClick={() => {
          onRemove?.(condition);
        }}
      >
        <IconX size={16} />
      </Button>
    </Flex>
  );
}

// ─── Inline ConditionModal ───────────────────────────────────────────

interface ConditionModalProps {
  onSubmit: (data: {
    code_display: string;
    code_value: string;
    code_system: string;
    clinical_status: string;
  }) => void;
}

function ConditionModal(props: ConditionModalProps): JSX.Element {
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

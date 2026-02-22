// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Button, Card, Flex, Group, Menu, Stack } from '@mantine/core';
import { useDebouncedCallback } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import { IconDownload, IconFileText, IconSend } from '@tabler/icons-react';
import type { Dispatch, SetStateAction } from 'react';
import type { JSX } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { SAVE_TIMEOUT_MS } from '../../config/constants';
import type { Tables, Json } from '../../lib/supabase/types';
import { HTTP_HL7_ORG } from '../../lib/utils';
import { useAuth } from '../../providers/AuthProvider';
import { conditionService } from '../../services/condition.service';
import { coverageService } from '../../services/coverage.service';
import { encounterService } from '../../services/encounter.service';
import { patientService } from '../../services/patient.service';
import { supabase } from '../../lib/supabase/client';
import { calculateTotalPrice } from '../../utils/chargeitems';
import { createClaimFromEncounter, getCptChargeItems } from '../../utils/claims';
import { showErrorNotification } from '../../utils/notifications';
import { ChargeItemList } from '../ChargeItem/ChargeItemList';
import { ConditionList } from '../Conditions/ConditionList';
import { VisitDetailsPanel } from './VisitDetailsPanel';
import { claimService } from '../../services/claim.service';

type Encounter = Tables<'encounters'>;
type Claim = Tables<'claims'>;
type ChargeItem = Tables<'charge_items'>;
type Practitioner = Tables<'practitioners'>;
type Patient = Tables<'patients'>;
type Condition = Tables<'conditions'>;
type Coverage = Tables<'coverages'>;

export interface BillingTabProps {
  patient: string; // patient ID
  encounter: Encounter;
  setEncounter: Dispatch<SetStateAction<Encounter | undefined>>;
  practitioner: Practitioner | undefined;
  setPractitioner: Dispatch<SetStateAction<Practitioner | undefined>>;
  chargeItems: ChargeItem[];
  setChargeItems: Dispatch<SetStateAction<ChargeItem[]>>;
  claim: Claim | undefined;
  setClaim: Dispatch<SetStateAction<Claim | undefined>>;
}

export const BillingTab = (props: BillingTabProps): JSX.Element => {
  const {
    encounter,
    setEncounter,
    claim,
    patient: patientId,
    practitioner,
    setPractitioner,
    chargeItems,
    setChargeItems,
    setClaim,
  } = props;

  const { organizationId } = useAuth();
  const [patientData, setPatientData] = useState<Patient | undefined>();
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [coverage, setCoverage] = useState<Coverage | undefined>();

  // Fetch patient data
  useEffect(() => {
    if (!patientId) return;
    patientService
      .getById(patientId)
      .then((p) => setPatientData(p as Patient))
      .catch((err) => showErrorNotification(err));
  }, [patientId]);

  // Fetch coverage
  useEffect(() => {
    const fetchCoverage = async (): Promise<void> => {
      if (!patientId) {
        return;
      }
      const coverageResults = await coverageService.list({
        filters: { patient_id: patientId, status: 'active' },
      });
      if (coverageResults.data.length > 0) {
        setCoverage(coverageResults.data[0] as Coverage);
      }
    };

    fetchCoverage().catch((err) => showErrorNotification(err));
  }, [patientId]);

  // Fetch conditions
  useEffect(() => {
    if (!patientId) return;
    conditionService
      .getByPatientId(patientId)
      .then((data) => setConditions(data as Condition[]))
      .catch((err) => showErrorNotification(err));
  }, [patientId]);

  const exportClaimAsCMS1500 = async (): Promise<void> => {
    showNotification({
      title: 'CMS 1500 Export',
      message: 'CMS 1500 export is not yet available in this version. Please contact support.',
      color: 'blue',
    });
  };

  const handleDiagnosisChange = useCallback(
    async (diagnosisData: any): Promise<void> => {
      // Store diagnosis data in clinical_data JSONB
      const updatedClinicalData = {
        ...(encounter.clinical_data as Record<string, unknown> | null),
        diagnosis: diagnosisData,
      };
      try {
        const updated = await encounterService.update(encounter.id, {
          clinical_data: updatedClinicalData as Json,
        });
        setEncounter(updated as Encounter);
      } catch (err) {
        showErrorNotification(err);
      }
    },
    [encounter, setEncounter]
  );

  const handleEncounterChange = useDebouncedCallback(
    async (payload: { practitioner_id?: string; period_start?: string; period_end?: string }): Promise<void> => {
      try {
        const updated = await encounterService.update(encounter.id, payload);
        const savedEncounter = updated as Encounter;
        setEncounter(savedEncounter);

        let currentPractitioner = practitioner;
        if (payload.practitioner_id && payload.practitioner_id !== practitioner?.id) {
          const { data, error } = await supabase
            .from('practitioners')
            .select('*')
            .eq('id', payload.practitioner_id)
            .single();
          if (!error && data) {
            currentPractitioner = data as Practitioner;
            setPractitioner(currentPractitioner);
          }
        }

        if (!patientId || !savedEncounter?.id || !currentPractitioner?.id || !chargeItems?.length || !organizationId) {
          return;
        }

        if (!claim) {
          const newClaim = await createClaimFromEncounter(
            organizationId,
            patientId,
            savedEncounter.id,
            currentPractitioner.id,
            chargeItems
          );
          if (newClaim) {
            setClaim(newClaim);
          }
        } else {
          const providerNeedsUpdate = claim.practitioner_id !== currentPractitioner.id;
          if (providerNeedsUpdate) {
            const updatedClaim = await claimService.update(claim.id, {
              practitioner_id: currentPractitioner.id,
            });
            setClaim(updatedClaim as Claim);
          }
        }
      } catch (err) {
        showErrorNotification(err);
      }
    },
    SAVE_TIMEOUT_MS
  );

  const updateChargeItems = useCallback(
    async (updatedChargeItems: ChargeItem[]): Promise<void> => {
      setChargeItems(updatedChargeItems);
      if (claim?.id && updatedChargeItems.length > 0 && encounter) {
        const claimItems = getCptChargeItems(updatedChargeItems, encounter.id);
        const updatedClaim = await claimService.update(claim.id, {
          items: claimItems as unknown as Json,
          total_amount: calculateTotalPrice(updatedChargeItems),
        });
        setClaim(updatedClaim as Claim);
      }
    },
    [setChargeItems, claim, encounter, setClaim]
  );

  return (
    <Stack gap="md">
      {claim && (
        <Card withBorder shadow="sm">
          <Flex justify="space-between">
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button variant="outline" leftSection={<IconDownload size={16} />}>
                  Export Claim
                </Button>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Export Options</Menu.Label>

                <Menu.Item
                  leftSection={<IconFileText size={14} />}
                  onClick={async () => {
                    await exportClaimAsCMS1500();
                  }}
                >
                  CMS 1500 Form
                </Menu.Item>

                <Menu.Item
                  leftSection={<IconFileText size={14} />}
                  onClick={() => {
                    showNotification({
                      title: 'EDI X12',
                      message: 'Please contact sales to enable EDI X12 export',
                      color: 'blue',
                    });
                  }}
                >
                  EDI X12
                </Menu.Item>

                <Menu.Item
                  leftSection={<IconFileText size={14} />}
                  onClick={() => {
                    showNotification({
                      title: 'NUCC Crosswalk',
                      message: 'Please contact sales to enable NUCC Crosswalk export',
                      color: 'blue',
                    });
                  }}
                >
                  NUCC Crosswalk CSV
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>

            <Button variant="outline" leftSection={<IconSend size={16} />}>
              Request to connect a billing service
            </Button>
          </Flex>
        </Card>
      )}

      <Group grow align="flex-start">
        <VisitDetailsPanel
          practitioner={practitioner}
          encounter={encounter}
          onEncounterChange={handleEncounterChange}
        />
      </Group>

      {encounter && patientData && (
        <ConditionList
          patient={patientData}
          encounter={encounter}
          conditions={conditions}
          setConditions={setConditions}
          onDiagnosisChange={handleDiagnosisChange}
        />
      )}

      {chargeItems && patientData && (
        <ChargeItemList
          patient={patientData}
          encounter={encounter}
          chargeItems={chargeItems}
          updateChargeItems={updateChargeItems}
        />
      )}
    </Stack>
  );
};

const createDiagnosisArray = (conditions: Condition[]): Array<{ code: Json; sequence: number; type: string }> => {
  return conditions.map((condition, index) => {
    const code = condition.code as { coding?: Array<{ system?: string; code?: string; display?: string }> } | null;
    const icd10Coding = code?.coding?.find((c) => c.system === `${HTTP_HL7_ORG}/fhir/sid/icd-10-cm`);
    return {
      code: {
        coding: icd10Coding
          ? [
              {
                ...icd10Coding,
                system: `${HTTP_HL7_ORG}/fhir/sid/icd-10`,
              },
            ]
          : [],
      } as Json,
      sequence: index + 1,
      type: index === 0 ? 'principal' : 'secondary',
    };
  });
};

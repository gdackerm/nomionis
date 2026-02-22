// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, Card, Loader, Stack, Textarea, Title } from '@mantine/core';
import type { JSX } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { SAVE_TIMEOUT_MS } from '../../config/constants';
import { useDebouncedUpdateResource } from '../../hooks/useDebouncedUpdateResource';
import { useEncounterChart } from '../../hooks/useEncounterChart';
import type { Tables } from '../../lib/supabase/types';
import { useAuth } from '../../providers/AuthProvider';
import { clinicalImpressionService } from '../../services/clinical-impression.service';
import { encounterService } from '../../services/encounter.service';
import { provenanceService } from '../../services/provenance.service';
import { taskService } from '../../services/task.service';
import { ChartNoteStatus } from '../../types/encounter';
import { updateEncounterStatus } from '../../utils/encounter';
import { showErrorNotification } from '../../utils/notifications';
import { TaskPanel } from '../tasks/encounter/TaskPanel';
import { BillingTab } from './BillingTab';
import { EncounterHeader } from './EncounterHeader';
import { SignAddendum } from './SignAddendum';

type Encounter = Tables<'encounters'>;
type Provenance = Tables<'provenances'>;

const TASK_COMPLETED_STATUSES = new Set<string>([
  'completed',
  'cancelled',
  'failed',
  'rejected',
  'entered-in-error',
]);

export interface EncounterChartProps {
  encounterId: string;
}

export const EncounterChart = (props: EncounterChartProps): JSX.Element => {
  const { encounterId } = props;
  const { practitioner: authPractitioner, organizationId } = useAuth();

  const [encounterData, setEncounterData] = useState<Encounter | undefined>();
  const [patientId, setPatientId] = useState<string | undefined>();

  // Fetch encounter by ID
  useEffect(() => {
    const fetchEncounter = async (): Promise<void> => {
      try {
        const enc = await encounterService.getById(encounterId);
        setEncounterData(enc as Encounter);
        setPatientId(enc.patient_id);
      } catch (err) {
        showErrorNotification(err);
      }
    };
    fetchEncounter().catch(console.error);
  }, [encounterId]);

  const [activeTab, setActiveTab] = useState<string>('notes');
  const {
    encounter,
    claim,
    practitioner,
    tasks,
    clinicalImpression,
    chargeItems,
    appointment,
    setEncounter,
    setClaim,
    setPractitioner,
    setTasks,
    setChargeItems,
  } = useEncounterChart(encounterData);

  const [chartNote, setChartNote] = useState<string | undefined>(clinicalImpression?.note_text ?? undefined);
  const debouncedUpdate = useDebouncedUpdateResource(clinicalImpressionService, SAVE_TIMEOUT_MS);
  const [provenances, setProvenances] = useState<Provenance[]>([]);
  const [chartNoteStatus, setChartNoteStatus] = useState<ChartNoteStatus>(ChartNoteStatus.Unsigned);

  // Sync chart note when clinical impression loads
  useEffect(() => {
    if (clinicalImpression?.note_text !== undefined) {
      setChartNote(clinicalImpression.note_text ?? undefined);
    }
  }, [clinicalImpression?.note_text]);

  useEffect(() => {
    if (!encounter) {
      return;
    }

    const fetchProvenance = async (): Promise<void> => {
      const result = await provenanceService.list({
        filters: { target_type: 'encounters', target_id: encounter.id },
      });
      const provs = result.data as Provenance[];
      setProvenances(provs);
      if (provs.length > 0 && clinicalImpression?.status === 'completed') {
        setChartNoteStatus(ChartNoteStatus.SignedAndLocked);
      } else if (provs.length > 0) {
        setChartNoteStatus(ChartNoteStatus.Signed);
      } else {
        setChartNoteStatus(ChartNoteStatus.Unsigned);
      }
    };

    fetchProvenance().catch((err) => showErrorNotification(err));
  }, [clinicalImpression, encounter]);

  const updateTaskList = useCallback(
    (updatedTask: Tables<'tasks'>): void => {
      setTasks((prevTasks) => prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
    },
    [setTasks]
  );

  const handleEncounterStatusChange = useCallback(
    async (newStatus: string): Promise<void> => {
      if (!encounter) {
        return;
      }

      try {
        const updatedEncounter = await updateEncounterStatus(encounter.id, appointment?.id, newStatus);
        setEncounter(updatedEncounter as Encounter);
      } catch (err) {
        showErrorNotification(err);
      }
    },
    [encounter, setEncounter, appointment]
  );

  const handleTabChange = (tab: string): void => {
    setActiveTab(tab);
  };

  const handleChartNoteChange = async (e: React.ChangeEvent<HTMLTextAreaElement>): Promise<void> => {
    setChartNote(e.target.value);

    if (!clinicalImpression) {
      return;
    }

    try {
      debouncedUpdate(clinicalImpression.id, { note_text: e.target.value || null });
    } catch (err) {
      showErrorNotification(err);
    }
  };

  const handleSign = async (practitionerId: string, lock: boolean): Promise<void> => {
    if (!encounter || !organizationId) {
      return;
    }

    if (lock) {
      // Complete all incomplete tasks
      const tasksToUpdate = tasks.filter((task) => !TASK_COMPLETED_STATUSES.has(task.status));
      const updatedTasks = await Promise.all(
        tasksToUpdate.map((task) => taskService.update(task.id, { status: 'completed' }))
      );

      setTasks(
        tasks.map((task) => {
          const updated = updatedTasks.find((t: Tables<'tasks'>) => t.id === task.id);
          return (updated as Tables<'tasks'>) || task;
        })
      );
    }

    // Create provenance record with signature
    const signatureJson = {
      type: 'legally-authenticated',
      when: new Date().toISOString(),
      who_id: practitionerId,
    };

    const newProvenance = (await provenanceService.create({
      organization_id: organizationId,
      target_type: 'encounters',
      target_id: encounter.id,
      agent_id: practitionerId,
      reason_code: 'SIGN',
      signature: signatureJson,
    })) as Provenance;

    setProvenances([...provenances, newProvenance]);

    if (lock) {
      setChartNoteStatus(ChartNoteStatus.SignedAndLocked);
    } else {
      setChartNoteStatus(ChartNoteStatus.Signed);
    }
  };

  if (!patientId || !encounter) {
    return <Loader />;
  }

  return (
    <>
      <Stack justify="space-between" gap={0}>
        <EncounterHeader
          encounter={encounter}
          chartNoteStatus={chartNoteStatus}
          practitioner={practitioner}
          onStatusChange={handleEncounterStatusChange}
          onTabChange={handleTabChange}
          onSign={handleSign}
        />
        <Box p="md">
          {activeTab === 'notes' && (
            <Stack gap="md">
              <SignAddendum encounter={encounter} provenances={provenances} chartNoteStatus={chartNoteStatus} />

              {clinicalImpression && (
                <Card withBorder shadow="sm" mt="md">
                  <Title>Fill chart note</Title>
                  <Textarea
                    defaultValue={clinicalImpression.note_text ?? undefined}
                    value={chartNote}
                    onChange={handleChartNoteChange}
                    autosize
                    minRows={4}
                    maxRows={8}
                    disabled={chartNoteStatus === ChartNoteStatus.SignedAndLocked}
                  />
                </Card>
              )}
              {tasks.map((task) => (
                <TaskPanel
                  key={task.id}
                  task={task}
                  onUpdateTask={updateTaskList}
                  enabled={chartNoteStatus !== ChartNoteStatus.SignedAndLocked}
                />
              ))}
            </Stack>
          )}
          {activeTab === 'details' && (
            <BillingTab
              encounter={encounter}
              setEncounter={setEncounter}
              claim={claim}
              patient={patientId}
              practitioner={practitioner}
              setPractitioner={setPractitioner}
              chargeItems={chargeItems}
              setChargeItems={setChargeItems}
              setClaim={setClaim}
            />
          )}
        </Box>
      </Stack>
    </>
  );
};

// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Button, Card, Divider, Group, Stack, Text, Textarea } from '@mantine/core';
import { IconLock, IconPencil, IconSignature } from '@tabler/icons-react';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import type { Tables } from '../../lib/supabase/types';
import { formatDate, formatHumanName } from '../../lib/utils';
import { useAuth, useCurrentUser } from '../../providers/AuthProvider';
import { documentReferenceService } from '../../services/document-reference.service';
import { supabase } from '../../lib/supabase/client';
import { ChartNoteStatus } from '../../types/encounter';
import { showErrorNotification } from '../../utils/notifications';

type Provenance = Tables<'provenances'>;
type Encounter = Tables<'encounters'>;
type Practitioner = Tables<'practitioners'>;

interface SignAddendumProps {
  provenances: Provenance[];
  chartNoteStatus: ChartNoteStatus;
  encounter: Encounter;
}

interface ProvenanceDisplay {
  practitionerName: string;
  timestamp: string;
}

interface AddendumDisplay {
  authorName: string;
  timestamp: string;
  text: string;
}

export const SignAddendum = ({ provenances, chartNoteStatus, encounter }: SignAddendumProps): JSX.Element | null => {
  const { organizationId } = useAuth();
  const currentUser = useCurrentUser();
  const [provenanceDisplays, setProvenanceDisplays] = useState<ProvenanceDisplay[]>([]);
  const [addendumDisplays, setAddendumDisplays] = useState<AddendumDisplay[]>([]);
  const [addendumText, setAddendumText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load provenance display data, looking up practitioner names from agent_id
  useEffect(() => {
    const loadProvenanceData = async (): Promise<void> => {
      const displays: ProvenanceDisplay[] = [];

      for (const prov of provenances) {
        let practitionerName = 'Unknown Practitioner';
        if (prov.agent_id) {
          const { data } = await supabase
            .from('practitioners')
            .select('given_name, family_name')
            .eq('id', prov.agent_id)
            .single();
          if (data) {
            practitionerName = formatHumanName(data.given_name, data.family_name);
          }
        }

        displays.push({
          practitionerName,
          timestamp: formatDate(prov.created_at),
        });
      }

      setProvenanceDisplays(displays);
    };

    loadProvenanceData().catch(showErrorNotification);
  }, [provenances]);

  // Load addendums (document references for this encounter)
  useEffect(() => {
    const loadAddendums = async (): Promise<void> => {
      try {
        const result = await documentReferenceService.list({
          filters: {
            patient_id: encounter.patient_id,
            category: 'addendum',
          },
          orderBy: { column: 'created_at', ascending: false },
        });

        // Filter to addendums related to this encounter by checking title pattern
        const encounterAddendums = result.data.filter((doc: any) => {
          const title = doc.title as string | null;
          return title?.includes(`encounter:${encounter.id}`);
        });

        const displays: AddendumDisplay[] = encounterAddendums.map((doc: any) => {
          const timestamp = formatDate(doc.created_at);
          // The content_url stores the addendum text for inline addendums
          const text = doc.content_url || '';

          return {
            authorName: doc.title?.replace(`encounter:${encounter.id}:`, '') || 'Unknown Author',
            timestamp,
            text,
          };
        });

        setAddendumDisplays(displays);
      } catch (error) {
        showErrorNotification(error);
      }
    };

    if (encounter.id) {
      loadAddendums().catch(console.error);
    }
  }, [encounter.id, encounter.patient_id]);

  const handleAddAddendum = async (): Promise<void> => {
    if (!organizationId || !currentUser) return;

    setIsSubmitting(true);
    try {
      const authorName = formatHumanName(currentUser.given_name, currentUser.family_name);

      await documentReferenceService.create({
        organization_id: organizationId,
        patient_id: encounter.patient_id,
        status: 'current',
        category: 'addendum',
        content_url: addendumText,
        title: `encounter:${encounter.id}:${authorName}`,
      });

      setAddendumDisplays([
        ...addendumDisplays,
        {
          authorName,
          timestamp: formatDate(new Date().toISOString()),
          text: addendumText,
        },
      ]);
      setAddendumText('');
    } catch (error) {
      showErrorNotification(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (provenanceDisplays.length === 0) {
    return null;
  }

  return (
    <Card withBorder shadow="sm">
      <Stack gap="md">
        {provenanceDisplays.map((display, index) => (
          <Stack key={`prov-${index}`}>
            <Group gap="sm">
              {provenanceDisplays.length - 1 === index && chartNoteStatus === ChartNoteStatus.SignedAndLocked ? (
                <IconLock size={20} />
              ) : (
                <IconSignature size={20} />
              )}
              <Text fw={500}>
                {provenanceDisplays.length - 1 === index && chartNoteStatus === ChartNoteStatus.SignedAndLocked
                  ? 'Signed and Locked by '
                  : 'Signed by '}
                {display.practitionerName}
              </Text>
              <Text c="dimmed" size="sm">
                {display.timestamp}
              </Text>
            </Group>
            <Divider />
          </Stack>
        ))}

        {addendumDisplays.map((addendum, index) => (
          <Stack key={`addendum-${index}`}>
            <Group gap="sm" align="flex-start">
              <IconPencil size={20} />
              <Stack gap="xs" style={{ flex: 1 }}>
                <Group gap="sm">
                  <Text fw={500}>Addendum by {addendum.authorName}</Text>
                  <Text c="dimmed" size="sm">
                    {addendum.timestamp}
                  </Text>
                </Group>
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                  {addendum.text}
                </Text>
              </Stack>
            </Group>
            <Divider />
          </Stack>
        ))}

        <Text fw={600} mt="sm">
          Add Addendum
        </Text>
        <Textarea
          placeholder="Add an addendum to this Visit..."
          value={addendumText}
          onChange={(e) => setAddendumText(e.target.value)}
          autosize
          minRows={3}
          maxRows={6}
        />
        <Group justify="flex-end">
          <Button
            leftSection={<IconPencil size={16} />}
            onClick={handleAddAddendum}
            disabled={!addendumText.trim() || isSubmitting}
            loading={isSubmitting}
          >
            Add Addendum
          </Button>
        </Group>
      </Stack>
    </Card>
  );
};

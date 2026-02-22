// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Autocomplete, Button, Modal, Stack, Text, TextInput } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { useCallback, useEffect, useState } from 'react';
import type { JSX } from 'react';
import type { Tables } from '../../lib/supabase/types';
import { formatHumanName, formatPatientName } from '../../lib/utils';
import { useAuth, useCurrentUser } from '../../providers/AuthProvider';
import { communicationService } from '../../services/communication.service';
import { patientService } from '../../services/patient.service';
import { supabase } from '../../lib/supabase/client';
import { showErrorNotification } from '../../utils/notifications';

type Communication = Tables<'communications'>;
type Patient = Tables<'patients'>;

interface NewTopicDialogProps {
  patientId?: string | undefined;
  opened: boolean;
  onClose: () => void;
  onSubmit?: (communication: Communication) => void;
}

export const NewTopicDialog = (props: NewTopicDialogProps): JSX.Element => {
  const { patientId: defaultPatientId, opened, onClose, onSubmit } = props;
  const { organizationId } = useAuth();
  const currentUser = useCurrentUser();

  const [topic, setTopic] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(defaultPatientId);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientOptions, setPatientOptions] = useState<{ value: string; label: string }[]>([]);
  const [practitionerSearch, setPractitionerSearch] = useState('');
  const [practitionerOptions, setPractitionerOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default patient name
  useEffect(() => {
    if (defaultPatientId) {
      setSelectedPatientId(defaultPatientId);
      patientService
        .getById(defaultPatientId)
        .then((p) => setPatientSearch(formatPatientName(p as Patient)))
        .catch(console.error);
    }
  }, [defaultPatientId]);

  // Add current user as default recipient
  useEffect(() => {
    if (currentUser) {
      setSelectedRecipientIds([currentUser.id]);
    }
  }, [currentUser]);

  const searchPatients = useCallback(async (query: string): Promise<void> => {
    if (!query.trim() || query.length < 2) {
      setPatientOptions([]);
      return;
    }
    try {
      const patients = await patientService.search(query);
      setPatientOptions(
        patients.map((p: Patient) => ({
          value: p.id,
          label: formatPatientName(p),
        }))
      );
    } catch (err) {
      showErrorNotification(err);
    }
  }, []);

  const searchPractitioners = useCallback(async (query: string): Promise<void> => {
    if (!query.trim() || query.length < 2) {
      setPractitionerOptions([]);
      return;
    }
    const { data } = await supabase
      .from('practitioners')
      .select('id, given_name, family_name')
      .or(`family_name.ilike.%${query}%,given_name.ilike.%${query}%`)
      .limit(10);

    if (data) {
      setPractitionerOptions(
        data.map((p) => ({
          value: p.id,
          label: formatHumanName(p.given_name, p.family_name),
        }))
      );
    }
  }, []);

  const handleSubmit = async (): Promise<void> => {
    if (!selectedPatientId) {
      showNotification({
        title: 'Error',
        message: 'Please select a patient',
        color: 'red',
      });
      return;
    }

    if (!organizationId) {
      showNotification({
        title: 'Error',
        message: 'Organization not configured',
        color: 'red',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const newCommunication = await communicationService.sendMessage({
        organization_id: organizationId,
        status: 'in-progress',
        patient_id: selectedPatientId,
        sender_id: currentUser?.id ?? null,
        recipient_ids: selectedRecipientIds.length > 0 ? selectedRecipientIds : null,
        topic: topic || null,
        payload_text: null,
      });

      onSubmit?.(newCommunication as Communication);
      onClose();

      // Reset form
      setTopic('');
      if (!defaultPatientId) {
        setSelectedPatientId(undefined);
        setPatientSearch('');
      }
    } catch (error) {
      showErrorNotification(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="New Message" size="md">
      <Stack gap="xl">
        <Stack gap={0}>
          <Text fw={500}>Patient</Text>
          <Text c="dimmed" size="sm">
            Select a patient
          </Text>
          <Autocomplete
            placeholder="Search patients..."
            value={patientSearch}
            onChange={(value) => {
              setPatientSearch(value);
              searchPatients(value).catch(console.error);
            }}
            onOptionSubmit={(value) => {
              const selected = patientOptions.find((o) => o.label === value);
              if (selected) {
                setSelectedPatientId(selected.value);
                setPatientSearch(selected.label);
              }
            }}
            data={patientOptions.map((o) => o.label)}
            disabled={!!defaultPatientId}
          />
        </Stack>

        <Stack gap={0}>
          <Text fw={500}>Practitioner (optional)</Text>
          <Text c="dimmed" size="sm">
            Add a practitioner recipient
          </Text>
          <Autocomplete
            placeholder="Search practitioners..."
            value={practitionerSearch}
            onChange={(value) => {
              setPractitionerSearch(value);
              searchPractitioners(value).catch(console.error);
            }}
            onOptionSubmit={(value) => {
              const selected = practitionerOptions.find((o) => o.label === value);
              if (selected && !selectedRecipientIds.includes(selected.value)) {
                setSelectedRecipientIds((prev) => [...prev, selected.value]);
              }
              setPractitionerSearch('');
            }}
            data={practitionerOptions.map((o) => o.label)}
          />
        </Stack>

        <Stack gap={0}>
          <Text fw={500}>Topic (optional)</Text>
          <Text c="dimmed" size="sm">
            Enter a topic for the message
          </Text>
          <TextInput placeholder="Enter your topic" value={topic} onChange={(e) => setTopic(e.target.value)} />
        </Stack>

        <Button onClick={handleSubmit} loading={isSubmitting}>
          Next
        </Button>
      </Stack>
    </Modal>
  );
};

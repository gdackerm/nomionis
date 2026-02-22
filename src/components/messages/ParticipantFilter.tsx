// SPDX-FileCopyrightText: Copyright Orangebot, Inc.
// SPDX-License-Identifier: Apache-2.0

import { ActionIcon, Avatar, Checkbox, CloseButton, Group, Popover, Stack, Text, TextInput } from '@mantine/core';
import { useDebouncedCallback, useDisclosure } from '@mantine/hooks';
import { IconUsers } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import type { JSX } from 'react';
import { useAuth, useCurrentUser } from '../../providers/AuthProvider';
import { supabase } from '../../lib/supabase/client';
import { formatHumanName, formatPatientName, getInitials } from '../../lib/utils';
import { showErrorNotification } from '../../utils/notifications';
import classes from './ParticipantFilter.module.css';

export interface Participant {
  id: string;
  name: string;
  type: 'patient' | 'practitioner';
}

interface ParticipantFilterProps {
  selectedParticipants: Participant[];
  onFilterChange: (participants: Participant[]) => void;
}

export function ParticipantFilter(props: ParticipantFilterProps): JSX.Element {
  const { selectedParticipants, onFilterChange } = props;
  const [opened, { open, close }] = useDisclosure(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Participant[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [additionalParticipants, setAdditionalParticipants] = useState<Participant[]>([]);
  const { organizationId } = useAuth();
  const currentUser = useCurrentUser();

  // Current user participant - always shown at top
  const currentUserParticipant = useMemo((): Participant | undefined => {
    if (!currentUser) {
      return undefined;
    }
    return {
      id: currentUser.id,
      name: formatHumanName(currentUser.given_name, currentUser.family_name),
      type: 'practitioner',
    };
  }, [currentUser]);

  // Filter additional participants (excluding current user)
  useEffect(() => {
    const currentUserId = currentUserParticipant?.id;
    const filtered = selectedParticipants.filter((p) => p.id !== currentUserId);
    setAdditionalParticipants(filtered);
  }, [selectedParticipants, currentUserParticipant]);

  const debouncedSearch = useDebouncedCallback(async (query: string): Promise<void> => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results: Participant[] = [];
      const currentUserId = currentUserParticipant?.id;
      const searchPattern = `%${query}%`;

      // Search patients
      const { data: patients, error: patientError } = await supabase
        .from('patients')
        .select('id, given_name, family_name')
        .or(`family_name.ilike.${searchPattern},given_name.cs.{${query}}`)
        .limit(5);

      if (patientError) {
        throw patientError;
      }

      for (const patient of patients ?? []) {
        results.push({
          id: patient.id,
          name: formatPatientName(patient),
          type: 'patient',
        });
      }

      // Search practitioners
      let practitionerQuery = supabase
        .from('practitioners')
        .select('id, given_name, family_name')
        .or(`family_name.ilike.${searchPattern},given_name.ilike.${searchPattern}`)
        .limit(5);

      if (organizationId) {
        practitionerQuery = practitionerQuery.eq('organization_id', organizationId);
      }

      const { data: practitioners, error: practitionerError } = await practitionerQuery;

      if (practitionerError) {
        throw practitionerError;
      }

      for (const practitioner of practitioners ?? []) {
        if (practitioner.id === currentUserId) {
          continue;
        }
        results.push({
          id: practitioner.id,
          name: formatHumanName(practitioner.given_name, practitioner.family_name),
          type: 'practitioner',
        });
      }

      setSearchResults(results);
    } catch (error) {
      showErrorNotification(error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, 300);

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const isSelected = (participant: Participant): boolean => {
    return selectedParticipants.some((p) => p.id === participant.id);
  };

  const toggleParticipant = (participant: Participant): void => {
    const newParticipants = isSelected(participant)
      ? selectedParticipants.filter((p) => p.id !== participant.id)
      : [...selectedParticipants, participant];

    onFilterChange(newParticipants);
  };

  const removeParticipant = (participant: Participant): void => {
    const newParticipants = selectedParticipants.filter((p) => p.id !== participant.id);
    onFilterChange(newParticipants);
  };

  // Build display list: additional selected first, then search results
  const displayParticipants = useMemo(() => {
    const result: Participant[] = [];

    for (const p of additionalParticipants) {
      if (!result.some((r) => r.id === p.id)) {
        result.push(p);
      }
    }

    if (searchQuery.trim() && searchResults.length > 0) {
      for (const p of searchResults) {
        if (currentUserParticipant?.id === p.id) {
          continue;
        }
        if (!result.some((r) => r.id === p.id)) {
          result.push(p);
        }
      }
    }

    return result;
  }, [additionalParticipants, searchQuery, searchResults, currentUserParticipant]);

  const hasActiveFilter = selectedParticipants.length > 0;

  return (
    <Popover
      opened={opened}
      onChange={(o) => !o && close()}
      position="bottom-start"
      width={360}
      shadow="md"
      withinPortal
    >
      <Popover.Target>
        <ActionIcon
          variant={hasActiveFilter ? 'filled' : 'light'}
          color={hasActiveFilter ? 'blue' : 'gray'}
          onClick={opened ? close : open}
          radius="xl"
          size="lg"
        >
          <IconUsers size={18} />
        </ActionIcon>
      </Popover.Target>

      <Popover.Dropdown p="md">
        <Stack gap="md">
          <Text fw={600} size="sm">
            Message Participants
          </Text>

          <TextInput
            placeholder="Search for a Patient or Practitioner..."
            value={searchQuery}
            autoFocus
            onChange={(e) => setSearchQuery(e.target.value)}
            rightSection={searchQuery ? <CloseButton size="sm" onClick={() => setSearchQuery('')} /> : null}
          />

          <Stack gap="xs" mah={250} style={{ overflowY: 'auto' }}>
            {currentUserParticipant && (
              <ParticipantItem
                participant={currentUserParticipant}
                isSelected={isSelected(currentUserParticipant)}
                isCurrentUser={true}
                onToggle={() => toggleParticipant(currentUserParticipant)}
              />
            )}

            {displayParticipants.map((participant) => (
              <ParticipantItem
                key={participant.id}
                participant={participant}
                isSelected={isSelected(participant)}
                isCurrentUser={false}
                onToggle={() => toggleParticipant(participant)}
                onRemove={isSelected(participant) ? () => removeParticipant(participant) : undefined}
              />
            ))}

            {isSearching && (
              <Text size="sm" c="dimmed" ta="center">
                Searching...
              </Text>
            )}
            {searchQuery.trim() && !isSearching && searchResults.length === 0 && (
              <Text size="sm" c="dimmed" ta="center">
                No results found
              </Text>
            )}
          </Stack>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

interface ParticipantItemProps {
  participant: Participant;
  isSelected: boolean;
  isCurrentUser: boolean;
  onToggle: () => void;
  onRemove?: () => void;
}

function ParticipantItem(props: ParticipantItemProps): JSX.Element {
  const { participant, isSelected, isCurrentUser, onToggle, onRemove } = props;

  const initials = (() => {
    const parts = participant.name.split(' ');
    const first = parts[0]?.[0]?.toUpperCase() ?? '';
    const last = parts[parts.length - 1]?.[0]?.toUpperCase() ?? '';
    return first + (parts.length > 1 ? last : '');
  })();

  return (
    <Group justify="space-between" wrap="nowrap" className={classes.participantItem}>
      <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
        <Checkbox checked={isSelected} onChange={onToggle} />
        <Avatar radius="xl" size={32} color={participant.type === 'patient' ? 'blue' : 'green'}>
          {initials}
        </Avatar>
        <Text size="sm" truncate style={{ flex: 1 }}>
          {participant.name}
          {isCurrentUser && (
            <Text component="span" c="dimmed" size="sm">
              {' '}
              (you)
            </Text>
          )}
        </Text>
      </Group>
      {onRemove && <CloseButton size="sm" onClick={onRemove} />}
    </Group>
  );
}

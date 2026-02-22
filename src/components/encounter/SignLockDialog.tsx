// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Avatar, Button, Group, Paper, Stack, Text } from '@mantine/core';
import { IconLock, IconSignature } from '@tabler/icons-react';
import type { JSX } from 'react';
import { formatHumanName, getInitials } from '../../lib/utils';
import { useCurrentUser } from '../../providers/AuthProvider';
import { showErrorNotification } from '../../utils/notifications';

interface SignLockDialogProps {
  onSign: (practitionerId: string, lock: boolean) => void;
}

export const SignLockDialog = (props: SignLockDialogProps): JSX.Element => {
  const { onSign } = props;
  const practitioner = useCurrentUser();

  const handleSign = (lock: boolean): void => {
    if (!practitioner) {
      showErrorNotification('No author information found');
      return;
    }

    onSign(practitioner.id, lock);
  };

  const displayName = practitioner
    ? formatHumanName(practitioner.given_name, practitioner.family_name)
    : 'Unknown';

  const initials = practitioner
    ? getInitials(practitioner.given_name, practitioner.family_name)
    : '?';

  return (
    <Stack gap="md">
      <Paper p="sm" withBorder radius="md">
        <Group gap="sm">
          <Avatar radius="xl" size={36} color="blue">
            {initials}
          </Avatar>
          <Text size="sm" fw={500}>
            {displayName}
          </Text>
        </Group>
      </Paper>

      <Stack gap={0}>
        <Button fullWidth leftSection={<IconLock size={18} />} onClick={() => handleSign(true)} mt="md">
          Sign & Lock Note
        </Button>

        <Button
          variant="outline"
          fullWidth
          leftSection={<IconSignature size={18} />}
          onClick={() => handleSign(false)}
          mt="md"
        >
          Just Sign
        </Button>
      </Stack>
    </Stack>
  );
};

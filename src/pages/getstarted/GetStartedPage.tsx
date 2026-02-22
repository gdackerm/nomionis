import {
  Box,
  Button,
  Card,
  Container,
  Group,
  List,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IconBook,
  IconCalendarEvent,
  IconClipboardCheck,
  IconStethoscope,
  IconUserPlus,
  IconUsers,
} from '@tabler/icons-react';
import type { JSX } from 'react';
import { useNavigate } from 'react-router';

interface GetStartedPageProps {
  onDismiss?: () => void;
}

export function GetStartedPage({ onDismiss }: GetStartedPageProps = {}): JSX.Element {
  const navigate = useNavigate();

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={2}>Welcome to Nomionis</Title>
          <Text c="dimmed" mt="xs">
            Get started by exploring the key features of your EHR system.
          </Text>
        </div>

        <Group grow>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <Group>
                <IconUserPlus size={24} />
                <Text fw={600}>Register a Patient</Text>
              </Group>
              <Text size="sm" c="dimmed">
                Start by onboarding a new patient using the intake form.
              </Text>
              <Button
                variant="light"
                onClick={() => navigate('/onboarding')?.catch(console.error)}
              >
                New Patient
              </Button>
            </Stack>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <Group>
                <IconUsers size={24} />
                <Text fw={600}>View Patients</Text>
              </Group>
              <Text size="sm" c="dimmed">
                Browse and search your patient list.
              </Text>
              <Button
                variant="light"
                onClick={() => navigate('/Patient')?.catch(console.error)}
              >
                Patient List
              </Button>
            </Stack>
          </Card>
        </Group>

        <Group grow>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <Group>
                <IconCalendarEvent size={24} />
                <Text fw={600}>Schedule</Text>
              </Group>
              <Text size="sm" c="dimmed">
                View and manage your appointment calendar.
              </Text>
              <Button
                variant="light"
                onClick={() => navigate('/schedule')?.catch(console.error)}
              >
                View Schedule
              </Button>
            </Stack>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <Group>
                <IconClipboardCheck size={24} />
                <Text fw={600}>Tasks</Text>
              </Group>
              <Text size="sm" c="dimmed">
                Manage your tasks and to-dos.
              </Text>
              <Button
                variant="light"
                onClick={() => navigate('/Task')?.catch(console.error)}
              >
                View Tasks
              </Button>
            </Stack>
          </Card>
        </Group>

        {onDismiss && (
          <Group justify="center">
            <Button variant="subtle" onClick={onDismiss}>
              Dismiss this page
            </Button>
          </Group>
        )}
      </Stack>
    </Container>
  );
}

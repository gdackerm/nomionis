import { Button, Card, Center, Stack, Text, Title } from '@mantine/core';
import { IconBrandGoogle } from '@tabler/icons-react';
import type { JSX } from 'react';
import { useAuth } from '../providers/AuthProvider';

export function SignInPage(): JSX.Element {
  const { signInWithGoogle } = useAuth();

  return (
    <Center h="100vh">
      <Card shadow="md" padding="xl" radius="md" w={400}>
        <Stack align="center" gap="lg">
          <Title order={2}>Nomionis</Title>
          <Text c="dimmed" size="sm" ta="center">
            Sign in to access the provider portal
          </Text>
          <Button
            leftSection={<IconBrandGoogle size={18} />}
            variant="default"
            size="md"
            fullWidth
            onClick={() => signInWithGoogle()}
          >
            Sign in with Google
          </Button>
        </Stack>
      </Card>
    </Center>
  );
}

import {
  Alert,
  Anchor,
  Box,
  Button,
  Card,
  Center,
  Group,
  PasswordInput,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconAlertCircle, IconStethoscope } from '@tabler/icons-react';
import type { JSX } from 'react';
import { useState } from 'react';
import { useAuth } from '../providers/AuthProvider';

export function SignInPage(): JSX.Element {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<string>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [givenName, setGivenName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmitSignIn = email.trim() !== '' && password.length >= 6;
  const canSubmitSignUp =
    email.trim() !== '' &&
    password.length >= 6 &&
    givenName.trim() !== '' &&
    familyName.trim() !== '';

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleSignUp = async () => {
    setError(null);
    setLoading(true);
    const result = await signUp(email, password, givenName, familyName);
    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (mode === 'signin' && canSubmitSignIn) {
        handleSignIn();
      } else if (mode === 'signup' && canSubmitSignUp) {
        handleSignUp();
      }
    }
  };

  return (
    <Box
      h="100vh"
      style={{
        background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)',
      }}
    >
      <Center h="100%">
        <Stack align="center" gap="md">
          <Card shadow="lg" padding={32} radius="lg" w={420} withBorder>
            <Stack align="center" gap="lg">
              <ThemeIcon size={56} radius="xl" variant="light" color="blue">
                <IconStethoscope size={30} />
              </ThemeIcon>
              <Stack align="center" gap={4}>
                <Title order={2}>Nomionis</Title>
                <Text c="dimmed" size="sm" ta="center">
                  Sign in to access the provider portal
                </Text>
              </Stack>
              <SegmentedControl
                value={mode}
                onChange={(v) => {
                  setMode(v);
                  setError(null);
                }}
                data={[
                  { label: 'Sign In', value: 'signin' },
                  { label: 'Sign Up', value: 'signup' },
                ]}
                fullWidth
              />
              {error && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  color="red"
                  w="100%"
                  variant="light"
                >
                  {error}
                </Alert>
              )}
              <Stack w="100%" gap="sm" onKeyDown={handleKeyDown}>
                {mode === 'signup' && (
                  <Group grow>
                    <TextInput
                      label="First Name"
                      placeholder="First name"
                      value={givenName}
                      onChange={(e) => setGivenName(e.currentTarget.value)}
                      required
                    />
                    <TextInput
                      label="Last Name"
                      placeholder="Last name"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.currentTarget.value)}
                      required
                    />
                  </Group>
                )}
                <TextInput
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  required
                />
                <PasswordInput
                  label="Password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                  required
                />
                {mode === 'signin' && (
                  <Group justify="flex-end">
                    <Anchor size="xs" c="dimmed">
                      Forgot password?
                    </Anchor>
                  </Group>
                )}
              </Stack>
              {mode === 'signin' ? (
                <Button
                  size="md"
                  fullWidth
                  loading={loading}
                  disabled={!canSubmitSignIn}
                  onClick={handleSignIn}
                >
                  Sign In
                </Button>
              ) : (
                <Button
                  size="md"
                  fullWidth
                  loading={loading}
                  disabled={!canSubmitSignUp}
                  onClick={handleSignUp}
                >
                  Create Account
                </Button>
              )}
            </Stack>
          </Card>
          <Text size="xs" c="dimmed">
            &copy; {new Date().getFullYear()} Nomionis
          </Text>
        </Stack>
      </Center>
    </Box>
  );
}

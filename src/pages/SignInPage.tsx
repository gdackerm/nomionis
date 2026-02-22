import { Alert, Button, Card, Center, PasswordInput, SegmentedControl, Stack, Text, TextInput, Title } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
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

  return (
    <Center h="100vh">
      <Card shadow="md" padding="xl" radius="md" w={400}>
        <Stack align="center" gap="lg">
          <Title order={2}>Nomionis</Title>
          <Text c="dimmed" size="sm" ta="center">
            Sign in to access the provider portal
          </Text>
          <SegmentedControl
            value={mode}
            onChange={(v) => { setMode(v); setError(null); }}
            data={[
              { label: 'Sign In', value: 'signin' },
              { label: 'Sign Up', value: 'signup' },
            ]}
            fullWidth
          />
          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" w="100%">
              {error}
            </Alert>
          )}
          {mode === 'signup' && (
            <>
              <TextInput
                label="First Name"
                placeholder="First name"
                value={givenName}
                onChange={(e) => setGivenName(e.currentTarget.value)}
                w="100%"
                required
              />
              <TextInput
                label="Last Name"
                placeholder="Last name"
                value={familyName}
                onChange={(e) => setFamilyName(e.currentTarget.value)}
                w="100%"
                required
              />
            </>
          )}
          <TextInput
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            w="100%"
            required
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            w="100%"
            required
          />
          {mode === 'signin' ? (
            <Button size="md" fullWidth loading={loading} onClick={handleSignIn}>
              Sign In
            </Button>
          ) : (
            <Button size="md" fullWidth loading={loading} onClick={handleSignUp}>
              Create Account
            </Button>
          )}
        </Stack>
      </Card>
    </Center>
  );
}

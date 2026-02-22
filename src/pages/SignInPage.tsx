import {
  Alert,
  Anchor,
  Box,
  Button,
  Card,
  Center,
  Divider,
  Group,
  List,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconArrowRight,
  IconBrain,
  IconHeartRateMonitor,
  IconReportMedical,
  IconStethoscope,
} from '@tabler/icons-react';
import type { JSX } from 'react';
import { useState } from 'react';
import { useAuth } from '../providers/AuthProvider';

function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function MicrosoftLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 21 21">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

const VALUE_PROPS = [
  {
    icon: IconHeartRateMonitor,
    text: 'What changed since last visit',
  },
  {
    icon: IconAlertCircle,
    text: 'Risks identified today',
  },
  {
    icon: IconReportMedical,
    text: 'Care gaps detected',
  },
  {
    icon: IconBrain,
    text: 'Draft plan prepared',
  },
];

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
    <Box h="100vh" style={{ display: 'flex' }}>
      {/* Left panel — value proposition */}
      <Box
        visibleFrom="md"
        style={{
          flex: 1,
          background: 'linear-gradient(135deg, #1864ab 0%, #228be6 60%, #339af0 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 64,
          paddingBottom: 180,
        }}
      >
        <Stack gap={32} maw={480}>
          <Group gap="md">
            <ThemeIcon size={56} radius="xl" variant="white" color="blue">
              <IconStethoscope size={30} />
            </ThemeIcon>
            <Title c="white" fw={700} fz={34}>
              Nomionis
            </Title>
          </Group>

          <Stack gap="sm">
            <Title c="white" fw={600} fz={30}>
              AI-native clinical intelligence
            </Title>
            <Text c="rgba(255,255,255,0.85)" fz={18} lh={1.7}>
              Not AI bolted onto an EHR. A system built from the ground up
              where intelligence is the interface.
            </Text>
          </Stack>

          <Stack gap="md">
            <Text c="rgba(255,255,255,0.6)" fz={13} fw={600} tt="uppercase" lts={1.5}>
              When you open a patient chart, you see
            </Text>
            <List spacing="lg" center>
              {VALUE_PROPS.map((item) => (
                <List.Item
                  key={item.text}
                  icon={
                    <ThemeIcon size={38} radius="md" variant="light" color="rgba(255,255,255,0.15)">
                      <item.icon size={20} color="white" />
                    </ThemeIcon>
                  }
                >
                  <Text c="white" fw={500} fz={17}>
                    {item.text}
                  </Text>
                </List.Item>
              ))}
            </List>
          </Stack>

          <Group gap={8} mt={8}>
            <Text c="rgba(255,255,255,0.85)" fz={15} fw={500}>
              No tabs. No hunting. Just what matters right now.
            </Text>
            <IconArrowRight size={16} color="rgba(255,255,255,0.85)" />
          </Group>
        </Stack>
      </Box>

      {/* Right panel — auth form */}
      <Box
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)',
          minWidth: 0,
        }}
      >
        <Center w="100%" px="md">
          <Stack align="center" gap="md" w="100%" maw={420}>
            {/* Mobile-only header (hidden on desktop where left panel shows) */}
            <Stack align="center" gap={4} hiddenFrom="md">
              <ThemeIcon size={56} radius="xl" variant="light" color="blue">
                <IconStethoscope size={30} />
              </ThemeIcon>
              <Title order={2}>Nomionis</Title>
              <Text c="dimmed" size="xs" ta="center">
                AI-native clinical intelligence
              </Text>
            </Stack>

            <Card shadow="lg" padding={32} radius="lg" w="100%" withBorder>
              <Stack gap="lg">
                <Stack align="center" gap={4}>
                  <Title order={3}>Welcome</Title>
                  <Text c="dimmed" size="sm" ta="center">
                    {mode === 'signin'
                      ? 'Sign in to access the provider portal'
                      : 'Create your account to get started'}
                  </Text>
                </Stack>

                {/* SSO buttons */}
                <Stack gap="xs">
                  <Button
                    variant="default"
                    size="md"
                    fullWidth
                    leftSection={<GoogleLogo />}
                    onClick={() => {}}
                    styles={{ inner: { justifyContent: 'center' } }}
                  >
                    Continue with Google
                  </Button>
                  <Button
                    variant="default"
                    size="md"
                    fullWidth
                    leftSection={<MicrosoftLogo />}
                    onClick={() => {}}
                    styles={{ inner: { justifyContent: 'center' } }}
                  >
                    Continue with Microsoft
                  </Button>
                </Stack>

                <Divider label="or continue with email" labelPosition="center" />

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

                <Text size="xs" c="dimmed" ta="center">
                  {mode === 'signin' ? (
                    <>
                      Don&apos;t have an account?{' '}
                      <Anchor size="xs" onClick={() => { setMode('signup'); setError(null); }}>
                        Sign up
                      </Anchor>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <Anchor size="xs" onClick={() => { setMode('signin'); setError(null); }}>
                        Sign in
                      </Anchor>
                    </>
                  )}
                </Text>
              </Stack>
            </Card>
            <Text size="xs" c="dimmed">
              &copy; {new Date().getFullYear()} Nomionis
            </Text>
          </Stack>
        </Center>
      </Box>
    </Box>
  );
}

import {
  Alert,
  Anchor,
  Box,
  Button,
  Card,
  Center,
  Group,
  List,
  PasswordInput,
  SegmentedControl,
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
          padding: 48,
        }}
      >
        <Stack gap="xl" maw={440}>
          <Group gap="sm">
            <ThemeIcon size={44} radius="xl" variant="white" color="blue">
              <IconStethoscope size={24} />
            </ThemeIcon>
            <Title order={2} c="white" fw={700}>
              Nomionis
            </Title>
          </Group>

          <Stack gap="xs">
            <Title order={3} c="white" fw={600}>
              AI-native clinical intelligence
            </Title>
            <Text c="rgba(255,255,255,0.8)" size="md" lh={1.6}>
              Not AI bolted onto an EHR. A system built from the ground up
              where intelligence is the interface.
            </Text>
          </Stack>

          <Stack gap="xs">
            <Text c="rgba(255,255,255,0.65)" size="xs" fw={600} tt="uppercase" lts={1}>
              When you open a patient chart, you see
            </Text>
            <List spacing="sm" center>
              {VALUE_PROPS.map((item) => (
                <List.Item
                  key={item.text}
                  icon={
                    <ThemeIcon size={28} radius="md" variant="light" color="rgba(255,255,255,0.2)">
                      <item.icon size={16} color="white" />
                    </ThemeIcon>
                  }
                >
                  <Text c="white" fw={500} size="sm">
                    {item.text}
                  </Text>
                </List.Item>
              ))}
            </List>
          </Stack>

          <Group gap={6}>
            <Text c="rgba(255,255,255,0.65)" size="xs">
              No tabs. No hunting. Just what matters right now.
            </Text>
            <IconArrowRight size={14} color="rgba(255,255,255,0.65)" />
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
              <Stack align="center" gap="lg">
                <Stack align="center" gap={4}>
                  <Title order={3} hiddenFrom="md">
                    Welcome
                  </Title>
                  <Title order={3} visibleFrom="md">
                    Welcome
                  </Title>
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
    </Box>
  );
}

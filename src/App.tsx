import {
  AppShell,
  Burger,
  Group,
  Loader,
  NavLink,
  ScrollArea,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconBook2,
  IconCalendarEvent,
  IconClipboardCheck,
  IconLogout,
  IconMail,
  IconSettingsAutomation,
  IconUserPlus,
  IconUsers,
} from '@tabler/icons-react';
import type { JSX } from 'react';
import { Suspense, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router';
import './index.css';
import { useAuth } from './providers/AuthProvider';

import { EncounterChartPage } from './pages/encounter/EncounterChartPage';
import { EncounterModal } from './pages/encounter/EncounterModal';
import { IntegrationsPage } from './pages/integrations/IntegrationsPage';
import { MessagesPage } from './pages/messages/MessagesPage';
import { CommunicationTab } from './pages/patient/CommunicationTab';
import { EditTab } from './pages/patient/EditTab';
import { IntakeFormPage } from './pages/patient/IntakeFormPage';
import { PatientPage } from './pages/patient/PatientPage';
import { PatientListPage } from './pages/patient/PatientListPage';
import { TasksTab } from './pages/patient/TasksTab';
import { TimelineTab } from './pages/patient/TimelineTab';
import { SchedulePage } from './pages/schedule/SchedulePage';
import { SignInPage } from './pages/SignInPage';
import { SpacesPage } from './pages/spaces/SpacesPage';
import { TasksPage } from './pages/tasks/TasksPage';
import { GetStartedPage } from './pages/getstarted/GetStartedPage';

const SETUP_DISMISSED_KEY = 'nomionis-setup-dismissed';

export function App(): JSX.Element | null {
  const { practitioner, loading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [opened, { toggle }] = useDisclosure();
  const [setupDismissed, setSetupDismissed] = useState(
    () => localStorage.getItem(SETUP_DISMISSED_KEY) === 'true'
  );

  const handleDismissSetup = (): void => {
    localStorage.setItem(SETUP_DISMISSED_KEY, 'true');
    setSetupDismissed(true);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loader />
      </div>
    );
  }

  if (!practitioner) {
    return (
      <Routes>
        <Route path="/signin" element={<SignInPage />} />
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    );
  }

  const navLinks = [
    { icon: <IconBook2 size={20} />, label: 'Spaces', href: '/Spaces/Communication' },
    { icon: <IconUsers size={20} />, label: 'Patients', href: '/Patient' },
    { icon: <IconCalendarEvent size={20} />, label: 'Schedule', href: '/schedule' },
    { icon: <IconMail size={20} />, label: 'Messages', href: '/Communication' },
    { icon: <IconClipboardCheck size={20} />, label: 'Tasks', href: '/Task' },
  ];

  const quickLinks = [
    ...(!setupDismissed
      ? [{ icon: <IconSettingsAutomation size={20} />, label: 'Get Started', href: '/getstarted' }]
      : []),
    { icon: <IconUserPlus size={20} />, label: 'New Patient', href: '/onboarding' },
  ];

  const isActive = (href: string) => location.pathname.startsWith(href);

  return (
    <AppShell
      header={{ height: 50 }}
      navbar={{ width: 220, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="0"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text fw={700} size="lg">Nomionis</Text>
          </Group>
          <Group>
            <Text size="sm" c="dimmed">
              {practitioner.given_name} {practitioner.family_name}
            </Text>
            <UnstyledButton
              onClick={() => { signOut(); }}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <IconLogout size={18} />
            </UnstyledButton>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        <AppShell.Section grow component={ScrollArea}>
          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              label={link.label}
              leftSection={link.icon}
              active={isActive(link.href)}
              onClick={() => navigate(link.href)?.catch(console.error)}
              variant="light"
            />
          ))}
          <Text size="xs" fw={500} c="dimmed" mt="md" mb="xs" px="sm">
            Quick Links
          </Text>
          {quickLinks.map((link) => (
            <NavLink
              key={link.href}
              label={link.label}
              leftSection={link.icon}
              active={isActive(link.href)}
              onClick={() => navigate(link.href)?.catch(console.error)}
              variant="light"
            />
          ))}
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route
              path="/"
              element={
                <Navigate to={setupDismissed ? '/Patient' : '/getstarted'} replace />
              }
            />
            <Route path="/getstarted" element={<GetStartedPage onDismiss={handleDismissSetup} />} />
            <Route path="/Spaces/Communication" element={<SpacesPage />}>
              <Route index element={<SpacesPage />} />
              <Route path=":topicId" element={<SpacesPage />} />
            </Route>
            <Route path="/Patient" element={<PatientListPage />} />
            <Route path="/Patient/:patientId" element={<PatientPage />}>
              <Route path="Encounter/new" element={<EncounterModal />} />
              <Route path="Encounter/:encounterId" element={<EncounterChartPage />} />
              <Route path="edit" element={<EditTab />} />
              <Route path="Communication" element={<CommunicationTab />} />
              <Route path="Communication/:messageId" element={<CommunicationTab />} />
              <Route path="Task" element={<TasksTab />} />
              <Route path="Task/:taskId" element={<TasksTab />} />
              <Route path="timeline" element={<TimelineTab />} />
              <Route path="" element={<TimelineTab />} />
            </Route>
            <Route path="/Communication" element={<MessagesPage />}>
              <Route index element={<MessagesPage />} />
              <Route path=":messageId" element={<MessagesPage />} />
            </Route>
            <Route path="Task" element={<TasksPage />} />
            <Route path="Task/:taskId" element={<TasksPage />} />
            <Route path="/onboarding" element={<IntakeFormPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
          </Routes>
        </Suspense>
      </AppShell.Main>
    </AppShell>
  );
}

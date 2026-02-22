// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

import {
  Flex,
  Paper,
  ScrollArea,
  Stack,
  Text,
  ActionIcon,
  Divider,
  Button,
  Center,
  ThemeIcon,
  Menu,
  Skeleton,
  Box,
  Pagination,
  Group,
  TextInput,
  Loader,
} from '@mantine/core';
import type { Tables } from '../../lib/supabase/types';
import { PatientSummary } from '../PatientSummary';
import { useCallback, useEffect, useState } from 'react';
import type { JSX } from 'react';
import { IconMessageCircle, IconChevronDown, IconPlus, IconSend } from '@tabler/icons-react';
import { ChatList } from './ChatList';
import { NewTopicDialog } from './NewTopicDialog';
import { useThreadInbox } from '../../hooks/useThreadInbox';
import classes from './ThreadInbox.module.css';
import { useDisclosure } from '@mantine/hooks';
import { showErrorNotification } from '../../utils/notifications';
import cx from 'clsx';
import { Link } from 'react-router';
import { communicationService } from '../../services/communication.service';
import { patientService } from '../../services/patient.service';
import { formatDateTime } from '../../lib/utils';
import { useAuth } from '../../providers/AuthProvider';

type Communication = Tables<'communications'>;
type Patient = Tables<'patients'>;

/**
 * ThreadInbox is a component that displays a list of threads and allows the user to select a thread to view.
 * @param filters - Filters to fetch communications.
 * @param threadId - The id of the thread to select.
 * @param patientId - The default patient ID when creating a new thread.
 * @param showPatientSummary - Whether to show the patient summary.
 * @param onNew - A function to handle a new thread.
 * @param getThreadUri - A function to build thread URIs.
 * @param onChange - A function to handle filter changes.
 * @param inProgressUri - The URI for in-progress threads.
 * @param completedUri - The URI for completed threads.
 */

interface ThreadInboxProps {
  filters?: Record<string, unknown>;
  threadId: string | undefined;
  patientId?: string | undefined;
  showPatientSummary?: boolean | undefined;
  onNew: (message: Communication) => void;
  getThreadUri: (topic: Communication) => string;
  onChange: (filters: Record<string, unknown>) => void;
  inProgressUri: string;
  completedUri: string;
}

export function ThreadInbox(props: ThreadInboxProps): JSX.Element {
  const {
    filters,
    threadId,
    patientId,
    showPatientSummary = false,
    onNew,
    getThreadUri,
    onChange,
    inProgressUri,
    completedUri,
  } = props;

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const itemsPerPage = (filters?._count as number) ?? 20;
  const currentOffset = (filters?._offset as number) ?? 0;
  const currentPage = Math.floor(currentOffset / itemsPerPage) + 1;
  const status = (filters?.status as string) || 'in-progress';

  const {
    loading,
    error,
    threadMessages,
    selectedThread,
    total,
    handleThreadStatusChange,
    addThreadMessage,
    refreshThreadMessages,
  } = useThreadInbox({
    filters,
    threadId,
  });

  // Patient data for the patient summary sidebar
  const [sidebarPatient, setSidebarPatient] = useState<Patient | undefined>(undefined);

  useEffect(() => {
    if (selectedThread?.patient_id && showPatientSummary) {
      patientService
        .getById(selectedThread.patient_id)
        .then((p) => setSidebarPatient(p as Patient))
        .catch(console.error);
    } else {
      setSidebarPatient(undefined);
    }
  }, [selectedThread?.patient_id, showPatientSummary]);

  useEffect(() => {
    if (error) {
      showErrorNotification(error);
    }
  }, [error]);

  const handleTopicStatusChangeWithErrorHandling = async (newStatus: string): Promise<void> => {
    try {
      await handleThreadStatusChange(newStatus);
      await refreshThreadMessages();
    } catch (error) {
      showErrorNotification(error);
    }
  };

  const handleNewTopicCompletion = (message: Communication): void => {
    addThreadMessage(message);
    onNew(message);
  };

  const skeletonTitleWidths = [80, 72, 68, 64];
  const skeletonSubtitleWidths = [85, 78, 70, 60];

  return (
    <>
      <div className={classes.container}>
        <Flex direction="row" h="100%" w="100%">
          {/* Left sidebar - Messages list */}
          <Flex direction="column" w={380} h="100%" className={classes.rightBorder}>
            <Paper h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
              <ScrollArea style={{ flex: 1 }} scrollbarSize={10} type="hover" scrollHideDelay={250}>
                <Flex h={64} align="center" justify="space-between" p="md">
                  <Group gap="xs">
                    <Button
                      component={Link}
                      to={inProgressUri}
                      className={cx(classes.button, { [classes.selected]: status === 'in-progress' })}
                      h={32}
                      radius="xl"
                    >
                      In progress
                    </Button>
                    <Button
                      component={Link}
                      to={completedUri}
                      className={cx(classes.button, { [classes.selected]: status === 'completed' })}
                      h={32}
                      radius="xl"
                    >
                      Completed
                    </Button>
                  </Group>
                  <ActionIcon radius="50%" variant="filled" color="blue" onClick={openModal}>
                    <IconPlus size={16} />
                  </ActionIcon>
                </Flex>
                <Divider />
                {loading ? (
                  <Stack gap="md" p="md">
                    {Array.from({ length: 10 }).map((_, index) => {
                      const titleWidth = skeletonTitleWidths[index % skeletonTitleWidths.length];
                      const subtitleWidth = skeletonSubtitleWidths[index % skeletonSubtitleWidths.length];
                      return (
                        <Flex key={index} gap="sm" align="flex-start">
                          <Skeleton height={40} width={40} radius="50%" />
                          <Box style={{ flex: 1 }}>
                            <Flex direction="column" gap="xs">
                              <Skeleton height={16} width={`${titleWidth}%`} />
                              <Skeleton height={14} width={`${subtitleWidth}%`} />
                            </Flex>
                          </Box>
                        </Flex>
                      );
                    })}
                  </Stack>
                ) : (
                  threadMessages.length > 0 && (
                    <ChatList
                      threads={threadMessages}
                      selectedCommunication={selectedThread}
                      getThreadUri={getThreadUri}
                    />
                  )
                )}
                {threadMessages.length === 0 && !loading && <EmptyMessagesState />}
              </ScrollArea>
              {!loading && total !== undefined && total > itemsPerPage && (
                <Box p="md">
                  <Center>
                    <Pagination
                      value={currentPage}
                      total={Math.ceil(total / itemsPerPage)}
                      onChange={(page) => {
                        const offset = (page - 1) * itemsPerPage;
                        onChange({
                          ...filters,
                          _offset: offset,
                        });
                      }}
                      size="sm"
                      siblings={1}
                      boundaries={1}
                    />
                  </Center>
                </Box>
              )}
            </Paper>
          </Flex>

          {selectedThread ? (
            <>
              {/* Main chat area */}
              <Flex direction="column" style={{ flex: 1 }} h="100%" className={classes.rightBorder}>
                <Paper h="100%">
                  <Stack h="100%" gap={0}>
                    <Flex h={64} align="center" justify="space-between" p="md">
                      <Text fw={800} truncate fz="lg">
                        {selectedThread.topic ?? 'Messages'}
                      </Text>

                      <Menu position="bottom-end" shadow="md">
                        <Menu.Target>
                          <Button
                            variant="light"
                            color={getStatusColor(selectedThread.status)}
                            rightSection={
                              selectedThread.status === 'completed' ? undefined : <IconChevronDown size={16} />
                            }
                            radius="xl"
                            size="sm"
                          >
                            {selectedThread.status
                              .split('-')
                              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(' ')}
                          </Button>
                        </Menu.Target>

                        {selectedThread.status !== 'completed' && (
                          <>
                            <Menu.Dropdown>
                              <Menu.Item onClick={() => handleTopicStatusChangeWithErrorHandling('completed')}>
                                Completed
                              </Menu.Item>
                            </Menu.Dropdown>
                          </>
                        )}
                      </Menu>
                    </Flex>
                    <Divider />
                    <Flex direction="column" style={{ flex: 1 }} h="100%">
                      <ThreadChatPanel
                        key={selectedThread.id}
                        thread={selectedThread}
                      />
                    </Flex>
                  </Stack>
                </Paper>
              </Flex>

              {/* Right sidebar - Patient summary */}
              {sidebarPatient && showPatientSummary && (
                <Flex direction="column" w={300} h="100%">
                  <ScrollArea p={0} h="100%" scrollbarSize={10} type="hover" scrollHideDelay={250}>
                    <PatientSummary key={selectedThread.id} patient={sidebarPatient} />
                  </ScrollArea>
                </Flex>
              )}
            </>
          ) : (
            <Flex direction="column" style={{ flex: 1 }} h="100%">
              <NoMessages />
            </Flex>
          )}
        </Flex>
      </div>
      <NewTopicDialog patientId={patientId} opened={modalOpened} onClose={closeModal} onSubmit={handleNewTopicCompletion} />
    </>
  );
}

// ─── Inline ThreadChat replacement ─────────────────────────────────

interface ThreadChatPanelProps {
  thread: Communication;
}

function ThreadChatPanel({ thread }: ThreadChatPanelProps): JSX.Element {
  const [replies, setReplies] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const { practitioner, organizationId } = useAuth();

  const fetchReplies = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await communicationService.getReplies(thread.id);
      setReplies(data);
    } catch (err) {
      showErrorNotification(err);
    } finally {
      setLoading(false);
    }
  }, [thread.id]);

  useEffect(() => {
    fetchReplies().catch(console.error);
  }, [fetchReplies]);

  const handleSend = async (): Promise<void> => {
    if (!messageText.trim() || !organizationId) return;
    setSending(true);
    try {
      const newMessage = await communicationService.sendMessage({
        organization_id: organizationId,
        parent_id: thread.id,
        patient_id: thread.patient_id,
        sender_id: practitioner?.id ?? null,
        payload_text: messageText.trim(),
        status: 'completed',
      });
      setReplies((prev) => [...prev, newMessage as Communication]);
      setMessageText('');
    } catch (err) {
      showErrorNotification(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <Flex direction="column" h="100%">
      <ScrollArea style={{ flex: 1 }} p="md">
        {loading ? (
          <Center h={200}>
            <Loader size="sm" />
          </Center>
        ) : replies.length === 0 ? (
          <Center h={200}>
            <Text c="dimmed" size="sm">No messages yet. Start the conversation below.</Text>
          </Center>
        ) : (
          <Stack gap="md">
            {replies.map((reply) => {
              const isCurrentUser = reply.sender_id === practitioner?.id;
              return (
                <Flex key={reply.id} justify={isCurrentUser ? 'flex-end' : 'flex-start'}>
                  <Box
                    p="sm"
                    style={{
                      maxWidth: '70%',
                      borderRadius: 'var(--mantine-radius-md)',
                      backgroundColor: isCurrentUser
                        ? 'var(--mantine-color-blue-light)'
                        : 'var(--mantine-color-gray-light)',
                    }}
                  >
                    <Text size="sm">{reply.payload_text}</Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      {formatDateTime(reply.sent)}
                    </Text>
                  </Box>
                </Flex>
              );
            })}
          </Stack>
        )}
      </ScrollArea>
      <Divider />
      <Flex p="md" gap="sm" align="center">
        <TextInput
          placeholder="Type a message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend().catch(console.error);
            }
          }}
          style={{ flex: 1 }}
          disabled={sending}
        />
        <ActionIcon
          variant="filled"
          color="blue"
          onClick={() => handleSend().catch(console.error)}
          disabled={!messageText.trim() || sending}
          loading={sending}
        >
          <IconSend size={16} />
        </ActionIcon>
      </Flex>
    </Flex>
  );
}

// ─── Helper components ─────────────────────────────────────────────

function NoMessages(): JSX.Element {
  return (
    <Center h="100%" w="100%">
      <Stack align="center" gap="md">
        <ThemeIcon size={64} variant="light" color="gray">
          <IconMessageCircle size={32} />
        </ThemeIcon>
        <Stack align="center" gap="xs">
          <Text size="sm" c="dimmed" ta="center">
            Select a message from the list to view details
          </Text>
        </Stack>
      </Stack>
    </Center>
  );
}

function getStatusColor(status: string): string {
  if (status === 'completed') {
    return 'green';
  }
  if (status === 'stopped') {
    return 'red';
  }
  return 'blue';
}

function EmptyMessagesState(): JSX.Element {
  return (
    <Flex direction="column" h="100%" justify="center" align="center">
      <Stack align="center" gap="md" pt="xl">
        <IconMessageCircle size={64} color="var(--mantine-color-gray-4)" />
        <Text size="lg" c="dimmed" fw={500}>
          No messages found
        </Text>
      </Stack>
    </Flex>
  );
}

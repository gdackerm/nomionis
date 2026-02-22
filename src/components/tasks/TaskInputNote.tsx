// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import {
  ActionIcon,
  Button,
  Card,
  Divider,
  Flex,
  Loader,
  Modal,
  Paper,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core';
import { IconCheck, IconTrash } from '@tabler/icons-react';
import React, { useState } from 'react';
import type { Tables } from '../../lib/supabase/types';
import { formatDate } from '../../lib/utils';
import { taskService } from '../../services/task.service';
import { useDebouncedUpdateResource } from '../../hooks/useDebouncedUpdateResource';
import { SAVE_TIMEOUT_MS } from '../../config/constants';
import { showErrorNotification } from '../../utils/notifications';
import { TaskQuestionnaireForm } from './encounter/TaskQuestionnaireForm';

type Task = Tables<'tasks'>;

interface TaskInputNoteProps {
  task: Task;
  allowEdit?: boolean;
  onTaskChange?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
}

export function TaskInputNote(props: TaskInputNoteProps): React.JSX.Element {
  const { task, allowEdit = true, onTaskChange, onDeleteTask } = props;
  const debouncedUpdate = useDebouncedUpdateResource(taskService, SAVE_TIMEOUT_MS);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  const handleDeleteTask = (): void => {
    setShowDeleteModal(true);
  };

  const confirmDeleteTask = async (): Promise<void> => {
    if (!task) {
      return;
    }
    onDeleteTask?.(task);
    setShowDeleteModal(false);
  };

  const handleMarkAsCompleted = async (): Promise<void> => {
    if (!task) {
      return;
    }

    try {
      const result = await taskService.update(task.id, { status: 'completed' });
      onTaskChange?.(result as Task);
      debouncedUpdate(task.id, { status: 'completed' });
    } catch (error) {
      showErrorNotification(error);
    }
  };

  if (!task) {
    return (
      <Flex align="center" justify="center" h="100%">
        <Loader />
      </Flex>
    );
  }

  const taskTitle = (task.code as any)?.text ?? 'Task';
  const taskDateStr = task.authored_on ? ` from ${formatDate(task.authored_on)}` : '';

  return (
    <Flex direction="column" h="100%">
      <Paper h="100%">
        <Flex justify="space-between" p="lg" h={72}>
          <Flex justify="left" align="center" direction="row" pr="md">
            <Text size="xl" fw={600} lh={1.2}>
              {taskTitle}
              {taskDateStr}
            </Text>
          </Flex>

          {allowEdit && (
            <Flex align="center" gap="md">
              {onDeleteTask && (
                <ActionIcon
                  variant="outline"
                  c="dimmed"
                  color="gray"
                  aria-label="Delete Task"
                  radius="xl"
                  w={36}
                  h={36}
                  onClick={() => handleDeleteTask()}
                >
                  <IconTrash size={24} />
                </ActionIcon>
              )}

              <ActionIcon
                variant={task.status === 'completed' ? 'filled' : 'outline'}
                color={task.status === 'completed' ? 'blue' : 'gray'}
                aria-label="Mark as Completed"
                radius="xl"
                w={36}
                h={36}
                onClick={() => handleMarkAsCompleted()}
              >
                <IconCheck size={24} />
              </ActionIcon>
            </Flex>
          )}
        </Flex>

        <ScrollArea w="100%" h="calc(100% - 70px)" p="lg">
          {task.description && (
            <Stack mb="lg">
              <Text size="lg">{task.description}</Text>
              <Divider />
            </Stack>
          )}
          <Stack>
            {task.focus_type === 'Questionnaire' && task.focus_id && (
              <>
                <Stack gap={0}>
                  <Text size="lg" fw={600} mb="lg">
                    Related Questionnaire
                  </Text>
                  <Card withBorder shadow="sm" p="md">
                    <TaskQuestionnaireForm
                      key={task.focus_id}
                      task={task}
                    />
                  </Card>
                </Stack>
                <Divider />
              </>
            )}

            <Stack gap={0}>
              <Text size="lg" fw={600} mb="md">
                Notes
              </Text>
              <Text c="dimmed" size="sm">
                Notes are not available in the current version.
              </Text>
            </Stack>
          </Stack>
        </ScrollArea>

        <Modal
          opened={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Task"
          size="md"
          centered
        >
          <Stack gap="md">
            <Text>Are you sure you want to delete this task? This action cannot be undone.</Text>
            <Text fw={500} c="dimmed">
              Task: {taskTitle}
            </Text>
            <Flex justify="flex-end" gap="sm">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button color="red" onClick={confirmDeleteTask}>
                Delete
              </Button>
            </Flex>
          </Stack>
        </Modal>
      </Paper>
    </Flex>
  );
}

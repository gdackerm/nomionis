// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Card, Stack } from '@mantine/core';
import { useDebouncedCallback } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import { IconCircleOff } from '@tabler/icons-react';
import type { JSX } from 'react';
import { useNavigate } from 'react-router';
import type { Tables } from '../../../lib/supabase/types';
import { normalizeErrorString } from '../../../lib/utils';
import { questionnaireResponseService } from '../../../services/questionnaire-response.service';
import { taskService } from '../../../services/task.service';
import { useAuth } from '../../../providers/AuthProvider';
import { SAVE_TIMEOUT_MS } from '../../../config/constants';
import { SimpleTask } from './SimpleTask';
import { TaskQuestionnaireForm } from './TaskQuestionnaireForm';
import { TaskServiceRequest } from './TaskServiceRequest';
import { TaskStatusPanel } from './TaskStatusPanel';

interface TaskPanelProps {
  task: Tables<'tasks'>;
  enabled?: boolean;
  onUpdateTask: (task: Tables<'tasks'>) => void;
}

export const TaskPanel = (props: TaskPanelProps): JSX.Element => {
  const { task, enabled = true, onUpdateTask } = props;
  const navigate = useNavigate();
  const { organizationId } = useAuth();

  const onActionButtonClicked = async (): Promise<void> => {
    navigate(`Task/${task.id}`)?.catch(console.error);
  };

  const onChangeResponse = (response: Tables<'questionnaire_responses'>): void => {
    saveQuestionnaireResponse(task, response);
  };

  const saveQuestionnaireResponse = useDebouncedCallback(
    async (task: Tables<'tasks'>, response: Tables<'questionnaire_responses'>): Promise<void> => {
      try {
        if (response.id) {
          await questionnaireResponseService.update(response.id, {
            items: response.items,
            status: response.status,
          });
        } else {
          await questionnaireResponseService.create({
            organization_id: organizationId!,
            questionnaire_id: task.focus_type === 'Questionnaire' ? task.focus_id : null,
            patient_id: task.patient_id,
            encounter_id: task.encounter_id,
            status: response.status || 'in-progress',
            items: response.items,
          });
        }
      } catch (err) {
        console.error(err);
      }
    },
    SAVE_TIMEOUT_MS
  );

  const onChangeStatus = async (status: string): Promise<void> => {
    try {
      const updatedTask = await taskService.update(task.id, { status });
      onUpdateTask(updatedTask as Tables<'tasks'>);
    } catch (err) {
      showNotification({
        color: 'red',
        icon: <IconCircleOff />,
        title: 'Error',
        message: normalizeErrorString(err),
      });
    }
  };

  const isQuestionnaire = task.focus_type === 'Questionnaire';
  const isServiceRequest = task.focus_type === 'ServiceRequest';

  return (
    <Card withBorder shadow="sm" p={0}>
      <Stack gap="xs">
        <Stack p="md">
          {isQuestionnaire && (
            <TaskQuestionnaireForm key={task.id} task={task} onChangeResponse={onChangeResponse} />
          )}
          {isServiceRequest && (
            <TaskServiceRequest key={task.id} task={task} />
          )}

          {!isServiceRequest && !isQuestionnaire && <SimpleTask key={task.id} task={task} />}
        </Stack>
        <TaskStatusPanel
          task={task}
          enabled={enabled}
          onActionButtonClicked={onActionButtonClicked}
          onChangeStatus={onChangeStatus}
        />
      </Stack>
    </Card>
  );
};

// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Alert, Box, Code, Group, Loader, Skeleton, Stack, Text, Title } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import type { Tables, Json } from '../../../lib/supabase/types';
import { questionnaireService } from '../../../services/questionnaire.service';
import { questionnaireResponseService } from '../../../services/questionnaire-response.service';
import { useCurrentUser } from '../../../providers/AuthProvider';
import { showErrorNotification } from '../../../utils/notifications';
import { supabase } from '../../../lib/supabase/client';

interface TaskQuestionnaireFormProps {
  task: Tables<'tasks'>;
  onChangeResponse?: (response: Tables<'questionnaire_responses'>) => void;
}

export const TaskQuestionnaireForm = ({ task, onChangeResponse }: TaskQuestionnaireFormProps): JSX.Element => {
  const currentUser = useCurrentUser();
  const [questionnaire, setQuestionnaire] = useState<Tables<'questionnaires'> | undefined>(undefined);
  const [questionnaireResponse, setQuestionnaireResponse] = useState<Tables<'questionnaire_responses'> | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  // When task is completed, mark the response as completed too
  useEffect(() => {
    const updateQuestionnaireResponse = async (): Promise<void> => {
      if (questionnaireResponse && task.status === 'completed' && questionnaireResponse.status !== 'completed') {
        await questionnaireResponseService.update(questionnaireResponse.id, {
          status: 'completed',
        });
      }
    };
    updateQuestionnaireResponse().catch(showErrorNotification);
  }, [task, questionnaireResponse]);

  // Fetch questionnaire and existing response
  useEffect(() => {
    const fetchResources = async (): Promise<void> => {
      if (task.focus_type !== 'Questionnaire' || !task.focus_id) {
        return;
      }

      // Load the questionnaire
      const q = await questionnaireService.getById(task.focus_id);
      setQuestionnaire(q as Tables<'questionnaires'>);

      // Look for an existing response linked to this questionnaire and encounter
      const { data: responses } = await supabase
        .from('questionnaire_responses')
        .select('*')
        .eq('questionnaire_id', task.focus_id)
        .eq('encounter_id', task.encounter_id ?? '')
        .order('created_at', { ascending: false })
        .limit(1);

      if (responses && responses.length > 0) {
        setQuestionnaireResponse(responses[0] as Tables<'questionnaire_responses'>);
      }
    };

    setError(undefined);
    setLoading(true);
    fetchResources()
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load questionnaire');
      })
      .finally(() => setLoading(false));
  }, [task]);

  if (loading) {
    return <QuestionnaireSkeleton />;
  }

  return (
    <Box p={0}>
      {task.status !== 'completed' && questionnaire && (
        <Stack gap="md">
          <Title order={4}>{questionnaire.title || 'Questionnaire'}</Title>
          <Text c="dimmed" size="sm">
            Questionnaire form -- items rendered from JSONB data.
          </Text>
          {questionnaire.items && (
            <QuestionnaireItemsDisplay items={questionnaire.items} />
          )}
        </Stack>
      )}
      {task.status === 'completed' && questionnaireResponse && (
        <Stack gap="md">
          <Title order={4}>Questionnaire Response</Title>
          <Text c="dimmed" size="sm">Status: {questionnaireResponse.status}</Text>
          {questionnaireResponse.items ? (
            <Code block>{JSON.stringify(questionnaireResponse.items, null, 2)}</Code>
          ) : (
            <Text c="dimmed">No response data recorded.</Text>
          )}
        </Stack>
      )}
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error}
        </Alert>
      )}
    </Box>
  );
};

/** Simple display of questionnaire items from JSONB */
function QuestionnaireItemsDisplay({ items }: { items: Json }): JSX.Element {
  if (!items || typeof items !== 'object') {
    return <Text c="dimmed">No questionnaire items defined.</Text>;
  }

  const itemsArray = Array.isArray(items) ? items : [];

  if (itemsArray.length === 0) {
    return <Text c="dimmed">No questionnaire items defined.</Text>;
  }

  return (
    <Stack gap="xs">
      {itemsArray.map((item: any, index: number) => (
        <Box key={item?.linkId || index} p="xs" style={{ borderLeft: '3px solid #dee2e6', paddingLeft: 12 }}>
          <Text fw={500} size="sm">
            {item?.text || item?.linkId || `Item ${index + 1}`}
          </Text>
          {item?.type && (
            <Text c="dimmed" size="xs">
              Type: {item.type}
            </Text>
          )}
        </Box>
      ))}
    </Stack>
  );
}

const QuestionnaireSkeleton = (): JSX.Element => (
  <Stack gap="lg">
    {/* Form title/header */}
    <Stack gap="xs">
      <Skeleton height={24} width="60%" />
      <Skeleton height={16} width="85%" />
    </Stack>

    {/* Question group 1 */}
    <Stack gap="sm">
      <Skeleton height={18} width="45%" />
      <Group gap="md">
        <Skeleton height={20} width={20} radius="xl" />
        <Skeleton height={16} width="15%" />
        <Skeleton height={20} width={20} radius="xl" />
        <Skeleton height={16} width="12%" />
      </Group>
    </Stack>

    {/* Question group 2 */}
    <Stack gap="sm">
      <Skeleton height={18} width="38%" />
      <Skeleton height={36} width="100%" radius="md" />
    </Stack>

    {/* Question group 3 */}
    <Stack gap="sm">
      <Skeleton height={18} width="52%" />
      <Stack gap="xs">
        <Group gap="sm">
          <Skeleton height={16} width={16} radius="sm" />
          <Skeleton height={14} width="25%" />
        </Group>
        <Group gap="sm">
          <Skeleton height={16} width={16} radius="sm" />
          <Skeleton height={14} width="30%" />
        </Group>
        <Group gap="sm">
          <Skeleton height={16} width={16} radius="sm" />
          <Skeleton height={14} width="22%" />
        </Group>
      </Stack>
    </Stack>

    {/* Text area question */}
    <Stack gap="sm">
      <Skeleton height={18} width="42%" />
      <Skeleton height={80} width="100%" radius="md" />
    </Stack>

    {/* Another radio group */}
    <Stack gap="sm">
      <Skeleton height={18} width="48%" />
      <Group gap="md">
        <Skeleton height={20} width={20} radius="xl" />
        <Skeleton height={16} width="18%" />
        <Skeleton height={20} width={20} radius="xl" />
        <Skeleton height={16} width="20%" />
        <Skeleton height={20} width={20} radius="xl" />
        <Skeleton height={16} width="16%" />
      </Group>
    </Stack>
  </Stack>
);

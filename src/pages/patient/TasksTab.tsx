// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Tables } from '../../lib/supabase/types';
import { Loader } from '@mantine/core';
import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import classes from '../tasks/TasksPage.module.css';
import { TaskBoard } from '../../components/tasks/TaskBoard';
import type { TaskSearchDescriptor } from '../../components/tasks/TaskBoard';
import { useCurrentUser } from '../../providers/AuthProvider';
import { normalizeTaskSearch, formatTaskSearchQuery } from '../../utils/task-search';

type Task = Tables<'tasks'>;

export function TasksTab(): JSX.Element {
  const { patientId, taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useCurrentUser();
  const [parsedSearch, setParsedSearch] = useState<Record<string, string>>();

  useEffect(() => {
    const { normalizedSearch, needsNavigation } = normalizeTaskSearch(location.pathname, location.search, {
      additionalFilters: {
        patient: patientId ?? '',
      },
    });

    if (needsNavigation) {
      const qs = formatTaskSearchQuery(normalizedSearch);
      navigate(`/Patient/${patientId}/Task${qs ? `?${qs}` : ''}`)?.catch(console.error);
    } else {
      setParsedSearch(normalizedSearch);
    }
  }, [location, navigate, patientId]);

  if (!parsedSearch) {
    return <Loader />;
  }

  const currentQuery = formatTaskSearchQuery(parsedSearch);

  const onNew = (task: Task): void => {
    navigate(getTaskUri(task))?.catch(console.error);
  };

  const getTaskUri = (task: Task): string => {
    return `/Patient/${patientId}/Task/${task.id}${currentQuery ? `?${currentQuery}` : ''}`;
  };

  const onDelete = (_: Task): void => {
    navigate(`/Patient/${patientId}/Task${currentQuery ? `?${currentQuery}` : ''}`)?.catch(console.error);
  };

  const onChange = (search: TaskSearchDescriptor): void => {
    const merged: Record<string, string> = { ...search.filters };
    if (search.offset > 0) {
      merged['_offset'] = String(search.offset);
    }
    merged['_count'] = String(search.count);
    // Preserve sort from current search
    if (parsedSearch['_sort']) {
      merged['_sort'] = parsedSearch['_sort'];
    }
    if (parsedSearch['_total']) {
      merged['_total'] = parsedSearch['_total'];
    }
    const qs = formatTaskSearchQuery(merged);
    navigate(`/Patient/${patientId}/Task${qs ? `?${qs}` : ''}`)?.catch(console.error);
  };

  // Build "My Tasks" filters: keep current filters but set owner to current user
  const myTasksFilters: Record<string, string> = { ...parsedSearch };
  delete myTasksFilters['owner'];
  delete myTasksFilters['_offset'];
  myTasksFilters['patient'] = patientId ?? '';
  if (profile) {
    myTasksFilters['owner'] = profile.id;
  }
  const myTasksQuery = formatTaskSearchQuery(myTasksFilters);

  // Build "All Tasks" filters: keep current filters but remove owner
  const allTasksFilters: Record<string, string> = { ...parsedSearch };
  delete allTasksFilters['owner'];
  delete allTasksFilters['_offset'];
  allTasksFilters['patient'] = patientId ?? '';
  const allTasksQuery = formatTaskSearchQuery(allTasksFilters);

  return (
    <div className={classes.container}>
      <TaskBoard
        query={currentQuery}
        selectedTaskId={taskId}
        onDelete={onDelete}
        onNew={onNew}
        onChange={onChange}
        getTaskUri={getTaskUri}
        myTasksUri={myTasksQuery ? `/Patient/${patientId}/Task?${myTasksQuery}` : `/Patient/${patientId}/Task`}
        allTasksUri={allTasksQuery ? `/Patient/${patientId}/Task?${allTasksQuery}` : `/Patient/${patientId}/Task`}
      />
    </div>
  );
}

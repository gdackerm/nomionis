// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Tables } from '../../lib/supabase/types';
import { Loader } from '@mantine/core';
import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import classes from './TasksPage.module.css';
import { TaskBoard } from '../../components/tasks/TaskBoard';
import type { TaskSearchDescriptor } from '../../components/tasks/TaskBoard';
import { useCurrentUser } from '../../providers/AuthProvider';
import { normalizeTaskSearch, formatTaskSearchQuery } from '../../utils/task-search';

type Task = Tables<'tasks'>;

export function TasksPage(): JSX.Element {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useCurrentUser();
  const [parsedSearch, setParsedSearch] = useState<Record<string, string>>();

  useEffect(() => {
    const { normalizedSearch, needsNavigation } = normalizeTaskSearch(location.pathname, location.search);
    if (needsNavigation) {
      const qs = formatTaskSearchQuery(normalizedSearch);
      navigate(`/Task${qs ? `?${qs}` : ''}`)?.catch(console.error);
    } else {
      setParsedSearch(normalizedSearch);
    }
  }, [location, navigate]);

  if (!parsedSearch) {
    return <Loader />;
  }

  const currentQuery = formatTaskSearchQuery(parsedSearch);

  const onNew = (task: Task): void => {
    navigate(getTaskUri(task))?.catch(console.error);
  };

  const getTaskUri = (task: Task): string => {
    return `/Task/${task.id}${currentQuery ? `?${currentQuery}` : ''}`;
  };

  const onDelete = (_: Task): void => {
    navigate(`/Task${currentQuery ? `?${currentQuery}` : ''}`)?.catch(console.error);
  };

  const onChange = (search: TaskSearchDescriptor): void => {
    const merged: Record<string, string> = { ...search.filters };
    if (search.offset > 0) {
      merged['_offset'] = String(search.offset);
    }
    merged['_count'] = String(search.count);
    if (parsedSearch['_sort']) {
      merged['_sort'] = parsedSearch['_sort'];
    }
    if (parsedSearch['_total']) {
      merged['_total'] = parsedSearch['_total'];
    }
    const qs = formatTaskSearchQuery(merged);
    navigate(`/Task${qs ? `?${qs}` : ''}`)?.catch(console.error);
  };

  // Build "My Tasks" filters
  const myTasksFilters: Record<string, string> = { ...parsedSearch };
  delete myTasksFilters['owner'];
  delete myTasksFilters['_offset'];
  if (profile) {
    myTasksFilters['owner'] = profile.id;
  }
  const myTasksQuery = formatTaskSearchQuery(myTasksFilters);

  // Build "All Tasks" filters
  const allTasksFilters: Record<string, string> = { ...parsedSearch };
  delete allTasksFilters['owner'];
  delete allTasksFilters['_offset'];
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
        myTasksUri={myTasksQuery ? `/Task?${myTasksQuery}` : '/Task'}
        allTasksUri={allTasksQuery ? `/Task?${allTasksQuery}` : '/Task'}
      />
    </div>
  );
}

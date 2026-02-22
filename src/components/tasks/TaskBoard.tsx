// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import {
  Flex,
  Paper,
  Group,
  Button,
  Divider,
  ActionIcon,
  ScrollArea,
  Stack,
  Skeleton,
  Text,
  Box,
  Pagination,
  Center,
} from '@mantine/core';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { JSX } from 'react';
import cx from 'clsx';
import classes from './TaskBoard.module.css';
import type { Tables } from '../../lib/supabase/types';
import { Link, useNavigate } from 'react-router';
import { taskService } from '../../services/task.service';
import { showErrorNotification } from '../../utils/notifications';
import { TaskFilterType } from './TaskFilterMenu.utils';
import type { TaskFilterValue, TaskStatus, TaskPriority } from './TaskFilterMenu.utils';
import { TaskFilterMenu } from './TaskFilterMenu';
import { IconPlus } from '@tabler/icons-react';
import { TaskListItem } from './TaskListItem';
import { TaskSelectEmpty } from './TaskSelectEmpty';
import { NewTaskModal } from './NewTaskModal';
import { TaskDetailPanel } from './TaskDetailPanel';
import { supabase } from '../../lib/supabase/client';

type Task = Tables<'tasks'>;

/** Parsed filter/pagination state derived from the query string */
interface ParsedSearch {
  filters: Record<string, string>;
  offset: number;
  count: number;
  orderBy?: string;
  owner?: string;
}

/** The onChange callback now receives a simplified search descriptor instead of a Medplum SearchRequest */
export interface TaskSearchDescriptor {
  filters: Record<string, string>;
  offset: number;
  count: number;
  owner?: string;
}

/**
 * TaskBoardProps is the props for the TaskBoard component.
 */
interface TaskBoardProps {
  query: string;
  selectedTaskId: string | undefined;
  onDelete: (task: Task) => void;
  onNew: (task: Task) => void;
  onChange: (search: TaskSearchDescriptor) => void;
  getTaskUri: (task: Task) => string;
  myTasksUri: string;
  allTasksUri: string;
}

/** Parse a query string into our simplified search descriptor */
function parseQuery(query: string): ParsedSearch {
  const params = new URLSearchParams(query);
  const filters: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    if (key === '_count' || key === '_offset' || key === '_sort') continue;
    if (key === 'owner') continue;
    filters[key] = value;
  }

  return {
    filters,
    offset: Number.parseInt(params.get('_offset') || '0', 10),
    count: Number.parseInt(params.get('_count') || '20', 10),
    orderBy: params.get('_sort') || undefined,
    owner: params.get('owner') || undefined,
  };
}

/** Convert a TaskSearchDescriptor back to a query-string-friendly format */
function searchToQueryString(search: TaskSearchDescriptor): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search.filters)) {
    if (value) params.set(key, value);
  }
  if (search.owner) params.set('owner', search.owner);
  if (search.offset) params.set('_offset', String(search.offset));
  params.set('_count', String(search.count));
  return params.toString();
}

export function TaskBoard({
  query,
  selectedTaskId,
  onDelete,
  onNew,
  onChange,
  getTaskUri,
  myTasksUri,
  allTasksUri,
}: TaskBoardProps): JSX.Element {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [newTaskModalOpened, setNewTaskModalOpened] = useState<boolean>(false);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const requestIdRef = useRef<number>(0);
  const fetchingRef = useRef<boolean>(false);

  // Parse pagination and status filters from query
  const searchParams = useMemo(() => new URLSearchParams(query), [query]);
  const itemsPerPage = Number.parseInt(searchParams.get('_count') || '20', 10);
  const currentOffset = Number.parseInt(searchParams.get('_offset') || '0', 10);
  const currentPage = Math.floor(currentOffset / itemsPerPage) + 1;
  const isMyTasks = searchParams.has('owner');

  const currentSearch = useMemo(() => parseQuery(query), [query]);

  // Parse status filters from query string
  const selectedStatuses = useMemo(() => {
    const statusParam = currentSearch.filters['status'];
    if (!statusParam) return [] as string[];
    return statusParam.split(',').map((s) => s.trim()).filter(Boolean);
  }, [currentSearch]);

  // Parse priority filters from query string
  const selectedPriorities = useMemo(() => {
    const priorityParam = currentSearch.filters['priority'];
    if (!priorityParam) return [] as string[];
    return priorityParam.split(',').map((p) => p.trim()).filter(Boolean);
  }, [currentSearch]);

  const fetchTasks = useCallback(async (): Promise<void> => {
    if (fetchingRef.current) {
      return;
    }
    fetchingRef.current = true;
    const currentRequestId = ++requestIdRef.current;

    try {
      // Build Supabase query
      let q = supabase.from('tasks').select('*', { count: 'exact' });

      // Apply owner filter
      if (currentSearch.owner) {
        q = q.eq('owner_id', currentSearch.owner);
      }

      // Apply status filter
      if (selectedStatuses.length > 0) {
        q = q.in('status', selectedStatuses);
      }

      // Apply pagination
      const pageSize = currentSearch.count;
      const offset = currentSearch.offset;
      q = q.order('created_at', { ascending: false });
      q = q.range(offset, offset + pageSize - 1);

      const { data, error, count } = await q;

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      if (error) throw error;

      const results: Task[] = data ?? [];

      if (count !== null && count !== undefined) {
        setTotal(count);
      }

      setTasks(results);
    } catch (error) {
      if (currentRequestId === requestIdRef.current) {
        throw error;
      }
    } finally {
      fetchingRef.current = false;
    }
  }, [currentSearch, selectedStatuses, query]);

  useEffect(() => {
    setLoading(true);
    fetchTasks()
      .catch(showErrorNotification)
      .finally(() => setLoading(false));
  }, [fetchTasks]);

  // Auto-select first task when list loads and no task is selected, or when selected task is not in list
  useEffect(() => {
    if (!loading && tasks.length > 0) {
      const selectedTaskInList = selectedTaskId && tasks.some((task) => task.id === selectedTaskId);
      if (!selectedTaskInList) {
        const firstTask = tasks[0];
        if (firstTask?.id) {
          navigate(getTaskUri(firstTask))?.catch(console.error);
        }
      }
    }
  }, [loading, tasks, selectedTaskId, navigate, getTaskUri]);

  useEffect(() => {
    const handleTaskSelection = async (): Promise<void> => {
      if (selectedTaskId) {
        const task = tasks.find((t: Task) => t.id === selectedTaskId);
        if (task) {
          setSelectedTask(task);
        } else {
          try {
            const task = await taskService.getById(selectedTaskId);
            setSelectedTask(task as Task);
          } catch {
            setSelectedTask(undefined);
          }
        }
      } else {
        setSelectedTask(undefined);
      }
    };

    handleTaskSelection().catch(() => {
      setSelectedTask(undefined);
    });
  }, [selectedTaskId, tasks]);

  const handleNewTaskCreated = (task: Task): void => {
    fetchTasks().catch(showErrorNotification);
    onNew(task);
  };

  const handleTaskChange = async (_task: Task): Promise<void> => {
    await fetchTasks().catch(showErrorNotification);
  };

  const handleDeleteTask = async (task: Task): Promise<void> => {
    await fetchTasks().catch(showErrorNotification);
    onDelete(task);
  };

  const handleFilterChange = (filterType: TaskFilterType, value: TaskFilterValue): void => {
    switch (filterType) {
      case TaskFilterType.STATUS: {
        const statusValue = value as string;
        const newStatuses = selectedStatuses.includes(statusValue)
          ? selectedStatuses.filter((s) => s !== statusValue)
          : [...selectedStatuses, statusValue];

        const newFilters = { ...currentSearch.filters };
        if (newStatuses.length > 0) {
          newFilters['status'] = newStatuses.join(',');
        } else {
          delete newFilters['status'];
        }

        onChange({
          filters: newFilters,
          offset: 0,
          count: currentSearch.count,
          owner: currentSearch.owner,
        });
        break;
      }
      case TaskFilterType.PRIORITY: {
        const priorityValue = value as string;
        const newPriorities = selectedPriorities.includes(priorityValue)
          ? selectedPriorities.filter((p) => p !== priorityValue)
          : [...selectedPriorities, priorityValue];

        const newFilters = { ...currentSearch.filters };
        if (newPriorities.length > 0) {
          newFilters['priority'] = newPriorities.join(',');
        } else {
          delete newFilters['priority'];
        }

        onChange({
          filters: newFilters,
          offset: 0,
          count: currentSearch.count,
          owner: currentSearch.owner,
        });
        break;
      }
      default:
        break;
    }
  };

  return (
    <Box w="100%" h="100%">
      <Flex h="100%">
        <Box w={350} h="100%">
          <Flex direction="column" h="100%" className={classes.borderRight}>
            <Paper>
              <Flex h={64} align="center" justify="space-between" p="md">
                <Group gap="xs">
                  <Button
                    component={Link}
                    to={myTasksUri}
                    className={cx(classes.button, { [classes.selected]: isMyTasks })}
                    h={32}
                    radius="xl"
                  >
                    My Tasks
                  </Button>

                  <Button
                    component={Link}
                    to={allTasksUri}
                    className={cx(classes.button, { [classes.selected]: !isMyTasks })}
                    h={32}
                    radius="xl"
                  >
                    All Tasks
                  </Button>

                  <TaskFilterMenu
                    statuses={selectedStatuses as TaskStatus[]}
                    priorities={selectedPriorities as TaskPriority[]}
                    onFilterChange={handleFilterChange}
                  />
                </Group>

                <ActionIcon radius="50%" variant="filled" color="blue" onClick={() => setNewTaskModalOpened(true)}>
                  <IconPlus size={16} />
                </ActionIcon>
              </Flex>
            </Paper>

            <Divider />
            <Paper style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <ScrollArea style={{ flex: 1 }} id="task-list-scrollarea">
                {loading && <TaskListSkeleton />}
                {!loading && tasks.length === 0 && <EmptyTasksState />}
                {!loading &&
                  tasks.length > 0 &&
                  tasks.map((task, index) => (
                    <React.Fragment key={task.id}>
                      <TaskListItem task={task} selectedTask={selectedTask} getTaskUri={getTaskUri} />
                      {index < tasks.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
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
                          ...currentSearch,
                          filters: currentSearch.filters,
                          offset,
                          count: currentSearch.count,
                          owner: currentSearch.owner,
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
        </Box>

        {selectedTask ? (
          <TaskDetailPanel task={selectedTask} onTaskChange={handleTaskChange} onDeleteTask={handleDeleteTask} />
        ) : (
          <Flex direction="column" h="100%" style={{ flex: 1 }}>
            <TaskSelectEmpty />
          </Flex>
        )}
      </Flex>

      <NewTaskModal
        opened={newTaskModalOpened}
        onClose={() => setNewTaskModalOpened(false)}
        onTaskCreated={handleNewTaskCreated}
      />
    </Box>
  );
}

function EmptyTasksState(): JSX.Element {
  return (
    <Flex direction="column" h="100%" justify="center" align="center" pt="xl">
      <Text c="dimmed" fw={500}>
        No tasks available.
      </Text>
    </Flex>
  );
}

function TaskListSkeleton(): JSX.Element {
  return (
    <Stack gap="md" p="md">
      {Array.from({ length: 6 }).map((_, index) => (
        <Stack key={index}>
          <Flex direction="column" gap="xs" align="flex-start">
            <Skeleton height={16} width={`${Math.random() * 40 + 60}%`} />
            <Skeleton height={14} width={`${Math.random() * 50 + 40}%`} />
            <Skeleton height={14} width={`${Math.random() * 50 + 40}%`} />
          </Flex>
          <Divider />
        </Stack>
      ))}
    </Stack>
  );
}

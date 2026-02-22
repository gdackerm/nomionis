// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Menu, ActionIcon, Text, Flex } from '@mantine/core';
import {
  IconFilter,
  IconChevronRight,
  IconStethoscope,
  IconCheck,
  IconExclamationCircle,
} from '@tabler/icons-react';
import type { JSX } from 'react';
import { TaskFilterType, TASK_STATUSES, TASK_PRIORITIES } from './TaskFilterMenu.utils';
import type { TaskFilterValue, TaskStatus, TaskPriority } from './TaskFilterMenu.utils';

interface TaskFilterMenuProps {
  statuses?: TaskStatus[];
  priorities?: TaskPriority[];
  onFilterChange?: (filterType: TaskFilterType, value: TaskFilterValue) => void;
}

export function TaskFilterMenu(props: TaskFilterMenuProps): JSX.Element {
  const { statuses = [], priorities = [], onFilterChange } = props;

  return (
    <Menu shadow="md" width={200} position="bottom-start">
      <Menu.Target>
        <ActionIcon variant="light" color="gray" size={32} radius="xl" aria-label="Filter tasks">
          <IconFilter size={16} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Filters</Menu.Label>

        {/* Status Submenu */}
        <Menu.Item>
          <Menu trigger="hover" openDelay={100} closeDelay={400} position="right-start" offset={5}>
            <Menu.Target>
              <Flex align="center" justify="space-between" w="100%">
                <Flex align="center" gap="xs">
                  <IconStethoscope size={16} />
                  <Text size="sm">Status</Text>
                </Flex>
                <IconChevronRight size={16} />
              </Flex>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Task Status</Menu.Label>
              {TASK_STATUSES.map((taskStatus) => (
                <Menu.Item
                  key={taskStatus}
                  onClick={() => onFilterChange?.(TaskFilterType.STATUS, taskStatus)}
                  rightSection={statuses.includes(taskStatus) ? <IconCheck size={16} /> : null}
                >
                  <Text size="sm">{taskStatus}</Text>
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        </Menu.Item>

        {/* Priority Submenu */}
        <Menu.Item>
          <Menu trigger="hover" openDelay={100} closeDelay={400} position="right-start" offset={5}>
            <Menu.Target>
              <Flex align="center" justify="space-between" w="100%">
                <Flex align="center" gap="xs">
                  <IconExclamationCircle size={16} />
                  <Text size="sm">Priority</Text>
                </Flex>
                <IconChevronRight size={16} />
              </Flex>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Task Priority</Menu.Label>
              {TASK_PRIORITIES.map((taskPriority) => (
                <Menu.Item
                  key={taskPriority}
                  onClick={() => onFilterChange?.(TaskFilterType.PRIORITY, taskPriority)}
                  rightSection={priorities.includes(taskPriority) ? <IconCheck size={16} /> : null}
                >
                  <Text size="sm">{taskPriority}</Text>
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

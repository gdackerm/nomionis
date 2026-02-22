// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, Paper, ScrollArea, SegmentedControl, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import type { Tables } from '../../lib/supabase/types';
import { taskService } from '../../services/task.service';
import { patientService } from '../../services/patient.service';
import { showErrorNotification } from '../../utils/notifications';
import { PatientSummary } from '../PatientSummary';
import { TaskInputNote } from './TaskInputNote';
import { TaskProperties } from './TaskProperties';
import classes from './TaskBoard.module.css';

type Task = Tables<'tasks'>;
type Patient = Tables<'patients'>;

interface TaskDetailPanelProps {
  task: Task;
  onTaskChange?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
}

export function TaskDetailPanel(props: TaskDetailPanelProps): JSX.Element | null {
  const { task: taskProp, onTaskChange, onDeleteTask } = props;
  const [task, setTask] = useState<Task>(taskProp);
  const [activeTab, setActiveTab] = useState<string>('properties');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    setTask(taskProp);
  }, [taskProp]);

  useEffect(() => {
    if (task.patient_id) {
      patientService.getById(task.patient_id).then(setSelectedPatient).catch(() => setSelectedPatient(null));
    } else {
      setSelectedPatient(null);
    }
  }, [task.patient_id]);

  if (!task) {
    return (
      <Box h="100%" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text c="dimmed">No task selected</Text>
      </Box>
    );
  }

  const handleTaskChange = async (updatedTask: Task): Promise<void> => {
    try {
      const { id, created_at, updated_at, ...updateFields } = updatedTask;
      const result = await taskService.update(task.id, updateFields);
      setTask(result as Task);
      onTaskChange?.(result as Task);
    } catch (error) {
      showErrorNotification(error);
    }
  };

  const handleDeleteTask = async (deletedTask: Task): Promise<void> => {
    try {
      await taskService.delete(deletedTask.id);
      onDeleteTask?.(deletedTask);
    } catch (error) {
      showErrorNotification(error);
    }
  };

  const handleTabChange = (value: string): void => {
    setActiveTab(value);
  };

  const getTabData = (): { label: string; value: string }[] => {
    const tabs = [
      { label: 'Properties', value: 'properties' },
      { label: 'Activity Log', value: 'activity-log' },
    ];

    if (selectedPatient) {
      tabs.push({ label: 'Patient Summary', value: 'patient-summary' });
    }

    return tabs;
  };

  return (
    <>
      <Box
        h="100%"
        style={{
          flex: 1,
        }}
        className={classes.borderRight}
      >
        <TaskInputNote
          task={task}
          onTaskChange={handleTaskChange}
          onDeleteTask={onDeleteTask ? handleDeleteTask : undefined}
        />
      </Box>

      <Box h="100%" w="400px">
        <Paper h="100%" style={{ overflow: 'hidden' }}>
          <Box px="md" pb="md" pt="md">
            <SegmentedControl
              value={activeTab}
              onChange={handleTabChange}
              data={getTabData()}
              fullWidth
              radius="md"
              color="gray"
              size="sm"
              className={classes.segmentedControl}
            />
          </Box>

          <Box>
            {activeTab === 'properties' && (
              <ScrollArea h="calc(100vh - 120px)">
                <TaskProperties key={task.id} p="md" task={task} onTaskChange={handleTaskChange} />
              </ScrollArea>
            )}
            {activeTab === 'activity-log' && (
              <ScrollArea h="calc(100vh - 120px)">
                <Box p="md">
                  <Text c="dimmed" ta="center">
                    Activity log not available in POC
                  </Text>
                </Box>
              </ScrollArea>
            )}
            {activeTab === 'patient-summary' && selectedPatient && (
              <ScrollArea h="calc(100vh - 120px)">
                <PatientSummary patient={selectedPatient} />
              </ScrollArea>
            )}
          </Box>
        </Paper>
      </Box>
    </>
  );
}

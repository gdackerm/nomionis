// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Autocomplete, Avatar, Button, Group, Stack, Text } from '@mantine/core';
import type { JSX } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { showErrorNotification } from '../../utils/notifications';
import { appointmentService } from '../../services/appointment.service';
import { patientService } from '../../services/patient.service';
import { formatDateTime, formatHumanName, formatPatientName, getInitials } from '../../lib/utils';
import type { Tables } from '../../lib/supabase/types';

type Appointment = Tables<'appointments'>;
type Patient = Tables<'patients'>;

type UpdateAppointmentFormProps = {
  appointment: Appointment;
  onUpdate: (appointment: Appointment) => void;
};

function UpdateAppointmentForm(props: UpdateAppointmentFormProps): JSX.Element {
  const [patientId, setPatientId] = useState<string | undefined>(undefined);
  const [patientSearchValue, setPatientSearchValue] = useState('');
  const [patientOptions, setPatientOptions] = useState<{ value: string; label: string }[]>([]);

  const { appointment, onUpdate } = props;

  const handlePatientSearch = useCallback(async (query: string): Promise<void> => {
    if (!query.trim()) {
      setPatientOptions([]);
      return;
    }
    try {
      const patients = await patientService.search(query);
      const options = patients.map((p: Patient) => ({
        value: p.id,
        label: formatPatientName(p),
      }));
      setPatientOptions(options);
    } catch (err) {
      showErrorNotification(err);
    }
  }, []);

  const handlePatientSelect = useCallback(
    (value: string): void => {
      setPatientSearchValue(value);
      const selected = patientOptions.find((o) => o.label === value);
      if (selected) {
        setPatientId(selected.value);
      }
    },
    [patientOptions]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault();
      if (!patientId) {
        return;
      }

      try {
        const result = await appointmentService.update(appointment.id, { patient_id: patientId });
        onUpdate?.(result as Appointment);
      } catch (error) {
        showErrorNotification(error);
      }
    },
    [patientId, appointment, onUpdate]
  );

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <Autocomplete
          label="Patient"
          placeholder="Search patients..."
          data={patientOptions.map((o) => o.label)}
          value={patientSearchValue}
          onChange={(value) => {
            setPatientSearchValue(value);
            handlePatientSearch(value).catch(console.error);
            handlePatientSelect(value);
          }}
          required
        />

        <Button fullWidth type="submit">
          Update Appointment
        </Button>
      </Stack>
    </form>
  );
}

export function AppointmentDetails(props: {
  appointment: Appointment;
  onUpdate: (appointment: Appointment) => void;
}): JSX.Element {
  const { appointment, onUpdate } = props;
  const [patient, setPatient] = useState<Patient | undefined>(undefined);

  useEffect(() => {
    const fetchPatient = async (): Promise<void> => {
      if (appointment.patient_id) {
        try {
          const p = await patientService.getById(appointment.patient_id);
          setPatient(p as Patient);
        } catch (err) {
          console.error('Failed to fetch patient:', err);
        }
      }
    };
    fetchPatient().catch(console.error);
  }, [appointment.patient_id]);

  const periodDisplay = [
    formatDateTime(appointment.start_time),
    formatDateTime(appointment.end_time),
  ]
    .filter(Boolean)
    .join(' - ');

  return (
    <Stack gap="md">
      <Text size="lg">{periodDisplay}</Text>

      {!appointment.patient_id && <UpdateAppointmentForm appointment={appointment} onUpdate={onUpdate} />}

      {!!patient && (
        <Group align="center" gap="sm">
          <Link to={`/Patient/${patient.id}`}>
            <Avatar size={48} radius={48} color="blue">
              {getInitials(patient.given_name, patient.family_name)}
            </Avatar>
          </Link>
          <Link to={`/Patient/${patient.id}`} style={{ fontWeight: 800, fontSize: 'var(--mantine-font-size-lg)', textDecoration: 'none', color: 'inherit' }}>
            {formatHumanName(patient.given_name, patient.family_name)}
          </Link>
        </Group>
      )}
    </Stack>
  );
}

import { Box, Button, Center, Drawer, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { JSX } from 'react';
import type { SlotInfo } from 'react-big-calendar';
import { useNavigate } from 'react-router';
import { v4 as uuidv4 } from 'uuid';
import { AppointmentDetails } from '../../components/schedule/AppointmentDetails';
import { CreateVisit } from '../../components/schedule/CreateVisit';
import { showErrorNotification } from '../../utils/notifications';
import { Calendar } from '../../components/Calendar';
import type { Range } from '../../types/scheduling';
import { IconChevronRight, IconX } from '@tabler/icons-react';
import classes from './SchedulePage.module.css';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../lib/supabase/client';
import { scheduleService } from '../../services/schedule.service';
import { slotService } from '../../services/slot.service';
import { appointmentService } from '../../services/appointment.service';
import { formatDateTime } from '../../lib/utils';
import type { Tables } from '../../lib/supabase/types';

type Schedule = Tables<'schedules'>;
type Slot = Tables<'slots'>;
type Appointment = Tables<'appointments'>;

// Service type entry stored in the schedule's service_types JSON field.
// Each entry has a display name and optional coding information.
interface ServiceTypeEntry {
  display?: string;
  system?: string;
  code?: string;
}

function parseServiceTypes(schedule: Schedule): (ServiceTypeEntry | undefined)[] {
  if (!schedule.service_types) {
    return [];
  }
  try {
    const raw = schedule.service_types as ServiceTypeEntry[];
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw;
  } catch {
    return [];
  }
}

function getServiceTypeLabel(st: ServiceTypeEntry | undefined): string {
  if (!st) return 'Other';
  return st.display || st.code || 'Other';
}

// Adapts a Supabase slot row into the shape the Calendar component expects
// (which uses FHIR-style `start`/`end` string fields).
function toCalendarSlot(slot: Slot, transientId?: string): any {
  const adapted: any = {
    ...slot,
    start: slot.start_time,
    end: slot.end_time,
    status: slot.status,
    id: slot.id,
  };
  if (transientId) {
    // Tag with a transient identifier so Calendar treats it as a foreground event
    if (!adapted.identifier) {
      adapted.identifier = [];
    }
    adapted.identifier.push({
      system: 'urn:scheduling-transient',
      value: transientId,
    });
  }
  return adapted;
}

// Adapts a Supabase appointment row into the shape the Calendar component expects.
function toCalendarAppointment(appointment: Appointment): any {
  return {
    ...appointment,
    start: appointment.start_time,
    end: appointment.end_time,
    status: appointment.status,
    id: appointment.id,
    // Calendar expects a participant array for display; provide a minimal one
    participant: [],
  };
}

// Merge overlapping slots of the same status into single slots (inline version
// that works with Supabase Slot types instead of FHIR Slot types).
function mergeOverlappingSlots(slots: Slot[]): Slot[] {
  type DecoratedSlot = { slot: Slot; start: Date; end: Date };

  const slotsByStatus: Record<string, DecoratedSlot[]> = {};
  slots.forEach((slot) => {
    if (!slotsByStatus[slot.status]) {
      slotsByStatus[slot.status] = [];
    }
    slotsByStatus[slot.status].push({
      slot,
      start: new Date(slot.start_time),
      end: new Date(slot.end_time),
    });
  });

  return Object.values(slotsByStatus).flatMap((statusSlots) => {
    return statusSlots
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .reduce<DecoratedSlot[]>((acc, ds) => {
        const last = acc.at(-1);
        if (!last) {
          return [ds];
        }

        if (ds.start <= last.end) {
          if (ds.end > last.end) {
            last.end = ds.end;
            last.slot = { ...last.slot, end_time: ds.slot.end_time };
          }
        } else {
          acc.push(ds);
        }

        return acc;
      }, [])
      .map((ds) => ds.slot);
  });
}

type ScheduleFindPaneProps = {
  schedule: Schedule;
  range: Range;
  onChange: (slots: any[]) => void;
  onSelectSlot: (slot: any) => void;
  slots: any[] | undefined;
};

// Allows selection of a ServiceType found in the schedule's service_types JSON,
// and queries for upcoming free slots that can be used to book an Appointment.
export function ScheduleFindPane(props: ScheduleFindPaneProps): JSX.Element {
  const { schedule, onChange, range } = props;
  const serviceTypes = useMemo(
    () =>
      parseServiceTypes(schedule).map((entry) => ({
        entry,
        id: uuidv4(),
      })),
    [schedule]
  );

  // null: no selection made
  // undefined: "wildcard" availability selected
  // ServiceTypeEntry: a specific service type was selected
  const [serviceType, setServiceType] = useState<ServiceTypeEntry | undefined | null>(
    serviceTypes.length === 1 ? serviceTypes[0].entry : null
  );

  // Ensure that we are searching for slots in the future by at least 30 minutes.
  const now = useMemo(() => new Date(), []);
  const earliestSchedulable = useMemo(() => new Date(now.getTime() + 30 * 60 * 1000), [now]);
  const searchStart = range.start < earliestSchedulable ? earliestSchedulable : range.start;
  const searchEnd = searchStart < range.end ? range.end : new Date(searchStart.getTime() + 1000 * 60 * 60 * 24 * 7);

  const startISO = searchStart.toISOString();
  const endISO = searchEnd.toISOString();

  useEffect(() => {
    if (!schedule || serviceType === null) {
      return () => {};
    }
    let active = true;

    supabase
      .from('slots')
      .select('*')
      .eq('schedule_id', schedule.id)
      .gte('start_time', startISO)
      .lte('start_time', endISO)
      .eq('status', 'free')
      .order('start_time', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          showErrorNotification(error);
          return;
        }
        // Tag each slot with a transient identifier so the Calendar shows them
        // as foreground events and so we can track which one was booked.
        const taggedSlots = (data ?? []).map((slot) => toCalendarSlot(slot, uuidv4()));
        onChange(taggedSlots);
      });

    return () => {
      active = false;
    };
  }, [schedule, serviceType, startISO, endISO, onChange]);

  const handleDismiss = useCallback(() => {
    setServiceType(null);
    onChange([]);
  }, [onChange]);

  if (serviceType !== null) {
    return (
      <Stack gap="sm" justify="flex-start">
        <Title order={4}>
          <Group justify="space-between">
            <span>{serviceType ? getServiceTypeLabel(serviceType) : 'Event'}</span>
            {serviceTypes.length > 1 && (
              <Button variant="subtle" onClick={handleDismiss} aria-label="Clear selection">
                <IconX size={20} />
              </Button>
            )}
          </Group>
        </Title>
        {(props.slots ?? []).map((slot: any) => (
          <Button
            key={slot.id}
            variant="outline"
            color="gray.3"
            styles={(theme) => ({ label: { fontWeight: 'normal', color: theme.colors.gray[9] } })}
            onClick={() => props.onSelectSlot(slot)}
          >
            {formatDateTime(slot.start_time ?? slot.start)}
          </Button>
        ))}
      </Stack>
    );
  }

  return (
    <Stack gap="sm" justify="flex-start">
      <Title order={4}>Schedule&hellip;</Title>
      {serviceTypes.map((st) => (
        <Button
          key={st.id}
          fullWidth
          variant="outline"
          rightSection={<IconChevronRight size={12} />}
          justify="space-between"
          onClick={() => setServiceType(st.entry)}
        >
          {getServiceTypeLabel(st.entry)}
        </Button>
      ))}
    </Stack>
  );
}

/**
 * Schedule page that displays the practitioner's schedule.
 * Allows the practitioner to create/update slots and create appointments.
 * @returns A React component that displays the schedule page.
 */
export function SchedulePage(): JSX.Element | null {
  const navigate = useNavigate();
  const { practitioner, organizationId, loading } = useAuth();
  const [createAppointmentOpened, createAppointmentHandlers] = useDisclosure(false);
  const [appointmentDetailsOpened, appointmentDetailsHandlers] = useDisclosure(false);
  const [schedule, setSchedule] = useState<Schedule | undefined>();
  const [range, setRange] = useState<Range | undefined>(undefined);
  const [slots, setSlots] = useState<Slot[] | undefined>(undefined);
  const [appointments, setAppointments] = useState<Appointment[] | undefined>(undefined);
  const [findSlots, setFindSlots] = useState<any[] | undefined>(undefined);

  const [appointmentSlot, setAppointmentSlot] = useState<Range>();
  const [appointmentDetails, setAppointmentDetails] = useState<Appointment | undefined>(undefined);

  useEffect(() => {
    if (loading || !practitioner || !organizationId) {
      return;
    }

    // Search for a Schedule associated with the logged-in practitioner,
    // create one if it doesn't exist
    scheduleService
      .list({ filters: { practitioner_id: practitioner.id, organization_id: organizationId } })
      .then(({ data }) => {
        if (data.length > 0) {
          setSchedule(data[0] as Schedule);
        } else {
          scheduleService
            .create({
              organization_id: organizationId,
              practitioner_id: practitioner.id,
              active: true,
            })
            .then((created) => setSchedule(created as Schedule))
            .catch(showErrorNotification);
        }
      })
      .catch(showErrorNotification);
  }, [loading, practitioner, organizationId]);

  // Find slots visible in the current range
  useEffect(() => {
    if (!schedule || !range) {
      return () => {};
    }
    let active = true;

    slotService
      .getByScheduleAndDateRange(schedule.id, range.start.toISOString(), range.end.toISOString())
      .then((rawSlots) => {
        if (!active) return;
        // Filter to free and busy-unavailable, then merge overlapping
        const filtered = rawSlots.filter(
          (s) => s.status === 'free' || s.status === 'busy-unavailable'
        );
        setSlots(mergeOverlappingSlots(filtered));
      })
      .catch((error: unknown) => active && showErrorNotification(error));

    return () => {
      active = false;
    };
  }, [schedule, range]);

  // Find appointments visible in the current range
  useEffect(() => {
    if (!practitioner || !range || !organizationId) {
      return () => {};
    }
    let active = true;

    supabase
      .from('appointments')
      .select('*')
      .eq('practitioner_id', practitioner.id)
      .eq('organization_id', organizationId)
      .gte('start_time', range.start.toISOString())
      .lte('start_time', range.end.toISOString())
      .order('start_time', { ascending: true })
      .limit(1000)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          showErrorNotification(error);
          return;
        }
        setAppointments(data ?? []);
      });

    return () => {
      active = false;
    };
  }, [practitioner, organizationId, range]);

  // When a date/time interval is selected, set the event object and open the
  // create appointment modal
  const handleSelectInterval = useCallback(
    (slot: SlotInfo) => {
      createAppointmentHandlers.open();
      setAppointmentSlot(slot);
    },
    [createAppointmentHandlers]
  );

  const bookSlot = useCallback(
    async (slot: any) => {
      // The slot coming from the find pane may have adapted fields;
      // resolve the actual slot ID and times.
      const slotId: string = slot.id;
      const startTime: string = slot.start_time ?? slot.start;
      const endTime: string = slot.end_time ?? slot.end;

      if (!practitioner || !organizationId) {
        throw new Error('Not authenticated');
      }

      // Create an appointment for this slot
      const newAppointment = await appointmentService.create({
        organization_id: organizationId,
        status: 'booked',
        start_time: startTime,
        end_time: endTime,
        practitioner_id: practitioner.id,
        slot_id: slotId,
      });

      // Mark the slot as busy
      await slotService.update(slotId, { status: 'busy' });

      // Remove the $find result we acted on from our state
      setFindSlots((prev) => (prev ?? []).filter((s: any) => s.id !== slotId));

      // Add the new appointment to our state
      const createdAppointment = newAppointment as Appointment;
      setAppointments((state) => [createdAppointment, ...(state ?? [])]);

      // Open the appointment details drawer for the resource we just created
      setAppointmentDetails(createdAppointment);
      appointmentDetailsHandlers.open();
    },
    [practitioner, organizationId, appointmentDetailsHandlers]
  );

  const [bookLoading, setBookLoading] = useState(false);

  const handleSelectSlot = useCallback(
    (slot: any) => {
      // If selecting a slot from the find pane (has transient identifier), book it
      const isTransient =
        slot.identifier?.some?.((id: any) => id.system === 'urn:scheduling-transient');
      if (isTransient) {
        setBookLoading(true);
        bookSlot(slot)
          .catch(showErrorNotification)
          .finally(() => setBookLoading(false));
        return;
      }

      // When a "free" slot is selected, open the create appointment modal
      if (slot.status === 'free') {
        createAppointmentHandlers.open();
        setAppointmentSlot({
          start: new Date(slot.start_time ?? slot.start),
          end: new Date(slot.end_time ?? slot.end),
        });
      }
    },
    [createAppointmentHandlers, bookSlot]
  );

  // When an appointment is selected, navigate to the encounter detail page or
  // open the appointment details drawer
  const handleSelectAppointment = useCallback(
    async (appointment: any) => {
      const appointmentId = appointment.id;
      if (!appointmentId) {
        showErrorNotification("Can't navigate to unsaved appointment");
        return;
      }

      // Resolve the Supabase Appointment record from the adapted calendar object
      const resolvedAppointment: Appointment =
        appointment.start_time !== undefined
          ? appointment
          : {
              ...appointment,
              start_time: appointment.start,
              end_time: appointment.end,
            };

      try {
        // Look up an encounter linked to this appointment
        const { data: encounters, error } = await supabase
          .from('encounters')
          .select('*')
          .eq('appointment_id', appointmentId)
          .limit(1);

        if (error) throw error;

        if (!encounters || encounters.length === 0) {
          setAppointmentDetails(resolvedAppointment);
          appointmentDetailsHandlers.open();
          return;
        }

        const encounter = encounters[0];
        const patientId = encounter.patient_id;
        if (patientId) {
          await navigate(`/patients/${patientId}/Encounter/${encounter.id}`);
        }
      } catch (error) {
        showErrorNotification(error);
      }
    },
    [navigate, appointmentDetailsHandlers]
  );

  const height = window.innerHeight - 60;
  const serviceTypes = useMemo(() => schedule && parseServiceTypes(schedule), [schedule]);

  const handleAppointmentUpdate = useCallback((updated: Appointment) => {
    setAppointments((state) =>
      (state ?? []).map((existing) => (existing.id === updated.id ? updated : existing))
    );
    setAppointmentDetails((existing) => (existing?.id === updated.id ? updated : existing));
  }, []);

  // Adapt Supabase slot/appointment data to the shapes the Calendar component expects
  const calendarSlots = useMemo(() => {
    const regularSlots = (slots ?? []).map((s) => toCalendarSlot(s));
    return [...regularSlots, ...(findSlots ?? [])];
  }, [slots, findSlots]);

  const calendarAppointments = useMemo(
    () => (appointments ?? []).map(toCalendarAppointment),
    [appointments]
  );

  return (
    <Box pos="relative" bg="white" p="md" style={{ height }}>
      <div className={classes.container}>
        <div className={classes.calendar}>
          <Calendar
            style={{ height: height - 150 }}
            onSelectInterval={handleSelectInterval}
            onSelectAppointment={handleSelectAppointment}
            onSelectSlot={handleSelectSlot}
            slots={calendarSlots}
            appointments={calendarAppointments}
            onRangeChange={setRange}
          />
        </div>

        {serviceTypes?.length && schedule && range && (
          <Stack gap="md" justify="space-between" className={classes.findPane}>
            <ScheduleFindPane
              key={schedule.id}
              schedule={schedule}
              range={range}
              onChange={setFindSlots}
              onSelectSlot={(slot) => handleSelectSlot(slot)}
              slots={findSlots}
            />
            {bookLoading && (
              <Center>
                <Loader />
              </Center>
            )}
          </Stack>
        )}
      </div>

      {/* Modals */}
      <Drawer
        opened={createAppointmentOpened}
        onClose={createAppointmentHandlers.close}
        title="New Calendar Event"
        position="right"
        h="100%"
      >
        <CreateVisit appointmentSlot={appointmentSlot} />
      </Drawer>
      <Drawer
        opened={appointmentDetailsOpened}
        onClose={appointmentDetailsHandlers.close}
        title={
          <Text size="xl" fw={700}>
            Appointment Details
          </Text>
        }
        position="right"
        h="100%"
      >
        {appointmentDetails && (
          <AppointmentDetails appointment={appointmentDetails} onUpdate={handleAppointmentUpdate} />
        )}
      </Drawer>
    </Box>
  );
}

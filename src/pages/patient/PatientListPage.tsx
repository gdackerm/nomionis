import {
  ActionIcon,
  Badge,
  Group,
  Loader,
  Paper,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import type { JSX } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { formatDate, formatHumanName, formatGender, getStatusColor } from '../../lib/utils';
import { patientService } from '../../services/patient.service';
import type { Tables } from '../../lib/supabase/types';

type Patient = Tables<'patients'>;

export function PatientListPage(): JSX.Element {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);
  const [count, setCount] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      if (debouncedSearch) {
        const results = await patientService.search(debouncedSearch);
        setPatients(results);
        setCount(results.length);
      } else {
        const result = await patientService.list({
          orderBy: { column: 'updated_at', ascending: false },
          page,
          pageSize,
        });
        setPatients(result.data);
        setCount(result.count);
      }
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  return (
    <Paper p="md">
      <Group justify="space-between" mb="md">
        <Title order={3}>Patients</Title>
        <Group>
          <TextInput
            placeholder="Search patients..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.currentTarget.value);
              setPage(0);
            }}
          />
          <ActionIcon
            variant="filled"
            size="lg"
            onClick={() => navigate('/onboarding')?.catch(console.error)}
          >
            <IconPlus size={18} />
          </ActionIcon>
        </Group>
      </Group>

      {loading ? (
        <Loader />
      ) : patients.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No patients found
        </Text>
      ) : (
        <>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Gender</Table.Th>
                <Table.Th>Date of Birth</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {patients.map((patient) => (
                <Table.Tr
                  key={patient.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/Patient/${patient.id}`)?.catch(console.error)}
                >
                  <Table.Td>
                    {formatHumanName(patient.given_name, patient.family_name)}
                  </Table.Td>
                  <Table.Td>{formatGender(patient.gender)}</Table.Td>
                  <Table.Td>{formatDate(patient.birth_date)}</Table.Td>
                  <Table.Td>{patient.email ?? ''}</Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(patient.active ? 'active' : 'cancelled')} size="sm">
                      {patient.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          {count !== null && count > pageSize && (
            <Group justify="center" mt="md">
              <Text size="sm" c="dimmed">
                Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, count)} of {count}
              </Text>
              <Group gap="xs">
                <ActionIcon
                  variant="subtle"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  &lt;
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  disabled={(page + 1) * pageSize >= count}
                  onClick={() => setPage((p) => p + 1)}
                >
                  &gt;
                </ActionIcon>
              </Group>
            </Group>
          )}
        </>
      )}
    </Paper>
  );
}

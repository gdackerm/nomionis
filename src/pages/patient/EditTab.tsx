import {
  Button,
  Group,
  Loader,
  Paper,
  Select,
  Stack,
  TagsInput,
  TextInput,
  Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { showNotification } from '@mantine/notifications';
import { useCallback, useEffect, useState } from 'react';
import type { JSX } from 'react';
import { useNavigate, useParams } from 'react-router';
import { normalizeErrorString } from '../../lib/utils';
import { patientService } from '../../services/patient.service';
import type { Tables } from '../../lib/supabase/types';

type Patient = Tables<'patients'>;

export function EditTab(): JSX.Element | null {
  const { patientId } = useParams() as { patientId: string };
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | undefined>();
  const [saving, setSaving] = useState(false);

  // Form state
  const [givenName, setGivenName] = useState<string[]>([]);
  const [familyName, setFamilyName] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    patientService
      .getById(patientId)
      .then((p) => {
        setPatient(p);
        setGivenName(p.given_name ?? []);
        setFamilyName(p.family_name ?? '');
        setGender(p.gender);
        setBirthDate(p.birth_date ?? null);
        setEmail(p.email ?? '');
        setPhone(p.phone ?? '');
      })
      .catch((err) => {
        showNotification({ color: 'red', message: normalizeErrorString(err), autoClose: false });
      });
  }, [patientId]);

  const handleSubmit = useCallback(async () => {
    setSaving(true);
    try {
      await patientService.update(patientId, {
        given_name: givenName,
        family_name: familyName,
        gender,
        birth_date: birthDate ? new Date(birthDate).toISOString().split('T')[0] : null,
        email: email || null,
        phone: phone || null,
      });
      showNotification({ color: 'green', message: 'Patient updated successfully' });
      navigate(`/Patient/${patientId}/timeline`)?.catch(console.error);
    } catch (err) {
      showNotification({ color: 'red', message: normalizeErrorString(err), autoClose: false });
    } finally {
      setSaving(false);
    }
  }, [patientId, givenName, familyName, gender, birthDate, email, phone, navigate]);

  if (!patient) {
    return <Loader />;
  }

  return (
    <Paper p="md">
      <Title order={4} mb="md">Edit Patient</Title>
      <Stack gap="md" maw={600}>
        <TagsInput
          label="Given Name(s)"
          value={givenName}
          onChange={setGivenName}
          placeholder="Enter given names"
        />
        <TextInput
          label="Family Name"
          value={familyName}
          onChange={(e) => setFamilyName(e.currentTarget.value)}
          required
        />
        <Select
          label="Gender"
          value={gender}
          onChange={setGender}
          data={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
            { value: 'unknown', label: 'Unknown' },
          ]}
          clearable
        />
        <DateInput
          label="Date of Birth"
          value={birthDate}
          onChange={setBirthDate}
          clearable
        />
        <TextInput
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
        />
        <TextInput
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.currentTarget.value)}
        />
        <Group>
          <Button onClick={handleSubmit} loading={saving}>
            Save Changes
          </Button>
          <Button
            variant="subtle"
            onClick={() => navigate(`/Patient/${patientId}/timeline`)?.catch(console.error)}
          >
            Cancel
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

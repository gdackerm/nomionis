import {
  Button,
  Checkbox,
  Divider,
  Group,
  Loader,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { showNotification } from '@mantine/notifications';
import { useCallback, useState } from 'react';
import type { JSX } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../providers/AuthProvider';
import { onboardPatient } from '../../utils/intake-form';
import { normalizeErrorString } from '../../lib/utils';

export function IntakeFormPage(): JSX.Element {
  const navigate = useNavigate();
  const { organizationId } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  // Demographics
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [ssn, setSsn] = useState('');

  // Emergency contact
  const [ecFirstName, setEcFirstName] = useState('');
  const [ecLastName, setEcLastName] = useState('');
  const [ecPhone, setEcPhone] = useState('');

  // Consents
  const [consentTreatment, setConsentTreatment] = useState(false);
  const [consentPay, setConsentPay] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentDirectives, setConsentDirectives] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!firstName || !lastName) {
      showNotification({ color: 'red', message: 'First and last name are required' });
      return;
    }
    if (!organizationId) {
      showNotification({ color: 'red', message: 'Organization not configured' });
      return;
    }

    setSubmitting(true);

    // Build questionnaire-like answer structure for the onboarding function
    const questionnaire = {
      item: [
        { linkId: 'patient-demographics', type: 'group', item: [
          { linkId: 'first-name', type: 'string' },
          { linkId: 'middle-name', type: 'string' },
          { linkId: 'last-name', type: 'string' },
          { linkId: 'dob', type: 'date' },
          { linkId: 'gender-identity', type: 'choice' },
          { linkId: 'phone', type: 'string' },
          { linkId: 'street', type: 'string' },
          { linkId: 'city', type: 'string' },
          { linkId: 'state', type: 'choice' },
          { linkId: 'zip', type: 'string' },
          { linkId: 'ssn', type: 'string' },
        ]},
        { linkId: 'emergency-contact', type: 'group', item: [
          { linkId: 'emergency-contact-first-name', type: 'string' },
          { linkId: 'emergency-contact-last-name', type: 'string' },
          { linkId: 'emergency-contact-phone', type: 'string' },
        ]},
        { linkId: 'consent-for-treatment', type: 'group', item: [
          { linkId: 'consent-for-treatment-signature', type: 'boolean' },
          { linkId: 'consent-for-treatment-date', type: 'date' },
        ]},
        { linkId: 'agreement-to-pay-for-treatment', type: 'group', item: [
          { linkId: 'agreement-to-pay-for-treatment-help', type: 'boolean' },
          { linkId: 'agreement-to-pay-for-treatment-date', type: 'date' },
        ]},
        { linkId: 'notice-of-privacy-practices', type: 'group', item: [
          { linkId: 'notice-of-privacy-practices-signature', type: 'boolean' },
          { linkId: 'notice-of-privacy-practices-date', type: 'date' },
        ]},
        { linkId: 'acknowledgement-for-advance-directives', type: 'group', item: [
          { linkId: 'acknowledgement-for-advance-directives-signature', type: 'boolean' },
          { linkId: 'acknowledgement-for-advance-directives-date', type: 'date' },
        ]},
      ],
    };

    const now = new Date().toISOString().split('T')[0];

    const response = {
      item: [
        { linkId: 'patient-demographics', item: [
          { linkId: 'first-name', answer: [{ valueString: firstName }] },
          ...(middleName ? [{ linkId: 'middle-name', answer: [{ valueString: middleName }] }] : []),
          { linkId: 'last-name', answer: [{ valueString: lastName }] },
          ...(dob ? [{ linkId: 'dob', answer: [{ valueDate: new Date(dob).toISOString().split('T')[0] }] }] : []),
          ...(gender ? [{ linkId: 'gender-identity', answer: [{ valueCoding: { code: gender } }] }] : []),
          ...(phone ? [{ linkId: 'phone', answer: [{ valueString: phone }] }] : []),
          ...(street ? [{ linkId: 'street', answer: [{ valueString: street }] }] : []),
          ...(city ? [{ linkId: 'city', answer: [{ valueString: city }] }] : []),
          ...(state ? [{ linkId: 'state', answer: [{ valueCoding: { code: state } }] }] : []),
          ...(zip ? [{ linkId: 'zip', answer: [{ valueString: zip }] }] : []),
          ...(ssn ? [{ linkId: 'ssn', answer: [{ valueString: ssn }] }] : []),
        ]},
        ...(ecFirstName || ecLastName ? [{
          linkId: 'emergency-contact',
          item: [
            ...(ecFirstName ? [{ linkId: 'emergency-contact-first-name', answer: [{ valueString: ecFirstName }] }] : []),
            ...(ecLastName ? [{ linkId: 'emergency-contact-last-name', answer: [{ valueString: ecLastName }] }] : []),
            ...(ecPhone ? [{ linkId: 'emergency-contact-phone', answer: [{ valueString: ecPhone }] }] : []),
          ],
        }] : []),
        { linkId: 'consent-for-treatment', item: [
          { linkId: 'consent-for-treatment-signature', answer: [{ valueBoolean: consentTreatment }] },
          { linkId: 'consent-for-treatment-date', answer: [{ valueDate: now }] },
        ]},
        { linkId: 'agreement-to-pay-for-treatment', item: [
          { linkId: 'agreement-to-pay-for-treatment-help', answer: [{ valueBoolean: consentPay }] },
          { linkId: 'agreement-to-pay-for-treatment-date', answer: [{ valueDate: now }] },
        ]},
        { linkId: 'notice-of-privacy-practices', item: [
          { linkId: 'notice-of-privacy-practices-signature', answer: [{ valueBoolean: consentPrivacy }] },
          { linkId: 'notice-of-privacy-practices-date', answer: [{ valueDate: now }] },
        ]},
        { linkId: 'acknowledgement-for-advance-directives', item: [
          { linkId: 'acknowledgement-for-advance-directives-signature', answer: [{ valueBoolean: consentDirectives }] },
          { linkId: 'acknowledgement-for-advance-directives-date', answer: [{ valueDate: now }] },
        ]},
      ],
    };

    try {
      const patient = await onboardPatient(organizationId, questionnaire, response);
      showNotification({ color: 'green', message: 'Patient onboarded successfully' });
      navigate(`/Patient/${patient.id}/timeline`)?.catch(console.error);
    } catch (error) {
      showNotification({
        color: 'red',
        message: normalizeErrorString(error),
        autoClose: false,
      });
    } finally {
      setSubmitting(false);
    }
  }, [
    organizationId, firstName, middleName, lastName, dob, gender, phone,
    street, city, state, zip, ssn, ecFirstName, ecLastName, ecPhone,
    consentTreatment, consentPay, consentPrivacy, consentDirectives, navigate,
  ]);

  if (!organizationId) {
    return <Loader />;
  }

  return (
    <Paper p="md" maw={800} mx="auto">
      <Title order={3} mb="lg">New Patient Intake</Title>

      <Stack gap="lg">
        <div>
          <Title order={5} mb="sm">Demographics</Title>
          <Group grow>
            <TextInput label="First Name" value={firstName} onChange={(e) => setFirstName(e.currentTarget.value)} required />
            <TextInput label="Middle Name" value={middleName} onChange={(e) => setMiddleName(e.currentTarget.value)} />
            <TextInput label="Last Name" value={lastName} onChange={(e) => setLastName(e.currentTarget.value)} required />
          </Group>
          <Group grow mt="sm">
            <DateInput label="Date of Birth" value={dob} onChange={setDob} clearable />
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
            <TextInput label="Phone" value={phone} onChange={(e) => setPhone(e.currentTarget.value)} />
          </Group>
          <Group grow mt="sm">
            <TextInput label="Street" value={street} onChange={(e) => setStreet(e.currentTarget.value)} />
            <TextInput label="City" value={city} onChange={(e) => setCity(e.currentTarget.value)} />
            <TextInput label="State" value={state} onChange={(e) => setState(e.currentTarget.value)} />
            <TextInput label="Zip" value={zip} onChange={(e) => setZip(e.currentTarget.value)} />
          </Group>
          <TextInput label="SSN" value={ssn} onChange={(e) => setSsn(e.currentTarget.value)} mt="sm" maw={300} />
        </div>

        <Divider />

        <div>
          <Title order={5} mb="sm">Emergency Contact</Title>
          <Group grow>
            <TextInput label="First Name" value={ecFirstName} onChange={(e) => setEcFirstName(e.currentTarget.value)} />
            <TextInput label="Last Name" value={ecLastName} onChange={(e) => setEcLastName(e.currentTarget.value)} />
            <TextInput label="Phone" value={ecPhone} onChange={(e) => setEcPhone(e.currentTarget.value)} />
          </Group>
        </div>

        <Divider />

        <div>
          <Title order={5} mb="sm">Consents</Title>
          <Stack gap="sm">
            <Checkbox
              label="Consent for Treatment"
              description="I consent to and authorize the performance of any treatments, examinations, medical services, surgical or diagnostic procedures."
              checked={consentTreatment}
              onChange={(e) => setConsentTreatment(e.currentTarget.checked)}
            />
            <Checkbox
              label="Agreement to Pay for Treatment"
              description="I agree to pay all applicable co-payments, co-insurance and deductibles."
              checked={consentPay}
              onChange={(e) => setConsentPay(e.currentTarget.checked)}
            />
            <Checkbox
              label="Notice of Privacy Practices"
              description="I acknowledge that I have received a copy of the Notice of Privacy Practices."
              checked={consentPrivacy}
              onChange={(e) => setConsentPrivacy(e.currentTarget.checked)}
            />
            <Checkbox
              label="Advance Directives"
              description="I acknowledge I have received information about Advance Directives."
              checked={consentDirectives}
              onChange={(e) => setConsentDirectives(e.currentTarget.checked)}
            />
          </Stack>
        </div>

        <Divider />

        <Group>
          <Button onClick={handleSubmit} loading={submitting} size="md">
            Submit Intake Form
          </Button>
          <Text size="sm" c="dimmed">
            Additional clinical data (allergies, medications, conditions) can be added after patient creation.
          </Text>
        </Group>
      </Stack>
    </Paper>
  );
}

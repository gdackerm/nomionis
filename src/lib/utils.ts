import dayjs from 'dayjs';

// ─── FHIR Constants ───────────────────────────────────────────────

export const SNOMED = 'http://snomed.info/sct';
export const LOINC = 'http://loinc.org';
export const CPT = 'http://www.ama-assn.org/go/cpt';
export const HTTP_HL7_ORG = 'http://hl7.org';
export const HTTP_TERMINOLOGY_HL7_ORG = 'http://terminology.hl7.org';

// ─── Name formatting ──────────────────────────────────────────────

export function formatHumanName(givenName: string[] | string | null | undefined, familyName: string | null | undefined): string {
  const given = Array.isArray(givenName) ? givenName.join(' ') : (givenName ?? '');
  const family = familyName ?? '';
  return [given, family].filter(Boolean).join(' ');
}

export function formatPatientName(patient: { given_name?: string[] | null; family_name?: string | null } | null | undefined): string {
  if (!patient) return '';
  return formatHumanName(patient.given_name, patient.family_name);
}

// ─── Date formatting ──────────────────────────────────────────────

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  return dayjs(date).format('MM/DD/YYYY');
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '';
  return dayjs(date).format('MM/DD/YYYY h:mm A');
}

export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return '';
  return dayjs(date).format('h:mm A');
}

export function formatAge(birthDate: string | null | undefined): string {
  if (!birthDate) return '';
  const years = dayjs().diff(dayjs(birthDate), 'year');
  return `${years}y`;
}

// ─── Deep clone ───────────────────────────────────────────────────

export function deepClone<T>(obj: T): T {
  return structuredClone(obj);
}

// ─── Gender display ───────────────────────────────────────────────

export function formatGender(gender: string | null | undefined): string {
  if (!gender) return '';
  const map: Record<string, string> = {
    male: 'Male',
    female: 'Female',
    other: 'Other',
    unknown: 'Unknown',
  };
  return map[gender] ?? gender;
}

// ─── Status colors ────────────────────────────────────────────────

export function getStatusColor(status: string | null | undefined): string {
  switch (status) {
    case 'active':
    case 'completed':
    case 'fulfilled':
    case 'finished':
    case 'final':
      return 'green';
    case 'in-progress':
    case 'checked-in':
    case 'arrived':
    case 'accepted':
      return 'blue';
    case 'planned':
    case 'booked':
    case 'requested':
    case 'ready':
    case 'received':
    case 'draft':
      return 'yellow';
    case 'cancelled':
    case 'rejected':
    case 'entered-in-error':
    case 'failed':
      return 'red';
    case 'on-hold':
    case 'suspended':
      return 'orange';
    default:
      return 'gray';
  }
}

// ─── Initials for avatars ─────────────────────────────────────────

export function getInitials(givenName: string[] | string | null | undefined, familyName: string | null | undefined): string {
  const given = Array.isArray(givenName) ? givenName[0] : givenName;
  const first = given?.[0]?.toUpperCase() ?? '';
  const last = familyName?.[0]?.toUpperCase() ?? '';
  return first + last;
}

// ─── Error normalization ──────────────────────────────────────────

export function normalizeErrorString(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}

// ─── Questionnaire answer extraction ──────────────────────────────

export interface QuestionnaireAnswer {
  valueString?: string;
  valueDate?: string;
  valueDateTime?: string;
  valueBoolean?: boolean;
  valueCoding?: { system?: string; code?: string; display?: string };
  valueInteger?: number;
  valueDecimal?: number;
  valueReference?: { reference?: string; display?: string };
}

export interface QuestionnaireResponseItem {
  linkId: string;
  answer?: QuestionnaireAnswer[];
  item?: QuestionnaireResponseItem[];
}

export function getQuestionnaireAnswers(
  response: { item?: QuestionnaireResponseItem[] }
): Record<string, QuestionnaireAnswer> {
  const answers: Record<string, QuestionnaireAnswer> = {};

  function extractAnswers(items: QuestionnaireResponseItem[] | undefined): void {
    if (!items) return;
    for (const item of items) {
      if (item.answer && item.answer.length > 0) {
        answers[item.linkId] = item.answer[0];
      }
      if (item.item) {
        extractAnswers(item.item);
      }
    }
  }

  extractAnswers(response.item);
  return answers;
}

import { LOINC, HTTP_HL7_ORG, HTTP_TERMINOLOGY_HL7_ORG, SNOMED } from '../lib/utils';
import type { Json } from '../lib/supabase/types';
import { supabase } from '../lib/supabase/client';

export const PROFILE_URLS: Record<string, string> = {
  AllergyIntolerance: `${HTTP_HL7_ORG}/fhir/us/core/StructureDefinition/us-core-allergyintolerance`,
  CareTeam: `${HTTP_HL7_ORG}/fhir/us/core/StructureDefinition/us-core-careteam`,
  Coverage: `${HTTP_HL7_ORG}/fhir/us/core/StructureDefinition/us-core-coverage`,
  Immunization: `${HTTP_HL7_ORG}/fhir/us/core/StructureDefinition/us-core-immunization`,
  MedicationRequest: `${HTTP_HL7_ORG}/fhir/us/core/StructureDefinition/us-core-medicationrequest`,
  Patient: `${HTTP_HL7_ORG}/fhir/us/core/StructureDefinition/us-core-patient`,
  ObservationSexualOrientation: `${HTTP_HL7_ORG}/fhir/us/core/StructureDefinition/us-core-observation-sexual-orientation`,
  ObservationSmokingStatus: `${HTTP_HL7_ORG}/fhir/us/core/StructureDefinition/us-core-smokingstatus`,
};

export const extensionURLMapping: Record<string, string> = {
  race: HTTP_HL7_ORG + '/fhir/us/core/StructureDefinition/us-core-race',
  ethnicity: HTTP_HL7_ORG + '/fhir/us/core/StructureDefinition/us-core-ethnicity',
  veteran: HTTP_HL7_ORG + '/fhir/us/military-service/StructureDefinition/military-service-veteran-status',
};

export const observationCodeMapping: Record<string, { system: string; code: string; display: string }> = {
  housingStatus: { code: '71802-3', system: LOINC, display: 'Housing status' },
  educationLevel: { code: '82589-3', system: LOINC, display: 'Highest Level of Education' },
  smokingStatus: { code: '72166-2', system: LOINC, display: 'Tobacco smoking status' },
  sexualOrientation: { code: '76690-7', system: LOINC, display: 'Sexual orientation' },
  pregnancyStatus: { code: '82810-3', system: LOINC, display: 'Pregnancy status' },
  estimatedDeliveryDate: { code: '11778-8', system: LOINC, display: 'Estimated date of delivery' },
};

export const observationCategoryMapping: Record<string, { system: string; code: string; display: string }> = {
  socialHistory: {
    system: HTTP_TERMINOLOGY_HL7_ORG + '/CodeSystem/observation-category',
    code: 'social-history',
    display: 'Social History',
  },
  sdoh: {
    system: HTTP_HL7_ORG + '/fhir/us/core/CodeSystem/us-core-tags',
    code: 'sdoh',
    display: 'SDOH',
  },
};

export const consentScopeMapping: Record<string, Json> = {
  adr: { coding: [{ system: HTTP_TERMINOLOGY_HL7_ORG + '/CodeSystem/consentscope', code: 'adr', display: 'Advanced Care Directive' }] },
  patientPrivacy: { coding: [{ system: HTTP_TERMINOLOGY_HL7_ORG + '/CodeSystem/consentscope', code: 'patient-privacy', display: 'Patient Privacy' }] },
  treatment: { coding: [{ system: HTTP_TERMINOLOGY_HL7_ORG + '/CodeSystem/consentscope', code: 'treatment', display: 'Treatment' }] },
};

export const consentCategoryMapping: Record<string, Json> = {
  acd: { coding: [{ system: HTTP_TERMINOLOGY_HL7_ORG + '/CodeSystem/consentcategorycodes', code: 'acd', display: 'Advanced Care Directive' }] },
  nopp: { coding: [{ system: HTTP_TERMINOLOGY_HL7_ORG + '/CodeSystem/v3-ActCode', code: 'nopp', display: 'Notice of Privacy Practices' }] },
  pay: { coding: [{ system: HTTP_TERMINOLOGY_HL7_ORG + '/CodeSystem/v3-ActCode', code: 'pay', display: 'Payment' }] },
  med: { coding: [{ system: HTTP_TERMINOLOGY_HL7_ORG + '/CodeSystem/v3-ActCode', code: 'med', display: 'Medical' }] },
};

export const consentPolicyRuleMapping: Record<string, Json> = {
  hipaaNpp: { coding: [{ system: HTTP_TERMINOLOGY_HL7_ORG + '/CodeSystem/consentpolicycodes', code: 'hipaa-npp', display: 'HIPAA Notice of Privacy Practices' }] },
  hipaaSelfPay: { coding: [{ system: HTTP_TERMINOLOGY_HL7_ORG + '/CodeSystem/consentpolicycodes', code: 'hipaa-self-pay', display: 'HIPAA Self-Pay Restriction' }] },
  cric: { coding: [{ system: HTTP_TERMINOLOGY_HL7_ORG + '/CodeSystem/consentpolicycodes', code: 'cric', display: 'Common Rule Informed Consent' }] },
  adr: { coding: [{ system: 'http://medplum.com', code: 'BasicADR', display: 'Advanced Care Directive' }] },
};

// ─── Answer types ─────────────────────────────────────────────────

export interface IntakeAnswer {
  valueString?: string;
  valueDate?: string;
  valueDateTime?: string;
  valueBoolean?: boolean;
  valueCoding?: { system?: string; code?: string; display?: string };
  valueReference?: { reference?: string; display?: string };
}

// ─── Observation upsert ───────────────────────────────────────────

export async function upsertObservation(
  organizationId: string,
  patientId: string,
  code: { system: string; code: string; display: string },
  category: { system: string; code: string; display: string },
  answerType: 'valueCodeableConcept' | 'valueDateTime',
  value: IntakeAnswer | undefined
): Promise<void> {
  if (!value || !code) return;

  let observationValue: Json = null;
  if (answerType === 'valueCodeableConcept' && value.valueCoding) {
    observationValue = { type: 'CodeableConcept', coding: [value.valueCoding] };
  } else if (answerType === 'valueDateTime' && value.valueDateTime) {
    observationValue = { type: 'DateTime', value: value.valueDateTime };
  }

  if (!observationValue) return;

  await supabase.from('observations').upsert(
    {
      organization_id: organizationId,
      patient_id: patientId,
      code_system: code.system,
      code_value: code.code,
      code_display: code.display,
      status: 'final',
      effective_date: new Date().toISOString(),
      value: observationValue,
      category: { coding: [category] },
    },
    { onConflict: 'patient_id,code_system,code_value' }
  );
}

// ─── Extension helpers ────────────────────────────────────────────

export function buildExtensions(
  answers: Record<string, IntakeAnswer>
): Json {
  const extensions: Json[] = [];

  // Race
  if (answers['race']?.valueCoding) {
    extensions.push({
      url: extensionURLMapping.race,
      extension: [
        { url: 'ombCategory', valueCoding: answers['race'].valueCoding },
        ...(answers['race'].valueCoding.display ? [{ url: 'text', valueString: answers['race'].valueCoding.display }] : []),
      ],
    });
  }

  // Ethnicity
  if (answers['ethnicity']?.valueCoding) {
    extensions.push({
      url: extensionURLMapping.ethnicity,
      extension: [
        { url: 'ombCategory', valueCoding: answers['ethnicity'].valueCoding },
        ...(answers['ethnicity'].valueCoding.display ? [{ url: 'text', valueString: answers['ethnicity'].valueCoding.display }] : []),
      ],
    });
  }

  // Veteran status
  const veteranValue = answers['veteran-status']?.valueBoolean;
  if (veteranValue !== undefined) {
    extensions.push({
      url: extensionURLMapping.veteran,
      valueBoolean: Boolean(veteranValue),
    });
  }

  return extensions.length > 0 ? extensions : null;
}

// ─── Language/communication helpers ───────────────────────────────

export function buildCommunication(
  answers: Record<string, IntakeAnswer>
): Json {
  const communications: Json[] = [];

  if (answers['languages-spoken']?.valueCoding) {
    communications.push({
      language: { coding: [answers['languages-spoken'].valueCoding] },
    });
  }

  if (answers['preferred-language']?.valueCoding) {
    const existing = communications.find(
      (c: any) => c.language?.coding?.[0]?.code === answers['preferred-language']?.valueCoding?.code
    );
    if (existing) {
      (existing as any).preferred = true;
    } else {
      communications.push({
        language: { coding: [answers['preferred-language']!.valueCoding!] },
        preferred: true,
      });
    }
  }

  return communications.length > 0 ? communications : null;
}

// ─── Allergy ──────────────────────────────────────────────────────

export async function addAllergy(
  organizationId: string,
  patientId: string,
  answers: Record<string, IntakeAnswer>
): Promise<void> {
  const code = answers['allergy-substance']?.valueCoding;
  if (!code) return;

  const reaction = answers['allergy-reaction']?.valueString;
  const onsetDate = answers['allergy-onset']?.valueDateTime;

  await supabase.from('allergy_intolerances').upsert(
    {
      organization_id: organizationId,
      patient_id: patientId,
      code_system: code.system ?? null,
      code_value: code.code ?? null,
      code_display: code.display ?? null,
      clinical_status: 'active',
      verification_status: 'unconfirmed',
      onset_date: onsetDate ?? null,
      reaction: reaction ? [{ manifestation: [{ text: reaction }] }] : null,
      code: { coding: [code] },
    },
    { onConflict: 'patient_id,code_system,code_value' }
  );
}

// ─── Medication ───────────────────────────────────────────────────

export async function addMedication(
  organizationId: string,
  patientId: string,
  answers: Record<string, IntakeAnswer>
): Promise<void> {
  const code = answers['medication-code']?.valueCoding;
  if (!code) return;

  const note = answers['medication-note']?.valueString;

  await supabase.from('medication_requests').upsert(
    {
      organization_id: organizationId,
      patient_id: patientId,
      status: 'active',
      intent: 'order',
      medication_system: code.system ?? null,
      medication_code: code.code ?? null,
      medication_display: code.display ?? null,
      note: note ?? null,
    },
    { onConflict: 'patient_id,medication_system,medication_code' }
  );
}

// ─── Condition ────────────────────────────────────────────────────

export async function addCondition(
  organizationId: string,
  patientId: string,
  answers: Record<string, IntakeAnswer>
): Promise<void> {
  const code = answers['medical-history-problem']?.valueCoding;
  if (!code) return;

  const clinicalStatus = answers['medical-history-clinical-status']?.valueCoding;
  const onsetDate = answers['medical-history-onset']?.valueDateTime;

  await supabase.from('conditions').insert({
    organization_id: organizationId,
    patient_id: patientId,
    code_system: code.system ?? null,
    code_value: code.code ?? null,
    code_display: code.display ?? null,
    clinical_status: clinicalStatus?.code ?? null,
    onset_date: onsetDate ?? null,
    code: { coding: [code] },
  });
}

// ─── Family Member History ────────────────────────────────────────

export async function addFamilyMemberHistory(
  organizationId: string,
  patientId: string,
  answers: Record<string, IntakeAnswer>
): Promise<void> {
  const condition = answers['family-member-history-problem']?.valueCoding;
  const relationship = answers['family-member-history-relationship']?.valueCoding;
  if (!condition || !relationship) return;

  const deceased = answers['family-member-history-deceased']?.valueBoolean;

  await supabase.from('family_member_histories').insert({
    organization_id: organizationId,
    patient_id: patientId,
    relationship: { coding: [relationship] },
    condition: [{ code: { coding: [condition] } }],
    deceased: deceased ?? null,
  });
}

// ─── Immunization ─────────────────────────────────────────────────

export async function addImmunization(
  organizationId: string,
  patientId: string,
  answers: Record<string, IntakeAnswer>
): Promise<void> {
  const code = answers['immunization-vaccine']?.valueCoding;
  const occurrenceDate = answers['immunization-date']?.valueDateTime;
  if (!code || !occurrenceDate) return;

  await supabase.from('immunizations').insert({
    organization_id: organizationId,
    patient_id: patientId,
    status: 'completed',
    vaccine_system: code.system ?? null,
    vaccine_code: code.code ?? null,
    vaccine_display: code.display ?? null,
    occurrence_date: occurrenceDate,
  });
}

// ─── Coverage ─────────────────────────────────────────────────────

export async function addCoverage(
  organizationId: string,
  patientId: string,
  answers: Record<string, IntakeAnswer>
): Promise<void> {
  const subscriberId = answers['subscriber-id']?.valueString;
  const relationshipToSubscriber = answers['relationship-to-subscriber']?.valueCoding;

  // Create RelatedPerson if needed
  const relatedPersonAnswers = answers['related-person'] as unknown as Record<string, IntakeAnswer> | undefined;
  if (
    relationshipToSubscriber?.code &&
    !['other', 'self', 'injured'].includes(relationshipToSubscriber.code) &&
    relatedPersonAnswers
  ) {
    const name = getHumanName(relatedPersonAnswers, 'related-person-');
    await supabase.from('related_persons').insert({
      organization_id: organizationId,
      patient_id: patientId,
      given_name: name?.given?.[0] ?? null,
      family_name: name?.family ?? null,
      birth_date: relatedPersonAnswers['related-person-dob']?.valueDate ?? null,
      gender: relatedPersonAnswers['related-person-gender-identity']?.valueCoding?.code ?? null,
      relationship: relationshipToSubscriber ? { coding: [relationshipToSubscriber] } : null,
    });
  }

  await supabase.from('coverages').insert({
    organization_id: organizationId,
    patient_id: patientId,
    status: 'active',
    subscriber_id: subscriberId ?? null,
    relationship: relationshipToSubscriber ? { coding: [relationshipToSubscriber] } : null,
    payor: answers['insurance-provider']?.valueReference
      ? { reference: answers['insurance-provider'].valueReference }
      : null,
  });
}

// ─── Consent ──────────────────────────────────────────────────────

export async function addConsent(
  organizationId: string,
  patientId: string,
  consentGiven: boolean,
  scope: Json,
  category: Json,
  policyRule: Json | undefined,
  date: string | undefined
): Promise<void> {
  await supabase.from('consents').insert({
    organization_id: organizationId,
    patient_id: patientId,
    status: consentGiven ? 'active' : 'rejected',
    scope,
    category,
    policy_rule: policyRule ?? null,
    consent_date: date ?? null,
  });
}

// ─── Questionnaire helpers ────────────────────────────────────────

interface QuestionnaireItem {
  linkId: string;
  type?: string;
  item?: QuestionnaireItem[];
}

interface QuestionnaireResponseItem {
  linkId: string;
  answer?: IntakeAnswer[];
  item?: QuestionnaireResponseItem[];
}

export function findQuestionnaireItem(
  items: QuestionnaireItem[] | undefined,
  linkId: string
): QuestionnaireItem | undefined {
  if (!items) return undefined;
  for (const item of items) {
    if (item.linkId === linkId) return item;
    if (item.item) {
      const found = findQuestionnaireItem(item.item, linkId);
      if (found) return found;
    }
  }
  return undefined;
}

export function getGroupRepeatedAnswers(
  questionnaire: { item?: QuestionnaireItem[] },
  response: { item?: QuestionnaireResponseItem[] },
  groupLinkId: string
): Record<string, IntakeAnswer>[] {
  const questionnaireItem = findQuestionnaireItem(questionnaire.item, groupLinkId);
  if (!questionnaireItem || questionnaireItem.type !== 'group' || !questionnaireItem.item) return [];

  const responseGroups = response.item?.filter((item) => item.linkId === groupLinkId);
  if (!responseGroups || responseGroups.length === 0) return [];

  return responseGroups.map((responseItem) => {
    const answers: Record<string, any> = {};
    const extractAnswers = (items: QuestionnaireResponseItem[]): void => {
      items.forEach(({ linkId, answer, item }) => {
        if (item) {
          const subGroupAnswers: Record<string, any> = {};
          item.forEach((subItem) => {
            if (subItem.answer) {
              subGroupAnswers[subItem.linkId] = subItem.answer[0] ?? {};
            }
          });
          answers[linkId] = subGroupAnswers;
        } else {
          answers[linkId] = answer?.[0] ?? {};
        }
      });
    };
    extractAnswers(responseItem.item || []);
    return answers;
  });
}

export function convertDateToDateTime(date: string | undefined): string | undefined {
  if (!date) return undefined;
  return new Date(date).toISOString();
}

export function getHumanName(
  answers: Record<string, IntakeAnswer>,
  prefix: string = ''
): { given?: string[]; family?: string } | undefined {
  const given: string[] = [];
  if (answers[`${prefix}first-name`]?.valueString) {
    given.push(answers[`${prefix}first-name`].valueString as string);
  }
  if (answers[`${prefix}middle-name`]?.valueString) {
    given.push(answers[`${prefix}middle-name`].valueString as string);
  }
  const family = answers[`${prefix}last-name`]?.valueString;

  if (given.length === 0 && !family) return undefined;
  return { ...(given.length > 0 ? { given } : {}), ...(family ? { family } : {}) };
}

export function getPatientAddress(
  answers: Record<string, IntakeAnswer>
): Json | null {
  const address: Record<string, unknown> = {};

  if (answers['street']?.valueString) address.line = [answers['street'].valueString];
  if (answers['city']?.valueString) address.city = answers['city'].valueString;
  if (answers['state']?.valueCoding?.code) address.state = answers['state'].valueCoding.code;
  if (answers['zip']?.valueString) address.postalCode = answers['zip'].valueString;

  return Object.keys(address).length > 0
    ? { use: 'home', type: 'physical', ...address }
    : null;
}

import { getQuestionnaireAnswers } from '../lib/utils';
import type { Tables } from '../lib/supabase/types';
import { patientService } from '../services/patient.service';
import {
  addAllergy,
  addCondition,
  addConsent,
  addCoverage,
  addFamilyMemberHistory,
  addImmunization,
  addMedication,
  buildCommunication,
  buildExtensions,
  consentCategoryMapping,
  consentPolicyRuleMapping,
  consentScopeMapping,
  convertDateToDateTime,
  getGroupRepeatedAnswers,
  getHumanName,
  getPatientAddress,
  observationCategoryMapping,
  observationCodeMapping,
  upsertObservation,
} from './intake-utils';
import type { IntakeAnswer } from './intake-utils';

type Patient = Tables<'patients'>;

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

interface Questionnaire {
  item?: QuestionnaireItem[];
}

interface QuestionnaireResponse {
  item?: QuestionnaireResponseItem[];
}

export async function onboardPatient(
  organizationId: string,
  questionnaire: Questionnaire,
  response: QuestionnaireResponse
): Promise<Patient> {
  const answers = getQuestionnaireAnswers(response as any) as unknown as Record<string, IntakeAnswer>;

  // Build patient data
  const patientName = getHumanName(answers);
  const patientAddress = getPatientAddress(answers);
  const extensions = buildExtensions(answers);
  const communication = buildCommunication(answers);

  const givenName = patientName?.given ?? [];
  const familyName = patientName?.family ?? '';

  // Extract phone
  const phone = answers['phone']?.valueString ?? null;

  // Extract SSN
  const ssn = answers['ssn']?.valueString;
  const ssnLast4 = ssn ? ssn.slice(-4) : null;

  // Extract gender
  const gender = answers['gender-identity']?.valueCoding?.code ?? null;

  // Extract birth date
  const birthDate = answers['dob']?.valueDate ?? null;

  // Build contacts from emergency contacts
  const emergencyContacts = getGroupRepeatedAnswers(questionnaire, response, 'emergency-contact');
  const contacts = emergencyContacts
    .map((contact) => {
      const name = getHumanName(contact, 'emergency-contact-');
      return {
        relationship: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0131', code: 'EP', display: 'Emergency contact person' }] }],
        name,
        telecom: contact['emergency-contact-phone']?.valueString
          ? [{ system: 'phone', value: contact['emergency-contact-phone'].valueString }]
          : undefined,
      };
    })
    .filter((c) => c.name);

  // Create the patient
  const patient = await patientService.create({
    organization_id: organizationId,
    given_name: givenName,
    family_name: familyName,
    gender,
    birth_date: birthDate,
    phone,
    ssn_last4: ssnLast4,
    address: patientAddress,
    contacts: contacts.length > 0 ? contacts : null,
    communication,
    extensions,
  });

  // Handle observations
  await upsertObservation(
    organizationId, patient.id,
    observationCodeMapping.sexualOrientation,
    observationCategoryMapping.socialHistory,
    'valueCodeableConcept',
    answers['sexual-orientation']
  );

  await upsertObservation(
    organizationId, patient.id,
    observationCodeMapping.housingStatus,
    observationCategoryMapping.sdoh,
    'valueCodeableConcept',
    answers['housing-status']
  );

  await upsertObservation(
    organizationId, patient.id,
    observationCodeMapping.educationLevel,
    observationCategoryMapping.sdoh,
    'valueCodeableConcept',
    answers['education-level']
  );

  await upsertObservation(
    organizationId, patient.id,
    observationCodeMapping.smokingStatus,
    observationCategoryMapping.socialHistory,
    'valueCodeableConcept',
    answers['smoking-status']
  );

  await upsertObservation(
    organizationId, patient.id,
    observationCodeMapping.pregnancyStatus,
    observationCategoryMapping.socialHistory,
    'valueCodeableConcept',
    answers['pregnancy-status']
  );

  const estimatedDeliveryDate = convertDateToDateTime(answers['estimated-delivery-date']?.valueDate);
  if (estimatedDeliveryDate) {
    await upsertObservation(
      organizationId, patient.id,
      observationCodeMapping.estimatedDeliveryDate,
      observationCategoryMapping.socialHistory,
      'valueDateTime',
      { valueDateTime: estimatedDeliveryDate }
    );
  }

  // Handle allergies
  const allergies = getGroupRepeatedAnswers(questionnaire, response, 'allergies');
  for (const allergy of allergies) {
    await addAllergy(organizationId, patient.id, allergy);
  }

  // Handle medications
  const medications = getGroupRepeatedAnswers(questionnaire, response, 'medications');
  for (const medication of medications) {
    await addMedication(organizationId, patient.id, medication);
  }

  // Handle medical history
  const medicalHistory = getGroupRepeatedAnswers(questionnaire, response, 'medical-history');
  for (const history of medicalHistory) {
    await addCondition(organizationId, patient.id, history);
  }

  const familyMemberHistory = getGroupRepeatedAnswers(questionnaire, response, 'family-member-history');
  for (const history of familyMemberHistory) {
    await addFamilyMemberHistory(organizationId, patient.id, history);
  }

  // Handle immunizations
  const vaccinationHistory = getGroupRepeatedAnswers(questionnaire, response, 'vaccination-history');
  for (const vaccine of vaccinationHistory) {
    await addImmunization(organizationId, patient.id, vaccine);
  }

  // Handle coverage
  const insuranceProviders = getGroupRepeatedAnswers(questionnaire, response, 'coverage-information');
  for (const provider of insuranceProviders) {
    await addCoverage(organizationId, patient.id, provider);
  }

  // Handle consents
  await addConsent(
    organizationId, patient.id,
    !!answers['consent-for-treatment-signature']?.valueBoolean,
    consentScopeMapping.treatment,
    consentCategoryMapping.med,
    consentPolicyRuleMapping.cric,
    convertDateToDateTime(answers['consent-for-treatment-date']?.valueDate)
  );

  await addConsent(
    organizationId, patient.id,
    !!answers['agreement-to-pay-for-treatment-help']?.valueBoolean,
    consentScopeMapping.treatment,
    consentCategoryMapping.pay,
    consentPolicyRuleMapping.hipaaSelfPay,
    convertDateToDateTime(answers['agreement-to-pay-for-treatment-date']?.valueDate)
  );

  await addConsent(
    organizationId, patient.id,
    !!answers['notice-of-privacy-practices-signature']?.valueBoolean,
    consentScopeMapping.patientPrivacy,
    consentCategoryMapping.nopp,
    consentPolicyRuleMapping.hipaaNpp,
    convertDateToDateTime(answers['notice-of-privacy-practices-date']?.valueDate)
  );

  await addConsent(
    organizationId, patient.id,
    !!answers['acknowledgement-for-advance-directives-signature']?.valueBoolean,
    consentScopeMapping.adr,
    consentCategoryMapping.acd,
    consentPolicyRuleMapping.adr,
    convertDateToDateTime(answers['acknowledgement-for-advance-directives-date']?.valueDate)
  );

  return patient;
}

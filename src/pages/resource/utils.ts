// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

export const RESOURCE_PROFILE_URLS: Partial<Record<string, string>> = {
  Patient: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient',
  ServiceRequest: 'http://medplum.com/StructureDefinition/medplum-provider-lab-procedure-servicerequest',
  Device: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-implantable-device',
};

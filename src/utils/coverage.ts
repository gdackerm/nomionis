// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Tables } from '../lib/supabase/types';
import { coverageService } from '../services/coverage.service';

type Coverage = Tables<'coverages'>;

/**
 * Creates a self-pay coverage for a patient.
 * @param organizationId - The organization ID
 * @param patientId - The patient ID
 * @returns Promise with the created Coverage row
 */
export async function createSelfPayCoverage(organizationId: string, patientId: string): Promise<Coverage> {
  return coverageService.create({
    organization_id: organizationId,
    patient_id: patientId,
    status: 'active',
    type_code: 'SELFPAY',
    subscriber_id: patientId,
    payor: { type: 'self', patient_id: patientId },
    period_start: new Date().toISOString(),
  }) as Promise<Coverage>;
}

// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Tables, Json } from '../lib/supabase/types';
import { CPT } from '../lib/utils';
import { claimService } from '../services/claim.service';
import { coverageService } from '../services/coverage.service';
import { calculateTotalPrice } from './chargeitems';
import { createSelfPayCoverage } from './coverage';

type ChargeItem = Tables<'charge_items'>;
type Claim = Tables<'claims'>;

/**
 * Represents a single item within a claim's JSONB `items` array.
 */
export interface ClaimItemJson {
  sequence: number;
  encounter_id: string;
  code: Json;
  net: number | null;
}

/**
 * Creates a claim from an encounter, looking up or creating coverage as needed.
 * @param organizationId - The organization ID
 * @param patientId - The patient ID
 * @param encounterId - The encounter ID
 * @param practitionerId - The practitioner ID
 * @param chargeItems - Array of charge items for this encounter
 * @returns Promise with the created Claim row, or undefined if creation fails
 */
export async function createClaimFromEncounter(
  organizationId: string,
  patientId: string,
  encounterId: string,
  practitionerId: string,
  chargeItems: ChargeItem[]
): Promise<Claim | undefined> {
  // Look up active coverage for the patient
  const coverageResults = await coverageService.list({
    filters: { patient_id: patientId, status: 'active' },
  });

  let coverageId: string;
  if (coverageResults.data.length > 0) {
    coverageId = coverageResults.data[0].id;
  } else {
    const newCoverage = await createSelfPayCoverage(organizationId, patientId);
    coverageId = newCoverage.id;
  }

  const claimItems = getCptChargeItems(chargeItems, encounterId);

  const claim = await claimService.create({
    organization_id: organizationId,
    patient_id: patientId,
    encounter_id: encounterId,
    practitioner_id: practitionerId,
    status: 'draft',
    coverage_id: coverageId,
    items: claimItems as unknown as Json,
    total_amount: calculateTotalPrice(chargeItems),
  });

  return claim as Claim;
}

/**
 * Filters charge items to those with a CPT code and maps them to claim item JSON objects.
 * @param chargeItems - Array of charge items
 * @param encounterId - The encounter ID to associate with each claim item
 * @returns Array of claim item JSON objects suitable for the claims.items JSONB column
 */
export function getCptChargeItems(chargeItems: ChargeItem[], encounterId: string): ClaimItemJson[] {
  const cptChargeItems = chargeItems.filter((item) => {
    const code = item.code as { coding?: Array<{ system?: string }> } | null;
    return code?.coding?.some((coding) => coding.system === CPT);
  });

  return cptChargeItems.map((chargeItem: ChargeItem, index: number) => {
    const code = chargeItem.code as { coding?: Array<{ system?: string; code?: string; display?: string }>; text?: string } | null;
    const cptCoding = code?.coding?.filter((coding) => coding.system === CPT) ?? [];

    return {
      sequence: index + 1,
      encounter_id: encounterId,
      code: { coding: cptCoding, text: code?.text ?? null } as unknown as Json,
      net: chargeItem.price_override,
    };
  });
}

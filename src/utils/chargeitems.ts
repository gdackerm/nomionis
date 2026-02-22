// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Tables } from '../lib/supabase/types';
import { chargeItemService } from '../services/charge-item.service';

type ChargeItem = Tables<'charge_items'>;

/**
 * Standalone function to fetch and apply ChargeItemDefinition to charge item.
 * For POC, this is a no-op — ChargeItemDefinition operations are Medplum-specific.
 * @param chargeItem - Current charge item
 * @returns Promise with the charge item as-is
 */
export async function applyChargeItemDefinition(chargeItem: ChargeItem): Promise<ChargeItem> {
  return chargeItem;
}

/**
 * Fetches all charge items associated with a given encounter.
 * @param encounterId - The encounter ID to look up charge items for
 * @returns Promise with the list of charge items for the encounter
 */
export async function getChargeItemsForEncounter(encounterId: string): Promise<ChargeItem[]> {
  if (!encounterId) {
    return [];
  }

  const result = await chargeItemService.list({ filters: { encounter_id: encounterId } });
  return result.data as ChargeItem[];
}

/**
 * Calculates the total price from a list of charge items.
 * @param items - Array of charge items
 * @returns The sum of all price_override values
 */
export function calculateTotalPrice(items: ChargeItem[]): number {
  return items.reduce((sum, item) => sum + (item.price_override || 0), 0);
}

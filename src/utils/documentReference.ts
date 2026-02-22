// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * Fetches DocumentReference resources with LabOrderRequisition category.
 * Stub: always returns an empty array.
 */
export async function fetchLabOrderRequisitionDocuments(
  _medplum: any,
  _serviceRequest: any
): Promise<any[]> {
  return [];
}

/**
 * Extracts the Health Gorilla Requisition ID from a ServiceRequest.
 * Stub: always returns undefined.
 */
export function getHealthGorillaRequisitionId(_serviceRequest: any): string | undefined {
  return undefined;
}

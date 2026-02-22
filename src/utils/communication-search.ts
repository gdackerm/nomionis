// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

export interface NormalizeCommunicationSearchOptions {
  search?: string;
  defaultSort?: string;
  defaultStatus?: string;
  defaultCount?: string;
  defaultTotal?: string;
}

export interface NormalizeCommunicationSearchResult {
  normalizedSearch: string;
  parsedSearch: Record<string, string>;
}

export function normalizeCommunicationSearch({
  search = '',
  defaultSort = '-_lastUpdated',
  defaultStatus = 'in-progress',
  defaultCount = '20',
  defaultTotal = 'accurate',
}: NormalizeCommunicationSearchOptions): NormalizeCommunicationSearchResult {
  const params = new URLSearchParams(search || `_sort=${defaultSort}`);
  const entries = Array.from(params.entries());

  const addIfMissing = (key: string, value: string | undefined): void => {
    if (value && !params.has(key)) {
      entries.push([key, value]);
    }
  };

  addIfMissing('_sort', defaultSort);
  addIfMissing('status', defaultStatus);
  addIfMissing('_count', defaultCount);
  addIfMissing('_total', defaultTotal);

  const normalizedParams = new URLSearchParams(entries);
  const normalizedSearch = normalizedParams.toString();

  // Build a simple key-value record from the params
  const parsedSearch: Record<string, string> = {};
  for (const [key, value] of normalizedParams.entries()) {
    parsedSearch[key] = value;
  }

  return {
    normalizedSearch,
    parsedSearch,
  };
}

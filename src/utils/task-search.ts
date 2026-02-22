// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

export interface NormalizeTaskSearchOptions {
  /**
   * Additional filters to apply to the search request.
   * These filters will be merged with existing filters, replacing any with the same key.
   */
  additionalFilters?: Record<string, string>;
}

export interface NormalizeTaskSearchResult {
  /**
   * The normalized search parameters as a simple key-value record.
   */
  normalizedSearch: Record<string, string>;
  /**
   * Whether navigation is needed to update the URL with normalized parameters.
   */
  needsNavigation: boolean;
}

/**
 * Normalizes a task search request by ensuring required fields are present.
 * Checks for _sort, _count, and _total parameters.
 *
 * @param locationPathname - The pathname from useLocation()
 * @param locationSearch - The search string from useLocation()
 * @param options - Optional configuration for additional filters
 * @returns Normalized search parameters and whether navigation is needed
 */
export function normalizeTaskSearch(
  locationPathname: string,
  locationSearch: string,
  options?: NormalizeTaskSearchOptions
): NormalizeTaskSearchResult {
  const params = new URLSearchParams(locationSearch);

  const hasSort = params.has('_sort');
  const hasCount = params.has('_count');
  const hasTotal = params.has('_total');

  // Build the normalized search record
  const result: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    // Skip keys that will be overridden by additional filters
    if (options?.additionalFilters && key in options.additionalFilters) {
      continue;
    }
    result[key] = value;
  }

  // Merge additional filters
  if (options?.additionalFilters) {
    for (const [key, value] of Object.entries(options.additionalFilters)) {
      result[key] = value;
    }
  }

  // Set defaults if missing
  if (!hasSort) {
    result['_sort'] = '-_lastUpdated';
  }
  if (!hasCount) {
    result['_count'] = '20';
  }
  if (!hasTotal) {
    result['_total'] = 'accurate';
  }

  const needsNavigation = !hasSort || !hasCount || !hasTotal;

  return {
    normalizedSearch: result,
    needsNavigation,
  };
}

/**
 * Converts a Record<string, string> search descriptor into a query string.
 * Returns the query string without the leading '?'.
 */
export function formatTaskSearchQuery(search: Record<string, string>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    params.set(key, value);
  }
  return params.toString();
}

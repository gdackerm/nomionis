// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

type UseResourceTypeOptions = {
  onInvalidResourceType?: (resourceType: string) => void;
};

export function useResourceType(
  resourceType: string | undefined,
  _options?: UseResourceTypeOptions
): string | undefined {
  return resourceType;
}

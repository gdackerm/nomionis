// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Paper, Text } from '@mantine/core';
import type { JSX } from 'react';

interface FavoriteMedicationsTableProps {
  clinicFavoriteMedications: any[] | undefined;
  loadingFavorites?: boolean;
}

export function FavoriteMedicationsTable(_props: FavoriteMedicationsTableProps): JSX.Element {
  return (
    <Paper p="md">
      <Text>Favorite Medications - Coming Soon</Text>
    </Paper>
  );
}

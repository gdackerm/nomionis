// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { JSX } from 'react';
import { Outlet, useParams } from 'react-router';
import { EncounterChart } from '../../components/encounter/EncounterChart';
import { showErrorNotification } from '../../utils/notifications';

export const EncounterChartPage = (): JSX.Element | null => {
  const { encounterId } = useParams();

  if (!encounterId) {
    showErrorNotification('Encounter ID not found');
    return null;
  }

  return (
    <>
      <EncounterChart encounterId={encounterId} />
      <Outlet />
    </>
  );
};

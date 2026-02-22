// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Tables } from '../../lib/supabase/types';
import type { JSX } from 'react';
import { ThreadInbox } from '../../components/messages/ThreadInbox';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useEffect, useMemo } from 'react';
import { normalizeCommunicationSearch } from '../../utils/communication-search';

type Communication = Tables<'communications'>;

export function CommunicationTab(): JSX.Element {
  const { patientId, messageId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const currentSearch = useMemo(() => (location.search ? location.search.substring(1) : ''), [location.search]);

  const params = useMemo(() => new URLSearchParams(currentSearch), [currentSearch]);

  const hasPatient = params.has('patient');

  const { normalizedSearch, parsedSearch } = useMemo(() => {
    const entries = Array.from(params.entries());
    if (!hasPatient && patientId) {
      entries.push(['patient', patientId]);
    }
    const searchWithPatient = new URLSearchParams(entries).toString();
    return normalizeCommunicationSearch({
      search: searchWithPatient,
    });
  }, [hasPatient, params, patientId]);

  useEffect(() => {
    if (normalizedSearch !== currentSearch) {
      const prefix = normalizedSearch ? `?${normalizedSearch}` : '';
      navigate(`/Patient/${patientId}/Communication${prefix}`, { replace: true })?.catch(console.error);
    }
  }, [currentSearch, navigate, normalizedSearch, patientId]);

  const onChange = (filters: Record<string, unknown>): void => {
    const urlParams = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        urlParams.set(key, String(value));
      }
    }
    const qs = urlParams.toString();
    navigate(`/Patient/${patientId}/Communication${qs ? `?${qs}` : ''}`)?.catch(console.error);
  };

  const formatQuery = (search: Record<string, string>): string => {
    const urlParams = new URLSearchParams(search);
    const qs = urlParams.toString();
    return qs ? `?${qs}` : '';
  };

  const getThreadUri = (topic: Communication): string => {
    return `/Patient/${patientId}/Communication/${topic.id}${formatQuery(parsedSearch)}`;
  };

  const buildStatusFilters = (value: string): Record<string, string> => {
    const filters = { ...parsedSearch };
    filters['status'] = value;
    delete filters['_offset'];
    return filters;
  };

  const inProgressUri = `/Patient/${patientId}/Communication${formatQuery(buildStatusFilters('in-progress'))}`;
  const completedUri = `/Patient/${patientId}/Communication${formatQuery(buildStatusFilters('completed'))}`;

  const onNew = (message: Communication): void => {
    navigate(getThreadUri(message))?.catch(console.error);
  };

  return (
    <div style={{ height: `calc(100vh - 98px)` }}>
      <ThreadInbox
        threadId={messageId}
        filters={parsedSearch}
        patientId={patientId}
        showPatientSummary={false}
        onNew={onNew}
        getThreadUri={getThreadUri}
        onChange={onChange}
        inProgressUri={inProgressUri}
        completedUri={completedUri}
      />
    </div>
  );
}

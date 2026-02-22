// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Tables } from '../../lib/supabase/types';
import type { JSX } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ThreadInbox } from '../../components/messages/ThreadInbox';
import classes from './MessagesPage.module.css';
import { useEffect, useMemo } from 'react';
import { normalizeCommunicationSearch } from '../../utils/communication-search';

type Communication = Tables<'communications'>;

/**
 * Fetches
 * @returns A React component that displays all Threads/Topics.
 */
export function MessagesPage(): JSX.Element {
  const { messageId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const currentSearch = useMemo(() => (location.search ? location.search.substring(1) : ''), [location.search]);

  const { normalizedSearch, parsedSearch } = useMemo(
    () =>
      normalizeCommunicationSearch({
        search: currentSearch,
      }),
    [currentSearch]
  );

  useEffect(() => {
    const isDetailView = Boolean(messageId);
    if (!isDetailView && normalizedSearch !== currentSearch) {
      const prefix = normalizedSearch ? `?${normalizedSearch}` : '';
      navigate(`/Communication${prefix}`, { replace: true })?.catch(console.error);
    }
  }, [currentSearch, navigate, normalizedSearch, messageId]);

  const onChange = (filters: Record<string, unknown>): void => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    }
    const qs = params.toString();
    navigate(`/Communication${qs ? `?${qs}` : ''}`)?.catch(console.error);
  };

  const formatQuery = (search: Record<string, string>): string => {
    const params = new URLSearchParams(search);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  const getThreadUri = (topic: Communication): string => {
    return `/Communication/${topic.id}${formatQuery(parsedSearch)}`;
  };

  const buildStatusFilters = (value: string): Record<string, string> => {
    const filters = { ...parsedSearch };
    filters['status'] = value;
    // Reset offset when changing status
    delete filters['_offset'];
    return filters;
  };

  const inProgressUri = `/Communication${formatQuery(buildStatusFilters('in-progress'))}`;
  const completedUri = `/Communication${formatQuery(buildStatusFilters('completed'))}`;

  const onNew = (message: Communication): void => {
    navigate(getThreadUri(message))?.catch(console.error);
  };

  return (
    <div className={classes.container}>
      <ThreadInbox
        threadId={messageId}
        filters={parsedSearch}
        showPatientSummary={true}
        onNew={onNew}
        getThreadUri={getThreadUri}
        onChange={onChange}
        inProgressUri={inProgressUri}
        completedUri={completedUri}
      />
    </div>
  );
}

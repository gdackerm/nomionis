import { Loader, Paper, ScrollArea, Text } from '@mantine/core';
import { useCallback, useEffect, useState } from 'react';
import type { JSX } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import type { Location } from 'react-router';
import { usePatient } from '../../hooks/usePatient';
import { PatientSummary } from '../../components/PatientSummary';
import classes from './PatientPage.module.css';
import { formatPatientPageTabUrl, getPatientPageTabs } from './PatientPage.utils';
import type { PatientPageTabInfo } from './PatientPage.utils';
import { PatientTabsNavigation } from './PatientTabsNavigation';

function getTabFromLocation(location: Location, tabs: PatientPageTabInfo[]): PatientPageTabInfo | undefined {
  const tabId = location.pathname.split('/')[3] ?? '';
  const tab = tabId
    ? tabs.find((t) => t.id === tabId || t.url.toLowerCase().startsWith(tabId.toLowerCase()))
    : undefined;
  return tab;
}

export function PatientPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const patient = usePatient();
  const tabs = getPatientPageTabs();
  const [currentTab, setCurrentTab] = useState<string>(() => {
    return (getTabFromLocation(location, tabs) ?? tabs[0]).id;
  });

  const onTabChange = useCallback(
    (newTabName: string | null): void => {
      if (!patient?.id) {
        console.error('Not within a patient context');
        return;
      }
      const tab = newTabName ? tabs.find((t) => t.id === newTabName) : tabs[0];
      if (tab) {
        setCurrentTab(tab.id);
        navigate(formatPatientPageTabUrl(patient.id, tab))?.catch(console.error);
      }
    },
    [navigate, patient?.id, tabs]
  );

  useEffect(() => {
    const newTab = getTabFromLocation(location, tabs);
    if (newTab && newTab.id !== currentTab) {
      setCurrentTab(newTab.id);
    }
  }, [currentTab, location, tabs]);

  if (!patient) {
    return (
      <Paper p="xl">
        <Loader />
      </Paper>
    );
  }

  return (
    <div className={classes.container}>
      <div className={classes.sidebar}>
        <ScrollArea className={classes.scrollArea}>
          <PatientSummary patient={patient} />
        </ScrollArea>
      </div>

      <div className={classes.content}>
        <PatientTabsNavigation tabs={tabs} currentTab={currentTab} onTabChange={onTabChange} />
        <Outlet />
      </div>
    </div>
  );
}

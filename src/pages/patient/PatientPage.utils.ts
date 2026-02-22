export function patientPathPrefix(patientId: string): string {
  return `/Patient/${patientId}`;
}

export function formatPatientPageTabUrl(patientId: string, tab: PatientPageTabInfo): string {
  return `${patientPathPrefix(patientId)}/${tab.url}`;
}

export type PatientPageTabInfo = {
  id: string;
  url: string;
  label: string;
};

export function getPatientPageTabOrThrow(tabId: string): PatientPageTabInfo {
  const result = PatientPageTabs.find((tab) => tab.id === tabId);
  if (!result) {
    throw new Error(`Could not find patient page tab with id ${tabId}`);
  }
  return result;
}

export function getPatientPageTabs(): PatientPageTabInfo[] {
  return PatientPageTabs;
}

export const PatientPageTabs: PatientPageTabInfo[] = [
  { id: 'timeline', url: '', label: 'Timeline' },
  { id: 'edit', url: 'edit', label: 'Edit' },
  { id: 'encounter', url: 'Encounter', label: 'Visits' },
  { id: 'tasks', url: 'Task', label: 'Tasks' },
  { id: 'message', url: 'Communication', label: 'Messages' },
];

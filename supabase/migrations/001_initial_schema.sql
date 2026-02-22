-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Organizations
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text,
  active boolean not null default true,
  address jsonb,
  identifiers jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Practitioners
create table practitioners (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  auth_user_id uuid not null,
  given_name text not null,
  family_name text not null,
  email text not null,
  phone text,
  npi text,
  specialties jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Patients
create table patients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  given_name text[] not null,
  family_name text not null,
  gender text,
  birth_date date,
  email text,
  phone text,
  ssn_last4 text,
  ssn_hash text,
  active boolean not null default true,
  address jsonb,
  contacts jsonb,
  communication jsonb,
  extensions jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Related Persons
create table related_persons (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  patient_id uuid not null references patients(id),
  given_name text,
  family_name text,
  birth_date date,
  gender text,
  relationship jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Schedules
create table schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  practitioner_id uuid not null references practitioners(id),
  active boolean not null default true,
  service_types jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Slots
create table slots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  schedule_id uuid not null references schedules(id),
  status text not null default 'free',
  start_time timestamptz not null,
  end_time timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Appointments
create table appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  status text not null default 'proposed',
  start_time timestamptz not null,
  end_time timestamptz not null,
  patient_id uuid references patients(id),
  practitioner_id uuid references practitioners(id),
  slot_id uuid references slots(id),
  reason jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Encounters
create table encounters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  patient_id uuid not null references patients(id),
  practitioner_id uuid references practitioners(id),
  appointment_id uuid references appointments(id),
  status text not null default 'planned',
  class_code text,
  period_start timestamptz,
  period_end timestamptz,
  clinical_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Clinical Impressions
create table clinical_impressions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  patient_id uuid not null references patients(id),
  encounter_id uuid references encounters(id),
  status text not null default 'in-progress',
  description text,
  note_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Conditions
create table conditions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  patient_id uuid not null references patients(id),
  encounter_id uuid references encounters(id),
  code_system text,
  code_value text,
  code_display text,
  clinical_status text,
  onset_date date,
  code jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Observations
create table observations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  patient_id uuid not null references patients(id),
  encounter_id uuid references encounters(id),
  code_system text,
  code_value text,
  code_display text,
  status text not null default 'final',
  effective_date timestamptz,
  value jsonb,
  category jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Allergy Intolerances
create table allergy_intolerances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  patient_id uuid not null references patients(id),
  code_system text,
  code_value text,
  code_display text,
  clinical_status text,
  verification_status text,
  onset_date date,
  reaction jsonb,
  code jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Medication Requests
create table medication_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  patient_id uuid not null references patients(id),
  encounter_id uuid references encounters(id),
  status text not null default 'active',
  intent text not null default 'order',
  medication_system text,
  medication_code text,
  medication_display text,
  requester_id uuid references practitioners(id),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Immunizations
create table immunizations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  patient_id uuid not null references patients(id),
  status text not null default 'completed',
  vaccine_system text,
  vaccine_code text,
  vaccine_display text,
  occurrence_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Family Member Histories
create table family_member_histories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  patient_id uuid not null references patients(id),
  relationship jsonb,
  condition jsonb,
  deceased boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tasks
create table tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  status text not null default 'requested',
  intent text not null default 'order',
  patient_id uuid references patients(id),
  encounter_id uuid references encounters(id),
  owner_id uuid references practitioners(id),
  requester_id uuid references practitioners(id),
  focus_type text,
  focus_id uuid,
  code jsonb,
  description text,
  authored_on timestamptz,
  note jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Service Requests
create table service_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  patient_id uuid not null references patients(id),
  encounter_id uuid references encounters(id),
  status text not null default 'active',
  intent text not null default 'order',
  code jsonb,
  requester_id uuid references practitioners(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Communications
create table communications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  status text not null default 'completed',
  patient_id uuid references patients(id),
  sender_id uuid references practitioners(id),
  recipient_ids uuid[],
  topic text,
  parent_id uuid references communications(id),
  payload_text text,
  identifier_type text,
  sent timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Coverages
create table coverages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  patient_id uuid not null references patients(id),
  status text not null default 'active',
  type_code text,
  subscriber_id text,
  payor jsonb,
  relationship jsonb,
  period_start date,
  period_end date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Consents
create table consents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  patient_id uuid not null references patients(id),
  status text not null default 'active',
  scope jsonb,
  category jsonb,
  policy_rule jsonb,
  consent_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Charge Items
create table charge_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  patient_id uuid not null references patients(id),
  encounter_id uuid references encounters(id),
  status text not null default 'billable',
  code jsonb,
  quantity numeric,
  price_override numeric,
  definition_canonical text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Claims
create table claims (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  patient_id uuid not null references patients(id),
  encounter_id uuid references encounters(id),
  practitioner_id uuid references practitioners(id),
  status text not null default 'active',
  coverage_id uuid references coverages(id),
  total_amount numeric,
  items jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Care Teams
create table care_teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  patient_id uuid not null references patients(id),
  name text,
  participants jsonb,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Document References
create table document_references (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  patient_id uuid not null references patients(id),
  status text not null default 'current',
  category text,
  content_url text,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Provenances
create table provenances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  target_type text not null,
  target_id uuid not null,
  agent_id uuid references practitioners(id),
  reason_code text,
  signature jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Questionnaires
create table questionnaires (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  title text,
  status text not null default 'active',
  items jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Questionnaire Responses
create table questionnaire_responses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  questionnaire_id uuid references questionnaires(id),
  patient_id uuid references patients(id),
  encounter_id uuid references encounters(id),
  status text not null default 'completed',
  items jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Plan Definitions
create table plan_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  title text,
  status text not null default 'active',
  actions jsonb,
  extensions jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helper function used by RLS policies
create or replace function get_current_organization_id()
returns uuid
language sql
stable
as $$
  select organization_id from practitioners where auth_user_id = auth.uid() limit 1
$$;

-- Enable RLS on all tables
alter table organizations enable row level security;
alter table practitioners enable row level security;
alter table patients enable row level security;
alter table related_persons enable row level security;
alter table schedules enable row level security;
alter table slots enable row level security;
alter table appointments enable row level security;
alter table encounters enable row level security;
alter table clinical_impressions enable row level security;
alter table conditions enable row level security;
alter table observations enable row level security;
alter table allergy_intolerances enable row level security;
alter table medication_requests enable row level security;
alter table immunizations enable row level security;
alter table family_member_histories enable row level security;
alter table tasks enable row level security;
alter table service_requests enable row level security;
alter table communications enable row level security;
alter table coverages enable row level security;
alter table consents enable row level security;
alter table charge_items enable row level security;
alter table claims enable row level security;
alter table care_teams enable row level security;
alter table document_references enable row level security;
alter table provenances enable row level security;
alter table questionnaires enable row level security;
alter table questionnaire_responses enable row level security;
alter table plan_definitions enable row level security;

-- RLS policies: allow authenticated users full access to their organization's data
-- Organizations: allow inserts for any authenticated user (for signup), reads scoped to own org
create policy "Users can insert organizations" on organizations
  for insert to authenticated with check (true);

create policy "Users can read own organization" on organizations
  for select to authenticated using (id = get_current_organization_id());

create policy "Users can update own organization" on organizations
  for update to authenticated using (id = get_current_organization_id());

-- Practitioners: allow inserts for any authenticated user (for signup), reads scoped to own org
create policy "Users can insert practitioners" on practitioners
  for insert to authenticated with check (true);

create policy "Users can read own org practitioners" on practitioners
  for select to authenticated using (organization_id = get_current_organization_id());

create policy "Users can update own org practitioners" on practitioners
  for update to authenticated using (organization_id = get_current_organization_id());

-- Generic org-scoped policies for all other tables
do $$
declare
  tbl text;
begin
  for tbl in
    select unnest(array[
      'patients', 'related_persons', 'schedules', 'slots', 'appointments',
      'encounters', 'clinical_impressions', 'conditions', 'observations',
      'allergy_intolerances', 'medication_requests', 'immunizations',
      'family_member_histories', 'tasks', 'service_requests', 'communications',
      'coverages', 'consents', 'charge_items', 'claims', 'care_teams',
      'document_references', 'provenances', 'questionnaires',
      'questionnaire_responses', 'plan_definitions'
    ])
  loop
    execute format(
      'create policy "Org select on %1$s" on %1$s for select to authenticated using (organization_id = get_current_organization_id())',
      tbl
    );
    execute format(
      'create policy "Org insert on %1$s" on %1$s for insert to authenticated with check (organization_id = get_current_organization_id())',
      tbl
    );
    execute format(
      'create policy "Org update on %1$s" on %1$s for update to authenticated using (organization_id = get_current_organization_id())',
      tbl
    );
    execute format(
      'create policy "Org delete on %1$s" on %1$s for delete to authenticated using (organization_id = get_current_organization_id())',
      tbl
    );
  end loop;
end
$$;

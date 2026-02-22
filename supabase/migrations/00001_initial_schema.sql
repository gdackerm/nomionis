-- =============================================================================
-- Nomionis EHR Initial Schema Migration
-- =============================================================================
-- FHIR-aligned Electronic Health Record database schema for Supabase/PostgreSQL.
-- Includes tables, RLS policies, indexes, triggers, and utility functions.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Utility Functions
-- ---------------------------------------------------------------------------

-- Trigger function: automatically update the updated_at column on row change.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- RLS helper: returns the caller's current organization_id from their JWT.
CREATE OR REPLACE FUNCTION get_current_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'organization_id')::uuid;
END;
$$ LANGUAGE plpgsql STABLE;

-- ---------------------------------------------------------------------------
-- 1. organizations
-- ---------------------------------------------------------------------------
CREATE TABLE organizations (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT        NOT NULL,
    type            TEXT,
    active          BOOLEAN     DEFAULT true,
    address         JSONB,
    identifiers     JSONB,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON organizations
    FOR ALL
    USING (id = get_current_organization_id())
    WITH CHECK (id = get_current_organization_id());

-- ---------------------------------------------------------------------------
-- 2. practitioners
-- ---------------------------------------------------------------------------
CREATE TABLE practitioners (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id),
    auth_user_id    UUID        REFERENCES auth.users(id),
    given_name      TEXT        NOT NULL,
    family_name     TEXT        NOT NULL,
    email           TEXT        NOT NULL,
    phone           TEXT,
    npi             TEXT,
    specialties     JSONB,
    active          BOOLEAN     DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_practitioners_updated_at
    BEFORE UPDATE ON practitioners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE practitioners ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON practitioners
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_practitioners_organization_id ON practitioners(organization_id);
CREATE INDEX idx_practitioners_auth_user_id    ON practitioners(auth_user_id);

-- ---------------------------------------------------------------------------
-- 3. patients
-- ---------------------------------------------------------------------------
CREATE TABLE patients (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id),
    given_name      TEXT[]      NOT NULL,
    family_name     TEXT        NOT NULL,
    gender          TEXT,
    birth_date      DATE,
    email           TEXT,
    phone           TEXT,
    ssn_last4       TEXT,
    ssn_hash        TEXT,
    active          BOOLEAN     DEFAULT true,
    address         JSONB,
    contacts        JSONB,
    communication   JSONB,
    extensions      JSONB,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON patients
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_patients_organization_id ON patients(organization_id);
CREATE INDEX idx_patients_family_name     ON patients(family_name);

-- ---------------------------------------------------------------------------
-- 4. related_persons
-- ---------------------------------------------------------------------------
CREATE TABLE related_persons (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id),
    patient_id      UUID        NOT NULL REFERENCES patients(id),
    given_name      TEXT,
    family_name     TEXT,
    birth_date      DATE,
    gender          TEXT,
    relationship    JSONB,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_related_persons_updated_at
    BEFORE UPDATE ON related_persons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE related_persons ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON related_persons
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_related_persons_organization_id ON related_persons(organization_id);
CREATE INDEX idx_related_persons_patient_id      ON related_persons(patient_id);

-- ---------------------------------------------------------------------------
-- 5. schedules
-- ---------------------------------------------------------------------------
CREATE TABLE schedules (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id),
    practitioner_id UUID        NOT NULL REFERENCES practitioners(id),
    active          BOOLEAN     DEFAULT true,
    service_types   JSONB,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_schedules_updated_at
    BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON schedules
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_schedules_organization_id  ON schedules(organization_id);
CREATE INDEX idx_schedules_practitioner_id  ON schedules(practitioner_id);

-- ---------------------------------------------------------------------------
-- 6. slots
-- ---------------------------------------------------------------------------
CREATE TABLE slots (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id),
    schedule_id     UUID        NOT NULL REFERENCES schedules(id),
    status          TEXT        DEFAULT 'free',
    start_time      TIMESTAMPTZ,
    end_time        TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_slots_updated_at
    BEFORE UPDATE ON slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON slots
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_slots_organization_id ON slots(organization_id);
CREATE INDEX idx_slots_schedule_id     ON slots(schedule_id);
CREATE INDEX idx_slots_start_time      ON slots(start_time);

-- ---------------------------------------------------------------------------
-- 7. appointments
-- ---------------------------------------------------------------------------
CREATE TABLE appointments (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id),
    status          TEXT        DEFAULT 'booked',
    start_time      TIMESTAMPTZ,
    end_time        TIMESTAMPTZ,
    patient_id      UUID        REFERENCES patients(id),
    practitioner_id UUID        REFERENCES practitioners(id),
    slot_id         UUID        REFERENCES slots(id),
    reason          JSONB,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON appointments
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_appointments_organization_id  ON appointments(organization_id);
CREATE INDEX idx_appointments_patient_id       ON appointments(patient_id);
CREATE INDEX idx_appointments_practitioner_id  ON appointments(practitioner_id);
CREATE INDEX idx_appointments_start_time       ON appointments(start_time);

-- ---------------------------------------------------------------------------
-- 8. encounters
-- ---------------------------------------------------------------------------
CREATE TABLE encounters (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id),
    patient_id      UUID        NOT NULL REFERENCES patients(id),
    practitioner_id UUID        REFERENCES practitioners(id),
    appointment_id  UUID        REFERENCES appointments(id),
    status          TEXT        DEFAULT 'planned',
    class_code      TEXT,
    period_start    TIMESTAMPTZ,
    period_end      TIMESTAMPTZ,
    clinical_data   JSONB,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_encounters_updated_at
    BEFORE UPDATE ON encounters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON encounters
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_encounters_organization_id  ON encounters(organization_id);
CREATE INDEX idx_encounters_patient_id       ON encounters(patient_id);
CREATE INDEX idx_encounters_practitioner_id  ON encounters(practitioner_id);
CREATE INDEX idx_encounters_appointment_id   ON encounters(appointment_id);

-- ---------------------------------------------------------------------------
-- 9. clinical_impressions
-- ---------------------------------------------------------------------------
CREATE TABLE clinical_impressions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id),
    patient_id      UUID        NOT NULL REFERENCES patients(id),
    encounter_id    UUID        REFERENCES encounters(id),
    status          TEXT        DEFAULT 'in-progress',
    description     TEXT,
    note_text       TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_clinical_impressions_updated_at
    BEFORE UPDATE ON clinical_impressions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE clinical_impressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON clinical_impressions
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_clinical_impressions_organization_id ON clinical_impressions(organization_id);
CREATE INDEX idx_clinical_impressions_patient_id      ON clinical_impressions(patient_id);
CREATE INDEX idx_clinical_impressions_encounter_id    ON clinical_impressions(encounter_id);

-- ---------------------------------------------------------------------------
-- 10. conditions
-- ---------------------------------------------------------------------------
CREATE TABLE conditions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id),
    patient_id      UUID        NOT NULL REFERENCES patients(id),
    encounter_id    UUID        REFERENCES encounters(id),
    code_system     TEXT,
    code_value      TEXT,
    code_display    TEXT,
    clinical_status TEXT,
    onset_date      TIMESTAMPTZ,
    code            JSONB,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_conditions_updated_at
    BEFORE UPDATE ON conditions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON conditions
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_conditions_organization_id ON conditions(organization_id);
CREATE INDEX idx_conditions_patient_id      ON conditions(patient_id);
CREATE INDEX idx_conditions_encounter_id    ON conditions(encounter_id);

-- ---------------------------------------------------------------------------
-- 11. observations
-- ---------------------------------------------------------------------------
CREATE TABLE observations (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id),
    patient_id      UUID        NOT NULL REFERENCES patients(id),
    encounter_id    UUID        REFERENCES encounters(id),
    code_system     TEXT,
    code_value      TEXT,
    code_display    TEXT,
    status          TEXT        DEFAULT 'final',
    effective_date  TIMESTAMPTZ,
    value           JSONB,
    category        JSONB,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_observations_updated_at
    BEFORE UPDATE ON observations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON observations
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_observations_organization_id ON observations(organization_id);
CREATE INDEX idx_observations_patient_id      ON observations(patient_id);
CREATE INDEX idx_observations_encounter_id    ON observations(encounter_id);

-- ---------------------------------------------------------------------------
-- 12. allergy_intolerances
-- ---------------------------------------------------------------------------
CREATE TABLE allergy_intolerances (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID        NOT NULL REFERENCES organizations(id),
    patient_id          UUID        NOT NULL REFERENCES patients(id),
    code_system         TEXT,
    code_value          TEXT,
    code_display        TEXT,
    clinical_status     TEXT,
    verification_status TEXT,
    onset_date          TIMESTAMPTZ,
    reaction            JSONB,
    code                JSONB,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),

    UNIQUE (patient_id, code_system, code_value)
);

CREATE TRIGGER set_allergy_intolerances_updated_at
    BEFORE UPDATE ON allergy_intolerances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE allergy_intolerances ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON allergy_intolerances
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_allergy_intolerances_organization_id ON allergy_intolerances(organization_id);
CREATE INDEX idx_allergy_intolerances_patient_id      ON allergy_intolerances(patient_id);

-- ---------------------------------------------------------------------------
-- 13. medication_requests
-- ---------------------------------------------------------------------------
CREATE TABLE medication_requests (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID        NOT NULL REFERENCES organizations(id),
    patient_id          UUID        NOT NULL REFERENCES patients(id),
    encounter_id        UUID        REFERENCES encounters(id),
    status              TEXT        DEFAULT 'active',
    intent              TEXT        DEFAULT 'order',
    medication_system   TEXT,
    medication_code     TEXT,
    medication_display  TEXT,
    requester_id        UUID        REFERENCES practitioners(id),
    note                TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),

    UNIQUE (patient_id, medication_system, medication_code)
);

CREATE TRIGGER set_medication_requests_updated_at
    BEFORE UPDATE ON medication_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE medication_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON medication_requests
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_medication_requests_organization_id ON medication_requests(organization_id);
CREATE INDEX idx_medication_requests_patient_id      ON medication_requests(patient_id);
CREATE INDEX idx_medication_requests_encounter_id    ON medication_requests(encounter_id);

-- ---------------------------------------------------------------------------
-- 14. immunizations
-- ---------------------------------------------------------------------------
CREATE TABLE immunizations (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id),
    patient_id      UUID        NOT NULL REFERENCES patients(id),
    status          TEXT        DEFAULT 'completed',
    vaccine_system  TEXT,
    vaccine_code    TEXT,
    vaccine_display TEXT,
    occurrence_date TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_immunizations_updated_at
    BEFORE UPDATE ON immunizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE immunizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON immunizations
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_immunizations_organization_id ON immunizations(organization_id);
CREATE INDEX idx_immunizations_patient_id      ON immunizations(patient_id);

-- ---------------------------------------------------------------------------
-- 15. family_member_histories
-- ---------------------------------------------------------------------------
CREATE TABLE family_member_histories (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id),
    patient_id      UUID        NOT NULL REFERENCES patients(id),
    relationship    JSONB,
    condition       JSONB,
    deceased        BOOLEAN,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_family_member_histories_updated_at
    BEFORE UPDATE ON family_member_histories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE family_member_histories ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON family_member_histories
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_family_member_histories_organization_id ON family_member_histories(organization_id);
CREATE INDEX idx_family_member_histories_patient_id      ON family_member_histories(patient_id);

-- ---------------------------------------------------------------------------
-- 16. tasks
-- ---------------------------------------------------------------------------
CREATE TABLE tasks (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id),
    status          TEXT        DEFAULT 'requested',
    intent          TEXT        DEFAULT 'order',
    patient_id      UUID        REFERENCES patients(id),
    encounter_id    UUID        REFERENCES encounters(id),
    owner_id        UUID        REFERENCES practitioners(id),
    requester_id    UUID        REFERENCES practitioners(id),
    focus_type      TEXT,
    focus_id        UUID,
    code            JSONB,
    description     TEXT,
    authored_on     TIMESTAMPTZ,
    note            JSONB,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON tasks
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_tasks_organization_id ON tasks(organization_id);
CREATE INDEX idx_tasks_patient_id      ON tasks(patient_id);
CREATE INDEX idx_tasks_encounter_id    ON tasks(encounter_id);
CREATE INDEX idx_tasks_owner_id        ON tasks(owner_id);

-- ---------------------------------------------------------------------------
-- 17. service_requests
-- ---------------------------------------------------------------------------
CREATE TABLE service_requests (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id),
    patient_id      UUID        NOT NULL REFERENCES patients(id),
    encounter_id    UUID        REFERENCES encounters(id),
    status          TEXT        DEFAULT 'active',
    intent          TEXT        DEFAULT 'order',
    code            JSONB,
    requester_id    UUID        REFERENCES practitioners(id),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_service_requests_updated_at
    BEFORE UPDATE ON service_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON service_requests
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_service_requests_organization_id ON service_requests(organization_id);
CREATE INDEX idx_service_requests_patient_id      ON service_requests(patient_id);
CREATE INDEX idx_service_requests_encounter_id    ON service_requests(encounter_id);

-- ---------------------------------------------------------------------------
-- 18. communications
-- ---------------------------------------------------------------------------
CREATE TABLE communications (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id),
    status          TEXT        DEFAULT 'in-progress',
    patient_id      UUID        REFERENCES patients(id),
    sender_id       UUID        REFERENCES practitioners(id),
    recipient_ids   UUID[],
    topic           TEXT,
    parent_id       UUID        REFERENCES communications(id),
    payload_text    TEXT,
    identifier_type TEXT,
    sent            TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_communications_updated_at
    BEFORE UPDATE ON communications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON communications
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_communications_organization_id ON communications(organization_id);
CREATE INDEX idx_communications_patient_id      ON communications(patient_id);
CREATE INDEX idx_communications_parent_id       ON communications(parent_id);

-- ---------------------------------------------------------------------------
-- 19. coverages
-- ---------------------------------------------------------------------------
CREATE TABLE coverages (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id),
    patient_id      UUID        NOT NULL REFERENCES patients(id),
    status          TEXT        DEFAULT 'active',
    type_code       TEXT,
    subscriber_id   TEXT,
    payor           JSONB,
    relationship    JSONB,
    period_start    DATE,
    period_end      DATE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_coverages_updated_at
    BEFORE UPDATE ON coverages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE coverages ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON coverages
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_coverages_organization_id ON coverages(organization_id);
CREATE INDEX idx_coverages_patient_id      ON coverages(patient_id);

-- ---------------------------------------------------------------------------
-- 20. consents
-- ---------------------------------------------------------------------------
CREATE TABLE consents (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id),
    patient_id      UUID        NOT NULL REFERENCES patients(id),
    status          TEXT        DEFAULT 'active',
    scope           JSONB,
    category        JSONB,
    policy_rule     JSONB,
    consent_date    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_consents_updated_at
    BEFORE UPDATE ON consents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON consents
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_consents_organization_id ON consents(organization_id);
CREATE INDEX idx_consents_patient_id      ON consents(patient_id);

-- ---------------------------------------------------------------------------
-- 21. charge_items
-- ---------------------------------------------------------------------------
CREATE TABLE charge_items (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id      UUID        NOT NULL REFERENCES organizations(id),
    patient_id           UUID        NOT NULL REFERENCES patients(id),
    encounter_id         UUID        REFERENCES encounters(id),
    status               TEXT        DEFAULT 'planned',
    code                 JSONB,
    quantity             INTEGER,
    price_override       NUMERIC,
    definition_canonical TEXT,
    created_at           TIMESTAMPTZ DEFAULT now(),
    updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_charge_items_updated_at
    BEFORE UPDATE ON charge_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE charge_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON charge_items
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_charge_items_organization_id ON charge_items(organization_id);
CREATE INDEX idx_charge_items_patient_id      ON charge_items(patient_id);
CREATE INDEX idx_charge_items_encounter_id    ON charge_items(encounter_id);

-- ---------------------------------------------------------------------------
-- 22. claims
-- ---------------------------------------------------------------------------
CREATE TABLE claims (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id),
    patient_id      UUID        NOT NULL REFERENCES patients(id),
    encounter_id    UUID        REFERENCES encounters(id),
    practitioner_id UUID        REFERENCES practitioners(id),
    status          TEXT        DEFAULT 'active',
    coverage_id     UUID        REFERENCES coverages(id),
    total_amount    NUMERIC,
    items           JSONB,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_claims_updated_at
    BEFORE UPDATE ON claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON claims
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_claims_organization_id  ON claims(organization_id);
CREATE INDEX idx_claims_patient_id       ON claims(patient_id);
CREATE INDEX idx_claims_encounter_id     ON claims(encounter_id);
CREATE INDEX idx_claims_coverage_id      ON claims(coverage_id);

-- ---------------------------------------------------------------------------
-- 23. care_teams
-- ---------------------------------------------------------------------------
CREATE TABLE care_teams (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id),
    patient_id      UUID        REFERENCES patients(id),
    name            TEXT,
    participants    JSONB,
    status          TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_care_teams_updated_at
    BEFORE UPDATE ON care_teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE care_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON care_teams
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_care_teams_organization_id ON care_teams(organization_id);
CREATE INDEX idx_care_teams_patient_id      ON care_teams(patient_id);

-- ---------------------------------------------------------------------------
-- 24. document_references
-- ---------------------------------------------------------------------------
CREATE TABLE document_references (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id),
    patient_id      UUID        REFERENCES patients(id),
    status          TEXT        DEFAULT 'current',
    category        TEXT,
    content_url     TEXT,
    title           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_document_references_updated_at
    BEFORE UPDATE ON document_references
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE document_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON document_references
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_document_references_organization_id ON document_references(organization_id);
CREATE INDEX idx_document_references_patient_id      ON document_references(patient_id);

-- ---------------------------------------------------------------------------
-- 25. provenances
-- ---------------------------------------------------------------------------
CREATE TABLE provenances (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id),
    target_type     TEXT        NOT NULL,
    target_id       UUID        NOT NULL,
    agent_id        UUID        REFERENCES practitioners(id),
    reason_code     TEXT,
    signature       JSONB,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_provenances_updated_at
    BEFORE UPDATE ON provenances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE provenances ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON provenances
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_provenances_organization_id ON provenances(organization_id);
CREATE INDEX idx_provenances_target          ON provenances(target_type, target_id);
CREATE INDEX idx_provenances_agent_id        ON provenances(agent_id);

-- ---------------------------------------------------------------------------
-- 26. questionnaires
-- ---------------------------------------------------------------------------
CREATE TABLE questionnaires (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id),
    title           TEXT,
    status          TEXT        DEFAULT 'active',
    items           JSONB,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_questionnaires_updated_at
    BEFORE UPDATE ON questionnaires
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE questionnaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON questionnaires
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_questionnaires_organization_id ON questionnaires(organization_id);

-- ---------------------------------------------------------------------------
-- 27. questionnaire_responses
-- ---------------------------------------------------------------------------
CREATE TABLE questionnaire_responses (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  UUID        NOT NULL REFERENCES organizations(id),
    questionnaire_id UUID        REFERENCES questionnaires(id),
    patient_id       UUID        REFERENCES patients(id),
    encounter_id     UUID        REFERENCES encounters(id),
    status           TEXT        DEFAULT 'in-progress',
    items            JSONB,
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_questionnaire_responses_updated_at
    BEFORE UPDATE ON questionnaire_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON questionnaire_responses
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_questionnaire_responses_organization_id  ON questionnaire_responses(organization_id);
CREATE INDEX idx_questionnaire_responses_questionnaire_id ON questionnaire_responses(questionnaire_id);
CREATE INDEX idx_questionnaire_responses_patient_id       ON questionnaire_responses(patient_id);
CREATE INDEX idx_questionnaire_responses_encounter_id     ON questionnaire_responses(encounter_id);

-- ---------------------------------------------------------------------------
-- 28. plan_definitions
-- ---------------------------------------------------------------------------
CREATE TABLE plan_definitions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id),
    title           TEXT,
    status          TEXT        DEFAULT 'active',
    actions         JSONB,
    extensions      JSONB,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_plan_definitions_updated_at
    BEFORE UPDATE ON plan_definitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE plan_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON plan_definitions
    FOR ALL
    USING (organization_id = get_current_organization_id())
    WITH CHECK (organization_id = get_current_organization_id());

CREATE INDEX idx_plan_definitions_organization_id ON plan_definitions(organization_id);

-- ---------------------------------------------------------------------------
-- Auth Trigger: on_auth_user_created
-- ---------------------------------------------------------------------------
-- When a new user signs up through Supabase Auth, automatically create a
-- corresponding practitioner row and persist the organization_id into the
-- user's app_metadata so subsequent JWTs carry it for RLS.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_org_id UUID;
BEGIN
    -- Retrieve the organization_id supplied during sign-up (stored in raw_user_meta_data).
    v_org_id := (NEW.raw_user_meta_data ->> 'organization_id')::uuid;

    -- Create the practitioner record linked to the new auth user.
    INSERT INTO public.practitioners (
        organization_id,
        auth_user_id,
        given_name,
        family_name,
        email
    ) VALUES (
        v_org_id,
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'given_name', ''),
        COALESCE(NEW.raw_user_meta_data ->> 'family_name', ''),
        NEW.email
    );

    -- Persist the organization_id into app_metadata so it appears in JWTs.
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object('organization_id', v_org_id)
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

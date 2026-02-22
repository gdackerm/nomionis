export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          type: string | null;
          active: boolean;
          address: Json | null;
          identifiers: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type?: string | null;
          active?: boolean;
          address?: Json | null;
          identifiers?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string | null;
          active?: boolean;
          address?: Json | null;
          identifiers?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      practitioners: {
        Row: {
          id: string;
          organization_id: string;
          auth_user_id: string;
          given_name: string;
          family_name: string;
          email: string;
          phone: string | null;
          npi: string | null;
          specialties: Json | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          auth_user_id: string;
          given_name: string;
          family_name: string;
          email: string;
          phone?: string | null;
          npi?: string | null;
          specialties?: Json | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          auth_user_id?: string;
          given_name?: string;
          family_name?: string;
          email?: string;
          phone?: string | null;
          npi?: string | null;
          specialties?: Json | null;
          active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      patients: {
        Row: {
          id: string;
          organization_id: string;
          given_name: string[];
          family_name: string;
          gender: string | null;
          birth_date: string | null;
          email: string | null;
          phone: string | null;
          ssn_last4: string | null;
          ssn_hash: string | null;
          active: boolean;
          address: Json | null;
          contacts: Json | null;
          communication: Json | null;
          extensions: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          given_name: string[];
          family_name: string;
          gender?: string | null;
          birth_date?: string | null;
          email?: string | null;
          phone?: string | null;
          ssn_last4?: string | null;
          ssn_hash?: string | null;
          active?: boolean;
          address?: Json | null;
          contacts?: Json | null;
          communication?: Json | null;
          extensions?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          given_name?: string[];
          family_name?: string;
          gender?: string | null;
          birth_date?: string | null;
          email?: string | null;
          phone?: string | null;
          ssn_last4?: string | null;
          ssn_hash?: string | null;
          active?: boolean;
          address?: Json | null;
          contacts?: Json | null;
          communication?: Json | null;
          extensions?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      related_persons: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          given_name: string | null;
          family_name: string | null;
          birth_date: string | null;
          gender: string | null;
          relationship: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          given_name?: string | null;
          family_name?: string | null;
          birth_date?: string | null;
          gender?: string | null;
          relationship?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          given_name?: string | null;
          family_name?: string | null;
          birth_date?: string | null;
          gender?: string | null;
          relationship?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      schedules: {
        Row: {
          id: string;
          organization_id: string;
          practitioner_id: string;
          active: boolean;
          service_types: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          practitioner_id: string;
          active?: boolean;
          service_types?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          practitioner_id?: string;
          active?: boolean;
          service_types?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      slots: {
        Row: {
          id: string;
          organization_id: string;
          schedule_id: string;
          status: string;
          start_time: string;
          end_time: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          schedule_id: string;
          status?: string;
          start_time: string;
          end_time: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          schedule_id?: string;
          status?: string;
          start_time?: string;
          end_time?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          organization_id: string;
          status: string;
          start_time: string;
          end_time: string;
          patient_id: string | null;
          practitioner_id: string | null;
          slot_id: string | null;
          reason: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          status?: string;
          start_time: string;
          end_time: string;
          patient_id?: string | null;
          practitioner_id?: string | null;
          slot_id?: string | null;
          reason?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          status?: string;
          start_time?: string;
          end_time?: string;
          patient_id?: string | null;
          practitioner_id?: string | null;
          slot_id?: string | null;
          reason?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      encounters: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          practitioner_id: string | null;
          appointment_id: string | null;
          status: string;
          class_code: string | null;
          period_start: string | null;
          period_end: string | null;
          clinical_data: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          practitioner_id?: string | null;
          appointment_id?: string | null;
          status?: string;
          class_code?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          clinical_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          practitioner_id?: string | null;
          appointment_id?: string | null;
          status?: string;
          class_code?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          clinical_data?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      clinical_impressions: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          encounter_id: string | null;
          status: string;
          description: string | null;
          note_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          encounter_id?: string | null;
          status?: string;
          description?: string | null;
          note_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          encounter_id?: string | null;
          status?: string;
          description?: string | null;
          note_text?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      conditions: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          encounter_id: string | null;
          code_system: string | null;
          code_value: string | null;
          code_display: string | null;
          clinical_status: string | null;
          onset_date: string | null;
          code: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          encounter_id?: string | null;
          code_system?: string | null;
          code_value?: string | null;
          code_display?: string | null;
          clinical_status?: string | null;
          onset_date?: string | null;
          code?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          encounter_id?: string | null;
          code_system?: string | null;
          code_value?: string | null;
          code_display?: string | null;
          clinical_status?: string | null;
          onset_date?: string | null;
          code?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      observations: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          encounter_id: string | null;
          code_system: string | null;
          code_value: string | null;
          code_display: string | null;
          status: string;
          effective_date: string | null;
          value: Json | null;
          category: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          encounter_id?: string | null;
          code_system?: string | null;
          code_value?: string | null;
          code_display?: string | null;
          status?: string;
          effective_date?: string | null;
          value?: Json | null;
          category?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          encounter_id?: string | null;
          code_system?: string | null;
          code_value?: string | null;
          code_display?: string | null;
          status?: string;
          effective_date?: string | null;
          value?: Json | null;
          category?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      allergy_intolerances: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          code_system: string | null;
          code_value: string | null;
          code_display: string | null;
          clinical_status: string | null;
          verification_status: string | null;
          onset_date: string | null;
          reaction: Json | null;
          code: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          code_system?: string | null;
          code_value?: string | null;
          code_display?: string | null;
          clinical_status?: string | null;
          verification_status?: string | null;
          onset_date?: string | null;
          reaction?: Json | null;
          code?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          code_system?: string | null;
          code_value?: string | null;
          code_display?: string | null;
          clinical_status?: string | null;
          verification_status?: string | null;
          onset_date?: string | null;
          reaction?: Json | null;
          code?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      medication_requests: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          encounter_id: string | null;
          status: string;
          intent: string;
          medication_system: string | null;
          medication_code: string | null;
          medication_display: string | null;
          requester_id: string | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          encounter_id?: string | null;
          status?: string;
          intent?: string;
          medication_system?: string | null;
          medication_code?: string | null;
          medication_display?: string | null;
          requester_id?: string | null;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          encounter_id?: string | null;
          status?: string;
          intent?: string;
          medication_system?: string | null;
          medication_code?: string | null;
          medication_display?: string | null;
          requester_id?: string | null;
          note?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      immunizations: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          status: string;
          vaccine_system: string | null;
          vaccine_code: string | null;
          vaccine_display: string | null;
          occurrence_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          status?: string;
          vaccine_system?: string | null;
          vaccine_code?: string | null;
          vaccine_display?: string | null;
          occurrence_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          status?: string;
          vaccine_system?: string | null;
          vaccine_code?: string | null;
          vaccine_display?: string | null;
          occurrence_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      family_member_histories: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          relationship: Json | null;
          condition: Json | null;
          deceased: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          relationship?: Json | null;
          condition?: Json | null;
          deceased?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          relationship?: Json | null;
          condition?: Json | null;
          deceased?: boolean | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          organization_id: string;
          status: string;
          intent: string;
          patient_id: string | null;
          encounter_id: string | null;
          owner_id: string | null;
          requester_id: string | null;
          focus_type: string | null;
          focus_id: string | null;
          code: Json | null;
          description: string | null;
          authored_on: string | null;
          note: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          status?: string;
          intent?: string;
          patient_id?: string | null;
          encounter_id?: string | null;
          owner_id?: string | null;
          requester_id?: string | null;
          focus_type?: string | null;
          focus_id?: string | null;
          code?: Json | null;
          description?: string | null;
          authored_on?: string | null;
          note?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          status?: string;
          intent?: string;
          patient_id?: string | null;
          encounter_id?: string | null;
          owner_id?: string | null;
          requester_id?: string | null;
          focus_type?: string | null;
          focus_id?: string | null;
          code?: Json | null;
          description?: string | null;
          authored_on?: string | null;
          note?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      service_requests: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          encounter_id: string | null;
          status: string;
          intent: string;
          code: Json | null;
          requester_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          encounter_id?: string | null;
          status?: string;
          intent?: string;
          code?: Json | null;
          requester_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          encounter_id?: string | null;
          status?: string;
          intent?: string;
          code?: Json | null;
          requester_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      communications: {
        Row: {
          id: string;
          organization_id: string;
          status: string;
          patient_id: string | null;
          sender_id: string | null;
          recipient_ids: string[] | null;
          topic: string | null;
          parent_id: string | null;
          payload_text: string | null;
          identifier_type: string | null;
          sent: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          status?: string;
          patient_id?: string | null;
          sender_id?: string | null;
          recipient_ids?: string[] | null;
          topic?: string | null;
          parent_id?: string | null;
          payload_text?: string | null;
          identifier_type?: string | null;
          sent?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          status?: string;
          patient_id?: string | null;
          sender_id?: string | null;
          recipient_ids?: string[] | null;
          topic?: string | null;
          parent_id?: string | null;
          payload_text?: string | null;
          identifier_type?: string | null;
          sent?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      coverages: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          status: string;
          type_code: string | null;
          subscriber_id: string | null;
          payor: Json | null;
          relationship: Json | null;
          period_start: string | null;
          period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          status?: string;
          type_code?: string | null;
          subscriber_id?: string | null;
          payor?: Json | null;
          relationship?: Json | null;
          period_start?: string | null;
          period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          status?: string;
          type_code?: string | null;
          subscriber_id?: string | null;
          payor?: Json | null;
          relationship?: Json | null;
          period_start?: string | null;
          period_end?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      consents: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          status: string;
          scope: Json | null;
          category: Json | null;
          policy_rule: Json | null;
          consent_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          status?: string;
          scope?: Json | null;
          category?: Json | null;
          policy_rule?: Json | null;
          consent_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          status?: string;
          scope?: Json | null;
          category?: Json | null;
          policy_rule?: Json | null;
          consent_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      charge_items: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          encounter_id: string | null;
          status: string;
          code: Json | null;
          quantity: number | null;
          price_override: number | null;
          definition_canonical: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          encounter_id?: string | null;
          status?: string;
          code?: Json | null;
          quantity?: number | null;
          price_override?: number | null;
          definition_canonical?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          encounter_id?: string | null;
          status?: string;
          code?: Json | null;
          quantity?: number | null;
          price_override?: number | null;
          definition_canonical?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      claims: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          encounter_id: string | null;
          practitioner_id: string | null;
          status: string;
          coverage_id: string | null;
          total_amount: number | null;
          items: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          encounter_id?: string | null;
          practitioner_id?: string | null;
          status?: string;
          coverage_id?: string | null;
          total_amount?: number | null;
          items?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          encounter_id?: string | null;
          practitioner_id?: string | null;
          status?: string;
          coverage_id?: string | null;
          total_amount?: number | null;
          items?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      care_teams: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          name: string | null;
          participants: Json | null;
          status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          name?: string | null;
          participants?: Json | null;
          status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          name?: string | null;
          participants?: Json | null;
          status?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      document_references: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          status: string;
          category: string | null;
          content_url: string | null;
          title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          status?: string;
          category?: string | null;
          content_url?: string | null;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          status?: string;
          category?: string | null;
          content_url?: string | null;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      provenances: {
        Row: {
          id: string;
          organization_id: string;
          target_type: string;
          target_id: string;
          agent_id: string | null;
          reason_code: string | null;
          signature: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          target_type: string;
          target_id: string;
          agent_id?: string | null;
          reason_code?: string | null;
          signature?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          target_type?: string;
          target_id?: string;
          agent_id?: string | null;
          reason_code?: string | null;
          signature?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      questionnaires: {
        Row: {
          id: string;
          organization_id: string;
          title: string | null;
          status: string;
          items: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title?: string | null;
          status?: string;
          items?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string | null;
          status?: string;
          items?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      questionnaire_responses: {
        Row: {
          id: string;
          organization_id: string;
          questionnaire_id: string | null;
          patient_id: string | null;
          encounter_id: string | null;
          status: string;
          items: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          questionnaire_id?: string | null;
          patient_id?: string | null;
          encounter_id?: string | null;
          status?: string;
          items?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          questionnaire_id?: string | null;
          patient_id?: string | null;
          encounter_id?: string | null;
          status?: string;
          items?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      plan_definitions: {
        Row: {
          id: string;
          organization_id: string;
          title: string | null;
          status: string;
          actions: Json | null;
          extensions: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title?: string | null;
          status?: string;
          actions?: Json | null;
          extensions?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string | null;
          status?: string;
          actions?: Json | null;
          extensions?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {
      get_current_organization_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
}

// Convenience type aliases
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

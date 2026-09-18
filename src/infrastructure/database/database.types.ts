export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      account_deletion_requests: {
        Row: {
          account_id: string
          checkpoint: Json
          failure_code: string | null
          id: string
          requested_at: string
          requested_by_auth_user_id: string
          state: string
          updated_at: string
        }
        Insert: {
          account_id: string
          checkpoint?: Json
          failure_code?: string | null
          id?: string
          requested_at?: string
          requested_by_auth_user_id: string
          state?: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          checkpoint?: Json
          failure_code?: string | null
          id?: string
          requested_at?: string
          requested_by_auth_user_id?: string
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_deletion_requests_account_fk"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_deletion_requests_requester_fk"
            columns: ["account_id", "requested_by_auth_user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "auth_user_id"]
          },
        ]
      }
      account_preferences: {
        Row: {
          account_id: string
          extra_preferences: Json
          locale_code: string | null
          onboarding_state: string
          preference_schema_version: number
          timezone_name: string | null
          units_code: string | null
          updated_at: string
          version: number
          week_starts_on: number
        }
        Insert: {
          account_id: string
          extra_preferences?: Json
          locale_code?: string | null
          onboarding_state?: string
          preference_schema_version?: number
          timezone_name?: string | null
          units_code?: string | null
          updated_at?: string
          version?: number
          week_starts_on?: number
        }
        Update: {
          account_id?: string
          extra_preferences?: Json
          locale_code?: string | null
          onboarding_state?: string
          preference_schema_version?: number
          timezone_name?: string | null
          units_code?: string | null
          updated_at?: string
          version?: number
          week_starts_on?: number
        }
        Relationships: [
          {
            foreignKeyName: "account_preferences_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          auth_user_id: string
          created_at: string
          id: string
          state: string
          updated_at: string
          version: number
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          id?: string
          state?: string
          updated_at?: string
          version?: number
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          id?: string
          state?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      appearance_variants: {
        Row: {
          account_id: string
          archived_at: string | null
          clothing_item_id: string
          created_at: string
          id: string
          is_default: boolean
          label: string
          position: number
          updated_at: string
        }
        Insert: {
          account_id: string
          archived_at?: string | null
          clothing_item_id: string
          created_at?: string
          id?: string
          is_default?: boolean
          label: string
          position?: number
          updated_at?: string
        }
        Update: {
          account_id?: string
          archived_at?: string | null
          clothing_item_id?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appearance_variants_item_fk"
            columns: ["account_id", "clothing_item_id"]
            isOneToOne: false
            referencedRelation: "clothing_items"
            referencedColumns: ["account_id", "id"]
          },
        ]
      }
      audit_events: {
        Row: {
          account_id: string
          actor_auth_user_id: string | null
          event_type: string
          id: string
          metadata: Json
          occurred_at: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          account_id: string
          actor_auth_user_id?: string | null
          event_type: string
          id?: string
          metadata?: Json
          occurred_at?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          account_id?: string
          actor_auth_user_id?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          code: string
          id: string
          is_active: boolean
          label_ru: string
          parent_id: string | null
          sort_order: number
        }
        Insert: {
          code: string
          id?: string
          is_active?: boolean
          label_ru: string
          parent_id?: string | null
          sort_order?: number
        }
        Update: {
          code?: string
          id?: string
          is_active?: boolean
          label_ru?: string
          parent_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      clothing_item_colors: {
        Row: {
          account_id: string
          clothing_item_id: string
          color_id: string
          position: number
        }
        Insert: {
          account_id: string
          clothing_item_id: string
          color_id: string
          position?: number
        }
        Update: {
          account_id?: string
          clothing_item_id?: string
          color_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "clothing_item_colors_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clothing_item_colors_item_fk"
            columns: ["account_id", "clothing_item_id"]
            isOneToOne: false
            referencedRelation: "clothing_items"
            referencedColumns: ["account_id", "id"]
          },
        ]
      }
      clothing_item_seasons: {
        Row: {
          account_id: string
          clothing_item_id: string
          season_id: string
        }
        Insert: {
          account_id: string
          clothing_item_id: string
          season_id: string
        }
        Update: {
          account_id?: string
          clothing_item_id?: string
          season_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clothing_item_seasons_item_fk"
            columns: ["account_id", "clothing_item_id"]
            isOneToOne: false
            referencedRelation: "clothing_items"
            referencedColumns: ["account_id", "id"]
          },
          {
            foreignKeyName: "clothing_item_seasons_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      clothing_item_tags: {
        Row: {
          account_id: string
          clothing_item_id: string
          tag_id: string
        }
        Insert: {
          account_id: string
          clothing_item_id: string
          tag_id: string
        }
        Update: {
          account_id?: string
          clothing_item_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clothing_item_tags_item_fk"
            columns: ["account_id", "clothing_item_id"]
            isOneToOne: false
            referencedRelation: "clothing_items"
            referencedColumns: ["account_id", "id"]
          },
          {
            foreignKeyName: "clothing_item_tags_tag_fk"
            columns: ["account_id", "tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["account_id", "id"]
          },
        ]
      }
      clothing_items: {
        Row: {
          account_id: string
          archived_at: string | null
          brand: string | null
          category_id: string | null
          created_at: string
          description: string | null
          display_name: string | null
          id: string
          is_favorite: boolean
          lifecycle_state: string
          material: string | null
          notes: string | null
          observation_started_on: string | null
          pattern: string | null
          purchase_amount: number | null
          purchase_currency: string | null
          purchased_on: string | null
          record_state: string
          reference_code: string | null
          search_document: unknown
          search_text: string | null
          size_label: string | null
          updated_at: string
          version: number
        }
        Insert: {
          account_id: string
          archived_at?: string | null
          brand?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          id?: string
          is_favorite?: boolean
          lifecycle_state?: string
          material?: string | null
          notes?: string | null
          observation_started_on?: string | null
          pattern?: string | null
          purchase_amount?: number | null
          purchase_currency?: string | null
          purchased_on?: string | null
          record_state?: string
          reference_code?: string | null
          search_document?: unknown
          search_text?: string | null
          size_label?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          account_id?: string
          archived_at?: string | null
          brand?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          id?: string
          is_favorite?: boolean
          lifecycle_state?: string
          material?: string | null
          notes?: string | null
          observation_started_on?: string | null
          pattern?: string | null
          purchase_amount?: number | null
          purchase_currency?: string | null
          purchased_on?: string | null
          record_state?: string
          reference_code?: string | null
          search_document?: unknown
          search_text?: string | null
          size_label?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "clothing_items_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clothing_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      colors: {
        Row: {
          code: string
          hex_hint: string | null
          id: string
          is_active: boolean
          label_ru: string
        }
        Insert: {
          code: string
          hex_hint?: string | null
          id?: string
          is_active?: boolean
          label_ru: string
        }
        Update: {
          code?: string
          hex_hint?: string | null
          id?: string
          is_active?: boolean
          label_ru?: string
        }
        Relationships: []
      }
      export_requests: {
        Row: {
          account_id: string
          byte_size: number | null
          created_at: string
          expires_at: string | null
          failure_code: string | null
          id: string
          package_version: string
          scope_manifest: Json
          state: string
          storage_bucket: string | null
          storage_object_key: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          byte_size?: number | null
          created_at?: string
          expires_at?: string | null
          failure_code?: string | null
          id?: string
          package_version: string
          scope_manifest: Json
          state?: string
          storage_bucket?: string | null
          storage_object_key?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          byte_size?: number | null
          created_at?: string
          expires_at?: string | null
          failure_code?: string | null
          id?: string
          package_version?: string
          scope_manifest?: Json
          state?: string
          storage_bucket?: string | null
          storage_object_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_requests_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      external_item_identities: {
        Row: {
          account_id: string
          clothing_item_id: string
          created_at: string
          external_identifier: string
          first_seen_session_id: string | null
          id: string
          import_source_id: string
          last_seen_session_id: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          clothing_item_id: string
          created_at?: string
          external_identifier: string
          first_seen_session_id?: string | null
          id?: string
          import_source_id: string
          last_seen_session_id?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          clothing_item_id?: string
          created_at?: string
          external_identifier?: string
          first_seen_session_id?: string | null
          id?: string
          import_source_id?: string
          last_seen_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_item_identities_first_session_fk"
            columns: ["account_id", "first_seen_session_id"]
            isOneToOne: false
            referencedRelation: "import_sessions"
            referencedColumns: ["account_id", "id"]
          },
          {
            foreignKeyName: "external_item_identities_item_fk"
            columns: ["account_id", "clothing_item_id"]
            isOneToOne: false
            referencedRelation: "clothing_items"
            referencedColumns: ["account_id", "id"]
          },
          {
            foreignKeyName: "external_item_identities_last_session_fk"
            columns: ["account_id", "last_seen_session_id"]
            isOneToOne: false
            referencedRelation: "import_sessions"
            referencedColumns: ["account_id", "id"]
          },
          {
            foreignKeyName: "external_item_identities_source_fk"
            columns: ["account_id", "import_source_id"]
            isOneToOne: false
            referencedRelation: "import_sources"
            referencedColumns: ["account_id", "id"]
          },
        ]
      }
      idempotency_records: {
        Row: {
          account_id: string
          completed_at: string | null
          created_at: string
          expires_at: string
          id: string
          idempotency_key: string
          operation_scope: string
          request_hash: string
          resource_id: string | null
          resource_type: string | null
          response_summary: Json
          state: string
        }
        Insert: {
          account_id: string
          completed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          idempotency_key: string
          operation_scope: string
          request_hash: string
          resource_id?: string | null
          resource_type?: string | null
          response_summary?: Json
          state?: string
        }
        Update: {
          account_id?: string
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          idempotency_key?: string
          operation_scope?: string
          request_hash?: string
          resource_id?: string | null
          resource_type?: string | null
          response_summary?: Json
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "idempotency_records_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      import_archive_parts: {
        Row: {
          account_id: string
          content_hash: string | null
          created_at: string
          declared_byte_size: number
          failure_code: string | null
          id: string
          import_session_id: string
          observed_byte_size: number | null
          part_ordinal: number
          state: string
          storage_bucket: string
          storage_object_key: string
          updated_at: string
        }
        Insert: {
          account_id: string
          content_hash?: string | null
          created_at?: string
          declared_byte_size: number
          failure_code?: string | null
          id: string
          import_session_id: string
          observed_byte_size?: number | null
          part_ordinal: number
          state?: string
          storage_bucket?: string
          storage_object_key: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          content_hash?: string | null
          created_at?: string
          declared_byte_size?: number
          failure_code?: string | null
          id?: string
          import_session_id?: string
          observed_byte_size?: number | null
          part_ordinal?: number
          state?: string
          storage_bucket?: string
          storage_object_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_archive_parts_session_fk"
            columns: ["account_id", "import_session_id"]
            isOneToOne: false
            referencedRelation: "import_sessions"
            referencedColumns: ["account_id", "id"]
          },
        ]
      }
      import_asset_links: {
        Row: {
          account_id: string
          created_at: string
          disposition: string
          id: string
          import_record_id: string | null
          import_session_id: string
          media_asset_id: string
          proposed_primary: boolean
          proposed_role: string | null
          proposed_variant_key: string | null
          proposed_view: string | null
          source_reference: string
        }
        Insert: {
          account_id: string
          created_at?: string
          disposition?: string
          id?: string
          import_record_id?: string | null
          import_session_id: string
          media_asset_id: string
          proposed_primary?: boolean
          proposed_role?: string | null
          proposed_variant_key?: string | null
          proposed_view?: string | null
          source_reference: string
        }
        Update: {
          account_id?: string
          created_at?: string
          disposition?: string
          id?: string
          import_record_id?: string | null
          import_session_id?: string
          media_asset_id?: string
          proposed_primary?: boolean
          proposed_role?: string | null
          proposed_variant_key?: string | null
          proposed_view?: string | null
          source_reference?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_asset_links_asset_fk"
            columns: ["account_id", "media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["account_id", "id"]
          },
          {
            foreignKeyName: "import_asset_links_record_fk"
            columns: ["account_id", "import_record_id"]
            isOneToOne: false
            referencedRelation: "import_records"
            referencedColumns: ["account_id", "id"]
          },
          {
            foreignKeyName: "import_asset_links_session_fk"
            columns: ["account_id", "import_session_id"]
            isOneToOne: false
            referencedRelation: "import_sessions"
            referencedColumns: ["account_id", "id"]
          },
        ]
      }
      import_records: {
        Row: {
          account_id: string
          candidate_item_id: string | null
          commit_key: string
          commit_outcome: string
          committed_at: string | null
          committed_item_id: string | null
          created_at: string
          decision_payload: Json
          external_identifier: string | null
          id: string
          import_session_id: string
          issues: Json
          normalized_payload: Json | null
          outcome_detail: Json
          proposed_action: string | null
          proposed_diff: Json
          raw_payload: Json
          record_ordinal: number
          source_record_key: string
          updated_at: string
          user_decision: string
          validation_state: string
        }
        Insert: {
          account_id: string
          candidate_item_id?: string | null
          commit_key?: string
          commit_outcome?: string
          committed_at?: string | null
          committed_item_id?: string | null
          created_at?: string
          decision_payload?: Json
          external_identifier?: string | null
          id?: string
          import_session_id: string
          issues?: Json
          normalized_payload?: Json | null
          outcome_detail?: Json
          proposed_action?: string | null
          proposed_diff?: Json
          raw_payload: Json
          record_ordinal: number
          source_record_key: string
          updated_at?: string
          user_decision?: string
          validation_state?: string
        }
        Update: {
          account_id?: string
          candidate_item_id?: string | null
          commit_key?: string
          commit_outcome?: string
          committed_at?: string | null
          committed_item_id?: string | null
          created_at?: string
          decision_payload?: Json
          external_identifier?: string | null
          id?: string
          import_session_id?: string
          issues?: Json
          normalized_payload?: Json | null
          outcome_detail?: Json
          proposed_action?: string | null
          proposed_diff?: Json
          raw_payload?: Json
          record_ordinal?: number
          source_record_key?: string
          updated_at?: string
          user_decision?: string
          validation_state?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_records_candidate_item_fk"
            columns: ["account_id", "candidate_item_id"]
            isOneToOne: false
            referencedRelation: "clothing_items"
            referencedColumns: ["account_id", "id"]
          },
          {
            foreignKeyName: "import_records_committed_item_fk"
            columns: ["account_id", "committed_item_id"]
            isOneToOne: false
            referencedRelation: "clothing_items"
            referencedColumns: ["account_id", "id"]
          },
          {
            foreignKeyName: "import_records_session_fk"
            columns: ["account_id", "import_session_id"]
            isOneToOne: false
            referencedRelation: "import_sessions"
            referencedColumns: ["account_id", "id"]
          },
        ]
      }
      import_sessions: {
        Row: {
          account_id: string
          cleanup_after: string | null
          confirmed_at: string | null
          confirmed_manifest_hash: string | null
          confirmed_revision: number | null
          created_at: string
          expires_at: string
          failure_code: string | null
          id: string
          import_source_id: string
          preview_manifest_hash: string | null
          preview_revision: number
          source_schema_version: string | null
          state: string
          summary: Json
          updated_at: string
          version: number
        }
        Insert: {
          account_id: string
          cleanup_after?: string | null
          confirmed_at?: string | null
          confirmed_manifest_hash?: string | null
          confirmed_revision?: number | null
          created_at?: string
          expires_at?: string
          failure_code?: string | null
          id?: string
          import_source_id: string
          preview_manifest_hash?: string | null
          preview_revision?: number
          source_schema_version?: string | null
          state?: string
          summary?: Json
          updated_at?: string
          version?: number
        }
        Update: {
          account_id?: string
          cleanup_after?: string | null
          confirmed_at?: string | null
          confirmed_manifest_hash?: string | null
          confirmed_revision?: number | null
          created_at?: string
          expires_at?: string
          failure_code?: string | null
          id?: string
          import_source_id?: string
          preview_manifest_hash?: string | null
          preview_revision?: number
          source_schema_version?: string | null
          state?: string
          summary?: Json
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_sessions_source_fk"
            columns: ["account_id", "import_source_id"]
            isOneToOne: false
            referencedRelation: "import_sources"
            referencedColumns: ["account_id", "id"]
          },
        ]
      }
      import_sources: {
        Row: {
          account_id: string
          adapter_version: string
          created_at: string
          display_name: string
          id: string
          last_used_at: string | null
          source_kind: string
          source_namespace: string
        }
        Insert: {
          account_id: string
          adapter_version: string
          created_at?: string
          display_name: string
          id?: string
          last_used_at?: string | null
          source_kind: string
          source_namespace: string
        }
        Update: {
          account_id?: string
          adapter_version?: string
          created_at?: string
          display_name?: string
          id?: string
          last_used_at?: string | null
          source_kind?: string
          source_namespace?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_sources_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      item_metadata_evidence: {
        Row: {
          account_id: string
          applied_item_version: number | null
          clothing_item_id: string
          confidence: number | null
          created_at: string
          decided_at: string | null
          decided_value: Json | null
          field_code: string
          id: string
          import_record_id: string | null
          origin_code: string
          proposed_value: Json
          review_state: string
        }
        Insert: {
          account_id: string
          applied_item_version?: number | null
          clothing_item_id: string
          confidence?: number | null
          created_at?: string
          decided_at?: string | null
          decided_value?: Json | null
          field_code: string
          id?: string
          import_record_id?: string | null
          origin_code: string
          proposed_value: Json
          review_state?: string
        }
        Update: {
          account_id?: string
          applied_item_version?: number | null
          clothing_item_id?: string
          confidence?: number | null
          created_at?: string
          decided_at?: string | null
          decided_value?: Json | null
          field_code?: string
          id?: string
          import_record_id?: string | null
          origin_code?: string
          proposed_value?: Json
          review_state?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_metadata_evidence_import_record_fk"
            columns: ["account_id", "import_record_id"]
            isOneToOne: false
            referencedRelation: "import_records"
            referencedColumns: ["account_id", "id"]
          },
          {
            foreignKeyName: "item_metadata_evidence_item_fk"
            columns: ["account_id", "clothing_item_id"]
            isOneToOne: false
            referencedRelation: "clothing_items"
            referencedColumns: ["account_id", "id"]
          },
        ]
      }
      jobs: {
        Row: {
          account_deletion_request_id: string | null
          account_id: string
          attempt_count: number
          available_at: string
          checkpoint: Json
          created_at: string
          deduplication_key: string
          export_request_id: string | null
          failure_code: string | null
          id: string
          import_session_id: string | null
          job_type: string
          lease_expires_at: string | null
          lease_owner: string | null
          max_attempts: number
          media_asset_id: string | null
          payload: Json
          state: string
          updated_at: string
        }
        Insert: {
          account_deletion_request_id?: string | null
          account_id: string
          attempt_count?: number
          available_at?: string
          checkpoint?: Json
          created_at?: string
          deduplication_key: string
          export_request_id?: string | null
          failure_code?: string | null
          id?: string
          import_session_id?: string | null
          job_type: string
          lease_expires_at?: string | null
          lease_owner?: string | null
          max_attempts?: number
          media_asset_id?: string | null
          payload?: Json
          state?: string
          updated_at?: string
        }
        Update: {
          account_deletion_request_id?: string | null
          account_id?: string
          attempt_count?: number
          available_at?: string
          checkpoint?: Json
          created_at?: string
          deduplication_key?: string
          export_request_id?: string | null
          failure_code?: string | null
          id?: string
          import_session_id?: string | null
          job_type?: string
          lease_expires_at?: string | null
          lease_owner?: string | null
          max_attempts?: number
          media_asset_id?: string | null
          payload?: Json
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_account_deletion_request_fk"
            columns: ["account_id", "account_deletion_request_id"]
            isOneToOne: false
            referencedRelation: "account_deletion_requests"
            referencedColumns: ["account_id", "id"]
          },
          {
            foreignKeyName: "jobs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_export_request_fk"
            columns: ["account_id", "export_request_id"]
            isOneToOne: false
            referencedRelation: "export_requests"
            referencedColumns: ["account_id", "id"]
          },
          {
            foreignKeyName: "jobs_import_session_fk"
            columns: ["account_id", "import_session_id"]
            isOneToOne: false
            referencedRelation: "import_sessions"
            referencedColumns: ["account_id", "id"]
          },
          {
            foreignKeyName: "jobs_media_asset_fk"
            columns: ["account_id", "media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["account_id", "id"]
          },
        ]
      }
      media_assets: {
        Row: {
          account_id: string
          byte_size: number | null
          content_hash: string | null
          created_at: string
          declared_mime_type: string | null
          delete_after: string | null
          evidence_status: string
          failure_code: string | null
          height_px: number | null
          id: string
          origin_code: string
          original_filename: string | null
          processing_state: string
          replaces_asset_id: string | null
          storage_bucket: string
          storage_object_key: string
          updated_at: string
          verified_mime_type: string | null
          version: number
          width_px: number | null
        }
        Insert: {
          account_id: string
          byte_size?: number | null
          content_hash?: string | null
          created_at?: string
          declared_mime_type?: string | null
          delete_after?: string | null
          evidence_status: string
          failure_code?: string | null
          height_px?: number | null
          id?: string
          origin_code: string
          original_filename?: string | null
          processing_state?: string
          replaces_asset_id?: string | null
          storage_bucket: string
          storage_object_key: string
          updated_at?: string
          verified_mime_type?: string | null
          version?: number
          width_px?: number | null
        }
        Update: {
          account_id?: string
          byte_size?: number | null
          content_hash?: string | null
          created_at?: string
          declared_mime_type?: string | null
          delete_after?: string | null
          evidence_status?: string
          failure_code?: string | null
          height_px?: number | null
          id?: string
          origin_code?: string
          original_filename?: string | null
          processing_state?: string
          replaces_asset_id?: string | null
          storage_bucket?: string
          storage_object_key?: string
          updated_at?: string
          verified_mime_type?: string | null
          version?: number
          width_px?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_replacement_fk"
            columns: ["account_id", "replaces_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["account_id", "id"]
          },
        ]
      }
      media_bindings: {
        Row: {
          account_id: string
          appearance_variant_id: string | null
          clothing_item_id: string
          created_at: string
          id: string
          image_view: string
          is_primary: boolean
          media_asset_id: string
          position: number
          product_role: string
        }
        Insert: {
          account_id: string
          appearance_variant_id?: string | null
          clothing_item_id: string
          created_at?: string
          id?: string
          image_view?: string
          is_primary?: boolean
          media_asset_id: string
          position?: number
          product_role: string
        }
        Update: {
          account_id?: string
          appearance_variant_id?: string | null
          clothing_item_id?: string
          created_at?: string
          id?: string
          image_view?: string
          is_primary?: boolean
          media_asset_id?: string
          position?: number
          product_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_bindings_asset_fk"
            columns: ["account_id", "media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["account_id", "id"]
          },
          {
            foreignKeyName: "media_bindings_item_fk"
            columns: ["account_id", "clothing_item_id"]
            isOneToOne: false
            referencedRelation: "clothing_items"
            referencedColumns: ["account_id", "id"]
          },
          {
            foreignKeyName: "media_bindings_variant_fk"
            columns: ["account_id", "appearance_variant_id", "clothing_item_id"]
            isOneToOne: false
            referencedRelation: "appearance_variants"
            referencedColumns: ["account_id", "id", "clothing_item_id"]
          },
        ]
      }
      media_renditions: {
        Row: {
          account_id: string
          byte_size: number | null
          created_at: string
          failure_code: string | null
          height_px: number | null
          id: string
          media_asset_id: string
          mime_type: string | null
          processor_profile_version: string
          rendition_kind: string
          state: string
          storage_bucket: string
          storage_object_key: string
          updated_at: string
          version: number
          width_px: number | null
        }
        Insert: {
          account_id: string
          byte_size?: number | null
          created_at?: string
          failure_code?: string | null
          height_px?: number | null
          id?: string
          media_asset_id: string
          mime_type?: string | null
          processor_profile_version: string
          rendition_kind: string
          state?: string
          storage_bucket: string
          storage_object_key: string
          updated_at?: string
          version?: number
          width_px?: number | null
        }
        Update: {
          account_id?: string
          byte_size?: number | null
          created_at?: string
          failure_code?: string | null
          height_px?: number | null
          id?: string
          media_asset_id?: string
          mime_type?: string | null
          processor_profile_version?: string
          rendition_kind?: string
          state?: string
          storage_bucket?: string
          storage_object_key?: string
          updated_at?: string
          version?: number
          width_px?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_renditions_asset_fk"
            columns: ["account_id", "media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["account_id", "id"]
          },
        ]
      }
      outfit_items: {
        Row: {
          account_id: string
          appearance_variant_id: string | null
          clothing_item_id: string
          created_at: string
          id: string
          outfit_id: string
          position: number
          semantic_role: string | null
        }
        Insert: {
          account_id: string
          appearance_variant_id?: string | null
          clothing_item_id: string
          created_at?: string
          id?: string
          outfit_id: string
          position: number
          semantic_role?: string | null
        }
        Update: {
          account_id?: string
          appearance_variant_id?: string | null
          clothing_item_id?: string
          created_at?: string
          id?: string
          outfit_id?: string
          position?: number
          semantic_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outfit_items_item_fk"
            columns: ["account_id", "clothing_item_id"]
            isOneToOne: false
            referencedRelation: "clothing_items"
            referencedColumns: ["account_id", "id"]
          },
          {
            foreignKeyName: "outfit_items_outfit_fk"
            columns: ["account_id", "outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["account_id", "id"]
          },
          {
            foreignKeyName: "outfit_items_variant_fk"
            columns: ["account_id", "appearance_variant_id", "clothing_item_id"]
            isOneToOne: false
            referencedRelation: "appearance_variants"
            referencedColumns: ["account_id", "id", "clothing_item_id"]
          },
        ]
      }
      outfit_seasons: {
        Row: {
          account_id: string
          outfit_id: string
          season_id: string
        }
        Insert: {
          account_id: string
          outfit_id: string
          season_id: string
        }
        Update: {
          account_id?: string
          outfit_id?: string
          season_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outfit_seasons_outfit_fk"
            columns: ["account_id", "outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["account_id", "id"]
          },
          {
            foreignKeyName: "outfit_seasons_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      outfit_tags: {
        Row: {
          account_id: string
          outfit_id: string
          tag_id: string
        }
        Insert: {
          account_id: string
          outfit_id: string
          tag_id: string
        }
        Update: {
          account_id?: string
          outfit_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outfit_tags_outfit_fk"
            columns: ["account_id", "outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["account_id", "id"]
          },
          {
            foreignKeyName: "outfit_tags_tag_fk"
            columns: ["account_id", "tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["account_id", "id"]
          },
        ]
      }
      outfits: {
        Row: {
          account_id: string
          archived_at: string | null
          created_at: string
          id: string
          is_favorite: boolean
          lifecycle_state: string
          notes: string | null
          record_state: string
          title: string | null
          updated_at: string
          version: number
        }
        Insert: {
          account_id: string
          archived_at?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          lifecycle_state?: string
          notes?: string | null
          record_state?: string
          title?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          account_id?: string
          archived_at?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          lifecycle_state?: string
          notes?: string | null
          record_state?: string
          title?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "outfits_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          code: string
          id: string
          is_active: boolean
          label_ru: string
          sort_order: number
        }
        Insert: {
          code: string
          id?: string
          is_active?: boolean
          label_ru: string
          sort_order?: number
        }
        Update: {
          code?: string
          id?: string
          is_active?: boolean
          label_ru?: string
          sort_order?: number
        }
        Relationships: []
      }
      tags: {
        Row: {
          account_id: string
          archived_at: string | null
          code: string | null
          created_at: string
          id: string
          is_system_seed: boolean
          kind: string
          label: string
          normalized_label: string
          updated_at: string
        }
        Insert: {
          account_id: string
          archived_at?: string | null
          code?: string | null
          created_at?: string
          id?: string
          is_system_seed?: boolean
          kind?: string
          label: string
          normalized_label: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          archived_at?: string | null
          code?: string | null
          created_at?: string
          id?: string
          is_system_seed?: boolean
          kind?: string
          label?: string
          normalized_label?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      wear_event_items: {
        Row: {
          account_id: string
          appearance_variant_id: string | null
          category_code_snapshot: string | null
          category_label_snapshot: string | null
          clothing_item_id: string | null
          id: string
          item_display_name_snapshot: string
          position: number
          snapshot_item_id: string
          snapshot_variant_id: string | null
          variant_label_snapshot: string | null
          wear_event_id: string
        }
        Insert: {
          account_id: string
          appearance_variant_id?: string | null
          category_code_snapshot?: string | null
          category_label_snapshot?: string | null
          clothing_item_id?: string | null
          id?: string
          item_display_name_snapshot: string
          position: number
          snapshot_item_id: string
          snapshot_variant_id?: string | null
          variant_label_snapshot?: string | null
          wear_event_id: string
        }
        Update: {
          account_id?: string
          appearance_variant_id?: string | null
          category_code_snapshot?: string | null
          category_label_snapshot?: string | null
          clothing_item_id?: string | null
          id?: string
          item_display_name_snapshot?: string
          position?: number
          snapshot_item_id?: string
          snapshot_variant_id?: string | null
          variant_label_snapshot?: string | null
          wear_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wear_event_items_event_fk"
            columns: ["account_id", "wear_event_id"]
            isOneToOne: false
            referencedRelation: "wear_events"
            referencedColumns: ["account_id", "id"]
          },
          {
            foreignKeyName: "wear_event_items_live_item_fk"
            columns: ["account_id", "clothing_item_id"]
            isOneToOne: false
            referencedRelation: "clothing_items"
            referencedColumns: ["account_id", "id"]
          },
          {
            foreignKeyName: "wear_event_items_live_variant_fk"
            columns: ["account_id", "appearance_variant_id", "clothing_item_id"]
            isOneToOne: false
            referencedRelation: "appearance_variants"
            referencedColumns: ["account_id", "id", "clothing_item_id"]
          },
        ]
      }
      wear_events: {
        Row: {
          account_id: string
          created_at: string
          id: string
          notes: string | null
          occurred_at: string | null
          occurred_on: string
          source_outfit_id: string | null
          source_outfit_title_snapshot: string | null
          timezone_name: string
          updated_at: string
          version: number
          voided_at: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          notes?: string | null
          occurred_at?: string | null
          occurred_on: string
          source_outfit_id?: string | null
          source_outfit_title_snapshot?: string | null
          timezone_name: string
          updated_at?: string
          version?: number
          voided_at?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          occurred_at?: string | null
          occurred_on?: string
          source_outfit_id?: string | null
          source_outfit_title_snapshot?: string | null
          timezone_name?: string
          updated_at?: string
          version?: number
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wear_events_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wear_events_outfit_fk"
            columns: ["account_id", "source_outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["account_id", "id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_account: {
        Args: { p_account_id: string; p_auth_user_id: string }
        Returns: {
          account_id: string
          account_state: string
        }[]
      }
      build_import_preview: {
        Args: {
          p_account_id: string
          p_expected_version: number
          p_session_id: string
        }
        Returns: Json
      }
      cancel_import_session: {
        Args: {
          p_account_id: string
          p_expected_version: number
          p_session_id: string
        }
        Returns: number
      }
      claim_import_job: {
        Args: { p_lease_seconds?: number; p_worker_id: string }
        Returns: {
          account_id: string
          attempt_count: number
          import_session_id: string
          job_id: string
          job_type: string
          payload: Json
        }[]
      }
      claim_media_job: {
        Args: { p_lease_seconds?: number; p_worker_id: string }
        Returns: {
          account_id: string
          attempt_count: number
          job_id: string
          job_type: string
          max_attempts: number
          media_asset_id: string
          payload: Json
        }[]
      }
      commit_import_record: {
        Args: { p_job_id: string; p_record_id: string; p_worker_id: string }
        Returns: Json
      }
      complete_import_archive_part: {
        Args: {
          p_account_id: string
          p_observed_byte_size: number
          p_part_id: string
          p_session_id: string
        }
        Returns: Json
      }
      complete_media_upload: {
        Args: {
          p_account_id: string
          p_asset_id: string
          p_idempotency_key: string
          p_observed_byte_size: number
          p_request_hash: string
        }
        Returns: {
          asset_id: string
          job_id: string
          processing_state: string
        }[]
      }
      confirm_import_session: {
        Args: {
          p_account_id: string
          p_expected_manifest_hash: string
          p_expected_revision: number
          p_expected_version: number
          p_idempotency_key: string
          p_request_hash: string
          p_session_id: string
        }
        Returns: Json
      }
      create_import_session_intent: {
        Args: {
          p_account_id: string
          p_idempotency_key: string
          p_parts: Json
          p_request_hash: string
          p_session_id: string
        }
        Returns: Json
      }
      create_media_upload_intent: {
        Args: {
          p_account_id: string
          p_appearance_variant_id: string
          p_asset_id: string
          p_declared_byte_size: number
          p_declared_mime_type: string
          p_idempotency_key: string
          p_image_view: string
          p_item_id: string
          p_original_filename: string
          p_product_role: string
          p_replaces_asset_id: string
          p_request_hash: string
        }
        Returns: {
          asset_id: string
          processing_state: string
          storage_bucket: string
          storage_object_key: string
        }[]
      }
      fail_import_job: {
        Args: {
          p_failure_code: string
          p_job_id: string
          p_retry_delay_seconds?: number
          p_worker_id: string
        }
        Returns: boolean
      }
      fail_media_job: {
        Args: {
          p_failure_code: string
          p_job_id: string
          p_retry_delay_seconds?: number
          p_worker_id: string
        }
        Returns: string
      }
      finalize_import_cleanup: {
        Args: {
          p_deleted_part_ids: string[]
          p_job_id: string
          p_worker_id: string
        }
        Returns: boolean
      }
      finalize_import_commit: {
        Args: { p_job_id: string; p_worker_id: string }
        Returns: Json
      }
      finalize_media_cleanup: {
        Args: { p_job_id: string; p_worker_id: string }
        Returns: boolean
      }
      finish_import_prepare: {
        Args: {
          p_job_id: string
          p_part_hashes: Json
          p_summary: Json
          p_worker_id: string
        }
        Returns: number
      }
      record_import_record_failure: {
        Args: {
          p_failure_code: string
          p_job_id: string
          p_record_id: string
          p_worker_id: string
        }
        Returns: boolean
      }
      record_media_processing: {
        Args: { p_job_id: string; p_renditions: Json; p_worker_id: string }
        Returns: string
      }
      record_media_validation: {
        Args: {
          p_byte_size: number
          p_content_hash: string
          p_failure_code: string
          p_height_px: number
          p_job_id: string
          p_quarantine: boolean
          p_valid: boolean
          p_verified_mime_type: string
          p_width_px: number
          p_worker_id: string
        }
        Returns: string
      }
      remove_media_binding: {
        Args: {
          p_account_id: string
          p_binding_id: string
          p_expected_item_version: number
          p_item_id: string
        }
        Returns: number
      }
      replace_import_resolution: {
        Args: {
          p_account_id: string
          p_expected_version: number
          p_resolution: Json
          p_session_id: string
        }
        Returns: number
      }
      retry_import_commit: {
        Args: {
          p_account_id: string
          p_expected_version: number
          p_session_id: string
        }
        Returns: Json
      }
      retry_media_asset: {
        Args: {
          p_account_id: string
          p_asset_id: string
          p_expected_version: number
        }
        Returns: {
          asset_id: string
          asset_version: number
          processing_state: string
        }[]
      }
      save_wardrobe_item: {
        Args: {
          p_account_id: string
          p_brand: string
          p_category_id: string
          p_color_ids: string[]
          p_custom_labels: string[]
          p_description: string
          p_display_name: string
          p_expected_version: number
          p_item_id: string
          p_material: string
          p_notes: string
          p_pattern: string
          p_purpose_labels: string[]
          p_record_state: string
          p_reference_code: string
          p_season_ids: string[]
          p_size_label: string
          p_style_labels: string[]
          p_variant_labels: string[]
        }
        Returns: {
          item_id: string
          item_version: number
        }[]
      }
      search_wardrobe_item_ids: {
        Args: {
          p_category_id?: string
          p_color_id?: string
          p_favorite?: boolean
          p_lifecycle_state?: string
          p_limit?: number
          p_query?: string
          p_season_id?: string
          p_tag_id?: string
        }
        Returns: {
          item_id: string
        }[]
      }
      set_media_gallery: {
        Args: {
          p_account_id: string
          p_binding_ids: string[]
          p_expected_item_version: number
          p_item_id: string
          p_primary_binding_id: string
        }
        Returns: number
      }
      set_wardrobe_item_state: {
        Args: {
          p_account_id: string
          p_action: string
          p_expected_version: number
          p_item_id: string
        }
        Returns: {
          is_favorite: boolean
          item_id: string
          item_version: number
          lifecycle_state: string
        }[]
      }
      stage_import_asset: {
        Args: {
          p_asset_id: string
          p_byte_size: number
          p_content_hash: string
          p_job_id: string
          p_mime_type: string
          p_origin_proposal: string
          p_source_reference: string
          p_storage_object_key: string
          p_worker_id: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const


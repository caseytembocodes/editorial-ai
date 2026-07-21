export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      article_references: {
        Row: {
          article_id: string
          authority: string | null
          created_at: string
          id: string
          position: number
          provider: string | null
          retrieved_at: string | null
          source_item_id: string | null
          source_published_at: string | null
          title: string
          url: string
        }
        Insert: {
          article_id: string
          authority?: string | null
          created_at?: string
          id?: string
          position?: number
          provider?: string | null
          retrieved_at?: string | null
          source_item_id?: string | null
          source_published_at?: string | null
          title: string
          url: string
        }
        Update: {
          article_id?: string
          authority?: string | null
          created_at?: string
          id?: string
          position?: number
          provider?: string | null
          retrieved_at?: string | null
          source_item_id?: string | null
          source_published_at?: string | null
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_references_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_references_source_item_id_fkey"
            columns: ["source_item_id"]
            isOneToOne: false
            referencedRelation: "source_items"
            referencedColumns: ["id"]
          },
        ]
      }
      article_versions: {
        Row: {
          article_id: string
          body_markdown: string
          change_reason: string | null
          created_at: string
          description: string
          id: string
          model: string | null
          provider: string | null
          title: string
          version_number: number
        }
        Insert: {
          article_id: string
          body_markdown: string
          change_reason?: string | null
          created_at?: string
          description: string
          id?: string
          model?: string | null
          provider?: string | null
          title: string
          version_number: number
        }
        Update: {
          article_id?: string
          body_markdown?: string
          change_reason?: string | null
          created_at?: string
          description?: string
          id?: string
          model?: string | null
          provider?: string | null
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "article_versions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          archived_at: string | null
          article_type: Database["public"]["Enums"]["article_type_enum"]
          author_id: string
          body_markdown: string
          category_id: string
          created_at: string
          description: string
          event_at: string | null
          featured_image_alt: string | null
          featured_image_url: string | null
          generation_job_id: string | null
          id: string
          is_demo: boolean
          keywords: string[]
          language: string
          model: string | null
          provider: string | null
          published_at: string | null
          reading_time_minutes: number
          search_tsv: unknown
          slug: string
          source_item_id: string | null
          status: Database["public"]["Enums"]["article_status_enum"]
          title: string
          updated_at: string
          word_count: number
        }
        Insert: {
          archived_at?: string | null
          article_type?: Database["public"]["Enums"]["article_type_enum"]
          author_id: string
          body_markdown: string
          category_id: string
          created_at?: string
          description: string
          event_at?: string | null
          featured_image_alt?: string | null
          featured_image_url?: string | null
          generation_job_id?: string | null
          id?: string
          is_demo?: boolean
          keywords?: string[]
          language?: string
          model?: string | null
          provider?: string | null
          published_at?: string | null
          reading_time_minutes?: number
          search_tsv?: unknown
          slug: string
          source_item_id?: string | null
          status?: Database["public"]["Enums"]["article_status_enum"]
          title: string
          updated_at?: string
          word_count?: number
        }
        Update: {
          archived_at?: string | null
          article_type?: Database["public"]["Enums"]["article_type_enum"]
          author_id?: string
          body_markdown?: string
          category_id?: string
          created_at?: string
          description?: string
          event_at?: string | null
          featured_image_alt?: string | null
          featured_image_url?: string | null
          generation_job_id?: string | null
          id?: string
          is_demo?: boolean
          keywords?: string[]
          language?: string
          model?: string | null
          provider?: string | null
          published_at?: string | null
          reading_time_minutes?: number
          search_tsv?: unknown
          slug?: string
          source_item_id?: string | null
          status?: Database["public"]["Enums"]["article_status_enum"]
          title?: string
          updated_at?: string
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_generation_job_id_fkey"
            columns: ["generation_job_id"]
            isOneToOne: false
            referencedRelation: "delegation_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_source_item_id_fkey"
            columns: ["source_item_id"]
            isOneToOne: false
            referencedRelation: "source_items"
            referencedColumns: ["id"]
          },
        ]
      }
      authors: {
        Row: {
          article_count: number
          category_id: string
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          last_used_at: string | null
          rotation_weight: number
          slug: string
        }
        Insert: {
          article_count?: number
          category_id: string
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          rotation_weight?: number
          slug: string
        }
        Update: {
          article_count?: number
          category_id?: string
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          rotation_weight?: number
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "authors_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          internal_label: string | null
          is_current: boolean
          label: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          internal_label?: string | null
          is_current?: boolean
          label: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          internal_label?: string | null
          is_current?: boolean
          label?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      delegation_jobs: {
        Row: {
          attempt_count: number
          author_id: string | null
          category_id: string | null
          completed_at: string | null
          created_at: string
          failure_reason: string | null
          id: string
          input_payload: Json
          job_type: Database["public"]["Enums"]["job_type_enum"]
          max_attempts: number
          model: string
          output_payload: Json | null
          provider: string
          scheduled_at: string
          source_item_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status_enum"]
        }
        Insert: {
          attempt_count?: number
          author_id?: string | null
          category_id?: string | null
          completed_at?: string | null
          created_at?: string
          failure_reason?: string | null
          id?: string
          input_payload?: Json
          job_type: Database["public"]["Enums"]["job_type_enum"]
          max_attempts?: number
          model: string
          output_payload?: Json | null
          provider: string
          scheduled_at?: string
          source_item_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status_enum"]
        }
        Update: {
          attempt_count?: number
          author_id?: string | null
          category_id?: string | null
          completed_at?: string | null
          created_at?: string
          failure_reason?: string | null
          id?: string
          input_payload?: Json
          job_type?: Database["public"]["Enums"]["job_type_enum"]
          max_attempts?: number
          model?: string
          output_payload?: Json | null
          provider?: string
          scheduled_at?: string
          source_item_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "delegation_jobs_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegation_jobs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegation_jobs_source_item_id_fkey"
            columns: ["source_item_id"]
            isOneToOne: false
            referencedRelation: "source_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      provider_events: {
        Row: {
          created_at: string
          error_code: string | null
          event_type: Database["public"]["Enums"]["provider_event_type"]
          id: string
          input_tokens: number | null
          job_id: string | null
          latency_ms: number | null
          metadata: Json
          model: string | null
          output_tokens: number | null
          provider: string
          status_code: number | null
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          event_type: Database["public"]["Enums"]["provider_event_type"]
          id?: string
          input_tokens?: number | null
          job_id?: string | null
          latency_ms?: number | null
          metadata?: Json
          model?: string | null
          output_tokens?: number | null
          provider: string
          status_code?: number | null
        }
        Update: {
          created_at?: string
          error_code?: string | null
          event_type?: Database["public"]["Enums"]["provider_event_type"]
          id?: string
          input_tokens?: number | null
          job_id?: string | null
          latency_ms?: number | null
          metadata?: Json
          model?: string | null
          output_tokens?: number | null
          provider?: string
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "delegation_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      source_items: {
        Row: {
          category_id: string
          content_hash: string | null
          context: Json
          created_at: string
          external_id: string | null
          id: string
          instructions: Json
          prompt: string
          refs: Json
          rejection_reason: string | null
          retrieved_at: string
          source_id: string
          source_published_at: string | null
          status: Database["public"]["Enums"]["source_item_status"]
        }
        Insert: {
          category_id: string
          content_hash?: string | null
          context?: Json
          created_at?: string
          external_id?: string | null
          id?: string
          instructions?: Json
          prompt: string
          refs?: Json
          rejection_reason?: string | null
          retrieved_at?: string
          source_id: string
          source_published_at?: string | null
          status?: Database["public"]["Enums"]["source_item_status"]
        }
        Update: {
          category_id?: string
          content_hash?: string | null
          context?: Json
          created_at?: string
          external_id?: string | null
          id?: string
          instructions?: Json
          prompt?: string
          refs?: Json
          rejection_reason?: string | null
          retrieved_at?: string
          source_id?: string
          source_published_at?: string | null
          status?: Database["public"]["Enums"]["source_item_status"]
        }
        Relationships: [
          {
            foreignKeyName: "source_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_items_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          auth_type: string | null
          base_url: string | null
          category_id: string
          collected_count: number
          configuration: Json
          created_at: string
          env_var_name: string | null
          id: string
          is_enabled: boolean
          last_run_at: string | null
          name: string
          next_eligible_at: string | null
          priority: number
          prompt_template: string | null
          provider: string | null
          recent_failures: number
          rights_notes: string | null
          slug: string
          source_type: Database["public"]["Enums"]["source_type_enum"]
          updated_at: string
        }
        Insert: {
          auth_type?: string | null
          base_url?: string | null
          category_id: string
          collected_count?: number
          configuration?: Json
          created_at?: string
          env_var_name?: string | null
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          name: string
          next_eligible_at?: string | null
          priority?: number
          prompt_template?: string | null
          provider?: string | null
          recent_failures?: number
          rights_notes?: string | null
          slug: string
          source_type: Database["public"]["Enums"]["source_type_enum"]
          updated_at?: string
        }
        Update: {
          auth_type?: string | null
          base_url?: string | null
          category_id?: string
          collected_count?: number
          configuration?: Json
          created_at?: string
          env_var_name?: string | null
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          name?: string
          next_eligible_at?: string | null
          priority?: number
          prompt_template?: string | null
          provider?: string | null
          recent_failures?: number
          rights_notes?: string | null
          slug?: string
          source_type?: Database["public"]["Enums"]["source_type_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sources_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      system_state: {
        Row: {
          afternoon_hour: number
          daily_maximum: number
          daily_target: number
          fallback_active: string | null
          id: number
          last_run_at: string | null
          max_attempts: number
          max_concurrent_jobs: number
          min_body_length: number
          mode: Database["public"]["Enums"]["system_mode_enum"]
          morning_hour: number
          next_run_at: string | null
          night_hour: number
          per_category_max: number
          primary_provider: string
          provider_cooldown_minutes: number
          provider_failure_threshold: number
          timezone: string
          updated_at: string
        }
        Insert: {
          afternoon_hour?: number
          daily_maximum?: number
          daily_target?: number
          fallback_active?: string | null
          id?: number
          last_run_at?: string | null
          max_attempts?: number
          max_concurrent_jobs?: number
          min_body_length?: number
          mode?: Database["public"]["Enums"]["system_mode_enum"]
          morning_hour?: number
          next_run_at?: string | null
          night_hour?: number
          per_category_max?: number
          primary_provider?: string
          provider_cooldown_minutes?: number
          provider_failure_threshold?: number
          timezone?: string
          updated_at?: string
        }
        Update: {
          afternoon_hour?: number
          daily_maximum?: number
          daily_target?: number
          fallback_active?: string | null
          id?: number
          last_run_at?: string | null
          max_attempts?: number
          max_concurrent_jobs?: number
          min_body_length?: number
          mode?: Database["public"]["Enums"]["system_mode_enum"]
          morning_hour?: number
          next_run_at?: string | null
          night_hour?: number
          per_category_max?: number
          primary_provider?: string
          provider_cooldown_minutes?: number
          provider_failure_threshold?: number
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _blogdel_store_cron_token: {
        Args: { _token: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "editor" | "viewer"
      article_status_enum:
        | "draft"
        | "review"
        | "scheduled"
        | "published"
        | "failed"
        | "archived"
      article_type_enum:
        | "news"
        | "analysis"
        | "explainer"
        | "list"
        | "profile"
        | "history"
        | "guide"
      job_status_enum:
        | "queued"
        | "running"
        | "completed"
        | "failed"
        | "retrying"
        | "cancelled"
      job_type_enum:
        | "normalise"
        | "draft"
        | "review"
        | "revise"
        | "schema_repair"
        | "publish"
      provider_event_type:
        | "request_started"
        | "request_completed"
        | "rate_limited"
        | "timeout"
        | "schema_failed"
        | "provider_unavailable"
        | "fallback_activated"
        | "provider_recovered"
      source_item_status:
        | "pending"
        | "queued"
        | "processed"
        | "rejected"
        | "duplicate"
        | "failed"
      source_type_enum: "api" | "dataset" | "website" | "evergreen"
      system_mode_enum:
        | "running"
        | "publishing_paused"
        | "generation_paused"
        | "fully_paused"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor", "viewer"],
      article_status_enum: [
        "draft",
        "review",
        "scheduled",
        "published",
        "failed",
        "archived",
      ],
      article_type_enum: [
        "news",
        "analysis",
        "explainer",
        "list",
        "profile",
        "history",
        "guide",
      ],
      job_status_enum: [
        "queued",
        "running",
        "completed",
        "failed",
        "retrying",
        "cancelled",
      ],
      job_type_enum: [
        "normalise",
        "draft",
        "review",
        "revise",
        "schema_repair",
        "publish",
      ],
      provider_event_type: [
        "request_started",
        "request_completed",
        "rate_limited",
        "timeout",
        "schema_failed",
        "provider_unavailable",
        "fallback_activated",
        "provider_recovered",
      ],
      source_item_status: [
        "pending",
        "queued",
        "processed",
        "rejected",
        "duplicate",
        "failed",
      ],
      source_type_enum: ["api", "dataset", "website", "evergreen"],
      system_mode_enum: [
        "running",
        "publishing_paused",
        "generation_paused",
        "fully_paused",
      ],
    },
  },
} as const

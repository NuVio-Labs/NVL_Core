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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      booking_field_definitions: {
        Row: {
          company_id: string
          created_at: string
          field_type: Database["public"]["Enums"]["resource_field_type"]
          id: string
          is_required: boolean
          label: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          field_type?: Database["public"]["Enums"]["resource_field_type"]
          id?: string
          is_required?: boolean
          label: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          field_type?: Database["public"]["Enums"]["resource_field_type"]
          id?: string
          is_required?: boolean
          label?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_field_definitions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          duration_field: string | null
          ends_at: string
          first_name: string
          id: string
          last_name: string
          metadata: Json
          notes: string | null
          phone: string
          price_list_id: string | null
          price_list_item_id: string | null
          price_snapshot: number | null
          resource_id: string
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          duration_field?: string | null
          ends_at: string
          first_name: string
          id?: string
          last_name: string
          metadata?: Json
          notes?: string | null
          phone: string
          price_list_id?: string | null
          price_list_item_id?: string | null
          price_snapshot?: number | null
          resource_id: string
          starts_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          duration_field?: string | null
          ends_at?: string
          first_name?: string
          id?: string
          last_name?: string
          metadata?: Json
          notes?: string | null
          phone?: string
          price_list_id?: string | null
          price_list_item_id?: string | null
          price_snapshot?: number | null
          resource_id?: string
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_price_list_item_id_fkey"
            columns: ["price_list_item_id"]
            isOneToOne: false
            referencedRelation: "price_list_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          settings: Json
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          settings?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          settings?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          advance_deposit: number | null
          advance_rent: number | null
          archived_at: string | null
          booking_id: string | null
          city: string | null
          company_id: string
          contract_number: number
          created_at: string
          created_by: string | null
          credit_card_last4: string | null
          customer_id: string | null
          damage: boolean | null
          damage_notes: string | null
          date_of_birth: string | null
          employer: string | null
          extended_until: string | null
          extras: Json
          first_name: string
          handover_at: string | null
          handover_location: string | null
          id: string
          id_issued_at: string | null
          id_number: string | null
          is_locked: boolean
          km_end: number | null
          km_free: number | null
          km_start: number | null
          last_name: string
          license_class: string | null
          license_issued_at: string | null
          license_issued_in: string | null
          license_number: string | null
          loading_gate: boolean | null
          notes: string | null
          ocr_consent_log: Json | null
          payment_method: string | null
          payment_status: string
          pdf_url: string | null
          phone: string | null
          place_of_birth: string | null
          price_base: number | null
          price_override: number | null
          price_override_at: string | null
          price_override_by: string | null
          price_override_reason: string | null
          price_per_day: number | null
          price_per_km: number | null
          profession: string | null
          resource_id: string | null
          retention_category: string | null
          retention_delete_after: string | null
          return_actual_at: string | null
          return_agreed_at: string | null
          return_location: string | null
          returned_by: string | null
          second_renter: Json | null
          status: string
          street: string | null
          tachograph: boolean | null
          tank_full: boolean | null
          tank_return_full: boolean | null
          tax_rate: number | null
          updated_at: string
        }
        Insert: {
          advance_deposit?: number | null
          advance_rent?: number | null
          archived_at?: string | null
          booking_id?: string | null
          city?: string | null
          company_id: string
          contract_number: number
          created_at?: string
          created_by?: string | null
          credit_card_last4?: string | null
          customer_id?: string | null
          damage?: boolean | null
          damage_notes?: string | null
          date_of_birth?: string | null
          employer?: string | null
          extended_until?: string | null
          extras?: Json
          first_name: string
          handover_at?: string | null
          handover_location?: string | null
          id?: string
          id_issued_at?: string | null
          id_number?: string | null
          is_locked?: boolean
          km_end?: number | null
          km_free?: number | null
          km_start?: number | null
          last_name: string
          license_class?: string | null
          license_issued_at?: string | null
          license_issued_in?: string | null
          license_number?: string | null
          loading_gate?: boolean | null
          notes?: string | null
          ocr_consent_log?: Json | null
          payment_method?: string | null
          payment_status?: string
          pdf_url?: string | null
          phone?: string | null
          place_of_birth?: string | null
          price_base?: number | null
          price_override?: number | null
          price_override_at?: string | null
          price_override_by?: string | null
          price_override_reason?: string | null
          price_per_day?: number | null
          price_per_km?: number | null
          profession?: string | null
          resource_id?: string | null
          retention_category?: string | null
          retention_delete_after?: string | null
          return_actual_at?: string | null
          return_agreed_at?: string | null
          return_location?: string | null
          returned_by?: string | null
          second_renter?: Json | null
          status?: string
          street?: string | null
          tachograph?: boolean | null
          tank_full?: boolean | null
          tank_return_full?: boolean | null
          tax_rate?: number | null
          updated_at?: string
        }
        Update: {
          advance_deposit?: number | null
          advance_rent?: number | null
          archived_at?: string | null
          booking_id?: string | null
          city?: string | null
          company_id?: string
          contract_number?: number
          created_at?: string
          created_by?: string | null
          credit_card_last4?: string | null
          customer_id?: string | null
          damage?: boolean | null
          damage_notes?: string | null
          date_of_birth?: string | null
          employer?: string | null
          extended_until?: string | null
          extras?: Json
          first_name?: string
          handover_at?: string | null
          handover_location?: string | null
          id?: string
          id_issued_at?: string | null
          id_number?: string | null
          is_locked?: boolean
          km_end?: number | null
          km_free?: number | null
          km_start?: number | null
          last_name?: string
          license_class?: string | null
          license_issued_at?: string | null
          license_issued_in?: string | null
          license_number?: string | null
          loading_gate?: boolean | null
          notes?: string | null
          ocr_consent_log?: Json | null
          payment_method?: string | null
          payment_status?: string
          pdf_url?: string | null
          phone?: string | null
          place_of_birth?: string | null
          price_base?: number | null
          price_override?: number | null
          price_override_at?: string | null
          price_override_by?: string | null
          price_override_reason?: string | null
          price_per_day?: number | null
          price_per_km?: number | null
          profession?: string | null
          resource_id?: string | null
          retention_category?: string | null
          retention_delete_after?: string | null
          return_actual_at?: string | null
          return_agreed_at?: string | null
          return_location?: string | null
          returned_by?: string | null
          second_renter?: Json | null
          status?: string
          street?: string | null
          tachograph?: boolean | null
          tank_full?: boolean | null
          tank_return_full?: boolean | null
          tax_rate?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_price_override_by_fkey"
            columns: ["price_override_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          city: string | null
          company_id: string
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          street: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          company_id: string
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          street?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          company_id?: string
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          street?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      duration_tariff_mappings: {
        Row: {
          company_id: string
          created_at: string
          duration_minutes: number
          field_name: string
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          company_id: string
          created_at?: string
          duration_minutes: number
          field_name: string
          id?: string
          label: string
          sort_order?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          duration_minutes?: number
          field_name?: string
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "duration_tariff_mappings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          company_id: string
          created_at: string
          id: string
          location: string | null
          metadata: Json
          profile_id: string
          role: Database["public"]["Enums"]["membership_role"]
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          location?: string | null
          metadata?: Json
          profile_id: string
          role?: Database["public"]["Enums"]["membership_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          location?: string | null
          metadata?: Json
          profile_id?: string
          role?: Database["public"]["Enums"]["membership_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      price_list_item_field_definitions: {
        Row: {
          company_id: string
          created_at: string
          field_type: Database["public"]["Enums"]["resource_field_type"]
          id: string
          is_required: boolean
          label: string
          name: string
          price_list_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          field_type?: Database["public"]["Enums"]["resource_field_type"]
          id?: string
          is_required?: boolean
          label: string
          name: string
          price_list_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          field_type?: Database["public"]["Enums"]["resource_field_type"]
          id?: string
          is_required?: boolean
          label?: string
          name?: string
          price_list_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_list_item_field_definitions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_list_item_field_definitions_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      price_list_items: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          name: string
          price_list_id: string
          price_per_unit: number
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          price_list_id: string
          price_per_unit?: number
          unit: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          price_list_id?: string
          price_per_unit?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_list_items_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      price_lists: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_lists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          platform_role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          platform_role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          platform_role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      resource_field_definitions: {
        Row: {
          company_id: string
          created_at: string
          field_type: Database["public"]["Enums"]["resource_field_type"]
          id: string
          is_required: boolean
          label: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          field_type?: Database["public"]["Enums"]["resource_field_type"]
          id?: string
          is_required?: boolean
          label: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          field_type?: Database["public"]["Enums"]["resource_field_type"]
          id?: string
          is_required?: boolean
          label?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_field_definitions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_field_definitions: {
        Row: {
          company_id: string
          created_at: string
          field_type: Database["public"]["Enums"]["resource_field_type"]
          id: string
          is_required: boolean
          label: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          field_type?: Database["public"]["Enums"]["resource_field_type"]
          id?: string
          is_required?: boolean
          label: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          field_type?: Database["public"]["Enums"]["resource_field_type"]
          id?: string
          is_required?: boolean
          label?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_field_definitions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: { Args: { p_company_id: string }; Returns: string }
      is_platform_owner: { Args: never; Returns: boolean }
      next_contract_number: { Args: { p_company_id: string }; Returns: number }
    }
    Enums: {
      membership_role:
        | "owner"
        | "admin"
        | "member"
        | "viewer"
        | "editor"
        | "user"
      membership_status: "active" | "invited" | "suspended"
      resource_field_type: "text" | "number" | "boolean" | "date"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      membership_role: ["owner", "admin", "member", "viewer", "editor", "user"],
      membership_status: ["active", "invited", "suspended"],
      resource_field_type: ["text", "number", "boolean", "date"],
    },
  },
} as const

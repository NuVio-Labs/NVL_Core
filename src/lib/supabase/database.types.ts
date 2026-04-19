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
      contracts: {
        Row: {
          id: string
          company_id: string
          booking_id: string | null
          resource_id: string | null
          contract_number: number
          first_name: string
          last_name: string
          phone: string | null
          street: string | null
          city: string | null
          profession: string | null
          employer: string | null
          id_number: string | null
          id_issued_at: string | null
          date_of_birth: string | null
          place_of_birth: string | null
          license_class: string | null
          license_number: string | null
          license_issued_in: string | null
          license_issued_at: string | null
          second_renter: Json | null
          handover_at: string | null
          handover_location: string | null
          return_agreed_at: string | null
          return_actual_at: string | null
          return_location: string | null
          extended_until: string | null
          km_start: number | null
          km_end: number | null
          km_free: number | null
          price_per_km: number | null
          price_per_day: number | null
          price_base: number | null
          tax_rate: number | null
          extras: Json
          loading_gate: boolean | null
          tachograph: boolean | null
          tank_full: boolean | null
          damage: boolean | null
          damage_notes: string | null
          tank_return_full: boolean | null
          returned_by: string | null
          advance_rent: number | null
          advance_deposit: number | null
          payment_status: string
          payment_method: string | null
          credit_card_last4: string | null
          notes: string | null
          ocr_consent_log: Json | null
          pdf_url: string | null
          price_override: number | null
          price_override_reason: string | null
          price_override_by: string | null
          price_override_at: string | null
          is_locked: boolean
          archived_at: string | null
          retention_category: string | null
          retention_delete_after: string | null
          status: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          booking_id?: string | null
          resource_id?: string | null
          contract_number: number
          first_name: string
          last_name: string
          phone?: string | null
          street?: string | null
          city?: string | null
          profession?: string | null
          employer?: string | null
          id_number?: string | null
          id_issued_at?: string | null
          date_of_birth?: string | null
          place_of_birth?: string | null
          license_class?: string | null
          license_number?: string | null
          license_issued_in?: string | null
          license_issued_at?: string | null
          second_renter?: Json | null
          handover_at?: string | null
          handover_location?: string | null
          return_agreed_at?: string | null
          return_actual_at?: string | null
          return_location?: string | null
          extended_until?: string | null
          km_start?: number | null
          km_end?: number | null
          km_free?: number | null
          price_per_km?: number | null
          price_per_day?: number | null
          price_base?: number | null
          tax_rate?: number | null
          extras?: Json
          loading_gate?: boolean | null
          tachograph?: boolean | null
          tank_full?: boolean | null
          damage?: boolean | null
          damage_notes?: string | null
          tank_return_full?: boolean | null
          returned_by?: string | null
          advance_rent?: number | null
          advance_deposit?: number | null
          payment_status?: string
          payment_method?: string | null
          credit_card_last4?: string | null
          notes?: string | null
          ocr_consent_log?: Json | null
          pdf_url?: string | null
          price_override?: number | null
          price_override_reason?: string | null
          price_override_by?: string | null
          price_override_at?: string | null
          is_locked?: boolean
          archived_at?: string | null
          retention_category?: string | null
          retention_delete_after?: string | null
          status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          booking_id?: string | null
          resource_id?: string | null
          contract_number?: number
          first_name?: string
          last_name?: string
          phone?: string | null
          street?: string | null
          city?: string | null
          profession?: string | null
          employer?: string | null
          id_number?: string | null
          id_issued_at?: string | null
          date_of_birth?: string | null
          place_of_birth?: string | null
          license_class?: string | null
          license_number?: string | null
          license_issued_in?: string | null
          license_issued_at?: string | null
          second_renter?: Json | null
          handover_at?: string | null
          handover_location?: string | null
          return_agreed_at?: string | null
          return_actual_at?: string | null
          return_location?: string | null
          extended_until?: string | null
          km_start?: number | null
          km_end?: number | null
          km_free?: number | null
          price_per_km?: number | null
          price_per_day?: number | null
          price_base?: number | null
          tax_rate?: number | null
          extras?: Json
          loading_gate?: boolean | null
          tachograph?: boolean | null
          tank_full?: boolean | null
          damage?: boolean | null
          damage_notes?: string | null
          tank_return_full?: boolean | null
          returned_by?: string | null
          advance_rent?: number | null
          advance_deposit?: number | null
          payment_status?: string
          payment_method?: string | null
          credit_card_last4?: string | null
          notes?: string | null
          ocr_consent_log?: Json | null
          pdf_url?: string | null
          price_override?: number | null
          price_override_reason?: string | null
          price_override_by?: string | null
          price_override_at?: string | null
          is_locked?: boolean
          archived_at?: string | null
          retention_category?: string | null
          retention_delete_after?: string | null
          status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
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
            foreignKeyName: "bookings_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
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
          price_list_id: string | null
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
          price_list_id?: string | null
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
          price_list_id?: string | null
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
          platform_role: 'owner' | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          platform_role?: 'owner' | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          platform_role?: 'owner' | null
          updated_at?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: { Args: { p_company_id: string }; Returns: string }
    }
    Enums: {
      membership_role: "admin" | "editor" | "user"
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
  public: {
    Enums: {
      membership_role: ["admin", "editor", "user"],
      membership_status: ["active", "invited", "suspended"],
      resource_field_type: ["text", "number", "boolean", "date"],
    },
  },
} as const

// Generado desde el esquema real del proyecto Supabase (otjoywhmbddrspvyghcr)
// via el MCP de Supabase. Regenerar con generate_typescript_types tras cada
// migracion nueva en supabase/migrations/.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      areas: {
        Row: { created_at: string; deleted_at: string | null; id: string; name: string; organization_id: string }
        Insert: { created_at?: string; deleted_at?: string | null; id?: string; name: string; organization_id: string }
        Update: { created_at?: string; deleted_at?: string | null; id?: string; name?: string; organization_id?: string }
        Relationships: []
      }
      asset_assignments: {
        Row: {
          asset_id: string; assigned_at: string; assigned_by: string | null; created_at: string; id: string
          notes: string | null; organization_id: string; returned_at: string | null; worker_id: string
        }
        Insert: {
          asset_id: string; assigned_at?: string; assigned_by?: string | null; created_at?: string; id?: string
          notes?: string | null; organization_id: string; returned_at?: string | null; worker_id: string
        }
        Update: {
          asset_id?: string; assigned_at?: string; assigned_by?: string | null; created_at?: string; id?: string
          notes?: string | null; organization_id?: string; returned_at?: string | null; worker_id?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          acquisitionDate: string | null; area: string | null; area_id: string | null; brand: string | null
          category: string; category_id: string | null; code: string; condition: string | null; cost: number | null
          createdAt: string; deleted_at: string | null; id: string; invoice_number: string | null; location: string | null
          location_id: string | null; model: string | null; name: string; notes: string | null; organization_id: string
          provider: string | null; responsible: string | null; serial: string | null; status: string
          subcategory_id: string | null; tag: string | null; updatedAt: string; user_id: string
          warrantyUntil: string | null; worker_id: string | null
        }
        Insert: {
          acquisitionDate?: string | null; area?: string | null; area_id?: string | null; brand?: string | null
          category: string; category_id?: string | null; code: string; condition?: string | null; cost?: number | null
          createdAt?: string; deleted_at?: string | null; id?: string; invoice_number?: string | null; location?: string | null
          location_id?: string | null; model?: string | null; name: string; notes?: string | null; organization_id: string
          provider?: string | null; responsible?: string | null; serial?: string | null; status?: string
          subcategory_id?: string | null; tag?: string | null; updatedAt?: string; user_id?: string
          warrantyUntil?: string | null; worker_id?: string | null
        }
        Update: {
          acquisitionDate?: string | null; area?: string | null; area_id?: string | null; brand?: string | null
          category?: string; category_id?: string | null; code?: string; condition?: string | null; cost?: number | null
          createdAt?: string; deleted_at?: string | null; id?: string; invoice_number?: string | null; location?: string | null
          location_id?: string | null; model?: string | null; name?: string; notes?: string | null; organization_id?: string
          provider?: string | null; responsible?: string | null; serial?: string | null; status?: string
          subcategory_id?: string | null; tag?: string | null; updatedAt?: string; user_id?: string
          warrantyUntil?: string | null; worker_id?: string | null
        }
        Relationships: []
      }
      attachments: {
        Row: {
          created_at: string; entity_id: string; entity_type: string; file_name: string; file_path: string; id: string
          mime_type: string | null; organization_id: string; size_bytes: number | null; uploaded_by: string | null
        }
        Insert: {
          created_at?: string; entity_id: string; entity_type: string; file_name: string; file_path: string; id?: string
          mime_type?: string | null; organization_id: string; size_bytes?: number | null; uploaded_by?: string | null
        }
        Update: {
          created_at?: string; entity_id?: string; entity_type?: string; file_name?: string; file_path?: string; id?: string
          mime_type?: string | null; organization_id?: string; size_bytes?: number | null; uploaded_by?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string; actor_user_id: string | null; created_at: string; id: string; new_data: Json | null
          old_data: Json | null; organization_id: string; record_id: string; table_name: string
        }
        Insert: {
          action: string; actor_user_id?: string | null; created_at?: string; id?: string; new_data?: Json | null
          old_data?: Json | null; organization_id: string; record_id: string; table_name: string
        }
        Update: {
          action?: string; actor_user_id?: string | null; created_at?: string; id?: string; new_data?: Json | null
          old_data?: Json | null; organization_id?: string; record_id?: string; table_name?: string
        }
        Relationships: []
      }
      birthday_notification_recipients: {
        Row: { active: boolean; created_at: string; id: string; label: string | null; organization_id: string; phone_e164: string }
        Insert: { active?: boolean; created_at?: string; id?: string; label?: string | null; organization_id: string; phone_e164: string }
        Update: { active?: boolean; created_at?: string; id?: string; label?: string | null; organization_id?: string; phone_e164?: string }
        Relationships: []
      }
      catalogs: {
        Row: { id: string; items: Json; organization_id: string; updatedAt: string; user_id: string }
        Insert: { id: string; items?: Json; organization_id: string; updatedAt?: string; user_id?: string }
        Update: { id?: string; items?: Json; organization_id?: string; updatedAt?: string; user_id?: string }
        Relationships: []
      }
      categories: {
        Row: { created_at: string; deleted_at: string | null; id: string; name: string; organization_id: string; parent_id: string | null }
        Insert: { created_at?: string; deleted_at?: string | null; id?: string; name: string; organization_id: string; parent_id?: string | null }
        Update: { created_at?: string; deleted_at?: string | null; id?: string; name?: string; organization_id?: string; parent_id?: string | null }
        Relationships: []
      }
      inventory_items: {
        Row: {
          category: string | null; created_at: string; deleted_at: string | null; id: string; min_stock: number
          name: string; organization_id: string; provider: string | null; unit: string; updated_at: string
        }
        Insert: {
          category?: string | null; created_at?: string; deleted_at?: string | null; id?: string; min_stock?: number
          name: string; organization_id: string; provider?: string | null; unit?: string; updated_at?: string
        }
        Update: {
          category?: string | null; created_at?: string; deleted_at?: string | null; id?: string; min_stock?: number
          name?: string; organization_id?: string; provider?: string | null; unit?: string; updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: { created_at: string; deleted_at: string | null; id: string; name: string; organization_id: string; site_id: string | null }
        Insert: { created_at?: string; deleted_at?: string | null; id?: string; name: string; organization_id: string; site_id?: string | null }
        Update: { created_at?: string; deleted_at?: string | null; id?: string; name?: string; organization_id?: string; site_id?: string | null }
        Relationships: []
      }
      maintenance: {
        Row: {
          assetId: string; assetName: string | null; cost: number | null; createdAt: string; date: string
          diagnosis: string | null; id: string; next_due_date: string | null; notes: string | null; organization_id: string
          parts_used: string | null; provider: string | null; status: string; technician: string | null; type: string
          updatedAt: string; user_id: string
        }
        Insert: {
          assetId: string; assetName?: string | null; cost?: number | null; createdAt?: string; date: string
          diagnosis?: string | null; id?: string; next_due_date?: string | null; notes?: string | null; organization_id: string
          parts_used?: string | null; provider?: string | null; status?: string; technician?: string | null; type: string
          updatedAt?: string; user_id?: string
        }
        Update: {
          assetId?: string; assetName?: string | null; cost?: number | null; createdAt?: string; date?: string
          diagnosis?: string | null; id?: string; next_due_date?: string | null; notes?: string | null; organization_id?: string
          parts_used?: string | null; provider?: string | null; status?: string; technician?: string | null; type?: string
          updatedAt?: string; user_id?: string
        }
        Relationships: []
      }
      movements: {
        Row: {
          assetCode: string | null; assetId: string; assetName: string | null; createdAt: string; createdBy: string | null
          date: string; from: string | null; id: string; notes: string | null; organization_id: string; to: string | null
          type: string; updatedAt: string; user_id: string
        }
        Insert: {
          assetCode?: string | null; assetId: string; assetName?: string | null; createdAt?: string; createdBy?: string | null
          date: string; from?: string | null; id?: string; notes?: string | null; organization_id: string; to?: string | null
          type: string; updatedAt?: string; user_id?: string
        }
        Update: {
          assetCode?: string | null; assetId?: string; assetName?: string | null; createdAt?: string; createdBy?: string | null
          date?: string; from?: string | null; id?: string; notes?: string | null; organization_id?: string; to?: string | null
          type?: string; updatedAt?: string; user_id?: string
        }
        Relationships: []
      }
      notification_deliveries: {
        Row: {
          created_at: string; error_reason: string | null; id: string; idempotency_key: string; job_id: string
          meta_message_id: string | null; meta_response: Json | null; organization_id: string; recipient_id: string
          retry_count: number; status: string; template_id: string | null; updated_at: string; worker_id: string
        }
        Insert: {
          created_at?: string; error_reason?: string | null; id?: string; idempotency_key: string; job_id: string
          meta_message_id?: string | null; meta_response?: Json | null; organization_id: string; recipient_id: string
          retry_count?: number; status?: string; template_id?: string | null; updated_at?: string; worker_id: string
        }
        Update: {
          created_at?: string; error_reason?: string | null; id?: string; idempotency_key?: string; job_id?: string
          meta_message_id?: string | null; meta_response?: Json | null; organization_id?: string; recipient_id?: string
          retry_count?: number; status?: string; template_id?: string | null; updated_at?: string; worker_id?: string
        }
        Relationships: []
      }
      notification_jobs: {
        Row: { completed_at: string | null; created_at: string; id: string; organization_id: string; run_date: string; run_type: string; status: string }
        Insert: { completed_at?: string | null; created_at?: string; id?: string; organization_id: string; run_date: string; run_type: string; status?: string }
        Update: { completed_at?: string | null; created_at?: string; id?: string; organization_id?: string; run_date?: string; run_type?: string; status?: string }
        Relationships: []
      }
      notification_templates: {
        Row: {
          approval_status: string; created_at: string; id: string; language: string; meta_template_name: string
          name: string; organization_id: string; variables: Json
        }
        Insert: {
          approval_status?: string; created_at?: string; id?: string; language?: string; meta_template_name: string
          name: string; organization_id: string; variables?: Json
        }
        Update: {
          approval_status?: string; created_at?: string; id?: string; language?: string; meta_template_name?: string
          name?: string; organization_id?: string; variables?: Json
        }
        Relationships: []
      }
      organization_members: {
        Row: { created_at: string; id: string; organization_id: string; role: string; user_id: string }
        Insert: { created_at?: string; id?: string; organization_id: string; role: string; user_id: string }
        Update: { created_at?: string; id?: string; organization_id?: string; role?: string; user_id?: string }
        Relationships: []
      }
      organization_notification_settings: {
        Row: { feb29_policy: string; organization_id: string; send_hour_local: number; timezone: string }
        Insert: { feb29_policy?: string; organization_id: string; send_hour_local?: number; timezone?: string }
        Update: { feb29_policy?: string; organization_id?: string; send_hour_local?: number; timezone?: string }
        Relationships: []
      }
      organizations: {
        Row: { created_at: string; id: string; name: string }
        Insert: { created_at?: string; id?: string; name: string }
        Update: { created_at?: string; id?: string; name?: string }
        Relationships: []
      }
      physical_count_items: {
        Row: {
          asset_id: string; counted_at: string | null; counted_by: string | null; expected: boolean; found: boolean
          id: string; notes: string | null; physical_count_id: string
        }
        Insert: {
          asset_id: string; counted_at?: string | null; counted_by?: string | null; expected?: boolean; found?: boolean
          id?: string; notes?: string | null; physical_count_id: string
        }
        Update: {
          asset_id?: string; counted_at?: string | null; counted_by?: string | null; expected?: boolean; found?: boolean
          id?: string; notes?: string | null; physical_count_id?: string
        }
        Relationships: []
      }
      physical_counts: {
        Row: {
          closed_at: string | null; closed_by: string | null; closing_notes: string | null; id: string; opened_at: string
          opened_by: string | null; organization_id: string; scope_location_id: string | null; status: string
        }
        Insert: {
          closed_at?: string | null; closed_by?: string | null; closing_notes?: string | null; id?: string; opened_at?: string
          opened_by?: string | null; organization_id: string; scope_location_id?: string | null; status?: string
        }
        Update: {
          closed_at?: string | null; closed_by?: string | null; closing_notes?: string | null; id?: string; opened_at?: string
          opened_by?: string | null; organization_id?: string; scope_location_id?: string | null; status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: { created_at: string; full_name: string | null; user_id: string }
        Insert: { created_at?: string; full_name?: string | null; user_id: string }
        Update: { created_at?: string; full_name?: string | null; user_id?: string }
        Relationships: []
      }
      sites: {
        Row: { address: string | null; created_at: string; deleted_at: string | null; id: string; name: string; organization_id: string }
        Insert: { address?: string | null; created_at?: string; deleted_at?: string | null; id?: string; name: string; organization_id: string }
        Update: { address?: string | null; created_at?: string; deleted_at?: string | null; id?: string; name?: string; organization_id?: string }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string; created_by: string | null; id: string; item_id: string; movement_date: string
          organization_id: string; quantity: number; reason: string | null; type: string
        }
        Insert: {
          created_at?: string; created_by?: string | null; id?: string; item_id: string; movement_date?: string
          organization_id: string; quantity: number; reason?: string | null; type: string
        }
        Update: {
          created_at?: string; created_by?: string | null; id?: string; item_id?: string; movement_date?: string
          organization_id?: string; quantity?: number; reason?: string | null; type?: string
        }
        Relationships: []
      }
      workers: {
        Row: {
          area_id: string | null; birth_date: string | null; birthday_consent: boolean; created_at: string
          deleted_at: string | null; document: string | null; email: string | null; full_name: string; hire_date: string | null
          id: string; location_id: string | null; organization_id: string; phone: string | null; position: string | null
          status: string; updated_at: string
        }
        Insert: {
          area_id?: string | null; birth_date?: string | null; birthday_consent?: boolean; created_at?: string
          deleted_at?: string | null; document?: string | null; email?: string | null; full_name: string; hire_date?: string | null
          id?: string; location_id?: string | null; organization_id: string; phone?: string | null; position?: string | null
          status?: string; updated_at?: string
        }
        Update: {
          area_id?: string | null; birth_date?: string | null; birthday_consent?: boolean; created_at?: string
          deleted_at?: string | null; document?: string | null; email?: string | null; full_name?: string; hire_date?: string | null
          id?: string; location_id?: string | null; organization_id?: string; phone?: string | null; position?: string | null
          status?: string; updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      worker_birthday_calendar: {
        Row: {
          area_id: string | null; birth_date_full: string | null; birth_day: number | null; birth_month: number | null
          full_name: string | null; location_id: string | null; organization_id: string | null; worker_id: string | null
        }
        Relationships: []
      }
    }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicSchema = Database["public"]
type PublicTablesAndViews = PublicSchema["Tables"] & PublicSchema["Views"]

export type Tables<T extends keyof PublicTablesAndViews> = PublicTablesAndViews[T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"]

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
      assets: {
        Row: {
          acquisitionDate: string | null
          area: string | null
          brand: string | null
          category: string
          code: string
          condition: string | null
          createdAt: string
          id: string
          location: string | null
          model: string | null
          name: string
          notes: string | null
          organization_id: string
          responsible: string | null
          serial: string | null
          status: string
          tag: string | null
          updatedAt: string
          user_id: string
          warrantyUntil: string | null
        }
        Insert: {
          acquisitionDate?: string | null
          area?: string | null
          brand?: string | null
          category: string
          code: string
          condition?: string | null
          createdAt?: string
          id?: string
          location?: string | null
          model?: string | null
          name: string
          notes?: string | null
          organization_id: string
          responsible?: string | null
          serial?: string | null
          status?: string
          tag?: string | null
          updatedAt?: string
          user_id?: string
          warrantyUntil?: string | null
        }
        Update: {
          acquisitionDate?: string | null
          area?: string | null
          brand?: string | null
          category?: string
          code?: string
          condition?: string | null
          createdAt?: string
          id?: string
          location?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          responsible?: string | null
          serial?: string | null
          status?: string
          tag?: string | null
          updatedAt?: string
          user_id?: string
          warrantyUntil?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          organization_id: string
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          organization_id: string
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      catalogs: {
        Row: {
          id: string
          items: Json
          organization_id: string
          updatedAt: string
          user_id: string
        }
        Insert: {
          id: string
          items?: Json
          organization_id: string
          updatedAt?: string
          user_id?: string
        }
        Update: {
          id?: string
          items?: Json
          organization_id?: string
          updatedAt?: string
          user_id?: string
        }
        Relationships: []
      }
      maintenance: {
        Row: {
          assetId: string
          assetName: string | null
          cost: number | null
          createdAt: string
          date: string
          id: string
          notes: string | null
          organization_id: string
          provider: string | null
          status: string
          type: string
          updatedAt: string
          user_id: string
        }
        Insert: {
          assetId: string
          assetName?: string | null
          cost?: number | null
          createdAt?: string
          date: string
          id?: string
          notes?: string | null
          organization_id: string
          provider?: string | null
          status?: string
          type: string
          updatedAt?: string
          user_id?: string
        }
        Update: {
          assetId?: string
          assetName?: string | null
          cost?: number | null
          createdAt?: string
          date?: string
          id?: string
          notes?: string | null
          organization_id?: string
          provider?: string | null
          status?: string
          type?: string
          updatedAt?: string
          user_id?: string
        }
        Relationships: []
      }
      movements: {
        Row: {
          assetCode: string | null
          assetId: string
          assetName: string | null
          createdAt: string
          createdBy: string | null
          date: string
          from: string | null
          id: string
          notes: string | null
          organization_id: string
          to: string | null
          type: string
          updatedAt: string
          user_id: string
        }
        Insert: {
          assetCode?: string | null
          assetId: string
          assetName?: string | null
          createdAt?: string
          createdBy?: string | null
          date: string
          from?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          to?: string | null
          type: string
          updatedAt?: string
          user_id?: string
        }
        Update: {
          assetCode?: string | null
          assetId?: string
          assetName?: string | null
          createdAt?: string
          createdBy?: string | null
          date?: string
          from?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          to?: string | null
          type?: string
          updatedAt?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"]

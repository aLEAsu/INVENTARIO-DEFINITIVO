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
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      areas: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_assignments: {
        Row: {
          asset_id: string
          assigned_at: string
          assigned_by: string | null
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          returned_at: string | null
          worker_id: string
        }
        Insert: {
          asset_id: string
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          returned_at?: string | null
          worker_id: string
        }
        Update: {
          asset_id?: string
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          returned_at?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_assignments_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_assignments_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_birthday_calendar"
            referencedColumns: ["worker_id"]
          },
          {
            foreignKeyName: "asset_assignments_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          acquisitionDate: string | null
          area: string | null
          area_id: string | null
          brand: string | null
          category: string
          category_id: string | null
          code: string
          condition: string | null
          cost: number | null
          createdAt: string
          deleted_at: string | null
          id: string
          invoice_number: string | null
          location: string | null
          location_id: string | null
          model: string | null
          name: string
          notes: string | null
          organization_id: string
          provider: string | null
          responsible: string | null
          serial: string | null
          status: string
          subcategory_id: string | null
          tag: string | null
          updatedAt: string
          user_id: string
          warrantyUntil: string | null
          worker_id: string | null
        }
        Insert: {
          acquisitionDate?: string | null
          area?: string | null
          area_id?: string | null
          brand?: string | null
          category: string
          category_id?: string | null
          code: string
          condition?: string | null
          cost?: number | null
          createdAt?: string
          deleted_at?: string | null
          id?: string
          invoice_number?: string | null
          location?: string | null
          location_id?: string | null
          model?: string | null
          name: string
          notes?: string | null
          organization_id: string
          provider?: string | null
          responsible?: string | null
          serial?: string | null
          status?: string
          subcategory_id?: string | null
          tag?: string | null
          updatedAt?: string
          user_id?: string
          warrantyUntil?: string | null
          worker_id?: string | null
        }
        Update: {
          acquisitionDate?: string | null
          area?: string | null
          area_id?: string | null
          brand?: string | null
          category?: string
          category_id?: string | null
          code?: string
          condition?: string | null
          cost?: number | null
          createdAt?: string
          deleted_at?: string | null
          id?: string
          invoice_number?: string | null
          location?: string | null
          location_id?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          provider?: string | null
          responsible?: string | null
          serial?: string | null
          status?: string
          subcategory_id?: string | null
          tag?: string | null
          updatedAt?: string
          user_id?: string
          warrantyUntil?: string | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_birthday_calendar"
            referencedColumns: ["worker_id"]
          },
          {
            foreignKeyName: "assets_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          organization_id: string
          size_bytes: number | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          organization_id: string
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          organization_id?: string
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      birthday_notification_recipients: {
        Row: {
          active: boolean
          callmebot_apikey: string | null
          created_at: string
          id: string
          label: string | null
          organization_id: string
          phone_e164: string
        }
        Insert: {
          active?: boolean
          callmebot_apikey?: string | null
          created_at?: string
          id?: string
          label?: string | null
          organization_id: string
          phone_e164: string
        }
        Update: {
          active?: boolean
          callmebot_apikey?: string | null
          created_at?: string
          id?: string
          label?: string | null
          organization_id?: string
          phone_e164?: string
        }
        Relationships: [
          {
            foreignKeyName: "birthday_notification_recipients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "catalogs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          organization_id: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          organization_id: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          organization_id?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_definitions: {
        Row: {
          created_at: string
          deleted_at: string | null
          entity_type: string
          field_type: string
          id: string
          key: string
          label: string
          options: Json | null
          organization_id: string
          required: boolean
          sort_order: number
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          entity_type: string
          field_type: string
          id?: string
          key: string
          label: string
          options?: Json | null
          organization_id: string
          required?: boolean
          sort_order?: number
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          entity_type?: string
          field_type?: string
          id?: string
          key?: string
          label?: string
          options?: Json | null
          organization_id?: string
          required?: boolean
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_definitions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_values: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          field_id: string
          id: string
          organization_id: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          field_id: string
          id?: string
          organization_id: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          field_id?: string
          id?: string
          organization_id?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "custom_field_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_values_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_actions: {
        Row: {
          created_at: string
          description: string
          due_date: string | null
          id: string
          incident_id: string
          organization_id: string
          responsible: string | null
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          incident_id: string
          organization_id: string
          responsible?: string | null
          status?: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          incident_id?: string
          organization_id?: string
          responsible?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_actions_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_folio_counters: {
        Row: {
          next_number: number
          organization_id: string
          year: number
        }
        Insert: {
          next_number?: number
          organization_id: string
          year: number
        }
        Update: {
          next_number?: number
          organization_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "incident_folio_counters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_subscribers: {
        Row: {
          created_at: string
          id: string
          incident_id: string
          last_seen_at: string
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          incident_id: string
          last_seen_at?: string
          organization_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          incident_id?: string
          last_seen_at?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_subscribers_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_subscribers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_updates: {
        Row: {
          author_id: string | null
          comment: string | null
          created_at: string
          id: string
          incident_id: string
          organization_id: string
          status_from: string | null
          status_to: string | null
          visibility: string
        }
        Insert: {
          author_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          incident_id: string
          organization_id: string
          status_from?: string | null
          status_to?: string | null
          visibility?: string
        }
        Update: {
          author_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          incident_id?: string
          organization_id?: string
          status_from?: string | null
          status_to?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_updates_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_updates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          affected_users_count: number | null
          asset_id: string | null
          category_id: string | null
          closed_at: string | null
          commitment_date: string | null
          created_at: string
          created_by: string | null
          description: string | null
          folio: string | null
          id: string
          impact: string | null
          organization_id: string
          parent_incident_id: string | null
          preventive_actions: string | null
          priority: string
          resolution: string | null
          resolved_at: string | null
          responsible_user_id: string | null
          root_cause: string | null
          service_id: string | null
          status: string
          title: string
          type: string
          updated_at: string
          urgency: string | null
          worker_id: string | null
        }
        Insert: {
          affected_users_count?: number | null
          asset_id?: string | null
          category_id?: string | null
          closed_at?: string | null
          commitment_date?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          folio?: string | null
          id?: string
          impact?: string | null
          organization_id: string
          parent_incident_id?: string | null
          preventive_actions?: string | null
          priority?: string
          resolution?: string | null
          resolved_at?: string | null
          responsible_user_id?: string | null
          root_cause?: string | null
          service_id?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
          urgency?: string | null
          worker_id?: string | null
        }
        Update: {
          affected_users_count?: number | null
          asset_id?: string | null
          category_id?: string | null
          closed_at?: string | null
          commitment_date?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          folio?: string | null
          id?: string
          impact?: string | null
          organization_id?: string
          parent_incident_id?: string | null
          preventive_actions?: string | null
          priority?: string
          resolution?: string | null
          resolved_at?: string | null
          responsible_user_id?: string | null
          root_cause?: string | null
          service_id?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          urgency?: string | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "incident_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_parent_incident_id_fkey"
            columns: ["parent_incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_birthday_calendar"
            referencedColumns: ["worker_id"]
          },
          {
            foreignKeyName: "incidents_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string | null
          created_at: string
          deleted_at: string | null
          id: string
          min_stock: number
          name: string
          organization_id: string
          provider: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          min_stock?: number
          name: string
          organization_id: string
          provider?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          min_stock?: number
          name?: string
          organization_id?: string
          provider?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_articles: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          organization_id: string
          related_incident_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          organization_id: string
          related_incident_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          organization_id?: string
          related_incident_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_articles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kb_articles_related_incident_id_fkey"
            columns: ["related_incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          organization_id: string
          site_id: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          organization_id: string
          site_id?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          organization_id?: string
          site_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance: {
        Row: {
          assetId: string
          assetName: string | null
          cost: number | null
          createdAt: string
          date: string
          diagnosis: string | null
          id: string
          next_due_date: string | null
          notes: string | null
          organization_id: string
          parts_used: string | null
          provider: string | null
          status: string
          technician: string | null
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
          diagnosis?: string | null
          id?: string
          next_due_date?: string | null
          notes?: string | null
          organization_id: string
          parts_used?: string | null
          provider?: string | null
          status?: string
          technician?: string | null
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
          diagnosis?: string | null
          id?: string
          next_due_date?: string | null
          notes?: string | null
          organization_id?: string
          parts_used?: string | null
          provider?: string | null
          status?: string
          technician?: string | null
          type?: string
          updatedAt?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_assetId_fkey"
            columns: ["assetId"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "movements_assetId_fkey"
            columns: ["assetId"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_deliveries: {
        Row: {
          created_at: string
          error_reason: string | null
          id: string
          idempotency_key: string
          job_id: string
          meta_message_id: string | null
          meta_response: Json | null
          organization_id: string
          recipient_id: string
          retry_count: number
          status: string
          template_id: string | null
          updated_at: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          error_reason?: string | null
          id?: string
          idempotency_key: string
          job_id: string
          meta_message_id?: string | null
          meta_response?: Json | null
          organization_id: string
          recipient_id: string
          retry_count?: number
          status?: string
          template_id?: string | null
          updated_at?: string
          worker_id: string
        }
        Update: {
          created_at?: string
          error_reason?: string | null
          id?: string
          idempotency_key?: string
          job_id?: string
          meta_message_id?: string | null
          meta_response?: Json | null
          organization_id?: string
          recipient_id?: string
          retry_count?: number
          status?: string
          template_id?: string | null
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "notification_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_deliveries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_deliveries_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "birthday_notification_recipients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_deliveries_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_deliveries_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_birthday_calendar"
            referencedColumns: ["worker_id"]
          },
          {
            foreignKeyName: "notification_deliveries_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          organization_id: string
          run_date: string
          run_type: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          organization_id: string
          run_date: string
          run_type: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          run_date?: string
          run_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          approval_status: string
          created_at: string
          id: string
          language: string
          meta_template_name: string
          name: string
          organization_id: string
          variables: Json
        }
        Insert: {
          approval_status?: string
          created_at?: string
          id?: string
          language?: string
          meta_template_name: string
          name: string
          organization_id: string
          variables?: Json
        }
        Update: {
          approval_status?: string
          created_at?: string
          id?: string
          language?: string
          meta_template_name?: string
          name?: string
          organization_id?: string
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_blueprint_applications: {
        Row: {
          applied_at: string
          applied_by: string | null
          blueprint_id: string | null
          blueprint_name_snapshot: string
          id: string
          organization_id: string
        }
        Insert: {
          applied_at?: string
          applied_by?: string | null
          blueprint_id?: string | null
          blueprint_name_snapshot: string
          id?: string
          organization_id: string
        }
        Update: {
          applied_at?: string
          applied_by?: string | null
          blueprint_id?: string | null
          blueprint_name_snapshot?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_blueprint_applications_blueprint_id_fkey"
            columns: ["blueprint_id"]
            isOneToOne: false
            referencedRelation: "trade_blueprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_blueprint_applications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_notification_settings: {
        Row: {
          feb29_policy: string
          organization_id: string
          send_hour_local: number
          timezone: string
        }
        Insert: {
          feb29_policy?: string
          organization_id: string
          send_hour_local?: number
          timezone?: string
        }
        Update: {
          feb29_policy?: string
          organization_id?: string
          send_hour_local?: number
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_notification_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      physical_count_items: {
        Row: {
          asset_id: string
          counted_at: string | null
          counted_by: string | null
          expected: boolean
          found: boolean
          id: string
          notes: string | null
          physical_count_id: string
        }
        Insert: {
          asset_id: string
          counted_at?: string | null
          counted_by?: string | null
          expected?: boolean
          found?: boolean
          id?: string
          notes?: string | null
          physical_count_id: string
        }
        Update: {
          asset_id?: string
          counted_at?: string | null
          counted_by?: string | null
          expected?: boolean
          found?: boolean
          id?: string
          notes?: string | null
          physical_count_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "physical_count_items_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_count_items_physical_count_id_fkey"
            columns: ["physical_count_id"]
            isOneToOne: false
            referencedRelation: "physical_counts"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_counts: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          closing_notes: string | null
          id: string
          opened_at: string
          opened_by: string | null
          organization_id: string
          scope_location_id: string | null
          status: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          closing_notes?: string | null
          id?: string
          opened_at?: string
          opened_by?: string | null
          organization_id: string
          scope_location_id?: string | null
          status?: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          closing_notes?: string | null
          id?: string
          opened_at?: string
          opened_by?: string | null
          organization_id?: string
          scope_location_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "physical_counts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_counts_scope_location_id_fkey"
            columns: ["scope_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
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
      services: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          address: string | null
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          item_id: string
          movement_date: string
          organization_id: string
          quantity: number
          reason: string | null
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          item_id: string
          movement_date?: string
          organization_id: string
          quantity: number
          reason?: string | null
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          item_id?: string
          movement_date?: string
          organization_id?: string
          quantity?: number
          reason?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_blueprints: {
        Row: {
          created_at: string
          definition: Json
          description: string | null
          id: string
          is_system: boolean
          name: string
          owner_user_id: string | null
          trade: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          definition: Json
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          owner_user_id?: string | null
          trade?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          definition?: Json
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          owner_user_id?: string | null
          trade?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      workers: {
        Row: {
          area_id: string | null
          birth_date: string | null
          birthday_consent: boolean
          created_at: string
          deleted_at: string | null
          document: string | null
          email: string | null
          full_name: string
          hire_date: string | null
          id: string
          location_id: string | null
          organization_id: string
          phone: string | null
          position: string | null
          status: string
          updated_at: string
        }
        Insert: {
          area_id?: string | null
          birth_date?: string | null
          birthday_consent?: boolean
          created_at?: string
          deleted_at?: string | null
          document?: string | null
          email?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          location_id?: string | null
          organization_id: string
          phone?: string | null
          position?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          area_id?: string | null
          birth_date?: string | null
          birthday_consent?: boolean
          created_at?: string
          deleted_at?: string | null
          document?: string | null
          email?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          location_id?: string | null
          organization_id?: string
          phone?: string | null
          position?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workers_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      worker_birthday_calendar: {
        Row: {
          area_id: string | null
          birth_date_full: string | null
          birth_day: number | null
          birth_month: number | null
          full_name: string | null
          location_id: string | null
          organization_id: string | null
          worker_id: string | null
        }
        Insert: {
          area_id?: string | null
          birth_date_full?: never
          birth_day?: never
          birth_month?: never
          full_name?: string | null
          location_id?: string | null
          organization_id?: string | null
          worker_id?: string | null
        }
        Update: {
          area_id?: string | null
          birth_date_full?: never
          birth_day?: never
          birth_month?: never
          full_name?: string | null
          location_id?: string | null
          organization_id?: string | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workers_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      apply_blueprint_to_organization: {
        Args: { p_blueprint_id: string; p_org_id: string }
        Returns: undefined
      }
      create_organization: { Args: { p_name: string }; Returns: string }
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

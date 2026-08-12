// ComHub 2.1 — Reference database types
//
// Mirrors `supabase/schema.sql`. Not wired into the current build (the
// front-end is plain JS/JSX and still runs entirely on the mocks in
// `src/data.js`) — this file is the contract to align against once the
// Supabase client is introduced, and the shape `supabase gen types
// typescript` would produce from the real schema.

// ============================================================
// ENUMS
// ============================================================
export type UserGender = 'M' | 'F'
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed'
export type MemberRole = 'admin' | 'leader' | 'member'
export type OrganizationType = 'church' | 'business' | 'ngo'

// ============================================================
// GROUP AUTO-ASSIGNMENT RULES (groups.rules_json)
// Evaluated by the `auto_assign_user_to_groups` PL/pgSQL trigger.
// ============================================================
export interface GroupAssignmentRules {
  gender?: UserGender
  marital_status?: MaritalStatus
  min_age?: number
  max_age?: number
}

// ============================================================
// DATABASE
// ============================================================
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string | null
          phone: string | null
          gender: UserGender | null
          birth_date: string | null // date (ISO 8601)
          marital_status: MaritalStatus | null
          profession: string | null
          skills: string[]
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email?: string | null
          phone?: string | null
          gender?: UserGender | null
          birth_date?: string | null
          marital_status?: MaritalStatus | null
          profession?: string | null
          skills?: string[]
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }

      organizations: {
        Row: {
          id: string
          name: string
          type: OrganizationType
          slug: string
          logo_url: string | null
          /** Dénomination/siège parent (hiérarchie annexes). Null = organisation racine. */
          parent_id: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: OrganizationType
          slug: string
          logo_url?: string | null
          parent_id?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>
      }

      organization_members: {
        Row: {
          id: string
          organization_id: string
          profile_id: string
          role: MemberRole
          joined_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          profile_id: string
          role?: MemberRole
          joined_at?: string
        }
        Update: Partial<Database['public']['Tables']['organization_members']['Insert']>
      }

      groups: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          rules_json: GroupAssignmentRules
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          rules_json?: GroupAssignmentRules
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['groups']['Insert']>
      }

      group_members: {
        Row: {
          id: string
          group_id: string
          profile_id: string
          added_by: 'system' | 'manual'
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          profile_id: string
          added_by?: 'system' | 'manual'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['group_members']['Insert']>
      }

      messages: {
        Row: {
          id: string
          organization_id: string
          group_id: string | null
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          group_id?: string | null
          sender_id: string
          content: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
    }
    Enums: {
      user_gender: UserGender
      marital_status: MaritalStatus
      member_role: MemberRole
      organization_type: OrganizationType
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Organization = Database['public']['Tables']['organizations']['Row']
export type OrganizationMember = Database['public']['Tables']['organization_members']['Row']
export type Group = Database['public']['Tables']['groups']['Row']
export type GroupMember = Database['public']['Tables']['group_members']['Row']
export type Message = Database['public']['Tables']['messages']['Row']


export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "friend_requests": {
                  Row: {
                    "created_at": string,"id": string,"recipient_id": string,"requester_id": string,"responded_at": string | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"recipient_id": string,"requester_id": string,"responded_at"?: string | null,"status"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"recipient_id"?: string,"requester_id"?: string,"responded_at"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "friend_requests_recipient_id_fkey"
      columns: ["recipient_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "friend_requests_requester_id_fkey"
      columns: ["requester_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"friendships": {
                  Row: {
                    "created_at": string,"friend_id": string,"share_presence": boolean,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"friend_id": string,"share_presence"?: boolean,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"friend_id"?: string,"share_presence"?: boolean,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "friendships_friend_id_fkey"
      columns: ["friend_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "friendships_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"group_invitations": {
                  Row: {
                    "created_at": string,"group_id": string,"id": string,"invitee_id": string,"inviter_id": string,"responded_at": string | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"group_id": string,"id"?: string,"invitee_id": string,"inviter_id": string,"responded_at"?: string | null,"status"?: string
                  }
                  Update: {
                    "created_at"?: string,"group_id"?: string,"id"?: string,"invitee_id"?: string,"inviter_id"?: string,"responded_at"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "group_invitations_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "groups"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "group_invitations_invitee_id_fkey"
      columns: ["invitee_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "group_invitations_inviter_id_fkey"
      columns: ["inviter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"group_members": {
                  Row: {
                    "group_id": string,"joined_at": string,"role": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "group_id": string,"joined_at"?: string,"role"?: string,"user_id": string
                  }
                  Update: {
                    "group_id"?: string,"joined_at"?: string,"role"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "group_members_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "groups"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "group_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"groups": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"presence_history": {
                  Row: {
                    "changed_at": string,"from_island": string | null,"id": string,"to_island": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "changed_at"?: string,"from_island"?: string | null,"id"?: string,"to_island": string,"user_id": string
                  }
                  Update: {
                    "changed_at"?: string,"from_island"?: string | null,"id"?: string,"to_island"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "presence_history_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_config": NonNullable<Json>,"created_at": string,"discoverable": boolean,"display_name": string,"id": string,"public_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_config": NonNullable<Json>,"created_at"?: string,"discoverable"?: boolean,"display_name": string,"id": string,"public_id": string,"updated_at"?: string
                  }
                  Update: {
                    "avatar_config"?: NonNullable<Json>,"created_at"?: string,"discoverable"?: boolean,"display_name"?: string,"id"?: string,"public_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"user_presence": {
                  Row: {
                    "island_type": string,"status_text": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "island_type": string,"status_text"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "island_type"?: string,"status_text"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_presence_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_friend_request":
{ Args: { "p_request_id": string }; Returns: undefined
                           },
"accept_group_invitation":
{ Args: { "p_invitation_id": string }; Returns: undefined
                           },
"can_view_presence_of":
{ Args: { "p_user_id": string }; Returns: boolean
                           },
"cancel_friend_request":
{ Args: { "p_request_id": string }; Returns: undefined
                           },
"cancel_group_invitation":
{ Args: { "p_invitation_id": string }; Returns: undefined
                           },
"close_friend_requests_between":
{ Args: { "p_user_a": string,"p_user_b": string }; Returns: undefined
                           },
"create_group":
{ Args: { "p_name": string }; Returns: string
                           },
"decline_group_invitation":
{ Args: { "p_invitation_id": string }; Returns: undefined
                           },
"find_profile_by_public_id":
{ Args: { "p_public_id": string }; Returns: {
              "avatar_config": Json,"display_name": string,"id": string,"public_id": string
            }[]
                           },
"has_pending_group_invitation_with":
{ Args: { "p_user_id": string }; Returns: boolean
                           },
"is_group_member":
{ Args: { "p_group_id": string }; Returns: boolean
                           },
"is_group_owner":
{ Args: { "p_group_id": string }; Returns: boolean
                           },
"leave_group":
{ Args: { "p_group_id": string }; Returns: undefined
                           },
"my_sent_friend_requests":
{ Args: Record<PropertyKey, never>; Returns: {
              "avatar_config": Json,"created_at": string,"display_name": string,"id": string,"public_id": string,"recipient_id": string
            }[]
                           },
"reject_friend_request":
{ Args: { "p_request_id": string }; Returns: undefined
                           },
"remove_friend":
{ Args: { "p_friend_id": string }; Returns: undefined
                           },
"send_friend_request":
{ Args: { "p_recipient_id": string }; Returns: string
                           },
"send_group_invitation":
{ Args: { "p_group_id": string,"p_invitee_id": string }; Returns: string
                           },
"shares_group_with":
{ Args: { "p_user_id": string }; Returns: boolean
                           },
"transfer_group_ownership":
{ Args: { "p_group_id": string,"p_new_owner_id": string }; Returns: undefined
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const

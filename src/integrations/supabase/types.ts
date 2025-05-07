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
      bookmarks: {
        Row: {
          created_at: string | null
          id: number
          item_id: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          item_id?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          item_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item_interactions"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "bookmarks_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: number
          item_id: number | null
          parent_id: number | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: never
          item_id?: number | null
          parent_id?: number | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: never
          item_id?: number | null
          parent_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item_interactions"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "comments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          item_id: number | null
          last_message_text: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id?: number | null
          last_message_text?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: number | null
          last_message_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item_interactions"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "conversations_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      interests: {
        Row: {
          created_at: string | null
          id: number
          item_id: number | null
          message: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          item_id?: number | null
          message?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          item_id?: number | null
          message?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interests_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item_interactions"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "interests_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      item_shares: {
        Row: {
          created_at: string | null
          id: number
          item_id: number | null
          share_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          item_id?: number | null
          share_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          item_id?: number | null
          share_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_shares_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item_interactions"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "item_shares_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          archived_at: string | null
          archived_reason: string | null
          category: string | null
          condition: string | null
          coordinates: unknown | null
          created_at: string | null
          description: string | null
          id: number
          images: string[] | null
          location: string | null
          measurements: Json | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          archived_at?: string | null
          archived_reason?: string | null
          category?: string | null
          condition?: string | null
          coordinates?: unknown | null
          created_at?: string | null
          description?: string | null
          id?: never
          images?: string[] | null
          location?: string | null
          measurements?: Json | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          archived_at?: string | null
          archived_reason?: string | null
          category?: string | null
          condition?: string | null
          coordinates?: unknown | null
          created_at?: string | null
          description?: string | null
          id?: never
          images?: string[] | null
          location?: string | null
          measurements?: Json | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_profile"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          id: string
          item_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item_interactions"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "likes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          content: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string | null
          first_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          location: string | null
          notification_preferences: Json | null
          onboarding_completed: boolean
          phone: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          first_name?: string | null
          gender?: string | null
          id: string
          last_name?: string | null
          location?: string | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean
          phone?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          location?: string | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean
          phone?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      swedish_urban_areas: {
        Row: {
          created_at: string
          id: number
          max_lat: number
          max_lng: number
          min_lat: number
          min_lng: number
          name: string
          population: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          max_lat: number
          max_lng: number
          min_lat: number
          min_lng: number
          name: string
          population?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          max_lat?: number
          max_lng?: number
          min_lat?: number
          min_lng?: number
          name?: string
          population?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      item_interactions: {
        Row: {
          comments_count: number | null
          interests_count: number | null
          item_id: number | null
          likes_count: number | null
          share_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_conversation: {
        Args: { item_id_param: number; receiver_id_param: string }
        Returns: string
      }
      create_notification: {
        Args: {
          p_user_id: string
          p_type: string
          p_title: string
          p_content: string
          p_reference_id?: string
          p_reference_type?: string
          p_action_url?: string
        }
        Returns: string
      }
      get_follower_count: {
        Args: { user_id: string }
        Returns: number
      }
      get_following_count: {
        Args: { user_id: string }
        Returns: number
      }
      get_item_interests_count: {
        Args: { item_id_param: number }
        Returns: number
      }
      get_item_likes_count: {
        Args: { item_id_param: number }
        Returns: number
      }
      get_unread_notifications_count: {
        Args: { user_id_param: string }
        Returns: number
      }
      get_user_conversation_ids: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      has_user_liked_item: {
        Args: { item_id_param: number }
        Returns: boolean
      }
      has_user_shown_interest: {
        Args: { item_id_param: number }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { conversation_id: string }
        Returns: boolean
      }
      is_following: {
        Args: { follower: string; following: string }
        Returns: boolean
      }
      mark_all_notifications_read: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      mark_notification_read: {
        Args: { notification_id: string }
        Returns: boolean
      }
      notify_interested_users_on_delete: {
        Args: { item_id_param: number }
        Returns: undefined
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

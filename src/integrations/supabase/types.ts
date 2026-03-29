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
      profiles: {
        Row: {
          id: string
          username: string | null
          first_name: string | null
          last_name: string | null
          gender: string | null
          phone: string | null
          address: string | null
          avatar_url: string | null
          date_of_birth: string | null
          location: string | null
          onboarding_completed: boolean
          notification_preferences: Json
          created_at: string
        }
        Insert: {
          id: string
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          gender?: string | null
          phone?: string | null
          address?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          location?: string | null
          onboarding_completed?: boolean
          notification_preferences?: Json
          created_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          gender?: string | null
          phone?: string | null
          address?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          location?: string | null
          onboarding_completed?: boolean
          notification_preferences?: Json
          created_at?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          id: number
          user_id: string
          title: string
          description: string | null
          category: string | null
          condition: string | null
          item_type: string
          pif_status: string
          images: string[] | null
          location: string | null
          coordinates: Json | null
          measurements: Json | null
          archived_at: string | null
          archived_reason: string | null
          created_at: string
        }
        Insert: {
          id?: never
          user_id: string
          title: string
          description?: string | null
          category?: string | null
          condition?: string | null
          item_type?: string
          pif_status?: string
          images?: string[] | null
          location?: string | null
          coordinates?: Json | null
          measurements?: Json | null
          archived_at?: string | null
          archived_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: never
          user_id?: string
          title?: string
          description?: string | null
          category?: string | null
          condition?: string | null
          item_type?: string
          pif_status?: string
          images?: string[] | null
          location?: string | null
          coordinates?: Json | null
          measurements?: Json | null
          archived_at?: string | null
          archived_reason?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          id: number
          item_id: number
          user_id: string
          parent_id: number | null
          content: string
          created_at: string
        }
        Insert: {
          id?: never
          item_id: number
          user_id: string
          parent_id?: number | null
          content: string
          created_at?: string
        }
        Update: {
          id?: never
          item_id?: number
          user_id?: string
          parent_id?: number | null
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          }
        ]
      }
      likes: {
        Row: {
          id: number
          item_id: number
          user_id: string
          created_at: string
        }
        Insert: {
          id?: never
          item_id: number
          user_id: string
          created_at?: string
        }
        Update: {
          id?: never
          item_id?: number
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      comment_likes: {
        Row: {
          id: number
          comment_id: number
          user_id: string
          created_at: string
        }
        Insert: {
          id?: never
          comment_id: number
          user_id: string
          created_at?: string
        }
        Update: {
          id?: never
          comment_id?: number
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      interests: {
        Row: {
          id: number
          item_id: number
          user_id: string
          status: string
          created_at: string
        }
        Insert: {
          id?: never
          item_id: number
          user_id: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: never
          item_id?: number
          user_id?: string
          status?: string
          created_at?: string
        }
        Relationships: [
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
          }
        ]
      }
      bookmarks: {
        Row: {
          id: number
          item_id: number
          user_id: string
          created_at: string
        }
        Insert: {
          id?: never
          item_id: number
          user_id: string
          created_at?: string
        }
        Update: {
          id?: never
          item_id?: number
          user_id?: string
          created_at?: string
        }
        Relationships: [
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
          }
        ]
      }
      follows: {
        Row: {
          id: number
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: never
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: never
          follower_id?: string
          following_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      conversations: {
        Row: {
          id: string
          item_id: number | null
          updated_at: string
          last_message_text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          item_id?: number | null
          updated_at?: string
          last_message_text?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: number | null
          updated_at?: string
          last_message_text?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          }
        ]
      }
      conversation_participants: {
        Row: {
          id: number
          conversation_id: string
          user_id: string
          created_at: string
          last_read_at: string | null
        }
        Insert: {
          id?: never
          conversation_id: string
          user_id: string
          created_at?: string
          last_read_at?: string | null
        }
        Update: {
          id?: never
          conversation_id?: string
          user_id?: string
          created_at?: string
          last_read_at?: string | null
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
          }
        ]
      }
      messages: {
        Row: {
          id: number
          conversation_id: string
          sender_id: string
          content: string
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: never
          conversation_id: string
          sender_id: string
          content: string
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: never
          conversation_id?: string
          sender_id?: string
          content?: string
          read_at?: string | null
          created_at?: string
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
          }
        ]
      }
      notifications: {
        Row: {
          id: number
          user_id: string
          type: string
          payload: Json | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: never
          user_id: string
          type: string
          payload?: Json | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: never
          user_id?: string
          type?: string
          payload?: Json | null
          read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      reports: {
        Row: {
          id: number
          reporter_id: string
          item_id: number | null
          reason: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: never
          reporter_id: string
          item_id?: number | null
          reason: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: never
          reporter_id?: string
          item_id?: number | null
          reason?: string
          description?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_own_account: {
        Args: Record<string, never>
        Returns: boolean
      }
      archive_item: {
        Args: { p_item_id: number; p_reason?: string }
        Returns: boolean
      }
      delete_item_with_related_records: {
        Args: { p_item_id: number; p_reason?: string }
        Returns: boolean
      }
      create_conversation: {
        Args: { p_item_id: number; p_recipient_id: string }
        Returns: string
      }
      create_notification: {
        Args: { p_user_id: string; p_type: string; p_payload?: Json }
        Returns: number
      }
      is_following: {
        Args: { p_following_id: string }
        Returns: boolean
      }
      get_follower_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_following_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_conversation_ids: {
        Args: Record<string, never>
        Returns: string[]
      }
      is_conversation_participant: {
        Args: { p_conversation_id: string }
        Returns: boolean
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

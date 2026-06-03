
import type { Post } from "./post";

export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  created_at: string;
  last_read_at?: string;
  profile?: Profile;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  item_id?: number;
  last_message_text?: string;
  participants: ConversationParticipant[];
  item?: Post;
  /** Unread message count for the current user. Computed client-side. */
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string;
  deleted_at?: string | null;
}

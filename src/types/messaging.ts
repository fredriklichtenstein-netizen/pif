
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
  /** Set when the conversation has been closed (e.g. fulfiller withdrawn,
   *  pif completed/archived). Authoritative "thread is closed" signal. */
  closed_at?: string | null;
  /** Pending reopen request awaiting the other party's response. */
  reopen_requested_by?: string | null;
  reopen_requested_at?: string | null;
  reopen_request_comment?: string | null;
  /** Once set, permanently overrides pif_status/closed_at-driven closure --
   *  the conversation stays open for messaging regardless of the item's
   *  (unchanged) completed/archived status. */
  reopened_at?: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string;
  deleted_at?: string | null;
  is_system_message?: boolean;
  target_user_id?: string | null;
}

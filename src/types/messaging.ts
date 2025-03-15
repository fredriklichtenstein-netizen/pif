
import type { Post } from "./post";

export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  first_name?: string;
  last_name?: string;
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
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string;
}

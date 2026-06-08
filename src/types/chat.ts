import type { UserRole } from "./types";

export interface SupportSender {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
}

export interface SupportChatOwner {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
}

export interface SupportMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_role: UserRole;
  body: string;
  attachment_url: string | null;
  attachment_file_id: string | null;
  attachment_name: string | null;
  attachment_content_type: string | null;
  attachment_size: number | null;
  is_read_by_owner: boolean;
  is_read_by_admin: boolean;
  sender: SupportSender;
  created_at: string;
  updated_at: string;
}

export interface SupportChat {
  id: string;
  owner_id: string;
  owner: SupportChatOwner;
  last_message: SupportMessage | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface SupportChatPage {
  items: SupportChat[];
  total: number;
  limit: number;
  offset: number;
}

export interface SupportMessagePage {
  items: SupportMessage[];
  total: number;
  limit: number;
  offset: number;
}

export interface SupportRealtimePayload {
  event: string;
  chat: SupportChat;
  message: SupportMessage | null;
  emitted_at: string;
}

export interface SupportAttachmentUpload {
  url: string;
  file_id: string;
  name: string;
  thumbnail_url: string | null;
  content_type: string;
  size: number;
}

export interface SupportMessagePayload {
  body?: string;
  attachment_url?: string | null;
  attachment_file_id?: string | null;
  attachment_name?: string | null;
  attachment_content_type?: string | null;
  attachment_size?: number | null;
}

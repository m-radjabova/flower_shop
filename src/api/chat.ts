import apiClient from "../apiClient/apiClient";
import type {
  SupportAttachmentUpload,
  SupportChat,
  SupportChatPage,
  SupportMessage,
  SupportMessagePage,
  SupportMessagePayload,
} from "../types/chat";

export interface GetSupportChatsParams {
  limit?: number;
  offset?: number;
  search?: string;
}

export async function getMySupportChat() {
  const { data } = await apiClient.get<SupportChat>("/support-chats/me");
  return data;
}

export async function getMySupportMessages(params: { limit?: number; offset?: number } = {}) {
  const { data } = await apiClient.get<SupportMessagePage>("/support-chats/me/messages", { params });
  return data;
}

export async function sendMySupportMessage(payload: SupportMessagePayload) {
  const { data } = await apiClient.post<SupportMessage>("/support-chats/me/messages", payload);
  return data;
}

export async function markMySupportChatRead() {
  const { data } = await apiClient.post<SupportChat>("/support-chats/me/read");
  return data;
}

export async function uploadMySupportAttachment(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<SupportAttachmentUpload>("/support-chats/me/attachments", formData);
  return data;
}

export async function getSupportChats(params: GetSupportChatsParams = {}) {
  const { data } = await apiClient.get<SupportChatPage>("/support-chats", { params });
  return data;
}

export async function getSupportChat(ownerId: string) {
  const { data } = await apiClient.get<SupportChat>(`/support-chats/${ownerId}`);
  return data;
}

export async function getSupportMessages(ownerId: string, params: { limit?: number; offset?: number } = {}) {
  const { data } = await apiClient.get<SupportMessagePage>(`/support-chats/${ownerId}/messages`, { params });
  return data;
}

export async function sendSupportMessage(ownerId: string, payload: SupportMessagePayload) {
  const { data } = await apiClient.post<SupportMessage>(`/support-chats/${ownerId}/messages`, payload);
  return data;
}

export async function markSupportChatRead(ownerId: string) {
  const { data } = await apiClient.post<SupportChat>(`/support-chats/${ownerId}/read`);
  return data;
}

export async function uploadSupportAttachment(ownerId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<SupportAttachmentUpload>(`/support-chats/${ownerId}/attachments`, formData);
  return data;
}

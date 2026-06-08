import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMySupportChat,
  getMySupportMessages,
  getSupportChat,
  getSupportChats,
  getSupportMessages,
  markMySupportChatRead,
  markSupportChatRead,
  sendMySupportMessage,
  sendSupportMessage,
  uploadMySupportAttachment,
  uploadSupportAttachment,
  type GetSupportChatsParams,
} from "../api/chat";
import type { SupportMessagePayload } from "../types/chat";

export const supportChatQueryKey = ["support-chats"];

export function useMySupportChat() {
  return useQuery({
    queryKey: [...supportChatQueryKey, "me"],
    queryFn: getMySupportChat,
    refetchInterval: 1000 * 30,
  });
}

export function useMySupportMessages() {
  return useQuery({
    queryKey: [...supportChatQueryKey, "me", "messages"],
    queryFn: () => getMySupportMessages({ limit: 200 }),
    refetchInterval: 1000 * 30,
  });
}

export function useSendMySupportMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SupportMessagePayload) => sendMySupportMessage(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportChatQueryKey });
    },
  });
}

export function useMarkMySupportChatRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markMySupportChatRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportChatQueryKey });
    },
  });
}

export function useSupportChats(params: GetSupportChatsParams = {}) {
  return useQuery({
    queryKey: [...supportChatQueryKey, "admin", params],
    queryFn: () => getSupportChats(params),
    placeholderData: (previousData) => previousData,
    refetchInterval: 1000 * 30,
  });
}

export function useSupportChat(ownerId: string | undefined) {
  return useQuery({
    queryKey: [...supportChatQueryKey, "admin", ownerId],
    queryFn: () => getSupportChat(ownerId ?? ""),
    enabled: Boolean(ownerId),
  });
}

export function useSupportMessages(ownerId: string | undefined) {
  return useQuery({
    queryKey: [...supportChatQueryKey, "admin", ownerId, "messages"],
    queryFn: () => getSupportMessages(ownerId ?? "", { limit: 200 }),
    enabled: Boolean(ownerId),
    refetchInterval: 1000 * 30,
  });
}

export function useSendSupportMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ownerId, payload }: { ownerId: string; payload: SupportMessagePayload }) =>
      sendSupportMessage(ownerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportChatQueryKey });
    },
  });
}

export function useUploadMySupportAttachment() {
  return useMutation({
    mutationFn: uploadMySupportAttachment,
  });
}

export function useUploadSupportAttachment() {
  return useMutation({
    mutationFn: ({ ownerId, file }: { ownerId: string; file: File }) => uploadSupportAttachment(ownerId, file),
  });
}

export function useMarkSupportChatRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markSupportChatRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportChatQueryKey });
    },
  });
}

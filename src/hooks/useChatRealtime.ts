import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getStoredAccessToken } from "../api/authStorage";
import type { SupportRealtimePayload } from "../types/chat";

type SupportRealtimeScope = "me" | "admin";

type UseChatRealtimeOptions = {
  scope: SupportRealtimeScope;
  enabled?: boolean;
  onEvent?: (payload: SupportRealtimePayload) => void;
};

function getWsBaseUrl() {
  const baseUrl =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_ORIGIN ||
    "http://127.0.0.1:8000";
  const url = new URL(baseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString().replace(/\/$/, "");
}

function buildSupportWebSocketUrl(scope: SupportRealtimeScope) {
  const url = new URL("/ws/support", getWsBaseUrl());
  const token = getStoredAccessToken();
  if (token) {
    url.searchParams.set("token", token);
  }
  url.searchParams.set("scope", scope);
  return url.toString();
}

function isSupportEvent(payload: unknown): payload is SupportRealtimePayload {
  return typeof payload === "object" && payload !== null && "event" in payload && "chat" in payload;
}

export function useChatRealtime({ scope, enabled = true, onEvent }: UseChatRealtimeOptions) {
  const queryClient = useQueryClient();
  const reconnectTimerRef = useRef<number | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const onEventRef = useRef<UseChatRealtimeOptions["onEvent"]>(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled) return;

    const token = getStoredAccessToken();
    if (!token) return;

    let stopped = false;
    let retryDelay = 1000;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const connect = () => {
      if (stopped) return;

      const socket = new WebSocket(buildSupportWebSocketUrl(scope));
      socketRef.current = socket;

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as unknown;
          if (!isSupportEvent(payload)) return;
          if (!payload.event.startsWith("support.")) return;
          queryClient.invalidateQueries({ queryKey: ["support-chats"] });
          onEventRef.current?.(payload);
        } catch {
          // Keep the socket alive when a malformed frame arrives.
        }
      };

      socket.onopen = () => {
        retryDelay = 1000;
      };

      socket.onclose = (event) => {
        socketRef.current = null;
        if ([1008, 4401, 4403].includes(event.code)) {
          stopped = true;
          clearReconnectTimer();
          return;
        }
        if (stopped) return;
        clearReconnectTimer();
        reconnectTimerRef.current = window.setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 10_000);
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connect();

    return () => {
      stopped = true;
      clearReconnectTimer();
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [enabled, queryClient, scope]);
}

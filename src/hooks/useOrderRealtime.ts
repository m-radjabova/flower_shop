import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getStoredAccessToken } from "../api/authStorage";
import type { OrderOut } from "../types/catalog";

type OrderRealtimeScope = "me" | "admin" | "shop";

type UseOrderRealtimeOptions = {
  scope: OrderRealtimeScope;
  shopId?: string | null;
  enabled?: boolean;
  onEvent?: (payload: { event: string; order: OrderOut }) => void;
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

function buildWebSocketUrl(scope: OrderRealtimeScope, shopId?: string | null) {
  const url = new URL("/ws/orders", getWsBaseUrl());
  const token = getStoredAccessToken();

  if (token) {
    url.searchParams.set("token", token);
  }

  url.searchParams.set("scope", scope);
  if (shopId) {
    url.searchParams.set("shop_id", shopId);
  }

  return url.toString();
}

function isOrderEvent(payload: unknown): payload is { event?: string; order?: OrderOut } {
  return typeof payload === "object" && payload !== null && "event" in payload;
}

export function useOrderRealtime({ scope, shopId, enabled = true, onEvent }: UseOrderRealtimeOptions) {
  const queryClient = useQueryClient();
  const reconnectTimerRef = useRef<number | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const onEventRef = useRef<UseOrderRealtimeOptions["onEvent"]>(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled) return;

    const token = getStoredAccessToken();
    if (!token) return;

    if (scope === "shop" && !shopId) return;

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

      const socket = new WebSocket(buildWebSocketUrl(scope, shopId));
      socketRef.current = socket;

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as unknown;
          if (!isOrderEvent(payload)) return;
          if (!payload.event?.startsWith("order.")) return;
          queryClient.invalidateQueries({ queryKey: ["orders"] });
          if (payload.event && payload.order) {
            onEventRef.current?.({
              event: payload.event,
              order: payload.order,
            });
          }
        } catch {
          // Ignore malformed messages and keep the socket alive.
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
  }, [enabled, queryClient, scope, shopId]);
}

import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { fetch } from "expo/fetch";
import { getAuthToken, getApiUrl, queryClient } from "@/lib/query-client";
import { API } from "@/lib/api-endpoints";
import type { UserEventType, UserEventPayload } from "@shared/schema";

export type SSEEvent = {
  [T in UserEventType]: { event: T; seq?: number } & UserEventPayload[T];
}[UserEventType];

type SSEListener = (data: SSEEvent) => void;

const listeners = new Set<SSEListener>();

export function addSSEListener(listener: SSEListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSSEListener(
  callback: SSEListener,
  deps: React.DependencyList = []
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const wrapper: SSEListener = (data) => callbackRef.current(data);
    return addSSEListener(wrapper);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_DELAY = 30000;
const KEEPALIVE_TIMEOUT = 45000;

let lastSeq = 0;
let sseConnectCount = 0;
let sseReconnectCount = 0;
let sseParseErrorCount = 0;

function notifyListeners(data: SSEEvent) {
  for (const listener of listeners) {
    try {
      listener(data);
    } catch (e) {
      console.warn("[SSE] listener error:", e);
    }
  }
}

function handleEvent(data: SSEEvent) {
  if (data.seq && data.seq > lastSeq) {
    lastSeq = data.seq;
  }

  switch (data.event) {
    case "heartbeat":
      return;

    case "listing_status":
      queryClient.invalidateQueries({ queryKey: [API.listings.my], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: [API.listings.list], refetchType: "all" });
      if (data.listingId) {
        queryClient.invalidateQueries({ queryKey: [API.listings.list, String(data.listingId), "detail"], refetchType: "all" });
        queryClient.invalidateQueries({ queryKey: [API.listings.priceHistory(data.listingId)], refetchType: "all" });
      }
      queryClient.invalidateQueries({ queryKey: [API.catalog.sections] });
      queryClient.invalidateQueries({ queryKey: [API.recommendations] });
      queryClient.invalidateQueries({ queryKey: [API.auth.listingLimits] });
      break;

    case "new_notification":
      queryClient.invalidateQueries({ queryKey: [API.notifications.list] });
      if (typeof data.unreadCount === "number") {
        queryClient.setQueryData([API.notifications.unreadCount], { count: data.unreadCount });
      } else {
        queryClient.invalidateQueries({ queryKey: [API.notifications.unreadCount] });
      }
      break;

    case "new_message":
      queryClient.invalidateQueries({ queryKey: [API.conversations.list] });
      if (typeof data.unreadCount === "number") {
        queryClient.setQueryData([API.unreadCount], { count: data.unreadCount });
      } else {
        queryClient.invalidateQueries({ queryKey: [API.unreadCount] });
      }
      if (data.conversationId) {
        queryClient.invalidateQueries({ queryKey: [API.conversations.messages(data.conversationId)] });
      }
      if (data.message?.text?.startsWith("[VIN_SHARE:") && data.listingId) {
        queryClient.invalidateQueries({ queryKey: [API.listings.list, String(data.listingId), "detail"] });
      }
      break;

    case "wallet_update":
      if (typeof data.newBalance === "number") {
        queryClient.setQueryData([API.wallet.balance], (old: any) => {
          if (old) return { ...old, balance: data.newBalance };
          return { balance: data.newBalance };
        });
      } else {
        queryClient.invalidateQueries({ queryKey: [API.wallet.balance] });
      }
      queryClient.invalidateQueries({ queryKey: [API.transactions] });
      break;

    case "promotion_update":
      queryClient.invalidateQueries({ queryKey: [API.listings.my] });
      queryClient.invalidateQueries({ queryKey: [API.listings.list] });
      if (data.listingId) {
        queryClient.invalidateQueries({ queryKey: [API.listings.list, String(data.listingId), "detail"] });
      }
      queryClient.invalidateQueries({ queryKey: [API.wallet.balance] });
      queryClient.invalidateQueries({ queryKey: [API.promotions.list] });
      queryClient.invalidateQueries({ queryKey: [API.catalog.sections] });
      break;

    case "dealer_status":
      queryClient.invalidateQueries({ queryKey: [API.dealer.info] });
      queryClient.invalidateQueries({ queryKey: [API.dealerRequests.my] });
      break;

    case "account_update":
      queryClient.invalidateQueries({ queryKey: [API.dealerRequests.my] });
      if (data.action === "dealer_activated" || data.action === "dealer_approved") {
        queryClient.invalidateQueries({ queryKey: [API.listings.list] });
        queryClient.invalidateQueries({ queryKey: [API.dealer.info] });
        queryClient.invalidateQueries({ queryKey: [API.dealer.myFeatures] });
        queryClient.invalidateQueries({ queryKey: [API.catalog.sections] });
        queryClient.invalidateQueries({ queryKey: [API.auth.listingLimits] });
        queryClient.invalidateQueries({ queryKey: [API.listings.my] });
      }
      if (data.action === "dealer_rejected") {
        queryClient.invalidateQueries({ queryKey: [API.dealer.info] });
      }
      if (data.action === "user_blocked" || data.action === "user_unblocked" || data.action === "blocked_by_user") {
        queryClient.invalidateQueries({ queryKey: [API.conversations.list] });
        queryClient.invalidateQueries({ queryKey: [API.blockedUsers] });
      }
      if (data.action === "subscription_renewed" || data.action === "plan_changed") {
        queryClient.invalidateQueries({ queryKey: [API.dealer.info] });
        queryClient.invalidateQueries({ queryKey: [API.dealer.myFeatures] });
      }
      if (data.action === "review_deleted") {
        queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.startsWith?.("/api/users/") });
      }
      if (data.action === "unbanned") {
        queryClient.invalidateQueries({ queryKey: [API.listings.my] });
        queryClient.invalidateQueries({ queryKey: [API.auth.listingLimits] });
      }
      if (data.action === "banned") {
        queryClient.clear();
      }
      break;

    case "favorites_update":
      queryClient.invalidateQueries({ queryKey: [API.favorites.list] });
      queryClient.invalidateQueries({ queryKey: [API.listings.byIds] });
      break;

    case "support_message":
      queryClient.invalidateQueries({ queryKey: [API.support.chat] });
      queryClient.invalidateQueries({ queryKey: [API.support.unreadCount] });
      queryClient.invalidateQueries({ queryKey: [API.unreadCount] });
      queryClient.invalidateQueries({ queryKey: [API.support.tickets] });
      break;

    case "support_status":
      queryClient.invalidateQueries({ queryKey: [API.support.chat] });
      queryClient.invalidateQueries({ queryKey: [API.support.unreadCount] });
      queryClient.invalidateQueries({ queryKey: [API.support.tickets] });
      break;

    case "support_read":
      queryClient.invalidateQueries({ queryKey: [API.support.chat] });
      queryClient.invalidateQueries({ queryKey: [API.support.tickets] });
      break;

    case "catalog_update":
      queryClient.invalidateQueries({ queryKey: [API.listings.list], refetchType: "all" });
      if (data.listingId) {
        queryClient.invalidateQueries({ queryKey: [API.listings.list, String(data.listingId), "detail"], refetchType: "all" });
      }
      queryClient.invalidateQueries({ queryKey: [API.catalog.sections] });
      queryClient.invalidateQueries({ queryKey: [API.recommendations] });
      break;

    case "new_review":
      if (data.sellerId) {
        queryClient.invalidateQueries({ queryKey: [API.users.getById(data.sellerId)] });
        queryClient.invalidateQueries({ queryKey: [API.users.reviews(data.sellerId)] });
      }
      queryClient.invalidateQueries({ queryKey: [API.notifications.list] });
      queryClient.invalidateQueries({ queryKey: [API.notifications.unreadCount] });
      break;

    case "model_review":
      if (data.brand && data.model) {
        queryClient.invalidateQueries({ queryKey: [API.modelRating] });
        queryClient.invalidateQueries({ queryKey: [API.modelRatingsBulk] });
        queryClient.invalidateQueries({ queryKey: [API.modelReviews] });
      }
      break;

    case "conversation_read":
      if (data.conversationId) {
        queryClient.invalidateQueries({ queryKey: [API.conversations.messages(data.conversationId)] });
        queryClient.invalidateQueries({ queryKey: [API.conversations.list] });
      }
      break;

    case "dealer_profile_update":
      if (data.dealerId) {
        queryClient.invalidateQueries({ queryKey: [API.listings.list], refetchType: "all" });
        queryClient.invalidateQueries({ queryKey: [API.users.getById(data.dealerId)] });
      }
      break;

    case "typing_indicator":
    case "typing_stop":
      break;

    case "connected":
      break;
  }

  notifyListeners(data);
}

const SSE_DEBOUNCE_MS = 1000;
let globalSSEAbort: AbortController | null = null;
let globalSSEUserId: string | null = null;
let globalSSEMountCount = 0;

export function useUserSSE(userId: string | null | undefined) {
  const abortRef = useRef<AbortController | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(RECONNECT_DELAY);
  const mountedRef = useRef(true);
  const lastDataRef = useRef<number>(Date.now());
  const keepaliveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectRef = useRef<() => void>(() => {});
  const connectingRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearKeepaliveTimer = useCallback(() => {
    if (keepaliveTimerRef.current) {
      clearInterval(keepaliveTimerRef.current);
      keepaliveTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!userId || !mountedRef.current) return;
    if (connectingRef.current) return;

    if (Platform.OS === "web") {
      return;
    }

    connectingRef.current = true;

    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    clearKeepaliveTimer();

    try {
      const token = await getAuthToken();
      if (!token || !mountedRef.current) {
        connectingRef.current = false;
        return;
      }

      const baseUrl = getApiUrl();
      let url = `${baseUrl}api/user/events?token=${encodeURIComponent(token)}`;
      if (lastSeq > 0) {
        url += `&lastSeq=${lastSeq}`;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      globalSSEAbort = controller;

      const response = await fetch(url, {
        headers: { Accept: "text/event-stream" },
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`SSE connect failed: ${response.status}`);
      }

      sseConnectCount++;
      connectingRef.current = false;
      lastDataRef.current = Date.now();
      if (__DEV__) console.log(`[SSE] Connected #${sseConnectCount} (lastSeq=${lastSeq})`);

      keepaliveTimerRef.current = setInterval(() => {
        if (Date.now() - lastDataRef.current > KEEPALIVE_TIMEOUT) {
          console.warn(`[SSE] Keepalive timeout (${KEEPALIVE_TIMEOUT}ms without data), reconnecting`);
          clearKeepaliveTimer();
          if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
          }
          if (mountedRef.current) {
            connectRef.current();
          }
        }
      }, 10000);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (mountedRef.current) {
        const { done, value } = await reader.read();
        if (done) break;

        lastDataRef.current = Date.now();
        reconnectDelayRef.current = RECONNECT_DELAY;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const parsed: SSEEvent = JSON.parse(line.slice(6));
              handleEvent(parsed);
            } catch (parseErr) {
              sseParseErrorCount++;
              console.error(`[SSE] Parse error #${sseParseErrorCount}:`, line.slice(6, 100));
            }
          }
        }
      }
    } catch (err: any) {
      connectingRef.current = false;
      if (err?.name === "AbortError") return;
      console.warn(`[SSE] Connection error:`, err?.message || err);
    }

    connectingRef.current = false;
    clearKeepaliveTimer();

    if (mountedRef.current && userId) {
      sseReconnectCount++;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (__DEV__) console.log(`[SSE] Scheduling reconnect #${sseReconnectCount} in ${reconnectDelayRef.current}ms (lastSeq=${lastSeq})`);
      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) connectRef.current();
      }, reconnectDelayRef.current);
      reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 1.5, MAX_RECONNECT_DELAY);
    }
  }, [userId, clearKeepaliveTimer]);

  connectRef.current = connect;

  const disconnect = useCallback(() => {
    clearKeepaliveTimer();
    connectingRef.current = false;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, [clearKeepaliveTimer]);

  useEffect(() => {
    mountedRef.current = true;
    globalSSEMountCount++;

    if (!userId) {
      disconnect();
      return;
    }

    if (globalSSEUserId === userId && globalSSEAbort && !globalSSEAbort.signal.aborted) {
      abortRef.current = globalSSEAbort;
      return () => {
        globalSSEMountCount--;
        mountedRef.current = false;
      };
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        globalSSEUserId = userId;
        connect();
      }
    }, SSE_DEBOUNCE_MS);

    const handleAppState = (state: AppStateStatus) => {
      if (state === "active") {
        reconnectDelayRef.current = RECONNECT_DELAY;
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, SSE_DEBOUNCE_MS);
      } else if (state === "background") {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        disconnect();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppState);

    return () => {
      globalSSEMountCount--;
      mountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (globalSSEMountCount <= 0) {
        disconnect();
        globalSSEUserId = null;
        globalSSEAbort = null;
        globalSSEMountCount = 0;
      }
      subscription.remove();
    };
  }, [userId, connect, disconnect]);
}

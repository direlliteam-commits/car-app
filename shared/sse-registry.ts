/**
 * SSE Event Registry — Production Reference
 *
 * Complete registry of all Server-Sent Events in the ArmAuto platform.
 * This file serves as the single source of truth for:
 *   - Event types and their purpose
 *   - Who initiates each event (backend route)
 *   - Who subscribes (client-side handlers)
 *   - Update strategy (setQueryData vs invalidateQueries)
 *   - Payload structure
 *
 * Architecture:
 *   Server:  UserEventBus (server/lib/user-events.ts)
 *            - emitUserEvent(userId, event, payload)  → targeted to one user
 *            - broadcastEvent(event, payload)          → to all connected clients
 *   Client:  useUserSSE (hooks/useUserSSE.ts)
 *            - connects via GET /api/user/events?token=...&lastSeq=...
 *            - uses expo/fetch with getReader() for streaming
 *            - reconnects with exponential backoff (3s → 30s max)
 *            - replays missed events via lastSeq param
 *
 * Delivery guarantees:
 *   - Global sequence counter (seq) for ordering
 *   - 200-event replay buffer with 5-min TTL
 *   - 15s heartbeat for connection keep-alive
 *   - 45s keepalive timeout on client triggers reconnect
 *   - Dead client auto-cleanup on write failure
 */

import type { UserEventType, UserEventPayload } from "./schema";

// ─── Update Strategy ──────────────────────────────────────────────

export type UpdateStrategy = "setQueryData" | "invalidateQueries" | "mixed" | "none";

// ─── Event Scope ──────────────────────────────────────────────────

export type EventScope = "user" | "broadcast";

// ─── Event Registry Entry ─────────────────────────────────────────

export interface SSERegistryEntry<T extends UserEventType = UserEventType> {
  event: T;
  scope: EventScope;
  description: string;
  initiators: string[];
  updateStrategy: UpdateStrategy;
  affectedQueryKeys: string[];
  payloadSchema: string;
}

// ─── Full Event Registry ──────────────────────────────────────────

export const SSE_EVENT_REGISTRY: Record<UserEventType, SSERegistryEntry> = {

  // ── Listing Events ──────────────────────────────────────────────

  listing_status: {
    event: "listing_status",
    scope: "user",
    description: "Listing moderation status changed (created, approved, rejected, deleted, updated)",
    initiators: [
      "POST /api/listings (create → moderation)",
      "PUT /api/listings/:id (update → re-moderation)",
      "DELETE /api/listings/:id (delete)",
      "PUT /api/admin/listings/:id/moderate (admin approve/reject)",
    ],
    updateStrategy: "invalidateQueries",
    affectedQueryKeys: [
      "/api/my/listings",
      "/api/listings",
      "/api/listings/:id",
      "/api/catalog/sections",
      "/api/recommendations",
    ],
    payloadSchema: "{ listingId: number; status: string; moderationNote?: string }",
  },

  catalog_update: {
    event: "catalog_update",
    scope: "broadcast",
    description: "Catalog data changed — new/updated/deleted listing affects public catalog",
    initiators: [
      "POST /api/listings (new listing moderated)",
      "PUT /api/listings/:id (listing updated)",
      "DELETE /api/listings/:id (listing removed)",
      "PUT /api/admin/listings/:id/moderate (admin action)",
    ],
    updateStrategy: "invalidateQueries",
    affectedQueryKeys: [
      "/api/listings",
      "/api/listings/:id",
      "/api/listings/catalog",
      "/api/catalog/sections",
      "/api/recommendations",
    ],
    payloadSchema: "{ listingId?: number }",
  },

  // ── Notification Events ─────────────────────────────────────────

  new_notification: {
    event: "new_notification",
    scope: "user",
    description: "New notification created or notification read status changed",
    initiators: [
      "PUT /api/admin/listings/:id/moderate (listing approved/rejected)",
      "PUT /api/admin/users/:id/wallet (wallet top-up)",
      "PUT /api/notifications/:id/read (mark read)",
      "PUT /api/notifications/read-all (mark all read)",
    ],
    updateStrategy: "mixed",
    affectedQueryKeys: [
      "/api/notifications",
      "/api/notifications/unread-count",
    ],
    payloadSchema: "{ notificationType?: string; unreadCount?: number }",
  },

  // ── Message Events ──────────────────────────────────────────────

  new_message: {
    event: "new_message",
    scope: "user",
    description: "New chat message received in a conversation",
    initiators: [
      "POST /api/conversations/:id/messages (send message)",
      "POST /api/conversations/:id/messages (send with images)",
    ],
    updateStrategy: "mixed",
    affectedQueryKeys: [
      "/api/conversations",
      "/api/unread-count",
      "/api/conversations/:id/messages",
    ],
    payloadSchema: "{ conversationId: number; message?: { id: number; text: string; senderId: string; senderName?: string; createdAt: string; images?: string[] }; unreadCount?: number }",
  },

  conversation_read: {
    event: "conversation_read",
    scope: "user",
    description: "Conversation marked as read by the other participant",
    initiators: [
      "PUT /api/conversations/:id/read (mark conversation read)",
    ],
    updateStrategy: "invalidateQueries",
    affectedQueryKeys: [
      "/api/conversations/:id/messages",
      "/api/conversations",
    ],
    payloadSchema: "{ conversationId: number }",
  },

  // ── Wallet Events ───────────────────────────────────────────────

  wallet_update: {
    event: "wallet_update",
    scope: "user",
    description: "User wallet balance changed (top-up, purchase, promotion, dealer subscription)",
    initiators: [
      "PUT /api/admin/users/:id/wallet (admin top-up)",
      "POST /api/promotions/:id/activate (promotion purchase)",
      "POST /api/dealer/activate (dealer activation)",
      "POST /api/dealer/renew (subscription renewal)",
      "POST /api/dealer/change-plan (plan change)",
    ],
    updateStrategy: "setQueryData",
    affectedQueryKeys: [
      "/api/wallet",
      "/api/auth/me",
      "/api/transactions",
    ],
    payloadSchema: "{ newBalance: number }",
  },

  // ── Promotion Events ────────────────────────────────────────────

  promotion_update: {
    event: "promotion_update",
    scope: "user",
    description: "Listing promotion activated, expired, or cancelled",
    initiators: [
      "POST /api/promotions/:id/activate (user purchase)",
      "PUT /api/admin/promotions/:id/cancel (admin cancel)",
    ],
    updateStrategy: "invalidateQueries",
    affectedQueryKeys: [
      "/api/my/listings",
      "/api/listings",
      "/api/listings/:id",
      "/api/wallet",
      "/api/promotions",
    ],
    payloadSchema: "{ listingId: number }",
  },

  // ── Dealer Events ───────────────────────────────────────────────

  dealer_status: {
    event: "dealer_status",
    scope: "user",
    description: "Dealer request approved or rejected by admin",
    initiators: [
      "PUT /api/admin/dealer-requests/:id (admin approve/reject)",
    ],
    updateStrategy: "invalidateQueries",
    affectedQueryKeys: [
      "/api/dealer",
      "/api/dealer-requests/my",
    ],
    payloadSchema: "{ status: string; requestId: number }",
  },

  // ── Account Events ──────────────────────────────────────────────

  account_update: {
    event: "account_update",
    scope: "user",
    description: "User account changed (profile, avatar, dealer status, block, ban, role)",
    initiators: [
      "PUT /api/auth/profile (profile update)",
      "POST /api/auth/avatar (avatar upload)",
      "POST /api/auth/dealer-images (dealer image upload)",
      "POST /api/users/:id/block (user block)",
      "POST /api/users/:id/unblock (user unblock)",
      "PUT /api/admin/users/:id/ban (admin ban/unban)",
      "PUT /api/admin/users/:id/role (admin role change)",
      "POST /api/dealer/activate (dealer activation)",
      "POST /api/dealer/renew (subscription renewal)",
      "POST /api/dealer/change-plan (plan change)",
      "PUT /api/admin/dealer-requests/:id (dealer approve/reject)",
      "DELETE /api/admin/reviews/:id (review deleted by admin)",
    ],
    updateStrategy: "invalidateQueries",
    affectedQueryKeys: [
      "/api/auth/me",
      "/api/dealer-requests/my",
      "/api/dealer",
      "/api/dealer/my-features",
      "/api/listings",
      "/api/catalog/sections",
      "/api/auth/listing-limits",
      "/api/my/listings",
      "/api/conversations",
      "/api/blocked-users",
    ],
    payloadSchema: "{ action: string }",
  },

  // ── Favorites Events ────────────────────────────────────────────

  favorites_update: {
    event: "favorites_update",
    scope: "user",
    description: "User favorites list changed (add/remove favorite)",
    initiators: [
      "POST /api/listings/:id/favorite (toggle favorite)",
    ],
    updateStrategy: "invalidateQueries",
    affectedQueryKeys: [
      "/api/favorites",
      "/api/listings/by-ids",
    ],
    payloadSchema: "Record<string, never>",
  },

  // ── Review Events ───────────────────────────────────────────────

  new_review: {
    event: "new_review",
    scope: "user",
    description: "New review posted for a seller or existing review deleted by admin",
    initiators: [
      "POST /api/reviews (create review)",
      "DELETE /api/admin/reviews/:id (admin delete)",
    ],
    updateStrategy: "invalidateQueries",
    affectedQueryKeys: [
      "/api/auth/me",
      "/api/users/:id",
      "/api/users/:id/reviews",
      "/api/notifications",
      "/api/notifications/unread-count",
    ],
    payloadSchema: "{ sellerId: string; reviewerId: string; rating: number; comment?: string }",
  },

  model_review: {
    event: "model_review",
    scope: "broadcast",
    description: "Model review created or updated — aggregated rating changed",
    initiators: [
      "POST /api/model-reviews (create review)",
    ],
    updateStrategy: "invalidateQueries",
    affectedQueryKeys: [
      "/api/model-rating",
      "/api/model-ratings/bulk",
      "/api/model-reviews",
    ],
    payloadSchema: "{ brand: string; model: string; generation?: string; avgRating: number; reviewsCount: number }",
  },

  // ── Support Events ──────────────────────────────────────────────

  support_message: {
    event: "support_message",
    scope: "user",
    description: "New support ticket message (user or admin)",
    initiators: [
      "POST /api/support/tickets (create ticket)",
      "POST /api/support/tickets/:id/messages (user message)",
      "POST /api/admin/support/tickets/:id/messages (admin message)",
    ],
    updateStrategy: "invalidateQueries",
    affectedQueryKeys: [
      "/api/support/chat",
      "/api/support/unread-count",
      "/api/unread-count",
      "/api/support/tickets",
    ],
    payloadSchema: "{ ticketId: number; message?: { id: number; text: string; senderId: string; isAdmin: boolean; createdAt: string } }",
  },

  support_status: {
    event: "support_status",
    scope: "user",
    description: "Support ticket status changed (resolved, reopened)",
    initiators: [
      "PUT /api/admin/support/tickets/:id/status (admin action)",
    ],
    updateStrategy: "invalidateQueries",
    affectedQueryKeys: [
      "/api/support/chat",
      "/api/support/unread-count",
      "/api/support/tickets",
    ],
    payloadSchema: "{ ticketId: number; status: string }",
  },

  support_read: {
    event: "support_read",
    scope: "user",
    description: "Support ticket messages marked as read",
    initiators: [
      "POST /api/support/tickets/:id/messages (auto-read on send)",
      "PUT /api/support/tickets/:id/read (explicit read)",
      "PUT /api/admin/support/tickets/:id/read (admin read)",
    ],
    updateStrategy: "invalidateQueries",
    affectedQueryKeys: [
      "/api/support/chat",
      "/api/support/tickets",
    ],
    payloadSchema: "{ ticketId: number }",
  },

  // ── Dealer Profile Events ───────────────────────────────────────

  dealer_profile_update: {
    event: "dealer_profile_update",
    scope: "broadcast",
    description: "Dealer profile changed (branches, services, working hours) — viewers with cached listings/profile must refetch",
    initiators: [
      "PUT /api/auth/profile (dealer profile update)",
    ],
    updateStrategy: "invalidateQueries",
    affectedQueryKeys: [
      "/api/listings",
      "/api/users/:dealerId",
    ],
    payloadSchema: "{ dealerId: string }",
  },

  // ── System Events ───────────────────────────────────────────────

  heartbeat: {
    event: "heartbeat",
    scope: "broadcast",
    description: "Keep-alive signal every 15 seconds, no cache updates",
    initiators: ["UserEventBus.startHeartbeat() (automatic)"],
    updateStrategy: "none",
    affectedQueryKeys: [],
    payloadSchema: "Record<string, never>",
  },

  connected: {
    event: "connected",
    scope: "user",
    description: "Initial connection established, returns current sequence number",
    initiators: ["GET /api/user/events (on connect)"],
    updateStrategy: "none",
    affectedQueryKeys: [],
    payloadSchema: "Record<string, never>",
  },

  // ── Typing Events ──────────────────────────────────────────────

  typing_indicator: {
    event: "typing_indicator",
    scope: "user",
    description: "User started typing in a conversation — handled by SSE listeners, no query invalidation",
    initiators: [
      "POST /api/conversations/:id/typing (send typing event)",
    ],
    updateStrategy: "none",
    affectedQueryKeys: [],
    payloadSchema: "{ conversationId: number; userId: string }",
  },

  typing_stop: {
    event: "typing_stop",
    scope: "user",
    description: "User stopped typing — handled by SSE listeners, no query invalidation",
    initiators: [
      "POST /api/conversations/:id/typing (timeout/stop)",
    ],
    updateStrategy: "none",
    affectedQueryKeys: [],
    payloadSchema: "{ conversationId: number; userId: string }",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────

export function getDirectCacheEvents(): UserEventType[] {
  return Object.values(SSE_EVENT_REGISTRY)
    .filter((e) => e.updateStrategy === "setQueryData" || e.updateStrategy === "mixed")
    .map((e) => e.event);
}

export function getInvalidateEvents(): UserEventType[] {
  return Object.values(SSE_EVENT_REGISTRY)
    .filter((e) => e.updateStrategy === "invalidateQueries" || e.updateStrategy === "mixed")
    .map((e) => e.event);
}

export function getBroadcastEvents(): UserEventType[] {
  return Object.values(SSE_EVENT_REGISTRY)
    .filter((e) => e.scope === "broadcast")
    .map((e) => e.event);
}

export function getUserTargetedEvents(): UserEventType[] {
  return Object.values(SSE_EVENT_REGISTRY)
    .filter((e) => e.scope === "user")
    .map((e) => e.event);
}

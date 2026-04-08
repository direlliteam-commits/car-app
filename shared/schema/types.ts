export const NOTIFICATION_TYPES = {
  NEW_MESSAGE: "new_message",
  PRICE_ALERT: "price_alert",
  NEW_REVIEW: "new_review",
  LISTING_FAVORITED: "listing_favorited",
  PROMOTION_EXPIRING: "promotion_expiring",
  PROMOTION_EXPIRED: "promotion_expired",
  LISTING_ARCHIVED: "listing_archived",
  SAVED_SEARCH_UPDATE: "saved_search_update",
  FAVORITE_PRICE_DROP: "favorite_price_drop",
  LISTING_APPROVED: "listing_approved",
  LISTING_REJECTED: "listing_rejected",
  SYSTEM_MESSAGE: "system_message",
  SUBSCRIPTION_EXPIRING: "subscription_expiring",
  SUBSCRIPTION_EXPIRING_3D: "subscription_expiring_3d",
  SUBSCRIPTION_EXPIRING_1D: "subscription_expiring_1d",
  LISTINGS_FROZEN: "listings_frozen",
  LISTINGS_UNFROZEN: "listings_unfrozen",
  CREDIT_APPLICATION: "credit_application",
  CALLBACK_REQUEST: "callback_request",
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

export type UserEventType =
  | "listing_status"
  | "new_notification"
  | "new_message"
  | "wallet_update"
  | "promotion_update"
  | "dealer_status"
  | "account_update"
  | "favorites_update"
  | "support_message"
  | "support_status"
  | "support_read"
  | "catalog_update"
  | "new_review"
  | "model_review"
  | "conversation_read"
  | "typing_indicator"
  | "typing_stop"
  | "heartbeat"
  | "connected"
  | "dealer_profile_update";

export type AdminSection =
  | "dashboard"
  | "listings"
  | "users"
  | "reports"
  | "dealers"
  | "promotions"
  | "reviews"
  | "brands"
  | "transactions"
  | "analytics"
  | "badges"
  | "support"
  | "team"
  | "pro"
  | "settings";

export interface UserEventPayload {
  listing_status: { listingId: number; status: string; moderationNote?: string; entityVersion?: number };
  new_notification: { notificationType?: string; unreadCount?: number };
  new_message: { conversationId: number; listingId?: number; message?: { id: number; text: string; senderId: string; senderName?: string; createdAt: string; images?: string[] }; unreadCount?: number };
  wallet_update: { newBalance: number; entityVersion?: number };
  promotion_update: { listingId: number };
  dealer_status: { status: string; requestId: number; entityVersion?: number };
  account_update: { action: string; entityVersion?: number };
  favorites_update: Record<string, never>;
  support_message: { ticketId: number; message?: { id: number; text: string; senderId: string; isAdmin: boolean; createdAt: string } };
  support_status: { ticketId: number; status: string };
  support_read: { ticketId: number };
  catalog_update: { listingId?: number; entityVersion?: number };
  new_review: { sellerId: string; reviewerId: string; rating: number; comment?: string };
  model_review: { brand: string; model: string; generation?: string; avgRating: number; reviewsCount: number };
  conversation_read: { conversationId: number };
  typing_indicator: { conversationId: number; userId: string };
  typing_stop: { conversationId: number; userId: string };
  heartbeat: Record<string, never>;
  connected: Record<string, never>;
  dealer_profile_update: { dealerId: string };
}

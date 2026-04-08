import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getApiUrl, getAuthToken } from "@/lib/query-client";
import { API } from "@/lib/api-endpoints";
import { useColors } from "@/constants/colors";
import { StyleSheet } from "react-native";
import { CARD_RADIUS } from "@/constants/layout";

export type IoniconsName = keyof (typeof import("@expo/vector-icons"))["Ionicons"]["glyphMap"];
export type AdminTab = "dashboard" | "dealers" | "listings" | "reports" | "users";

export interface AdminStats {
  users: { total: number; byRole: Record<string, number> };
  listings: { total: number; byStatus: Record<string, number> };
  reports: { total: number; byStatus: Record<string, number> };
  dealerRequests: { total: number; byStatus: Record<string, number> };
}

export interface DealerRequestItem {
  id: number;
  userId: string;
  companyName: string;
  taxId: string | null;
  phone: string;
  address: string | null;
  website: string | null;
  description: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  userName: string | null;
  userEmail: string | null;
  userAvatar: string | null;
  userListingsCount: number | null;
}

export interface AdminListing {
  id: number;
  brand: string;
  model: string;
  year: number;
  price: number;
  currency: string;
  photo: string | null;
  photos: string[];
  videoUrl: string | null;
  vehicleType: string | null;
  status: string;
  moderationNote: string | null;
  createdAt: string;
  userId: string;
  userName: string | null;
  userAvatar: string | null;
}

export interface ReportItem {
  id: number;
  reporterId: string;
  listingId: number | null;
  targetUserId: string | null;
  listingUserId: string | null;
  reason: string;
  description: string | null;
  status: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  reporterName: string | null;
  targetUserName: string | null;
}

export interface ConversationItem {
  id: number;
  buyerId: string;
  sellerId: string;
  listingId: number | null;
  listing?: { brand: string; model: string; year: number };
}

export interface ConversationMessage {
  id: number;
  conversationId: number;
  senderId: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  avatarUrl: string | null;
  listingsCount: number;
  rating: string | null;
  reviewsCount: number;
  createdAt: string;
  companyName: string | null;
}

export interface SectionProps {
  colors: ReturnType<typeof useColors>;
  isDark: boolean;
  insets: { top: number; bottom: number; left: number; right: number };
}

export const TAB_KEYS: { key: AdminTab; icon: IoniconsName; labelKey: string }[] = [
  { key: "dashboard", icon: "grid-outline" as IoniconsName, labelKey: "adminPanel.tabDashboard" },
  { key: "dealers", icon: "briefcase-outline" as IoniconsName, labelKey: "adminPanel.tabDealers" },
  { key: "listings", icon: "car-outline" as IoniconsName, labelKey: "adminPanel.tabListings" },
  { key: "reports", icon: "flag-outline" as IoniconsName, labelKey: "adminPanel.tabReports" },
  { key: "users", icon: "people-outline" as IoniconsName, labelKey: "adminPanel.tabUsers" },
];

function handleAdminSSEEvent(queryClient: ReturnType<typeof useQueryClient>, sections: string[]) {
  if (sections.includes("dealers")) {
    queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.startsWith?.(API.admin.dealerRequests), refetchType: "all" });
  }
  if (sections.includes("listings")) {
    queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.startsWith?.(API.admin.listings), refetchType: "all" });
  }
  if (sections.includes("users")) {
    queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.startsWith?.(API.admin.users), refetchType: "all" });
  }
  if (sections.includes("reports")) {
    queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.startsWith?.(API.admin.reports), refetchType: "all" });
  }
  if (sections.includes("dashboard") || sections.includes("badges") || sections.includes("analytics")) {
    queryClient.invalidateQueries({ queryKey: [API.admin.stats], refetchType: "all" });
    queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.startsWith?.(API.admin.analytics), refetchType: "all" });
  }
  if (sections.includes("support")) {
    queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.startsWith?.(API.admin.support), refetchType: "all" });
  }
}

const ADMIN_SSE_RECONNECT_DELAY = 3000;
const ADMIN_SSE_MAX_RECONNECT_DELAY = 30000;
const ADMIN_SSE_KEEPALIVE_TIMEOUT = 45000;

export function useAdminSSE(enabled: boolean) {
  const queryClient = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(ADMIN_SSE_RECONNECT_DELAY);
  const mountedRef = useRef(true);
  const lastDataRef = useRef<number>(Date.now());
  const keepaliveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    mountedRef.current = true;

    async function connect() {
      if (!mountedRef.current || connectingRef.current) return;
      connectingRef.current = true;

      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      if (keepaliveTimerRef.current) {
        clearInterval(keepaliveTimerRef.current);
        keepaliveTimerRef.current = null;
      }

      try {
        const token = await getAuthToken();
        if (!token || !mountedRef.current) {
          connectingRef.current = false;
          return;
        }

        const baseUrl = getApiUrl();
        const url = `${baseUrl}api/admin/events?token=${encodeURIComponent(token)}`;
        const controller = new AbortController();
        abortRef.current = controller;

        const { fetch: expoFetch } = await import("expo/fetch");
        const response = await expoFetch(url, {
          headers: { Accept: "text/event-stream" },
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Admin SSE connect failed: ${response.status}`);
        }

        connectingRef.current = false;
        reconnectDelayRef.current = ADMIN_SSE_RECONNECT_DELAY;
        lastDataRef.current = Date.now();

        keepaliveTimerRef.current = setInterval(() => {
          if (Date.now() - lastDataRef.current > ADMIN_SSE_KEEPALIVE_TIMEOUT) {
            if (keepaliveTimerRef.current) {
              clearInterval(keepaliveTimerRef.current);
              keepaliveTimerRef.current = null;
            }
            if (abortRef.current) {
              abortRef.current.abort();
              abortRef.current = null;
            }
            if (mountedRef.current) {
              reconnectDelayRef.current = ADMIN_SSE_RECONNECT_DELAY;
              connect();
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
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.sections && Array.isArray(data.sections)) {
                  handleAdminSSEEvent(queryClient, data.sections);
                }
              } catch {}
            }
          }
        }
      } catch (err: any) {
        connectingRef.current = false;
        if (err?.name === "AbortError") return;
        console.warn("[AdminSSE] Connection error:", err?.message || err);
      }

      connectingRef.current = false;
      if (keepaliveTimerRef.current) {
        clearInterval(keepaliveTimerRef.current);
        keepaliveTimerRef.current = null;
      }

      if (mountedRef.current) {
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, reconnectDelayRef.current);
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 1.5, ADMIN_SSE_MAX_RECONNECT_DELAY);
      }
    }

    connect();

    return () => {
      mountedRef.current = false;
      if (keepaliveTimerRef.current) {
        clearInterval(keepaliveTimerRef.current);
        keepaliveTimerRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [queryClient, enabled]);
}

export const adminStyles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 15, textAlign: "center" },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    gap: 2,
  },
  tabLabel: { fontSize: 11, fontWeight: "600" as const },
  filterRow: { paddingHorizontal: 8, paddingVertical: 10, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18 },
  filterChipText: { fontSize: 13, fontWeight: "600" as const },
  listContent: { padding: 16, gap: 10 },
  card: { borderRadius: CARD_RADIUS, padding: 14, gap: 10, marginBottom: 2 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: "600" as const },
  cardSub: { fontSize: 12, marginTop: 1 },
  priceText: { fontSize: 14, fontWeight: "700" as const, marginTop: 2 },
  avatar: { width: 34, height: 34, borderRadius: 17 },
  avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
  listingThumb: { width: 56, height: 40, borderRadius: 8 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 11, fontWeight: "600" as const },
  detailLine: { fontSize: 12, lineHeight: 17 },
  notePreview: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  notePreviewText: { fontSize: 11, fontWeight: "500" as const, flex: 1 },
  actionBlock: { paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, gap: 10 },
  noteInput: { minHeight: 50, borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8, fontSize: 13 },
  actionBtns: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 10, borderRadius: 10 },
  actionBtnText: { fontSize: 13, fontWeight: "700" as const, color: "#fff" },
  reportIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  reportActions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  viewBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  viewBtnText: { fontSize: 12, fontWeight: "500" as const },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5 },
  smallBtnText: { fontSize: 12, fontWeight: "600" as const },
  userDetails: { gap: 2, paddingLeft: 44 },
  roleActions: { flexDirection: "row", gap: 8, paddingLeft: 44 },
  searchRow: { paddingHorizontal: 8, paddingTop: 8 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, height: 38, borderRadius: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  dashboardContent: { padding: 16, gap: 12 },
  statCard: { borderRadius: 16, padding: 16, gap: 12 },
  statCardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  statIconBg: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statTitle: { fontSize: 13, fontWeight: "500" as const },
  statTotal: { fontSize: 24, fontWeight: "800" as const },
  statDetails: { flexDirection: "row", flexWrap: "wrap", gap: 4, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  statDetailItem: { width: "48%", flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, paddingHorizontal: 4 },
  statDetailLabel: { fontSize: 13 },
  statDetailValue: { fontSize: 13, fontWeight: "600" as const },
});

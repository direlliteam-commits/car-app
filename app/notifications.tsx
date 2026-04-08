import React, { useCallback, useState, useEffect } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl } from "react-native";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { apiRequest, queryClient } from "@/lib/query-client";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "@/lib/i18n";
import { ScreenHeader } from "@/components/ScreenHeader";
import { CARD_GAP, CARD_PADDING, HEADER_CONTENT_PADDING_H, WEB_TOP_INSET } from "@/constants/layout";
import { API } from "@/lib/api-endpoints";

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface Notification {
  id: number;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any> | null;
  read: boolean;
  pushSent: boolean;
  createdAt: string;
}

const typeIconMap: Record<string, IoniconsName> = {
  listing_approved: "checkmark-circle-outline",
  listing_rejected: "close-circle-outline",
  new_message: "chatbubble-outline",
  price_alert: "trending-down-outline",
  new_review: "star-outline",
  listing_favorited: "heart-outline",
  promotion_expiring: "time-outline",
  promotion_expired: "alert-circle-outline",
  listing_archived: "archive-outline",
  saved_search_update: "search-outline",
  favorite_price_drop: "pricetag-outline",
  system_message: "megaphone-outline",
};

function getRelativeTime(dateStr: string, t: (key: string) => string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return t("time.justNow");
  if (diffMin < 60) return `${diffMin} ${t("time.minutesAgo")}`;
  if (diffHours < 24) return `${diffHours} ${t("time.hoursAgo")}`;
  if (diffDays === 1) return t("common.yesterday");
  if (diffDays < 7) return `${diffDays} ${t("time.daysAgo")}`;
  const monthKey = `time.month${date.getMonth() + 1}` as string;
  return `${date.getDate()} ${t(monthKey)}`;
}

function getDateGroup(dateStr: string, t: (key: string) => string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayDate = new Date(todayDate.getTime() - 86400000);
  const notifDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (notifDate.getTime() === todayDate.getTime()) return t("common.today");
  if (notifDate.getTime() === yesterdayDate.getTime()) return t("common.yesterday");
  return t("notifications.earlier");
}

function getLocalizedTitle(n: Notification, t: (key: string) => string): string {
  const titleKey = `notifications.type_${n.type}_title`;
  const localized = t(titleKey);
  if (localized === titleKey) return n.title;
  const d = n.data || {};
  return localized
    .replace("{name}", d.senderName || d.reviewerName || "")
    .replace("{package}", d.packageName || "");
}

function getLocalizedBody(n: Notification, t: (key: string) => string): string {
  const bodyKey = `notifications.type_${n.type}_body`;
  const localized = t(bodyKey);
  if (localized === bodyKey) return n.body;
  const d = n.data || {};
  let result = localized
    .replace("{price}", d.currentPrice ? d.currentPrice.toLocaleString() : "")
    .replace("{target}", d.targetPrice ? d.targetPrice.toLocaleString() : "")
    .replace("{count}", String(d.totalFavorites || d.diff || d.newCount || ""))
    .replace("{package}", d.packageName || "")
    .replace("{hours}", String(d.hoursLeft || ""))
    .replace("{name}", d.searchName || "")
    .replace("{oldPrice}", d.oldPrice ? d.oldPrice.toLocaleString() : "")
    .replace("{newPrice}", d.newPrice ? d.newPrice.toLocaleString() : "");
  if (n.type === "listing_rejected" && d.moderationNote) {
    result += ". " + t("notifications.rejectedReason").replace("{reason}", d.moderationNote);
  }
  return result;
}

function handleNotificationPress(notification: Notification) {
  const { type, data } = notification;

  switch (type) {
    case "new_message":
      if (data?.conversationId) router.push(`/chat/${data.conversationId}`);
      break;
    case "price_alert":
    case "favorite_price_drop":
    case "listing_favorited":
    case "listing_archived":
      if (data?.listingId) router.push(`/car/${data.listingId}`);
      break;
    case "new_review":
      if (data?.userId) router.push(`/seller/${data.userId}`);
      break;
    case "promotion_expiring":
    case "promotion_expired":
      router.push("/my-listings");
      break;
    case "listing_approved":
      if (data?.listingId) router.push(`/car/${data.listingId}`);
      else router.push("/my-listings");
      break;
    case "listing_rejected":
      router.push("/my-listings?tab=rejected");
      break;
    case "saved_search_update":
      router.push("/saved-searches");
      break;
  }
}

const NotificationItem = React.memo(function NotificationItem({
  notification,
  onPress,
  colors,
  isDark,
  t,
}: {
  notification: Notification;
  onPress: (n: Notification) => void;
  colors: any;
  isDark: boolean;
  t: (key: string) => string;
}) {
  const iconName = typeIconMap[notification.type] || ("notifications-outline" as IoniconsName);
  const isUnread = !notification.read;

  return (
    <Pressable
      onPress={() => onPress(notification)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isDark
            ? isUnread ? "rgba(255,255,255,0.05)" : "transparent"
            : isUnread ? "rgba(0,0,0,0.03)" : "transparent",
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Ionicons name={iconName} size={20} color={isUnread ? colors.text : colors.textTertiary} style={styles.iconDirect} />

      <View style={styles.cardContent}>
        <View style={styles.cardTitleRow}>
          <Text
            style={[
              styles.cardTitle,
              { color: colors.text },
              isUnread && styles.cardTitleUnread,
            ]}
            numberOfLines={1}
          >
            {getLocalizedTitle(notification, t)}
          </Text>
          {isUnread && <View style={[styles.unreadDot, { backgroundColor: colors.accentBlue }]} />}
        </View>

        <Text
          style={[styles.cardBody, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {getLocalizedBody(notification, t)}
        </Text>

        <Text style={[styles.cardTime, { color: colors.textTertiary }]}>
          {getRelativeTime(notification.createdAt, t)}
        </Text>
      </View>
    </Pressable>
  );
});

export default function NotificationsScreen() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { unreadCount, markAllRead } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/auth");
    }
  }, [isAuthenticated, authLoading]);

  const { data, isLoading, refetch } = useQuery<{ notifications: Notification[]; total: number }>({
    queryKey: [API.notifications.list],
    enabled: isAuthenticated,
    refetchInterval: 60000,
  });

  const notifications = data?.notifications ?? [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  }, [refetch]);

  const handleMarkAsRead = useCallback(async (notification: Notification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!notification.read) {
      try {
        await apiRequest("PUT", API.notifications.markRead(notification.id));
        queryClient.invalidateQueries({ queryKey: [API.notifications.list] });
        queryClient.invalidateQueries({ queryKey: [API.notifications.unreadCount] });
      } catch (e) {}
    }
    handleNotificationPress(notification);
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await markAllRead();
    } catch (e) {}
  }, [markAllRead]);

  const grouped = React.useMemo(() => {
    const groups: { title: string; data: Notification[] }[] = [];
    const groupMap: Record<string, Notification[]> = {};
    const order = [t("common.today"), t("common.yesterday"), t("notifications.earlier")];

    for (const n of notifications) {
      const group = getDateGroup(n.createdAt, t);
      if (!groupMap[group]) groupMap[group] = [];
      groupMap[group].push(n);
    }

    for (const key of order) {
      if (groupMap[key]) {
        groups.push({ title: key, data: groupMap[key] });
      }
    }

    return groups;
  }, [notifications, t]);

  const flatData = React.useMemo(() => {
    const items: ({ type: "header"; title: string } | { type: "notification"; item: Notification })[] = [];
    for (const group of grouped) {
      items.push({ type: "header", title: group.title });
      for (const item of group.data) {
        items.push({ type: "notification", item });
      }
    }
    return items;
  }, [grouped]);

  const renderItem = useCallback(({ item }: { item: (typeof flatData)[number] }) => {
    if (item.type === "header") {
      return (
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
          {item.title.toUpperCase()}
        </Text>
      );
    }

    return (
      <NotificationItem
        notification={item.item}
        onPress={handleMarkAsRead}
        colors={colors}
        isDark={isDark}
        t={t}
      />
    );
  }, [colors, isDark, handleMarkAsRead, t]);

  const keyExtractor = useCallback((item: (typeof flatData)[number], index: number) => {
    if (item.type === "header") return `header-${item.title}`;
    return `notification-${item.item.id}`;
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScreenHeader
        title={t("notifications.title")}
        borderBottom
        rightActions={unreadCount > 0 ? [{ icon: "checkmark-done", onPress: handleMarkAllRead, color: colors.accentBlue }] : undefined}
      />

      {notifications.length === 0 && !isLoading ? (
        <View style={styles.emptyWrap}>
          <ExpoImage source={require("@/assets/images/empty-notifications.png")} style={{ width: 140, height: 140, marginBottom: 4 }} contentFit="contain" />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t("notifications.empty")}</Text>
          <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
            {t("notifications.emptySubtitle")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={flatData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentBlue} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: HEADER_CONTENT_PADDING_H,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  list: {
    paddingHorizontal: 0,
    paddingTop: 6,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginTop: 18,
    marginBottom: 10,
    marginLeft: 2,
  },
  card: {
    flexDirection: "row",
    paddingVertical: CARD_PADDING,
    paddingHorizontal: CARD_PADDING,
    borderRadius: 16,
    marginBottom: CARD_GAP,
    gap: 12,
    alignItems: "flex-start",
  },
  iconDirect: {
    marginTop: 2,
    width: 20,
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  cardTitleUnread: {
    fontWeight: "700",
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 1,
  },
  cardTime: {
    fontSize: 12,
    marginTop: 3,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptyBody: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});

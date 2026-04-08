import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  RefreshControl,
} from "react-native";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { Icon } from "@/components/Icon";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { EmptyState } from "@/components/EmptyState";
import { useColors } from "@/constants/colors";
import type { ColorScheme } from "@/constants/colors";
import { getAvatarUri, resolveMediaUri } from "@/lib/media";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { formatRelativeTime, getListingShortTitle } from "@/lib/formatters";
import { ConversationListSkeleton } from "@/components/SkeletonCard";
import { useTranslation } from "@/lib/i18n";
import { CARD_PADDING, CARD_PADDING_H, CARD_RADIUS, SCREEN_PADDING_H, TAB_BAR_HEIGHT, WEB_BOTTOM_INSET } from "@/constants/layout";
import { ScreenHeader } from "@/components/ScreenHeader";
import { API } from "@/lib/api-endpoints";

interface ConversationUser {
  id: string;
  username: string;
  name: string | null;
  phone?: string | null;
  avatarUrl: string | null;
  verified: boolean;
}

interface ConversationMessage {
  id: number;
  conversationId: number;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface ConversationListing {
  id: number;
  brand: string;
  model: string;
  year: number;
  price: number;
  status?: string;
  images: string[];
}

interface Conversation {
  id: number;
  buyerId: string;
  sellerId: string;
  listingId: number | null;
  lastMessageAt: string;
  createdAt: string;
  lastMessage?: ConversationMessage;
  otherUser?: ConversationUser;
  listing?: ConversationListing;
}

const ConversationItem = React.memo(({ conv, userId, colors, isDark, onPress, isTyping, t }: {
  conv: Conversation;
  userId: string | undefined;
  colors: ColorScheme;
  isDark: boolean;
  onPress: (id: number) => void;
  isTyping?: boolean;
  t: (key: string) => string;
}) => {
  const otherName = conv.otherUser?.name || conv.otherUser?.username || conv.otherUser?.phone || t("common.user");
  const isUnread = conv.lastMessage && !conv.lastMessage.read && conv.lastMessage.senderId !== userId;
  const isMine = conv.lastMessage?.senderId === userId;
  const listingTitle = conv.listing ? getListingShortTitle(conv.listing) : null;
  const listingStatus = conv.listing?.status;
  const isListingInactive = listingStatus && listingStatus !== "active";

  const getStatusLabel = (status: string): string | null => {
    const statusMap: Record<string, string> = {
      sold: t("messages.statusSold"),
      archived: t("messages.statusArchived"),
      deleted: t("messages.statusDeleted"),
      moderation: t("messages.statusModeration"),
      rejected: t("messages.statusRejected"),
    };
    return statusMap[status] || null;
  };

  const statusLabel = isListingInactive ? getStatusLabel(listingStatus) : null;
  const listingImage = conv.listing?.images?.[0] ? resolveMediaUri(conv.listing.images[0]) : null;

  return (
    <Pressable
      onPress={() => onPress(conv.id)}
      style={({ pressed }) => [
        styles.conversationCard,
        { backgroundColor: pressed ? colors.surfacePressed : "transparent" },
      ]}
    >
      <View style={styles.thumbContainer}>
        {listingImage ? (
          <View style={[styles.mainThumb, { backgroundColor: colors.inputBackground }]}>
            <Image source={{ uri: listingImage }} style={styles.mainThumbImage} contentFit="cover" />
          </View>
        ) : (
          <View style={[styles.mainThumb, styles.mainThumbPlaceholder, { backgroundColor: colors.inputBackground }]}>
            <Icon name="car" size={22} color={colors.textTertiary} />
          </View>
        )}
        <View style={[styles.miniAvatar, { backgroundColor: colors.inputBackground, borderColor: colors.background }]}>
          <Image
            source={conv.otherUser?.avatarUrl ? { uri: getAvatarUri(conv.otherUser.avatarUrl)! } : require("@/assets/images/default-avatar.png")}
            style={styles.miniAvatarImage}
          />
        </View>
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text
            style={[styles.conversationName, { color: colors.text }, isUnread && styles.unreadText]}
            numberOfLines={1}
          >
            {otherName}
          </Text>
          <View style={styles.timeRow}>
            {isMine && conv.lastMessage && (
              <Icon
                name="checkmark-done"
                size={14}
                color={conv.lastMessage.read ? colors.accentBlue : colors.textTertiary}
              />
            )}
            <Text style={[styles.conversationTime, { color: colors.textTertiary }]}>
              {formatRelativeTime(conv.lastMessageAt)}
            </Text>
          </View>
        </View>

        {listingTitle && (
          <View style={styles.listingRow}>
            <Text
              style={[
                styles.listingLabel,
                { color: colors.text },
                isListingInactive && { color: colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {isListingInactive ? t("messages.listingUnavailable") : listingTitle}
            </Text>
            {statusLabel && (
              <View style={[styles.statusBadge, { backgroundColor: colors.dangerBg }]}>
                <Text style={[styles.statusBadgeText, { color: colors.statusRejected }]}>{statusLabel}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.messageRow}>
          {isTyping ? (
            <Text
              style={[styles.messagePreview, { color: colors.primary, fontStyle: "italic" as const }]}
              numberOfLines={1}
            >
              {t("messages.typing")}
            </Text>
          ) : (
            <Text
              style={[
                styles.messagePreview,
                { color: isUnread ? colors.text : colors.textTertiary },
                isUnread && styles.unreadText,
              ]}
              numberOfLines={1}
            >
              {conv.lastMessage?.content === "[VIN_REQUEST]"
                ? t("chat.vinRequestPreview")
                : conv.lastMessage?.content?.match(/^\[VIN_SHARE:.+\]$/)
                  ? t("chat.vinSharePreview")
                  : conv.lastMessage?.content || t("messages.noMessages")}
            </Text>
          )}
          {isUnread && (
            <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
          )}
        </View>
      </View>
    </Pressable>
  );
});

export default function MessagesTabScreen() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuth();
  const isFocused = useIsFocused();
  const { t } = useTranslation();

  const tabBarBottom = insets.bottom + TAB_BAR_HEIGHT + WEB_BOTTOM_INSET;

  const conversationsQuery = useQuery<Conversation[]>({
    queryKey: [API.conversations.list],
    enabled: isAuthenticated,
    refetchInterval: isFocused ? 60000 : false,
    staleTime: 10000,
  });

  const supportUnreadQuery = useQuery<{ count: number }>({
    queryKey: [API.support.unreadCount],
    enabled: isAuthenticated,
    refetchInterval: isFocused ? 60000 : false,
    staleTime: 5000,
  });

  const supportUnread = supportUnreadQuery.data?.count ?? 0;

  const typingQuery = useQuery<{ typing: { conversationId: number; userId: string }[] }>({
    queryKey: [API.typingStatus],
    enabled: isAuthenticated && isFocused,
    staleTime: 2000,
  });

  const typingEntries = typingQuery.data?.typing || [];

  const conversations = conversationsQuery.data || [];
  const loading = conversationsQuery.isLoading;
  const error = conversationsQuery.error;

  const handleConversationPress = useCallback((conversationId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    (router.push as (href: string) => void)(`/chat/${conversationId}`);
  }, []);

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ScreenHeader
          title={t("messages.title")}
          hideBack
          backgroundColor={colors.background}
        />

        <EmptyState
          image={require("@/assets/images/empty-messages.png")}
          title={t("messages.guestTitle")}
          subtitle={t("messages.guestSubtitle")}
          actionLabel={t("messages.loginButton")}
          onAction={() => router.push("/auth")}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScreenHeader
        title={t("messages.title")}
        hideBack
        backgroundColor={colors.background}
      />

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/support");
        }}
        style={({ pressed }) => [
          styles.supportBanner,
          {
            backgroundColor: pressed ? colors.surfaceSecondary : colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={[styles.supportIconWrap, { backgroundColor: colors.primary + "15" }]}>
          <Icon name="support" size={20} color={colors.primary} />
        </View>
        <View style={styles.supportBannerText}>
          <Text style={[styles.supportBannerTitle, { color: colors.text }]}>{t("messages.support")}</Text>
          <Text style={[styles.supportBannerSubtitle, { color: colors.textSecondary }]}>
            {t("messages.supportSubtitle")}
          </Text>
        </View>
        {supportUnread > 0 && (
          <View style={[styles.supportUnreadBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.supportUnreadText}>{supportUnread}</Text>
          </View>
        )}
        <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
      </Pressable>

      {loading ? (
        <ConversationListSkeleton count={6} />
      ) : error ? (
        <View style={styles.centerContent}>
          <View style={[styles.errorCard, { backgroundColor: isDark ? colors.surface : colors.background }]}>
            <Icon name="alert-circle" size={48} color={colors.textTertiary} />
            <Text style={[styles.errorText, { color: colors.text }]}>{t("messages.loadError")}</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                conversationsQuery.refetch();
              }}
              style={({ pressed }) => [
                styles.retryButton,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Icon name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
            </Pressable>
          </View>
        </View>
      ) : conversations.length === 0 ? (
        <EmptyState
          image={require("@/assets/images/empty-messages.png")}
          title={t("messages.empty")}
          subtitle={t("messages.emptySubtitle")}
          actionLabel={t("messages.goToCatalog")}
          onAction={() => router.push("/")}
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id.toString()}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: tabBarBottom + 16 },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={conversations.length > 0}
          refreshControl={
            <RefreshControl
              refreshing={conversationsQuery.isFetching && !conversationsQuery.isLoading}
              onRefresh={() => conversationsQuery.refetch()}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: colors.divider, marginLeft: 78 }]} />
          )}
          renderItem={({ item }) => (
            <ConversationItem
              conv={item}
              userId={user?.id}
              colors={colors}
              isDark={isDark}
              onPress={handleConversationPress}
              isTyping={typingEntries.some(
                (entry) => entry.conversationId === item.id && entry.userId !== user?.id
              )}
              t={t}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  supportBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SCREEN_PADDING_H,
    marginTop: 12,
    marginBottom: 8,
    padding: CARD_PADDING,
    borderRadius: CARD_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  supportIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  supportBannerText: {
    flex: 1,
    gap: 1,
  },
  supportBannerTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  supportBannerSubtitle: {
    fontSize: 12,
  },
  supportUnreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  supportUnreadText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700" as const,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -40,
    paddingHorizontal: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  conversationCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: CARD_PADDING - 4,
    paddingHorizontal: CARD_PADDING_H,
    gap: 10,
  },
  thumbContainer: {
    width: 56,
    height: 56,
    position: "relative" as const,
  },
  mainThumb: {
    width: 56,
    height: 56,
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
  },
  mainThumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  mainThumbImage: {
    width: 56,
    height: 56,
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: "absolute" as const,
    top: -4,
    right: -4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  miniAvatarImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  miniAvatarText: {
    fontSize: 10,
    fontWeight: "600" as const,
  },
  conversationContent: {
    flex: 1,
    gap: 2,
  },
  conversationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  conversationName: {
    fontSize: 15,
    fontWeight: "500" as const,
    flex: 1,
    marginRight: 8,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  conversationTime: {
    fontSize: 13,
  },
  listingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  listingLabel: {
    fontSize: 13,
    fontWeight: "700" as const,
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  messagePreview: {
    fontSize: 14,
    flex: 1,
  },
  unreadText: {
    fontWeight: "600" as const,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  errorCard: {
    padding: 32,
    borderRadius: CARD_RADIUS,
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  errorText: {
    fontSize: 15,
    fontWeight: "500" as const,
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600" as const,
  },
});

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Icon } from "@/components/Icon";
import * as Haptics from "expo-haptics";
import { useColors } from "@/constants/colors";
import { Image } from "expo-image";
import { apiRequest } from "@/lib/query-client";
import { getAvatarUri } from "@/lib/media";
import { useTranslation } from "@/lib/i18n";
import { ScreenHeader } from "@/components/ScreenHeader";
import { CARD_RADIUS, HEADER_CONTENT_PADDING_H, WEB_TOP_INSET } from "@/constants/layout";
import { API } from "@/lib/api-endpoints";

interface BlockedUserItem {
  id: string;
  username: string;
  name: string | null;
  phone?: string | null;
  avatarUrl: string | null;
  blockedAt: string;
}

export default function BlockedUsersScreen() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/auth");
    }
  }, [isAuthenticated, authLoading]);

  const [blockedUsers, setBlockedUsers] = useState<BlockedUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBlockedUsers = useCallback(async () => {
    try {
      const res = await apiRequest("GET", API.blockedUsers);
      const data = await res.json();
      setBlockedUsers(data);
    } catch {
      showAlert(t("common.error"), t("blockedUsers.loadError"), undefined, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBlockedUsers();
    setRefreshing(false);
  }, [fetchBlockedUsers]);

  const handleUnblock = useCallback((userId: string, name: string) => {
    showAlert(
      t("blockedUsers.unblockConfirm"),
      `${t("blockedUsers.unblockMessage")} ${name}?`,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("blockedUsers.unblock"),
          onPress: async () => {
            setUnblockingId(userId);
            try {
              await apiRequest("DELETE", API.users.block(userId));
              setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
              showAlert(t("common.error"), t("blockedUsers.unblockError"), undefined, "error");
            } finally {
              setUnblockingId(null);
            }
          },
        },
      ]
    );
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: BlockedUserItem }) => {
      const displayName = item.name || item.username || item.phone || t("common.user");
      const isUnblocking = unblockingId === item.id;

      return (
        <View style={[styles.userRow, { backgroundColor: isDark ? colors.surface : colors.background }]}>
          <Pressable
            onPress={() => router.push(`/seller/${item.id}`)}
            style={styles.userInfo}
          >
            <View style={[styles.avatar, { backgroundColor: colors.buttonPrimary }]}>
              <Image
                source={item.avatarUrl ? { uri: getAvatarUri(item.avatarUrl)! } : require("@/assets/images/default-avatar.png")}
                style={styles.avatarImage}
              />
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={[styles.userMeta, { color: colors.textTertiary }]}>
                @{item.username}
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => handleUnblock(item.id, displayName)}
            disabled={isUnblocking}
            style={({ pressed }) => [
              styles.unblockButton,
              { backgroundColor: colors.errorLight, opacity: pressed ? 0.8 : isUnblocking ? 0.5 : 1 },
            ]}
          >
            {isUnblocking ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Text style={[styles.unblockText, { color: colors.error }]}>
                {t("blockedUsers.unblock")}
              </Text>
            )}
          </Pressable>
        </View>
      );
    },
    [colors, isDark, unblockingId, handleUnblock]
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScreenHeader title={t("blockedUsers.title")} backgroundColor={isDark ? colors.surface : colors.background} />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : blockedUsers.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon name="blocked-users" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {t("blockedUsers.empty")}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {t("blockedUsers.emptySubtitle")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
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
    paddingHorizontal: HEADER_CONTENT_PADDING_H,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: CARD_RADIUS,
    gap: 12,
  },
  userInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#fff",
  },
  userDetails: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  userMeta: {
    fontSize: 13,
  },
  unblockButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 120,
    alignItems: "center",
  },
  unblockText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
});

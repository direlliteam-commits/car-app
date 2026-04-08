import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Platform,
} from "react-native";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Icon, IconName } from "@/components/Icon";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useColors } from "@/constants/colors";
import { useNotifications } from "@/contexts/NotificationContext";
import { useTranslation } from "@/lib/i18n";
import { CARD_RADIUS, HEADER_CONTENT_PADDING_H, WEB_TOP_INSET } from "@/constants/layout";
import Animated, { FadeInDown } from "react-native-reanimated";

const STORAGE_KEY = "notification_preferences";

interface NotificationPreferences {
  pushEnabled: boolean;
  messages: boolean;
  priceAlerts: boolean;
  favorites: boolean;
  promotions: boolean;
  reviews: boolean;
  savedSearches: boolean;
  listingUpdates: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  pushEnabled: true,
  messages: true,
  priceAlerts: true,
  favorites: true,
  promotions: true,
  reviews: true,
  savedSearches: true,
  listingUpdates: true,
};

interface ToggleRowProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  value: boolean;
  onToggle: (val: boolean) => void;
  disabled?: boolean;
  isLast?: boolean;
  isDark?: boolean;
  colors: ReturnType<typeof useColors>;
}

const ToggleRow = React.memo(({ icon, title, subtitle, value, onToggle, disabled, isLast, isDark, colors }: ToggleRowProps) => (
  <View style={{ opacity: disabled ? 0.45 : 1 }}>
    <View style={styles.row}>
      <View style={styles.rowIconWrap}>
        <Icon name={icon} size={20} color={colors.text} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.rowSub, { color: colors.textTertiary }]}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={(val) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle(val);
        }}
        disabled={disabled}
        trackColor={{ false: colors.trackInactive, true: colors.text }}
        thumbColor="#fff"
        ios_backgroundColor={colors.trackInactive}
      />
    </View>
    {!isLast && <View style={[styles.divider, { backgroundColor: isDark ? colors.background : colors.surface }]} />}
  </View>
));

export default function NotificationSettingsScreen() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { registerForPush } = useNotifications();
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/auth");
    }
  }, [isAuthenticated, authLoading]);

  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) {
        try {
          setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(val) });
        } catch {}
      }
    });
  }, []);

  const updatePref = useCallback((key: keyof NotificationPreferences, value: boolean) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const handlePushToggle = useCallback(async (enabled: boolean) => {
    updatePref("pushEnabled", enabled);
    if (enabled) {
      await registerForPush();
    }
  }, [updatePref, registerForPush]);

  const enabledCount = Object.entries(prefs).filter(([k, v]) => k !== "pushEnabled" && v).length;
  const totalCount = Object.keys(prefs).length - 1;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScreenHeader title={t("notificationSettings.title")} backgroundColor={isDark ? colors.surface : colors.background} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(300).delay(50)}>
          <View style={[styles.masterCard, { backgroundColor: isDark ? colors.surface : colors.background }]}>
            <View style={styles.masterTop}>
              <View style={[styles.masterIconCircle, { backgroundColor: prefs.pushEnabled ? colors.text : colors.surfaceSecondary }]}>
                <Icon name="notif-bell" size={24} color={prefs.pushEnabled ? colors.background : colors.textTertiary} />
              </View>
              <View style={styles.masterTextWrap}>
                <Text style={[styles.masterTitle, { color: colors.text }]}>
                  {t("notificationSettings.pushTitle")}
                </Text>
                <Text style={[styles.masterSub, { color: colors.textSecondary }]}>
                  {prefs.pushEnabled
                    ? `${enabledCount}/${totalCount} ${t("notificationSettings.activeLabel")}`
                    : t("notificationSettings.pushSubtitle")}
                </Text>
              </View>
              <Switch
                value={prefs.pushEnabled}
                onValueChange={(val) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handlePushToggle(val);
                }}
                trackColor={{ false: colors.trackInactive, true: colors.text }}
                thumbColor="#fff"
                ios_backgroundColor={colors.trackInactive}
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(300).delay(120)}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {t("notificationSettings.typesSection")}
          </Text>
          <View style={[styles.card, { backgroundColor: isDark ? colors.surface : colors.background }]}>
            <ToggleRow
              icon="notif-chat"
              title={t("notificationSettings.messagesTitle")}
              subtitle={t("notificationSettings.messagesSubtitle")}
              value={prefs.messages}
              onToggle={(v) => updatePref("messages", v)}
              disabled={!prefs.pushEnabled}
              isDark={isDark}
              colors={colors}
            />
            <ToggleRow
              icon="notif-trending"
              title={t("notificationSettings.priceTitle")}
              subtitle={t("notificationSettings.priceSubtitle")}
              value={prefs.priceAlerts}
              onToggle={(v) => updatePref("priceAlerts", v)}
              disabled={!prefs.pushEnabled}
              isDark={isDark}
              colors={colors}
            />
            <ToggleRow
              icon="notif-heart"
              title={t("notificationSettings.favoritesTitle")}
              subtitle={t("notificationSettings.favoritesSubtitle")}
              value={prefs.favorites}
              onToggle={(v) => updatePref("favorites", v)}
              disabled={!prefs.pushEnabled}
              isDark={isDark}
              colors={colors}
            />
            <ToggleRow
              icon="notif-star"
              title={t("notificationSettings.reviewsTitle")}
              subtitle={t("notificationSettings.reviewsSubtitle")}
              value={prefs.reviews}
              onToggle={(v) => updatePref("reviews", v)}
              disabled={!prefs.pushEnabled}
              isDark={isDark}
              colors={colors}
            />
            <ToggleRow
              icon="notif-flash"
              title={t("notificationSettings.promoTitle")}
              subtitle={t("notificationSettings.promoSubtitle")}
              value={prefs.promotions}
              onToggle={(v) => updatePref("promotions", v)}
              disabled={!prefs.pushEnabled}
              isDark={isDark}
              colors={colors}
            />
            <ToggleRow
              icon="notif-bookmark"
              title={t("notificationSettings.savedSearchTitle")}
              subtitle={t("notificationSettings.savedSearchSubtitle")}
              value={prefs.savedSearches}
              onToggle={(v) => updatePref("savedSearches", v)}
              disabled={!prefs.pushEnabled}
              isDark={isDark}
              colors={colors}
            />
            <ToggleRow
              icon="notif-car"
              title={t("notificationSettings.listingsTitle")}
              subtitle={t("notificationSettings.listingsSubtitle")}
              value={prefs.listingUpdates}
              onToggle={(v) => updatePref("listingUpdates", v)}
              disabled={!prefs.pushEnabled}
              isDark={isDark}
              colors={colors}
              isLast
            />
          </View>
        </Animated.View>
      </ScrollView>
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
    letterSpacing: -0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
  masterCard: {
    borderRadius: CARD_RADIUS,
    padding: 16,
    marginTop: 4,
  },
  masterTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  masterIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  masterTextWrap: {
    flex: 1,
    gap: 2,
  },
  masterTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    letterSpacing: -0.2,
  },
  masterSub: {
    fontSize: 13,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 20,
    marginLeft: 4,
    textTransform: "uppercase" as const,
  },
  card: {
    borderRadius: CARD_RADIUS,
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    gap: 12,
  },
  rowIconWrap: {
    width: 24,
    alignItems: "center",
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "500" as const,
    letterSpacing: -0.15,
  },
  rowSub: {
    fontSize: 12,
    marginTop: 1,
    lineHeight: 16,
  },
  divider: {
    height: 2,
    marginHorizontal: -14,
  },
});

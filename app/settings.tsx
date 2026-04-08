import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Switch,
} from "react-native";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useQueryClient } from "@tanstack/react-query";
import { Icon, IconName } from "@/components/Icon";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/constants/colors";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, getRefreshToken } from "@/lib/query-client";
import { useTranslation } from "@/lib/i18n";
import { CARD_RADIUS, SCREEN_PADDING_H } from "@/constants/layout";
import { ScreenHeader } from "@/components/ScreenHeader";

import { isBiometricHardwareAvailable, isBiometricsEnabled, enableBiometrics, disableBiometrics, setBiometricSessionSkipped } from "@/lib/biometrics";
import { API } from "@/lib/api-endpoints";

interface MenuItemProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
  isLast?: boolean;
  isDark?: boolean;
  colors: ReturnType<typeof useColors>;
}

const MenuItem = React.memo(({ icon, title, subtitle, onPress, danger, isLast, isDark, colors }: MenuItemProps) => (
  <View>
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.menuItem,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={styles.iconWrap}>
        <Icon name={icon} size={22} color={danger ? colors.error : colors.text} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: danger ? colors.error : colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        )}
      </View>
      <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>
    {!isLast && <View style={[styles.divider, { backgroundColor: isDark ? colors.background : colors.surface }]} />}
  </View>
));

export default function SettingsScreen() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const { showAlert } = useAlert();
  const { t } = useTranslation();
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricToggling, setBiometricToggling] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") return;
    (async () => {
      const available = await isBiometricHardwareAvailable();
      setBiometricAvailable(available);
      if (available) {
        const enabled = await isBiometricsEnabled();
        setBiometricEnabled(enabled);
      }
    })();
  }, []);

  const handleBiometricToggle = async (value: boolean) => {
    if (biometricToggling) return;
    setBiometricToggling(true);
    try {
      if (value) {
        const token = await getRefreshToken();
        if (token) {
          await enableBiometrics(token);
          setBiometricSessionSkipped(false);
          setBiometricEnabled(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          showAlert(t("common.error"), t("biometrics.noToken"), undefined, "error");
        }
      } else {
        await disableBiometrics();
        setBiometricEnabled(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      console.error("biometric toggle error:", e);
      showAlert(t("common.error"), t("biometrics.toggleError"), undefined, "error");
    } finally {
      setBiometricToggling(false);
    }
  };

  const handleDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    showAlert(
      t("settings.deleteAccountConfirm"),
      t("settings.deleteAccountMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => {
            confirmDeleteWithPassword();
          },
        },
      ],
      "warning"
    );
  };

  const confirmDeleteWithPassword = () => {
    showAlert(
      t("settings.deleteConfirmTitle"),
      t("settings.deleteConfirmMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.deleteConfirmButton"),
          style: "destructive",
          onPress: async () => {
            await performDeleteAccount();
          },
        },
      ],
      "warning"
    );
  };

  const performDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await apiRequest("DELETE", API.auth.deleteAccount, {});
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/auth");
      await logout();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = error instanceof Error ? error.message : t("settings.deleteError");
      showAlert(t("common.error"), message, undefined, "error");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleClearCache = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    showAlert(
      t("settings.clearCacheConfirm"),
      t("settings.clearCacheMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.clearCacheButton"),
          style: "destructive",
          onPress: async () => {
            try {
              const keysToPreserve = ["auto_armenia_session", "biometrics_enabled", "auto_armenia_theme", "auto_armenia_language"];
              const allKeys = await AsyncStorage.getAllKeys();
              const keysToRemove = allKeys.filter(
                (key) => !keysToPreserve.includes(key)
              );
              if (keysToRemove.length > 0) {
                await AsyncStorage.multiRemove(keysToRemove);
              }
              queryClient.clear();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showAlert(t("common.done"), t("settings.cacheCleaned"), undefined, "success");
            } catch (e) { console.error("clearCache:", e); }
          },
        },
      ],
      "warning"
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScreenHeader title={t("settings.title")} backgroundColor={isDark ? colors.surface : colors.background} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400).delay(50)}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {t("settings.app")}
          </Text>
          <View style={[styles.card, { backgroundColor: isDark ? colors.surface : colors.background }]}>
            <MenuItem
              icon="notifications"
              title={t("settings.notifications")}
              subtitle={t("settings.notificationsSubtitle")}
              onPress={() => router.push("/notification-settings")}
              colors={colors}
              isDark={isDark}
            />
            <MenuItem
              icon="blocked-users"
              title={t("settings.blockedUsers")}
              subtitle={t("settings.blockedUsersSubtitle")}
              onPress={() => router.push("/blocked-users")}
              colors={colors}
              isDark={isDark}
            />
            <MenuItem
              icon="clear-cache"
              title={t("settings.clearCache")}
              subtitle={t("settings.clearCacheSubtitle")}
              onPress={handleClearCache}
              colors={colors}
              isDark={isDark}
            />
            <MenuItem
              icon="share-app"
              title={t("settings.shareApp")}
              onPress={async () => {
                try {
                  if (Platform.OS !== "web") {
                    const { Share } = require("react-native");
                    await Share.share({
                      message: t("settings.shareMessage"),
                    });
                  } else {
                    if (navigator.share) {
                      await navigator.share({
                        title: "armauto.am",
                        text: t("settings.appDescription"),
                        url: "https://armauto.am",
                      });
                    } else {
                      await navigator.clipboard.writeText("https://armauto.am");
                      showAlert(t("common.copied"), t("settings.linkCopied"), undefined, "success");
                    }
                  }
                } catch (e) { console.error("share error:", e); }
              }}
              colors={colors}
              isDark={isDark}
              isLast
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(150)}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {t("settings.help")}
          </Text>
          <View style={[styles.card, { backgroundColor: isDark ? colors.surface : colors.background }]}>
            <MenuItem
              icon="support"
              title={t("settings.contactSupport")}
              subtitle={t("settings.contactSupportSubtitle")}
              onPress={() => router.push("/support")}
              colors={colors}
              isDark={isDark}
            />
            <MenuItem
              icon="terms-of-service"
              title={t("settings.termsOfService")}
              onPress={() => router.push("/terms")}
              colors={colors}
              isDark={isDark}
            />
            <MenuItem
              icon="privacy-policy"
              title={t("settings.privacyPolicy")}
              onPress={() => router.push("/privacy")}
              colors={colors}
              isDark={isDark}
              isLast
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(250)}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {t("settings.security")}
          </Text>
          <View style={[styles.card, { backgroundColor: isDark ? colors.surface : colors.background }]}>
            {biometricAvailable && (
              <>
                <View style={styles.biometricRow}>
                  <View style={styles.iconWrap}>
                    <Icon name="finger-print" size={22} color={colors.text} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={[styles.menuTitle, { color: colors.text }]}>{t("biometrics.quickLogin")}</Text>
                    <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{t("biometrics.quickLoginSubtitle")}</Text>
                  </View>
                  <Switch
                    value={biometricEnabled}
                    onValueChange={handleBiometricToggle}
                    disabled={biometricToggling}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>
                <View style={[styles.divider, { backgroundColor: isDark ? colors.background : colors.surface }]} />
              </>
            )}
            <MenuItem
              icon="lock-closed"
              title={t("settings.changePassword")}
              subtitle={t("settings.changePasswordSubtitle")}
              onPress={() => router.push("/change-password")}
              colors={colors}
              isDark={isDark}
            />
            <MenuItem
              icon="trash"
              title={t("settings.deleteAccount")}
              subtitle={t("settings.deleteAccountSubtitle")}
              onPress={handleDeleteAccount}
              danger
              colors={colors}
              isDark={isDark}
              isLast
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(350)}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/about");
            }}
            style={({ pressed }) => [styles.aboutCard, { backgroundColor: isDark ? colors.surface : colors.background, opacity: pressed ? 0.9 : 1 }]}
          >
            <View style={[styles.appIconContainer, { backgroundColor: colors.text }]}>
              <Icon name="pricetag" size={32} color={colors.background} />
            </View>
            <Text style={[styles.appName, { color: colors.text }]}>armauto.am</Text>
            <Text style={[styles.appVersion, { color: colors.textSecondary }]}>
              {`${t("settings.version")} 1.0.0`}
            </Text>
            <Text style={[styles.appDescription, { color: colors.textTertiary }]}>
              {t("settings.appDescription")}
            </Text>
            <Text style={[styles.aboutLink, { color: colors.primary }]}>
              {t("settings.aboutApp")}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SCREEN_PADDING_H,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  card: {
    borderRadius: CARD_RADIUS,
    paddingHorizontal: 14,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  iconWrap: {
    width: 24,
    alignItems: "center",
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "500" as const,
  },
  menuSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 2,
    marginHorizontal: -14,
  },
  biometricRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  aboutCard: {
    borderRadius: CARD_RADIUS,
    padding: 24,
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  appIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  appName: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  appVersion: {
    fontSize: 14,
  },
  appDescription: {
    fontSize: 13,
    marginTop: 4,
  },
  aboutLink: {
    fontSize: 13,
    fontWeight: "600" as const,
    marginTop: 8,
  },
});

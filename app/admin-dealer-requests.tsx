import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
} from "react-native";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppIcons as I } from "@/constants/icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/lib/i18n";
import {
  AdminTab,
  TAB_KEYS,
  useAdminSSE,
  adminStyles as styles,
} from "@/hooks/useAdminDealerRequests";
import { DashboardSection, DealersSection } from "@/components/admin/DealerRequestCard";
import { ListingsSection } from "@/components/admin/DealerRequestDetail";
import { ReportsSection, UsersSection } from "@/components/admin/AdminRequestFilters";

export default function AdminPanelScreen() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const { t } = useTranslation();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  const isAdmin = user?.role === "admin";
  useAdminSSE(isAdmin);

  if (!isAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
        <Stack.Screen options={{ headerTitle: t("adminPanel.title") }} />
        <View style={styles.centered}>
          <Ionicons name={I.lock} size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t("adminPanel.accessDenied")}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <Stack.Screen
        options={{
          headerTitle: t("adminPanel.title"),
          headerShown: true,
          headerStyle: { backgroundColor: isDark ? colors.surface : colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <View style={[styles.tabBar, { backgroundColor: isDark ? colors.surface : colors.background, borderBottomColor: colors.border }]}>
        {TAB_KEYS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab.key);
              }}
              style={[styles.tabItem, isActive && { borderBottomColor: colors.accentBlue, borderBottomWidth: 2 }]}
            >
              <Ionicons name={tab.icon} size={18} color={isActive ? colors.accentBlue : colors.textTertiary} />
              <Text style={[styles.tabLabel, { color: isActive ? colors.accentBlue : colors.textTertiary }]}>
                {t(tab.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === "dashboard" && <DashboardSection colors={colors} isDark={isDark} insets={insets} />}
        {activeTab === "dealers" && <DealersSection colors={colors} isDark={isDark} insets={insets} />}
        {activeTab === "listings" && <ListingsSection colors={colors} isDark={isDark} insets={insets} />}
        {activeTab === "reports" && <ReportsSection colors={colors} isDark={isDark} insets={insets} />}
        {activeTab === "users" && <UsersSection colors={colors} isDark={isDark} insets={insets} />}
      </View>
    </View>
  );
}

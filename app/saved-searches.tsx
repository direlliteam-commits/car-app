import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
} from "react-native";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useAlert } from "@/contexts/AlertContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { AppIcons as I } from "@/constants/icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/constants/colors";
import { useCars } from "@/contexts/CarsContext";
import { useSavedSearches } from "@/contexts/SavedSearchContext";
import { EmptyState } from "@/components/EmptyState";
import { SavedSearch } from "@/types/car";
import { formatShortDate, usdToDisplayRounded, getCurrencySymbol } from "@/lib/formatters";
import { useTranslation } from "@/lib/i18n";
import { ScreenHeader } from "@/components/ScreenHeader";
import { CARD_RADIUS, HEADER_CONTENT_PADDING_H, WEB_TOP_INSET } from "@/constants/layout";

export default function SavedSearchesScreen() {
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useColors(colorScheme);
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const { setFilters } = useCars();
  const { savedSearches, deleteSearch, toggleSearchNotifications, refreshSavedSearches } = useSavedSearches();
  const { t } = useTranslation();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshSavedSearches();
    setRefreshing(false);
  }, []);

  const count = savedSearches.length;

  const handleApplySearch = (search: SavedSearch) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilters(search.filters);
    router.push("/search-results");
  };

  const handleDeleteSearch = (search: SavedSearch) => {
    showAlert(
      t("savedSearches.deleteConfirm"),
      `${search.name} ${t("savedSearches.deleteMessage")}`,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("savedSearches.delete"),
          style: "destructive",
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await deleteSearch(search.id);
          },
        },
      ]
    );
  };

  const handleToggleNotifications = async (search: SavedSearch) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleSearchNotifications(search.id);
  };

  const getFiltersSummary = (search: SavedSearch): string => {
    const parts: string[] = [];
    const f = search.filters;

    if (f.vehicleSelections && f.vehicleSelections.length > 0) {
      parts.push(f.vehicleSelections.map(v => v.model ? `${v.brand} ${v.model}` : v.brand).join(", "));
    }
    if (f.priceTo) parts.push(`${t("savedSearches.upTo")} ${getCurrencySymbol()}${usdToDisplayRounded(f.priceTo).toLocaleString()}`);
    if (f.priceFrom) parts.push(`${t("savedSearches.from")} ${getCurrencySymbol()}${usdToDisplayRounded(f.priceFrom).toLocaleString()}`);
    if (f.yearFrom || f.yearTo) {
      if (f.yearFrom && f.yearTo) parts.push(`${f.yearFrom}-${f.yearTo} ${t("savedSearches.year")}`);
      else if (f.yearFrom) parts.push(`${t("savedSearches.from")} ${f.yearFrom} ${t("savedSearches.year")}`);
      else if (f.yearTo) parts.push(`${t("savedSearches.upTo")} ${f.yearTo} ${t("savedSearches.year")}`);
    }
    if (f.conditions && f.conditions.length > 0) {
      const conditionLabels: Record<string, string> = { new: t("savedSearches.condNew"), used: t("savedSearches.condUsed"), damaged: t("savedSearches.condDamaged") };
      parts.push(f.conditions.map(c => conditionLabels[c]).filter(Boolean).join(", "));
    }
    if (f.ownersCounts && f.ownersCounts.length > 0) parts.push(`${f.ownersCounts.join(", ")} ${t("savedSearches.owners")}`);
    if (f.accidentHistories?.includes("none")) parts.push(t("savedSearches.noAccidents"));
    return parts.length > 0 ? parts.slice(0, 4).join(" · ") : t("savedSearches.allCars");
  };

  const renderSearchItem = ({ item }: { item: SavedSearch }) => (
    <Pressable
      onPress={() => handleApplySearch(item)}
      style={({ pressed }) => [
        styles.searchCard,
        { backgroundColor: isDark ? colors.surface : colors.background, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.searchName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={[styles.resultsBadge, { backgroundColor: colors.accentBlue + (isDark ? "20" : "12") }]}>
            <Text style={[styles.resultsText, { color: colors.accentBlue }]}>
              {item.resultsCount} {t("savedSearches.auto")}
            </Text>
          </View>
        </View>

        <Text style={[styles.searchFilters, { color: colors.textSecondary }]} numberOfLines={2}>
          {getFiltersSummary(item)}
        </Text>
      </View>

      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <Text style={[styles.searchDate, { color: colors.textTertiary }]}>
          {formatShortDate(item.createdAt)}
        </Text>

        <View style={styles.cardActions}>
          <Pressable
            onPress={() => handleToggleNotifications(item)}
            style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.5 : 1 }]}
            hitSlop={8}
          >
            <Ionicons
              name={item.notificationsEnabled ? "notifications" : "notifications-off-outline"}
              size={18}
              color={item.notificationsEnabled ? colors.accentBlue : colors.textTertiary}
            />
          </Pressable>
          <Pressable
            onPress={() => handleDeleteSearch(item)}
            style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.5 : 1 }]}
            hitSlop={8}
          >
            <Ionicons name={I.delete} size={18} color={colors.error} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScreenHeader title={t("savedSearches.title")} backgroundColor={isDark ? colors.surface : colors.background} />

      {count > 0 && (
        <View style={[styles.countBar, { borderBottomColor: colors.border }]}>
          <View style={[styles.countBadge, { backgroundColor: colors.accentBlue + (isDark ? "20" : "12") }]}>
            <Ionicons name={I.bookmark} size={14} color={colors.accentBlue} />
            <Text style={[styles.countText, { color: colors.accentBlue }]}>
              {count} {count === 1 ? t("savedSearches.search1") : count < 5 ? t("savedSearches.search2to4") : t("savedSearches.search5plus")}
            </Text>
          </View>
        </View>
      )}

      {count === 0 ? (
        <EmptyState
          icon="bookmark"
          title={t("savedSearches.empty")}
          subtitle={t("savedSearches.emptySubtitle")}
        />
      ) : (
        <FlatList
          data={savedSearches}
          renderItem={renderSearchItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 16 },
          ]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: HEADER_CONTENT_PADDING_H,
    paddingBottom: 12,
    gap: 10,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
  },
  countBar: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  countText: {
    fontSize: 13,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  searchCard: {
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
  },
  cardTop: {
    padding: 14,
    gap: 8,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  searchName: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  resultsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  resultsText: {
    fontSize: 12,
    fontWeight: "600",
  },
  searchFilters: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  searchDate: {
    fontSize: 12,
    fontWeight: "500",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionBtn: {
    padding: 4,
  },
});

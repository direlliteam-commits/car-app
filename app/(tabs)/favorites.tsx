import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  RefreshControl,
  ScrollView,
  Dimensions,
  LayoutChangeEvent,
} from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { useLocalSearchParams } from "expo-router";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/constants/colors";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useAuth } from "@/contexts/AuthContext";
import { CarCard } from "@/components/CarCard";
import { EmptyState } from "@/components/EmptyState";
import { FavoritesListSkeleton } from "@/components/SkeletonCard";
import { useTranslation } from "@/lib/i18n";
import { useCars } from "@/contexts/CarsContext";
import { useRecentlyViewed } from "@/contexts/RecentlyViewedContext";
import { useAlert } from "@/contexts/AlertContext";
import { useSavedSearches } from "@/contexts/SavedSearchContext";
import { useComparison } from "@/contexts/ComparisonContext";
import { useQueryClient } from "@tanstack/react-query";
import { SavedSearch } from "@/types/car";
import { Image } from "expo-image";
import { resolveMediaUri } from "@/lib/media";
import { formatShortDate, usdToDisplayRounded, getCurrencySymbol } from "@/lib/formatters";
import {
  formatPrice,
  formatMileage,
  formatEngineVolume,
  formatHorsepower,
  getBodyTypeLabel,
  getFuelTypeLabel,
  getTransmissionLabel,
  getDriveTypeLabel,
  getConditionLabel,
  getSteeringWheelLabel,
  getOwnersCountLabel,
  getAccidentHistoryLabel,
  getListingShortTitle,
} from "@/lib/formatters";
import { formatListingLocation } from "@/lib/location-labels";
import { SCREEN_PADDING_H, CARD_GAP, CARD_PADDING, CARD_PADDING_H, CARD_RADIUS, TAB_BAR_HEIGHT, WEB_BOTTOM_INSET } from "@/constants/layout";

import { ScreenHeader } from "@/components/ScreenHeader";
import { AppIcons as I } from "@/constants/icons";
import { API } from "@/lib/api-endpoints";

const { width } = Dimensions.get("window");

type TabKey = "listings" | "searches" | "comparisons" | "viewed";

type HighlightMode = "lowest" | "highest" | "none";

interface CompareRowProps {
  label: string;
  values: string[];
  rawValues?: number[];
  highlight?: HighlightMode;
  colors: ReturnType<typeof useColors>;
  iconName?: keyof typeof Ionicons.glyphMap;
}

function CompareRow({ label, values, rawValues, highlight = "none", colors, iconName }: CompareRowProps) {
  const bestIdx = useMemo(() => {
    if (highlight === "none" || !rawValues || rawValues.length < 2) return -1;
    const valid = rawValues.map((v, i) => ({ v, i })).filter(x => !isNaN(x.v) && x.v > 0);
    if (valid.length < 2) return -1;
    if (highlight === "lowest") return valid.reduce((a, b) => (a.v < b.v ? a : b)).i;
    return valid.reduce((a, b) => (a.v > b.v ? a : b)).i;
  }, [rawValues, highlight]);

  return (
    <View style={[rowStyles.row, { borderBottomColor: colors.border }]}>
      <View style={rowStyles.labelRow}>
        {iconName && <Ionicons name={iconName} size={13} color={colors.textTertiary} />}
        <Text style={[rowStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      </View>
      <View style={rowStyles.values}>
        {values.map((val, index) => {
          const isBest = bestIdx === index;
          return (
            <View key={index} style={[rowStyles.valueCell, isBest && { backgroundColor: colors.successLight, borderRadius: 6 }]}>
              <Text
                style={[
                  rowStyles.value,
                  { color: isBest ? colors.success : colors.text },
                  isBest && { fontWeight: "700" as const },
                ]}
                numberOfLines={2}
              >
                {val}
              </Text>
              {isBest && (
                <Ionicons name={I.verified} size={12} color={colors.success} style={{ marginTop: 2 }} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { paddingHorizontal: CARD_PADDING, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 },
  label: { fontSize: 12, fontWeight: "500" as const },
  values: { flexDirection: "row", gap: 8 },
  valueCell: { flex: 1, paddingVertical: 3, paddingHorizontal: 5, alignItems: "center" },
  value: { fontSize: 14, fontWeight: "500" as const, textAlign: "center" },
});

function CompareSection({ title, iconName, children, colors, isDark }: { title: string; iconName: keyof typeof Ionicons.glyphMap; children: React.ReactNode; colors: ReturnType<typeof useColors>; isDark: boolean }) {
  return (
    <View style={[sectionStyles.section, { backgroundColor: isDark ? colors.surface : colors.background }]}>
      <View style={sectionStyles.sectionHeader}>
        <Ionicons name={iconName} size={16} color={colors.accentBlue} />
        <Text style={[sectionStyles.sectionTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  section: { marginBottom: CARD_GAP, marginHorizontal: 0, borderRadius: CARD_RADIUS, overflow: "hidden" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, paddingBottom: 6 },
  sectionTitle: { fontSize: 15, fontWeight: "700" as const },
});

export default function FavoritesScreen() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { toggleFavorite, favoriteCars, isLoadingFavorites, refreshFavorites, favorites } = useFavorites();
  const { setFilters } = useCars();
  const { recentlyViewed, recentlyViewedCars } = useRecentlyViewed();
  const viewedCarIds = useMemo(() => new Set(recentlyViewed), [recentlyViewed]);
  const { t, language } = useTranslation();
  const { showAlert } = useAlert();
  const { savedSearches, deleteSearch, toggleSearchNotifications, refreshSavedSearches } = useSavedSearches();
  const { toggleComparison, clearComparison, comparisonCars } = useComparison();
  const queryClient = useQueryClient();

  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>((tabParam as TabKey) || "listings");
  const tabLayouts = useRef<Record<string, { x: number; width: number }>>({}).current;
  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);
  const indicatorReady = useRef(false);

  const indicatorStyle = useAnimatedStyle(() => ({
    left: indicatorX.value,
    width: indicatorW.value,
  }));

  const animateIndicator = useCallback((tab: string) => {
    const layout = tabLayouts[tab];
    if (!layout) return;
    const padding = 10;
    const targetX = layout.x + padding;
    const targetW = layout.width - padding * 2;
    if (!indicatorReady.current) {
      indicatorX.value = targetX;
      indicatorW.value = targetW;
      indicatorReady.current = true;
      return;
    }
    const timingConfig = { duration: 250, easing: Easing.out(Easing.cubic) };
    indicatorX.value = withTiming(targetX, timingConfig);
    indicatorW.value = withTiming(targetW, timingConfig);
  }, [tabLayouts, indicatorX, indicatorW]);

  useEffect(() => {
    animateIndicator(activeTab);
  }, [activeTab, animateIndicator]);

  const handleCarPress = (carId: string) => {
    router.push(`/car/${carId}`);
  };

  const handleToggleFavorite = useCallback(
    async (carId: string) => {
      await toggleFavorite(carId);
    },
    [toggleFavorite],
  );

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === "listings") {
      refreshFavorites();
    } else if (activeTab === "searches") {
      await refreshSavedSearches();
    } else if (activeTab === "viewed") {
      await queryClient.invalidateQueries({ queryKey: [API.listings.byIds] });
    } else {
      await queryClient.invalidateQueries({ queryKey: [API.listings.byIds] });
    }
    setTimeout(() => setRefreshing(false), 500);
  }, [refreshFavorites, refreshSavedSearches, activeTab]);

  const tabBarBottom = insets.bottom + TAB_BAR_HEIGHT + WEB_BOTTOM_INSET;

  const getCountWord = (count: number) => {
    if (count === 1) return t("favorites.car1");
    if (count >= 2 && count <= 4) return t("favorites.car2");
    return t("favorites.car5");
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "listings", label: t("favorites.tabListings") },
    { key: "searches", label: t("favorites.tabSearches") },
    { key: "comparisons", label: t("favorites.tabComparisons") },
    { key: "viewed", label: t("favorites.tabViewed") },
  ];

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

  const handleRemoveComparison = async (carId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleComparison(carId);
  };

  const handleClearComparison = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearComparison();
  };

  const cardWidth = comparisonCars.length > 0 ? (width - 56) / comparisonCars.length : 100;

  const verdictText = useMemo(() => {
    if (comparisonCars.length < 2) return null;
    const scores = comparisonCars.map((car) => {
      let score = 0;
      const prices = comparisonCars.map(c => c.price);
      const years = comparisonCars.map(c => c.year);
      const mileages = comparisonCars.map(c => c.mileage);
      const hps = comparisonCars.map(c => c.horsepower);
      if (car.price === Math.min(...prices)) score += 2;
      if (car.year === Math.max(...years)) score += 2;
      if (car.mileage === Math.min(...mileages.filter(m => m > 0))) score += 1;
      if (car.horsepower === Math.max(...hps.filter(h => h > 0))) score += 1;
      return { car, score };
    });
    scores.sort((a, b) => b.score - a.score);
    if (scores[0].score > scores[1].score) {
      return `${getListingShortTitle(scores[0].car)} ${t("comparison.leadsBy")}`;
    }
    return t("comparison.similar");
  }, [comparisonCars]);

  const tabBg = isDark ? colors.surface : colors.background;

  const renderTabBar = () => (
    <View style={styles.tabBarWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.tabBar, { borderBottomColor: colors.border, backgroundColor: tabBg }]}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab(tab.key);
              }}
              onLayout={(e: LayoutChangeEvent) => {
                const { x, width } = e.nativeEvent.layout;
                tabLayouts[tab.key] = { x, width };
                if (tab.key === activeTab) animateIndicator(tab.key);
              }}
              style={styles.tabItem}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? colors.text : colors.textTertiary },
                  isActive && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
        <Animated.View style={[styles.tabIndicator, { backgroundColor: colors.text }, indicatorStyle]} />
      </ScrollView>
    </View>
  );

  const renderEmptyFavorites = () => (
    <EmptyState
      image={require("@/assets/images/empty-favorites.png")}
      title={t("favorites.noActiveListings")}
      subtitle={t("favorites.noActiveSubtitle")}
      actionLabel={t("favorites.goToCatalog")}
      onAction={() => router.push("/")}
    />
  );

  const renderListingsTab = () => {
    if (isLoadingFavorites && favorites.length > 0) {
      return <FavoritesListSkeleton count={3} />;
    }

    return (
      <FlatList
        data={favoriteCars}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarBottom + 16 },
          favoriteCars.length === 0 && styles.emptyList,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accentBlue}
          />
        }
        renderItem={({ item }) => (
          <CarCard
            car={item}
            onPress={() => handleCarPress(item.id)}
            onFavoritePress={() => handleToggleFavorite(item.id)}
            isViewed={viewedCarIds.has(item.id)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: CARD_GAP }} />}
        extraData={viewedCarIds}
        ListEmptyComponent={renderEmptyFavorites}
        removeClippedSubviews
        maxToRenderPerBatch={6}
        windowSize={5}
        initialNumToRender={6}
      />
    );
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
          <View style={[styles.resultsBadge, { backgroundColor: colors.accentBlueLight }]}>
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

  const renderSearchesTab = () => {
    if (savedSearches.length === 0) {
      return (
        <EmptyState
          image={require("@/assets/images/empty-searches.png")}
          title={t("savedSearches.empty")}
          subtitle={t("savedSearches.emptySubtitle")}
          actionLabel={t("favorites.goToCatalog")}
          onAction={() => router.push("/")}
        />
      );
    }

    return (
      <FlatList
        data={savedSearches}
        renderItem={renderSearchItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.searchListContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: CARD_GAP }} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentBlue} />
        }
      />
    );
  };

  const renderComparisonsTab = () => {
    if (comparisonCars.length === 0) {
      return (
        <EmptyState
          image={require("@/assets/images/empty-comparisons.png")}
          title={t("comparison.empty")}
          subtitle={t("comparison.emptySubtitle")}
          actionLabel={t("comparison.toCatalog")}
          onAction={() => router.push("/")}
        />
      );
    }

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentBlue} />}
      >
        <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: CARD_PADDING, paddingVertical: 8 }}>
          <Pressable onPress={handleClearComparison} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, flexDirection: "row", alignItems: "center", gap: 4 })}>
            <Ionicons name={I.delete} size={18} color={colors.error} />
            <Text style={{ fontSize: 13, color: colors.error, fontWeight: "500" as const }}>{t("comparison.clearAll")}</Text>
          </Pressable>
        </View>

        <View style={[compStyles.carsRow, { backgroundColor: isDark ? colors.surface : colors.background }]}>
          {comparisonCars.map((car) => (
            <Pressable
              key={car.id}
              onPress={() => router.push(`/car/${car.id}`)}
              style={[compStyles.carCard, { width: cardWidth }]}
            >
              <View style={compStyles.imageWrapper}>
                <Image
                  source={car.images?.[0] ? { uri: resolveMediaUri(car.images[0]) } : undefined}
                  style={compStyles.carImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                <Pressable
                  onPress={() => handleRemoveComparison(car.id)}
                  style={({ pressed }) => [
                    compStyles.removeButton,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Ionicons name={I.close} size={14} color="#fff" />
                </Pressable>
              </View>
              <Text style={[compStyles.carTitle, { color: colors.text }]} numberOfLines={1}>
                {getListingShortTitle(car)}
              </Text>
              <Text style={[compStyles.carYear, { color: colors.textSecondary }]}>
                {car.year} {t("comparison.yearSuffix")}
              </Text>
              <Text style={[compStyles.carPrice, { color: colors.accentBlue }]}>
                {formatPrice(car.price, car.currency)}
              </Text>
            </Pressable>
          ))}
          {comparisonCars.length < 3 && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/");
              }}
              style={[compStyles.addCard, { width: cardWidth, borderColor: colors.border }]}
            >
              <Ionicons name={I.add} size={32} color={colors.textTertiary} />
              <Text style={[compStyles.addCardText, { color: colors.textTertiary }]}>{t("comparison.add")}</Text>
            </Pressable>
          )}
        </View>

        {verdictText && (
          <View style={[compStyles.verdictBanner, { backgroundColor: colors.accentBlueLight, borderColor: colors.accentBlueLight }]}>
            <Ionicons name={I.trophy} size={18} color={colors.accentBlue} />
            <Text style={[compStyles.verdictText, { color: colors.text }]}>{verdictText}</Text>
          </View>
        )}

        <CompareSection title={t("comparison.priceSection")} iconName="pricetag" colors={colors} isDark={isDark}>
          <CompareRow label={t("comparison.price")} values={comparisonCars.map(c => formatPrice(c.price, c.currency))} rawValues={comparisonCars.map(c => c.price)} highlight="lowest" colors={colors} iconName="cash-outline" />
          {comparisonCars.some(c => c.avgMarketPrice) && (
            <CompareRow label={t("comparison.avgMarket")} values={comparisonCars.map(c => c.avgMarketPrice ? formatPrice(c.avgMarketPrice, c.currency) : "—")} colors={colors} iconName="trending-up" />
          )}
        </CompareSection>

        <CompareSection title={t("comparison.mainSection")} iconName="car-sport" colors={colors} isDark={isDark}>
          <CompareRow label={t("comparison.yearLabel")} values={comparisonCars.map(c => c.year.toString())} rawValues={comparisonCars.map(c => c.year)} highlight="highest" colors={colors} iconName="calendar-outline" />
          <CompareRow label={t("comparison.mileage")} values={comparisonCars.map(c => formatMileage(c.mileage))} rawValues={comparisonCars.map(c => c.mileage)} highlight="lowest" colors={colors} iconName="speedometer-outline" />
          <CompareRow label={t("comparison.body")} values={comparisonCars.map(c => getBodyTypeLabel(c.bodyType))} colors={colors} iconName="car-outline" />
          <CompareRow label={t("comparison.color")} values={comparisonCars.map(c => c.color || "—")} colors={colors} iconName="color-palette-outline" />
          <CompareRow label={t("comparison.condition")} values={comparisonCars.map(c => getConditionLabel(c.condition))} colors={colors} iconName="shield-checkmark-outline" />
        </CompareSection>

        <CompareSection title={t("comparison.engineSection")} iconName="flash" colors={colors} isDark={isDark}>
          <CompareRow label={t("comparison.volume")} values={comparisonCars.map(c => formatEngineVolume(c.engineVolume))} colors={colors} iconName="cube-outline" />
          <CompareRow label={t("comparison.power")} values={comparisonCars.map(c => formatHorsepower(c.horsepower))} rawValues={comparisonCars.map(c => c.horsepower)} highlight="highest" colors={colors} iconName="rocket-outline" />
          <CompareRow label={t("comparison.fuel")} values={comparisonCars.map(c => getFuelTypeLabel(c.fuelType))} colors={colors} iconName="water-outline" />
          {comparisonCars.some(c => c.acceleration) && (
            <CompareRow label={t("comparison.acceleration")} values={comparisonCars.map(c => c.acceleration ? `${c.acceleration} ${t("comparison.secSuffix")}` : "—")} rawValues={comparisonCars.map(c => c.acceleration || 0)} highlight="lowest" colors={colors} iconName="timer-outline" />
          )}
          {comparisonCars.some(c => c.fuelConsumption) && (
            <CompareRow label={t("comparison.consumption")} values={comparisonCars.map(c => c.fuelConsumption ? `${c.fuelConsumption} ${t("comparison.consumptionUnit")}` : "—")} rawValues={comparisonCars.map(c => c.fuelConsumption || 0)} highlight="lowest" colors={colors} iconName="leaf-outline" />
          )}
        </CompareSection>

        <CompareSection title={t("comparison.transmissionSection")} iconName="cog" colors={colors} isDark={isDark}>
          <CompareRow label={t("comparison.gearbox")} values={comparisonCars.map(c => getTransmissionLabel(c.transmission))} colors={colors} iconName="settings-outline" />
          <CompareRow label={t("comparison.drive")} values={comparisonCars.map(c => getDriveTypeLabel(c.driveType))} colors={colors} iconName="git-branch-outline" />
          <CompareRow label={t("comparison.steering")} values={comparisonCars.map(c => c.vehicleType === "moto" ? "—" : getSteeringWheelLabel(c.steeringWheel))} colors={colors} iconName="navigate-outline" />
        </CompareSection>

        <CompareSection title={t("comparison.historySection")} iconName="document-text" colors={colors} isDark={isDark}>
          <CompareRow label={t("comparison.owners")} values={comparisonCars.map(c => getOwnersCountLabel(c.ownersCount))} colors={colors} iconName="people-outline" />
          <CompareRow label={t("comparison.accidents")} values={comparisonCars.map(c => getAccidentHistoryLabel(c.accidentHistory))} colors={colors} iconName="warning-outline" />
          <CompareRow label={t("comparison.keys")} values={comparisonCars.map(c => `${c.keysCount} ${t("comparison.keysSuffix")}`)} colors={colors} iconName="key-outline" />
          <CompareRow label={t("comparison.customs")} values={comparisonCars.map(c => c.customsCleared ? t("comparison.yes") : c.customsCleared === false ? t("comparison.no") : "—")} colors={colors} iconName="checkbox-outline" />
        </CompareSection>

        <CompareSection title={t("comparison.extraSection")} iconName="options" colors={colors} isDark={isDark}>
          <CompareRow label={t("comparison.gasEquipment")} values={comparisonCars.map(c => c.hasGasEquipment ? t("comparison.hasIt") : t("comparison.no"))} colors={colors} iconName="flame-outline" />
          <CompareRow label={t("comparison.exchange")} values={comparisonCars.map(c => c.exchangePossible ? t("comparison.exchangeYes") : t("comparison.no"))} colors={colors} iconName="swap-horizontal-outline" />
          <CompareRow label={t("comparison.paymentInParts")} values={comparisonCars.map(c => c.installmentPossible ? t("comparison.installmentYes") : t("comparison.no"))} colors={colors} iconName="card-outline" />
          <CompareRow label={t("comparison.credit")} values={comparisonCars.map(c => c.creditAvailable ? t("comparison.creditYes") : t("comparison.no"))} colors={colors} iconName="cash-outline" />
        </CompareSection>

        {comparisonCars.some(c => c.equipment && c.equipment.length > 0) && (
          <CompareSection title={t("comparison.equipmentSection")} iconName="list" colors={colors} isDark={isDark}>
            <CompareRow label={t("comparison.optionsCount")} values={comparisonCars.map(c => `${c.equipment?.length || 0}`)} rawValues={comparisonCars.map(c => c.equipment?.length || 0)} highlight="highest" colors={colors} iconName="checkmark-done-outline" />
          </CompareSection>
        )}

        <CompareSection title={t("comparison.locationSection")} iconName="location" colors={colors} isDark={isDark}>
          <CompareRow label={t("comparison.city")} values={comparisonCars.map(c => formatListingLocation(c.location, language) || "—")} colors={colors} iconName="pin-outline" />
          <CompareRow label={t("comparison.sellerLabel")} values={comparisonCars.map(c => c.sellerName || "—")} colors={colors} iconName="person-outline" />
        </CompareSection>
      </ScrollView>
    );
  };

  const renderViewedTab = () => {
    if (recentlyViewedCars.length === 0) {
      return (
        <EmptyState
          image={require("@/assets/images/empty-viewed.png")}
          title={t("favorites.viewedEmpty")}
          subtitle={t("favorites.viewedEmptySubtitle")}
          actionLabel={t("favorites.goToCatalog")}
          onAction={() => router.push("/")}
        />
      );
    }

    return (
      <FlatList
        data={recentlyViewedCars}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: tabBarBottom + 16 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accentBlue}
          />
        }
        renderItem={({ item }) => (
          <CarCard
            car={item}
            onPress={() => handleCarPress(item.id)}
            onFavoritePress={() => handleToggleFavorite(item.id)}
            isViewed={false}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: CARD_GAP }} />}
        removeClippedSubviews
        maxToRenderPerBatch={6}
        windowSize={5}
        initialNumToRender={6}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScreenHeader
        title={t("favorites.title")}
        hideBack
        backgroundColor={isDark ? colors.surface : colors.background}
      />

      {isAuthenticated ? (
        <>
          {renderTabBar()}
          <View style={{ flex: 1 }}>
            {activeTab === "listings" && renderListingsTab()}
            {activeTab === "searches" && renderSearchesTab()}
            {activeTab === "comparisons" && renderComparisonsTab()}
            {activeTab === "viewed" && renderViewedTab()}
          </View>
        </>
      ) : (
        <EmptyState
          image={require("@/assets/images/empty-favorites.png")}
          title={t("favorites.saveTitle")}
          subtitle={t("favorites.saveSubtitle")}
          actionLabel={t("favorites.loginButton")}
          onAction={() => router.push("/auth")}
        />
      )}
    </View>
  );
}

const compStyles = StyleSheet.create({
  carsRow: { flexDirection: "row", paddingHorizontal: CARD_PADDING_H, paddingVertical: 14, gap: CARD_GAP, marginBottom: CARD_GAP, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  carCard: { flex: 1, gap: 4, alignItems: "center" },
  imageWrapper: { position: "relative", width: "100%", height: 90, borderRadius: 12, overflow: "hidden" },
  carImage: { width: "100%", height: "100%" },
  removeButton: { position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
  carTitle: { fontSize: 13, fontWeight: "700" as const, textAlign: "center" },
  carYear: { fontSize: 11, textAlign: "center" },
  carPrice: { fontSize: 15, fontWeight: "800" as const },
  addCard: { flex: 1, height: 90, borderRadius: 12, borderWidth: 2, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 4 },
  addCardText: { fontSize: 12, fontWeight: "500" as const },
  verdictBanner: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 0, marginBottom: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  verdictText: { flex: 1, fontSize: 13, fontWeight: "600" as const, lineHeight: 18 },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBarWrapper: {
    position: "relative",
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 2,
  },
  tabItem: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    position: "relative",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  tabTextActive: {},
  tabIndicator: {
    position: "absolute",
    bottom: -2,
    height: 2.5,
    borderRadius: 1,
  },
  listContent: {
  },
  emptyList: {
    flex: 1,
  },
  searchListContent: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingTop: 10,
  },
  searchCard: {
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
  },
  cardTop: {
    padding: CARD_PADDING,
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
    paddingHorizontal: CARD_PADDING_H,
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
  emptyFavContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  actionBtn: {
    padding: 4,
  },
});

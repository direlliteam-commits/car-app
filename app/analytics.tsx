import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { useColors } from "@/constants/colors";
import { useTranslation } from "@/lib/i18n";
import { CARD_GAP, CARD_PADDING, CARD_PADDING_H, CARD_RADIUS, SECTION_GAP, WEB_TOP_INSET } from "@/constants/layout";
import { ScreenHeader } from "@/components/ScreenHeader";
import { VehicleCascadePicker } from "@/components/filters/VehicleCascadePicker";
import { VehicleCascadeProvider } from "@/contexts/VehicleCascadeContext";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { AnalyticsMyTab } from "@/components/analytics/AnalyticsMyTab";
import { AnalyticsMarketTab } from "@/components/analytics/AnalyticsMarketTab";

export default function AnalyticsScreen() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const webTopInset = WEB_TOP_INSET;

  const data = useAnalyticsData();

  const headerBg = isDark ? colors.surface : colors.background;
  const containerBg = isDark ? colors.background : colors.surface;

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={[styles.headerBlock, { paddingTop: insets.top + webTopInset, backgroundColor: headerBg }]}>
        <ScreenHeader
          title={t("analytics.headerTitle")}
          noSafeArea
          backgroundColor="transparent"
          paddingBottom={0}
        />

        {data.isAuthenticated && (
          <>
            <View style={styles.summaryStatsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.summaryStatValue, { color: colors.text }]}>{data.sellerStats?.totalViews ?? 0}</Text>
                <Text style={[styles.summaryStatLabel, { color: colors.textTertiary }]}>{t("analytics.views")}</Text>
              </View>
              <View style={[styles.statVDivider, { backgroundColor: isDark ? colors.border : colors.divider }]} />
              <View style={styles.statItem}>
                <Text style={[styles.summaryStatValue, { color: colors.text }]}>{data.sellerStats?.totalFavorites ?? 0}</Text>
                <Text style={[styles.summaryStatLabel, { color: colors.textTertiary }]}>{t("analytics.favorites")}</Text>
              </View>
              <View style={[styles.statVDivider, { backgroundColor: isDark ? colors.border : colors.divider }]} />
              <View style={styles.statItem}>
                <Text style={[styles.summaryStatValue, { color: colors.text }]}>{data.sellerStats?.activeListings ?? 0}</Text>
                <Text style={[styles.summaryStatLabel, { color: colors.textTertiary }]}>{t("analytics.activeListings")}</Text>
              </View>
              <View style={[styles.statVDivider, { backgroundColor: isDark ? colors.border : colors.divider }]} />
              <View style={styles.statItem}>
                <Text style={[styles.summaryStatValue, { color: colors.text }]}>{data.sellerStats?.soldListings ?? 0}</Text>
                <Text style={[styles.summaryStatLabel, { color: colors.textTertiary }]}>{t("analytics.sold")}</Text>
              </View>
            </View>

            <View style={styles.tabsRow}>
              {(["my", "market"] as const).map((tab) => {
                const isActive = data.activeTab === tab;
                return (
                  <Pressable
                    key={tab}
                    onPress={() => { Haptics.selectionAsync(); data.setActiveTab(tab); }}
                    style={[
                      styles.tabChip,
                      {
                        backgroundColor: isActive ? (isDark ? colors.border : colors.text) : "transparent",
                        borderColor: isActive ? (isDark ? colors.border : colors.text) : (isDark ? colors.border : colors.trackInactive),
                      },
                    ]}
                  >
                    <Text style={[styles.tabChipText, { color: isActive ? colors.textInverse : colors.textSecondary }]}>
                      {tab === "my" ? t("analytics.myListingsTab") : t("analytics.marketTab")}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={data.refreshing} onRefresh={data.onRefresh} tintColor={colors.primary} />}
      >
        {data.activeTab === "my" && data.isAuthenticated && (
          <AnalyticsMyTab
            colors={colors}
            isDark={isDark}
            userTier={data.userTier}
            hasPremiumAccess={data.hasPremiumAccess}
            isLoadingMyTab={data.isLoadingMyTab}
            dealerAnalytics={data.dealerAnalytics}
            viewsTrend={data.viewsTrend}
            maxTrendViews={data.maxTrendViews}
            topListing={data.topListing}
            listingStats={data.listingStats}
          />
        )}

        {data.activeTab === "market" && (
          <AnalyticsMarketTab
            colors={colors}
            isDark={isDark}
            hasPremiumAccess={data.hasPremiumAccess}
            marketStats={data.marketStats}
            isLoadingStats={data.isLoadingStats}
            topBrands={data.topBrands}
            priceDistribution={data.priceDistribution}
            maxDistributionCount={data.maxDistributionCount}
            priceData={data.priceData}
            isLoadingPrice={data.isLoadingPrice}
            yearPrices={data.yearPrices}
            maxYearPrice={data.maxYearPrice}
            topModels={data.topModels}
            selectedBrandName={data.selectedBrandName}
            selectedModelName={data.selectedModelName}
            selectedGenerationName={data.selectedGenerationName}
            selectedCondition={data.selectedCondition}
            setSelectedCondition={data.setSelectedCondition}
            openCascadePicker={data.openCascadePicker}
            handleClearSelection={data.handleClearSelection}
          />
        )}
      </ScrollView>

      <VehicleCascadeProvider value={useMemo(() => ({
        cascadeField: data.pickerField,
        filteredBrands: data.filteredBrands,
        filteredModels: data.filteredModels,
        cascadeGenerations: data.pickerGenerations,
        brandSearch: data.brandSearch, setBrandSearch: data.setBrandSearch,
        modelSearch: data.modelSearch, setModelSearch: data.setModelSearch,
        brandCategory: data.brandCategory, setBrandCategory: data.setBrandCategory,
        brandsLoading: data.brandsLoading, modelsLoading: data.modelsLoading,
        generationsLoading: data.generationsLoading,
        configurationsLoading: false, modificationsLoading: false,
        onSelectBrand: data.onSelectBrand,
        onSelectModel: data.onSelectModel,
        onSelectGeneration: data.onSelectGeneration,
        onSkipGeneration: data.onSkipGeneration,
        onBack: data.onPickerBack,
        colors, isDark,
        selectedBrandName: data.selectedBrandName,
        selectedModelName: data.selectedModelName,
      }), [
        data.pickerField, data.filteredBrands, data.filteredModels, data.pickerGenerations,
        data.brandSearch, data.setBrandSearch, data.modelSearch, data.setModelSearch,
        data.brandCategory, data.setBrandCategory, data.brandsLoading, data.modelsLoading,
        data.generationsLoading, data.onSelectBrand, data.onSelectModel,
        data.onSelectGeneration, data.onSkipGeneration, data.onPickerBack,
        colors, isDark, data.selectedBrandName, data.selectedModelName,
      ])}>
        <VehicleCascadePicker
          visible={data.showCascadePicker}
          onClose={data.closeCascadePicker}
        />
      </VehicleCascadeProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBlock: {
    borderBottomLeftRadius: CARD_RADIUS,
    borderBottomRightRadius: CARD_RADIUS,
    overflow: "hidden" as const,
    marginBottom: SECTION_GAP,
  },
  summaryStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: CARD_PADDING_H,
  },
  statItem: {
    flex: 1,
    alignItems: "center" as const,
    gap: 2,
  },
  summaryStatValue: {
    fontSize: 22,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
  },
  summaryStatLabel: {
    fontSize: 11,
    fontWeight: "500" as const,
  },
  statVDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
  },
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: CARD_PADDING_H,
    gap: 8,
    paddingBottom: CARD_PADDING,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: CARD_GAP,
    paddingHorizontal: 10,
  },
});

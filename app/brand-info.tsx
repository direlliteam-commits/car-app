import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { AppIcons as I } from "@/constants/icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/constants/colors";
import { formatPrice } from "@/lib/formatters";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTranslation } from "@/lib/i18n";
import { ScreenHeader } from "@/components/ScreenHeader";
import { CARD_RADIUS, HEADER_CONTENT_PADDING_H, WEB_TOP_INSET } from "@/constants/layout";
import { API } from "@/lib/api-endpoints";

interface PriceData {
  avg: number;
  count: number;
  min: number;
  max: number;
}

export default function BrandInfoScreen() {
  const { brand, model, tab } = useLocalSearchParams<{ brand: string; model?: string; tab?: string }>();
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"info" | "journal" | "news">(
    tab === "journal" ? "journal" : tab === "news" ? "news" : "info"
  );

  // Build query key with brand and optional model
  const priceQueryKey = model
    ? `${API.analytics.price}?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`
    : `${API.analytics.price}?brand=${encodeURIComponent(brand)}`;

  const { data: priceData, isLoading: isLoadingPrice } = useQuery<PriceData>({
    queryKey: [priceQueryKey],
    enabled: !!brand,
    staleTime: 5 * 60 * 1000,
  });

  // Build title
  const title = model ? `${brand} ${model}` : brand;

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const accentGradientStart = colors.infoLight;
  const accentGradientEnd = isDark ? colors.infoLight : colors.successLight;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScreenHeader title={title} onBack={handleBack} />

      <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
        {(["info", "journal", "news"] as const).map((tabKey) => (
          <Pressable
            key={tabKey}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (tabKey === "journal") {
                router.push({
                  pathname: "/journal",
                  params: { brand, ...(model ? { model } : {}), category: "reviews" },
                });
                return;
              }
              if (tabKey === "news") {
                router.push({
                  pathname: "/journal",
                  params: { brand, ...(model ? { model } : {}), category: "article" },
                });
                return;
              }
              setActiveTab(tabKey);
            }}
            style={[
              styles.tab,
              activeTab === tabKey && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tabKey ? colors.text : colors.textSecondary },
              ]}
            >
              {tabKey === "info" ? t("brandInfo.tabInfo") : tabKey === "journal" ? t("brandInfo.tabJournal") : t("brandInfo.tabNews")}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "info" && (
          <>
            {isLoadingPrice ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : priceData ? (
              <Animated.View entering={FadeInDown.duration(400).delay(100)}>
                <View style={[styles.priceCard, { backgroundColor: isDark ? colors.surface : colors.background }]}>
                  <View style={styles.priceCardHeader}>
                    <Ionicons name={I.pricetag} size={20} color={colors.primary} />
                    <Text style={[styles.priceCardTitle, { color: colors.text }]}>
                      {t("brandInfo.avgPrice")}
                    </Text>
                  </View>

                  <View style={styles.priceGrid}>
                    <View style={[styles.priceItem, { backgroundColor: accentGradientStart }]}>
                      <Text style={[styles.priceItemLabel, { color: colors.textSecondary }]}>
                        {t("brandInfo.avg")}
                      </Text>
                      <Text style={[styles.priceItemValue, { color: colors.primary }]}>
                        {formatPrice(priceData.avg, "USD")}
                      </Text>
                    </View>
                    <View style={[styles.priceItem, { backgroundColor: accentGradientEnd }]}>
                      <Text style={[styles.priceItemLabel, { color: colors.textSecondary }]}>
                        {t("brandInfo.listings")}
                      </Text>
                      <Text style={[styles.priceItemValue, { color: colors.success }]}>
                        {priceData.count}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.priceRange}>
                    <View style={styles.priceRangeItem}>
                      <View style={[styles.priceRangeDot, { backgroundColor: colors.success }]} />
                      <Text style={[styles.priceRangeLabel, { color: colors.textSecondary }]}>
                        {t("brandInfo.min")}
                      </Text>
                      <Text style={[styles.priceRangeValue, { color: colors.text }]}>
                        {formatPrice(priceData.min, "USD")}
                      </Text>
                    </View>
                    <View style={[styles.priceRangeLine, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.priceRangeIndicator,
                          {
                            backgroundColor: colors.buttonPrimary,
                            left: priceData.max > priceData.min
                              ? `${((priceData.avg - priceData.min) / (priceData.max - priceData.min)) * 100}%`
                              : "50%",
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.priceRangeItem}>
                      <View style={[styles.priceRangeDot, { backgroundColor: colors.error }]} />
                      <Text style={[styles.priceRangeLabel, { color: colors.textSecondary }]}>
                        {t("brandInfo.max")}
                      </Text>
                      <Text style={[styles.priceRangeValue, { color: colors.text }]}>
                        {formatPrice(priceData.max, "USD")}
                      </Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            ) : null}
          </>
        )}

        {activeTab === "journal" && (
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: "/journal",
                  params: { brand, ...(model ? { model } : {}), category: "reviews" },
                });
              }}
              style={({ pressed }) => [styles.placeholderCard, { backgroundColor: isDark ? colors.surface : colors.background, opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name={I.document} size={48} color={colors.textTertiary} />
              <Text style={[styles.placeholderTitle, { color: colors.text }]}>
                {t("brandInfo.journalTitle")}
              </Text>
              <Text style={[styles.placeholderText, { color: colors.primary }]}>
                {t("brandInfo.tabJournal")} →
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {activeTab === "news" && (
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: "/journal",
                  params: { brand, ...(model ? { model } : {}), category: "article" },
                });
              }}
              style={({ pressed }) => [styles.placeholderCard, { backgroundColor: isDark ? colors.surface : colors.background, opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name={I.newspaper} size={48} color={colors.textTertiary} />
              <Text style={[styles.placeholderTitle, { color: colors.text }]}>
                {t("brandInfo.newsTitle")}
              </Text>
              <Text style={[styles.placeholderText, { color: colors.primary }]}>
                {t("brandInfo.tabNews")} →
              </Text>
            </Pressable>
          </Animated.View>
        )}
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
    flex: 1,
    fontSize: 18,
    fontWeight: "700" as const,
    textAlign: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 8,
    gap: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  priceCard: {
    borderRadius: 18,
    padding: 18,
    gap: 16,
  },
  priceCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  priceCardTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  priceGrid: {
    flexDirection: "row",
    gap: 10,
  },
  priceItem: {
    flex: 1,
    padding: 14,
    borderRadius: CARD_RADIUS,
    alignItems: "center",
    gap: 4,
  },
  priceItemLabel: {
    fontSize: 12,
  },
  priceItemValue: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  priceRange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  priceRangeItem: {
    alignItems: "center",
    gap: 2,
  },
  priceRangeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priceRangeLabel: {
    fontSize: 10,
  },
  priceRangeValue: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  priceRangeLine: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    position: "relative" as const,
  },
  priceRangeIndicator: {
    position: "absolute" as const,
    width: 12,
    height: 12,
    borderRadius: 6,
    top: -4,
    marginLeft: -6,
  },
  placeholderCard: {
    borderRadius: 18,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    textAlign: "center" as const,
  },
  placeholderText: {
    fontSize: 14,
    textAlign: "center" as const,
    lineHeight: 20,
  },
});

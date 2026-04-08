import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
  Switch,
  LayoutAnimation,
  UIManager,
  Image,
} from "react-native";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useAlert } from "@/contexts/AlertContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppIcons as I } from "@/constants/icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/query-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSSEListener } from "@/hooks/useUserSSE";
import { useTranslation } from "@/lib/i18n";
import { ScreenHeader } from "@/components/ScreenHeader";
import { CARD_GAP, CARD_PADDING, CARD_RADIUS, HEADER_CONTENT_PADDING_H, WEB_TOP_INSET } from "@/constants/layout";
import { API } from "@/lib/api-endpoints";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ProSellerStatus {
  isProSeller: boolean;
  subscription: {
    id: number;
    startDate: string;
    endDate: string;
    autoRenew: boolean;
    daysRemaining: number;
  } | null;
  config: {
    priceAmd: number;
    durationDays: number;
    maxListings: number;
    maxPhotos: number;
    canUploadVideo: boolean;
    freePromotionsMonthly: number;
    freePromotionPackage: string;
    freePromotionMaxDays: number;
    bumpIntervalDays: number;
    searchBoost: number;
  };
  promotionQuota: {
    used: number;
    remaining: number;
    limit: number;
  } | null;
}

type IoniconsName = keyof typeof Ionicons.glyphMap;

const FEATURES: { icon: IoniconsName; valueKey: string }[] = [
  { icon: "documents-outline", valueKey: "featureListings" },
  { icon: "images-outline", valueKey: "featurePhotos" },
  { icon: "videocam-outline", valueKey: "featureVideo" },
  { icon: "flash-outline", valueKey: "featureBoostPromo" },
  { icon: "shield-checkmark-outline", valueKey: "featureBadge" },
  { icon: "trending-up-outline", valueKey: "featureSearchBoost" },
  { icon: "refresh-outline", valueKey: "featureBump" },
  { icon: "analytics-outline", valueKey: "featureAnalytics" },
];

const COMPARISON_ROWS: { key: string; regular: string | boolean; pro: string | boolean; dealer: string | boolean }[] = [
  { key: "listings", regular: "3*", pro: "10", dealer: "30" },
  { key: "photos", regular: "10", pro: "15", dealer: "20" },
  { key: "video", regular: false, pro: true, dealer: true },
  { key: "promoIncluded", regular: false, pro: "2", dealer: "5" },
  { key: "searchPriority", regular: false, pro: "+5%", dealer: "+8–15%" },
  { key: "badge", regular: false, pro: true, dealer: true },
  { key: "bumpInterval", regular: "30", pro: "15", dealer: "15" },
];

export default function ProSellerScreen() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const { t } = useTranslation();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const detailColors = useMemo(() => {
    if (!isDark) return { ...colors, surface: colors.surface, surfaceElevated: colors.background };
    return { ...colors, surface: colors.background, surfaceElevated: colors.surface };
  }, [isDark, colors]);

  const [purchasing, setPurchasing] = useState(false);
  const [togglingAutoRenew, setTogglingAutoRenew] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const isDealer = user?.role === "dealer";

  useSSEListener((event) => {
    if (event.event === "wallet_update" || event.event === "account_update") {
      refreshUser();
      queryClient.invalidateQueries({ queryKey: [API.proSeller.status] });
    }
  });

  useFocusEffect(
    useCallback(() => {
      refreshUser();
      queryClient.invalidateQueries({ queryKey: [API.proSeller.status] });
    }, [refreshUser, queryClient])
  );

  const statusQuery = useQuery<ProSellerStatus>({
    queryKey: [API.proSeller.status],
    enabled: !!user && !isDealer,
  });

  const walletQuery = useQuery<{ balance: number }>({
    queryKey: [API.wallet.balance],
    enabled: !!user,
  });

  const status = statusQuery.data;
  const isProActive = status?.isProSeller ?? false;
  const subscription = status?.subscription;
  const config = status?.config;
  const quota = status?.promotionQuota;
  const walletBalance = walletQuery.data?.balance ?? 0;
  const price = config?.priceAmd ?? 7900;

  const handlePurchase = async () => {
    if (!config) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (walletBalance < price) {
      showAlert(
        t("proSeller.insufficientFunds"),
        t("proSeller.topUpFirst"),
        [
          { text: t("proSeller.goToWallet"), onPress: () => router.push("/wallet") },
          { text: t("proSeller.cancel"), style: "cancel" },
        ],
        "error"
      );
      return;
    }

    showAlert(
      isProActive ? t("proSeller.renew") : t("proSeller.confirmTitle"),
      isProActive ? t("proSeller.renewConfirmMessage") : t("proSeller.confirmMessage"),
      [
        { text: t("proSeller.cancel"), style: "cancel" },
        {
          text: t("proSeller.confirm"),
          onPress: async () => {
            setPurchasing(true);
            try {
              const endpoint = isProActive ? API.proSeller.renew : API.proSeller.purchase;
              await apiRequest("POST", endpoint);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              queryClient.invalidateQueries({ queryKey: [API.proSeller.status] });
              queryClient.invalidateQueries({ queryKey: [API.auth.listingLimits] });
              queryClient.invalidateQueries({ queryKey: [API.wallet.balance] });
              queryClient.invalidateQueries({ queryKey: [API.listings.list] });
              queryClient.invalidateQueries({ queryKey: [API.catalog.sections] });
              queryClient.invalidateQueries({ queryKey: [API.listings.my] });
              queryClient.invalidateQueries({ queryKey: [API.promotions.dealerQuota] });
              queryClient.invalidateQueries({ queryKey: [API.recentlyViewed] });
              queryClient.invalidateQueries({ queryKey: [API.stories] });
              queryClient.invalidateQueries({ queryKey: [API.transactions] });
              refreshUser();
              showAlert(
                isProActive ? t("proSeller.renewSuccessTitle") : t("proSeller.successTitle"),
                isProActive ? t("proSeller.renewSuccessMessage") : t("proSeller.successMessage"),
                undefined,
                "success"
              );
            } catch (err: any) {
              const msg = err?.message || err?.error || "Error";
              if (msg === "PRO_ALREADY_ACTIVE") {
                showAlert(t("proSeller.alreadyActive"), "");
              } else {
                showAlert(t("common.error"), msg, undefined, "error");
              }
            } finally {
              setPurchasing(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleAutoRenew = async (value: boolean) => {
    setTogglingAutoRenew(true);
    try {
      await apiRequest("POST", API.proSeller.autoRenew, { autoRenew: value });
      queryClient.invalidateQueries({ queryKey: [API.proSeller.status] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
    } finally {
      setTogglingAutoRenew(false);
    }
  };

  const toggleComparison = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowComparison(prev => !prev);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  const getFeatureText = (valueKey: string) => {
    if (valueKey === "featureListings") return `${config?.maxListings ?? 10} ${t("proSeller.featureListings")}`;
    if (valueKey === "featurePhotos") return `${config?.maxPhotos ?? 15} ${t("proSeller.featurePhotos")}`;
    if (valueKey === "featureBoostPromo") return `${config?.freePromotionsMonthly ?? 2} ${t("proSeller.featureBoostPromo")}`;
    return t(`proSeller.${valueKey}`);
  };

  if (isDealer) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
        <ScreenHeader title="PRO" backgroundColor={isDark ? colors.surface : colors.background} />
        <View style={styles.dealerProContainer}>
          <Image source={require("@/assets/images/svc-pro-3d.png")} style={styles.dealerProIcon} resizeMode="contain" />
          <Text style={[styles.dealerProTitle, { color: colors.text }]}>{t("proSeller.title")}</Text>
          <Text style={[styles.dealerProDesc, { color: colors.textSecondary }]}>{t("proSeller.dealerRedirect")}</Text>

          <Pressable
            onPress={() => router.push("/dealer-plans")}
            style={({ pressed }) => [styles.dealerProBtn, { backgroundColor: colors.text, opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name={I.pro} size={18} color={colors.background} />
            <Text style={[styles.dealerProBtnText, { color: colors.background }]}>{t("dealerPlans.headerTitle")}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const loading = statusQuery.isLoading;

  return (
    <View style={[styles.container, { backgroundColor: detailColors.surface }]}>
      <ScreenHeader title="PRO" backgroundColor={detailColors.surfaceElevated} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, Platform.OS === "web" ? 34 : 16) + 90 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: detailColors.surfaceElevated, borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
            <View style={styles.gridWrap}>
              <View style={styles.gridCell}>
                <View style={styles.iconWrap}>
                  <Ionicons name={I.starActive} size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.gridCellValue, { color: colors.text }]}>{t("proSeller.title")}</Text>
                  <Text style={[styles.gridCellLabel, { color: colors.textTertiary }]}>{t("proSeller.subtitle")}</Text>
                </View>
              </View>
              <View style={[styles.gridCell, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                <View style={styles.iconWrap}>
                  <Ionicons name={I.pricetag} size={22} color={colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.gridCellValue, { color: colors.text }]}>
                    {price.toLocaleString("ru-RU")} ֏
                  </Text>
                  <Text style={[styles.gridCellLabel, { color: colors.textTertiary }]}>
                    {t("proSeller.pricePerMonth")}
                  </Text>
                </View>
                <View style={[styles.proBadge, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)" }]}>
                  <Text style={[styles.proBadgeText, { color: colors.text }]}>PRO</Text>
                </View>
              </View>
            </View>
          </View>

          {isProActive && subscription && (
            <View style={[styles.card, { backgroundColor: detailColors.surfaceElevated }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("proSeller.currentPlan")}</Text>
              <View style={styles.gridWrap}>
                <View style={styles.gridCell}>
                  <View style={styles.iconWrap}>
                    <Ionicons name={I.verified} size={22} color={colors.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.gridCellValue, { color: colors.text }]}>
                      PRO {t("proSeller.active").toLowerCase()}
                    </Text>
                    <Text style={[styles.gridCellLabel, { color: colors.textTertiary }]}>
                      {t("proSeller.expires")}: {formatDate(subscription.endDate)}
                    </Text>
                  </View>
                  <Text style={[styles.daysTag, {
                    color: subscription.daysRemaining <= 7 ? colors.error
                      : subscription.daysRemaining <= 14 ? colors.warning
                      : colors.textSecondary,
                  }]}>
                    {subscription.daysRemaining} {t("proSeller.daysLeft")}
                  </Text>
                </View>

                {quota && (
                  <View style={[styles.gridCell, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                    <View style={styles.iconWrap}>
                      <Ionicons name={I.promote} size={22} color={colors.text} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.gridCellValue, { color: colors.text }]}>
                        {quota.remaining}/{quota.limit}
                      </Text>
                      <Text style={[styles.gridCellLabel, { color: colors.textTertiary }]}>
                        Boost
                      </Text>
                    </View>
                  </View>
                )}

                <View style={[styles.gridCell, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                  <View style={styles.iconWrap}>
                    <Ionicons name={I.sync} size={22} color={colors.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.gridCellValue, { color: colors.text }]}>{t("proSeller.autoRenew")}</Text>
                    <Text style={[styles.gridCellLabel, { color: colors.textTertiary }]}>
                      {subscription.autoRenew ? t("proSeller.active") : t("proSeller.inactive")}
                    </Text>
                  </View>
                  <Switch
                    value={subscription.autoRenew}
                    onValueChange={handleToggleAutoRenew}
                    disabled={togglingAutoRenew}
                    trackColor={{ false: colors.trackInactive, true: colors.trackActive + "80" }}
                    thumbColor={subscription.autoRenew ? colors.thumbColor : colors.trackInactive}
                  />
                </View>
              </View>
            </View>
          )}

          <View style={[styles.card, { backgroundColor: detailColors.surfaceElevated }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("proSeller.features")}</Text>
            <View style={styles.gridWrap}>
              {FEATURES.map((feat, i) => (
                <View
                  key={i}
                  style={[
                    styles.gridCell,
                    i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                  ]}
                >
                  <View style={styles.iconWrap}>
                    <Ionicons name={feat.icon} size={22} color={colors.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.gridCellValue, { color: colors.text }]}>
                      {getFeatureText(feat.valueKey)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <Pressable
            onPress={toggleComparison}
            style={({ pressed }) => [styles.card, {
              backgroundColor: detailColors.surfaceElevated,
              opacity: pressed ? 0.7 : 1,
              flexDirection: "row" as const,
              alignItems: "center" as const,
              justifyContent: "space-between" as const,
              padding: 14,
            }]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={styles.iconWrap}>
                <Ionicons name={I.compare} size={22} color={colors.text} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>{t("proSeller.comparison")}</Text>
            </View>
            <Ionicons name={showComparison ? "chevron-up" : "chevron-down"} size={18} color={colors.textTertiary} />
          </Pressable>

          {showComparison && (
            <View style={[styles.card, { backgroundColor: detailColors.surfaceElevated, marginTop: -2 }]}>
              <View style={styles.compHeader}>
                <View style={styles.compColLabel} />
                <Text style={[styles.compColTitle, { color: colors.textTertiary }]}>{t("proSeller.regular")}</Text>
                <Text style={[styles.compColTitle, styles.compColPro, { color: colors.text }]}>PRO</Text>
                <Text style={[styles.compColTitle, { color: colors.textTertiary }]}>{t("proSeller.dealer")}</Text>
              </View>

              {COMPARISON_ROWS.map((row, i) => (
                <React.Fragment key={row.key}>
                  {i > 0 && <View style={[styles.compDivider, { backgroundColor: colors.border }]} />}
                  <View style={styles.compRow}>
                    <Text style={[styles.compRowLabel, { color: colors.textTertiary }]} numberOfLines={1}>{t(`proSeller.${row.key}`)}</Text>
                    {[row.regular, row.pro, row.dealer].map((val, ci) => (
                      <View key={ci} style={styles.compCell}>
                        {typeof val === "boolean" ? (
                          <Ionicons
                            name={val ? "checkmark" : "close"}
                            size={16}
                            color={val ? colors.success : colors.textTertiary}
                          />
                        ) : (
                          <Text style={[
                            styles.compCellText,
                            { color: ci === 1 ? colors.text : colors.textSecondary },
                            ci === 1 && { fontWeight: "600" as const },
                          ]}>{val}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                </React.Fragment>
              ))}
              <Text style={[styles.compFootnote, { color: colors.textTertiary }]}>
                {"* " + t("proSeller.listingsFootnote")}
              </Text>
            </View>
          )}

          <View style={[styles.card, { backgroundColor: detailColors.surfaceElevated }]}>
            <View style={[styles.gridCell, { paddingHorizontal: 14 }]}>
              <View style={styles.iconWrap}>
                <Ionicons name={I.info} size={22} color={colors.textTertiary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gridCellLabel, { color: colors.textTertiary, lineHeight: 18 }]}>
                  {t("proSeller.infoPayment")} {price.toLocaleString("ru-RU")} ֏ / {config?.durationDays ?? 30} {t("promote.dayShort")}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {!loading && !isDealer && (
        <View style={[styles.bottomBar, {
          backgroundColor: detailColors.surfaceElevated,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, Platform.OS === "web" ? 34 : 16),
        }]}>
          <View>
            <Text style={[styles.bottomPrice, { color: colors.text }]}>
              {price.toLocaleString("ru-RU")} ֏
              <Text style={[styles.bottomPricePeriod, { color: colors.textTertiary }]}> /{config?.durationDays ?? 30}{t("promote.dayShort")}</Text>
            </Text>
            <View style={styles.balanceRow}>
              <Ionicons name={I.wallet} size={13} color={walletBalance >= price ? colors.textTertiary : colors.error} />
              <Text style={[styles.balanceText, { color: walletBalance >= price ? colors.textTertiary : colors.error }]}>
                {walletBalance.toLocaleString("ru-RU")} ֏
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handlePurchase}
            disabled={purchasing}
            style={({ pressed }) => [
              styles.purchaseBtn,
              {
                backgroundColor: purchasing ? colors.disabledBg : colors.buttonPrimary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            {purchasing ? (
              <ActivityIndicator size="small" color={colors.buttonPrimaryText} />
            ) : (
              <Text style={[styles.purchaseBtnText, { color: colors.buttonPrimaryText }]}>
                {isProActive ? t("proSeller.renew") : t("proSeller.activate")}
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: HEADER_CONTENT_PADDING_H,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: "600", letterSpacing: -0.2 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 0, gap: CARD_GAP },

  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 10 },
  emptyTitle: { fontSize: 20, fontWeight: "700", letterSpacing: -0.3 },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },

  dealerProContainer: { flex: 1, alignItems: "center" as const, justifyContent: "center" as const, paddingHorizontal: 24 },
  dealerProIcon: { width: 120, height: 120, marginBottom: 12 },
  dealerProTitle: { fontSize: 22, fontWeight: "800" as const, letterSpacing: -0.3, marginBottom: 6 },
  dealerProDesc: { fontSize: 14, textAlign: "center" as const, lineHeight: 20, marginBottom: 24, paddingHorizontal: 16 },
  dealerProBtn: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8, paddingVertical: 15, paddingHorizontal: 32, borderRadius: CARD_RADIUS },
  dealerProBtnText: { fontSize: 15, fontWeight: "600" as const },

  card: {
    marginHorizontal: 0,
    borderRadius: 20,
    padding: CARD_PADDING,
    gap: 10,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },

  gridWrap: {
    flexDirection: "column",
  },
  iconWrap: {
    width: 24,
    alignItems: "center",
  },
  gridCell: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  gridCellValue: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  gridCellLabel: {
    fontSize: 12,
    marginTop: 1,
  },

  proBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  proBadgeText: { fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },

  daysTag: { fontSize: 13, fontWeight: "600" },

  compHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 0, paddingTop: 4, paddingBottom: 8 },
  compRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  compColLabel: { flex: 1.4 },
  compColTitle: { flex: 1, fontSize: 11, fontWeight: "600", letterSpacing: 0.5, textAlign: "center" },
  compColPro: { fontWeight: "800" },
  compRowLabel: { flex: 1.4, fontSize: 13 },
  compCell: { flex: 1, alignItems: "center", justifyContent: "center" },
  compCellText: { fontSize: 13 },
  compDivider: { height: StyleSheet.hairlineWidth },
  compFootnote: { fontSize: 11, marginTop: 8, paddingHorizontal: 4 },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bottomPrice: { fontSize: 18, fontWeight: "700" },
  bottomPricePeriod: { fontSize: 13, fontWeight: "400" },
  balanceRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  balanceText: { fontSize: 12 },

  actionBtn: { paddingVertical: 14, paddingHorizontal: 28, borderRadius: CARD_RADIUS, marginTop: 8 },
  actionBtnText: { fontSize: 15, fontWeight: "600" },

  purchaseBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: CARD_RADIUS,
    alignItems: "center",
    justifyContent: "center",
  },
  purchaseBtnText: { fontSize: 15, fontWeight: "600" },
});

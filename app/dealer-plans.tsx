import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
  Switch,
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
import { CARD_GAP, CARD_PADDING, HEADER_CONTENT_PADDING_H, CARD_RADIUS, WEB_TOP_INSET } from "@/constants/layout";
import { API } from "@/lib/api-endpoints";

interface DealerPlan {
  id: number;
  code: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
  maxListings: number;
  maxPhotos: number;
  maxPromoDays: number;
  freePromotionsMonthly: number;
  features: string[];
  sortOrder: number;
}

interface DealerRequest {
  id: number;
  status: string;
  selectedPlanId?: number;
}

interface DealerFeatures {
  active: boolean;
  planCode?: string;
  planName?: string;
  features?: string[];
  maxListings?: number;
  maxPhotos?: number;
  subscriptionEnd?: string;
  autoRenew?: boolean;
  subscriptionId?: number | null;
  planId?: number | null;
}

const FEATURE_LABEL_KEYS: Record<string, { labelKey: string; icon: string }> = {
  dealer_badge: { labelKey: "dealerPlans.featureDealerBadge", icon: "storefront-outline" },
  company_profile: { labelKey: "dealerPlans.featureCompanyProfile", icon: "business-outline" },
  priority_support: { labelKey: "dealerPlans.featurePrioritySupport", icon: "headset-outline" },
  video_upload: { labelKey: "dealerPlans.featureVideoUpload", icon: "videocam-outline" },
  analytics: { labelKey: "dealerPlans.featureAnalytics", icon: "analytics-outline" },
  promoted_profile: { labelKey: "dealerPlans.featurePromotedProfile", icon: "megaphone-outline" },
  top_search: { labelKey: "dealerPlans.featureTopSearch", icon: "search-outline" },
  featured_dealer: { labelKey: "dealerPlans.featureFeaturedDealer", icon: "star-outline" },
  unlimited_photos: { labelKey: "dealerPlans.featureUnlimitedPhotos", icon: "images-outline" },
  monthly_promotions: { labelKey: "dealerPlans.featureMonthlyPromotions", icon: "flash-outline" },
};

function formatPrice(price: number, currency: string): string {
  if (currency === "AMD") {
    return `${price.toLocaleString("ru-RU")} ֏`;
  }
  return `${price} ${currency}`;
}

export default function DealerPlansScreen() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const { t } = useTranslation();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const [activating, setActivating] = useState(false);
  const [togglingAutoRenew, setTogglingAutoRenew] = useState(false);

  const isDealer = user?.role === "dealer";

  useSSEListener((event) => {
    if (event.event === "wallet_update" || event.event === "account_update") {
      refreshUser();
      queryClient.invalidateQueries({ queryKey: [API.dealer.myFeatures] });
    }
    if (event.event === "dealer_status" || event.event === "account_update") {
      queryClient.invalidateQueries({ queryKey: [API.dealerRequests.my] });
      queryClient.invalidateQueries({ queryKey: [API.dealerPlans] });
    }
  });

  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [refreshUser])
  );

  const plansQuery = useQuery<DealerPlan[]>({
    queryKey: [API.dealerPlans],
    enabled: !!user,
  });

  const requestQuery = useQuery<DealerRequest | null>({
    queryKey: [API.dealerRequests.my],
    enabled: !!user && !isDealer,
  });

  const featuresQuery = useQuery<DealerFeatures>({
    queryKey: [API.dealer.myFeatures],
    enabled: !!user && isDealer,
  });

  const plans = plansQuery.data || [];
  const plan = plans[0] || null;
  const request = requestQuery.data;
  const dealerFeatures = featuresQuery.data;
  const isApproved = request?.status === "approved";
  const hasActiveSubscription = isDealer && dealerFeatures?.active;

  const getRemainingDays = () => {
    if (!dealerFeatures?.subscriptionEnd) return null;
    const end = new Date(dealerFeatures.subscriptionEnd);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };
  const remainingDays = getRemainingDays();

  const handleActivate = async () => {
    if (!plan) return;
    if (!isApproved && !isDealer) return;

    if (isApproved && request?.selectedPlanId !== plan.id) {
      try {
        await apiRequest("POST", API.dealerRequests.selectPlan, { planId: plan.id });
        queryClient.invalidateQueries({ queryKey: [API.dealerRequests.my] });
      } catch {}
    }

    const balance = user?.walletBalance ?? 0;
    if (balance < plan.price) {
      showAlert(
        t("dealerPlans.insufficientFunds"),
        `${t("dealerPlans.forActivation")} "${plan.name}" ${t("dealerPlans.needed")} ${formatPrice(plan.price, plan.currency)}. ${t("dealerPlans.onBalance")} ${formatPrice(balance, "AMD")}. ${t("dealerPlans.topUpWalletSuffix")}`,
        [
          { text: t("dealerPlans.topUp"), onPress: () => router.push("/wallet") },
          { text: t("common.cancel") },
        ],
        "error"
      );
      return;
    }

    showAlert(
      t("dealerPlans.confirmation"),
      `${t("dealerPlans.activatePlanPrefix")} "${plan.name}" ${formatPrice(plan.price, plan.currency)}${t("dealerPlans.perMonthQuestion")}`,
      [
        {
          text: t("dealerPlans.activate"),
          onPress: async () => {
            setActivating(true);
            try {
              await apiRequest("POST", API.dealerRequests.activate);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await refreshUser();
              queryClient.invalidateQueries({ queryKey: [API.dealerRequests.my] });
              queryClient.invalidateQueries({ queryKey: [API.listings.list] });
              queryClient.invalidateQueries({ queryKey: [API.dealer.myFeatures] });
              queryClient.invalidateQueries({ queryKey: [API.catalog.sections] });
              queryClient.invalidateQueries({ queryKey: [API.listings.my] });
              showAlert(
                t("dealerPlans.congratulations"),
                `${t("dealerPlans.becameDealerPrefix")} "${plan.name}" ${t("dealerPlans.activatedSuffix")}`,
                [{ text: t("dealerPlans.goToProfile"), onPress: () => router.replace("/(tabs)/profile") }],
                "success"
              );
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : t("dealerPlans.activationError");
              showAlert(t("common.error"), message, undefined, "error");
            } finally {
              setActivating(false);
            }
          },
        },
        { text: t("common.cancel") },
      ]
    );
  };

  const handleRenew = async () => {
    if (!plan) return;

    const balance = user?.walletBalance ?? 0;
    if (balance < plan.price) {
      showAlert(
        t("dealerPlans.insufficientFunds"),
        `${t("dealerPlans.forRenewal")} "${plan.name}" ${t("dealerPlans.needed")} ${formatPrice(plan.price, plan.currency)}. ${t("dealerPlans.onBalance")} ${formatPrice(balance, "AMD")}.`,
        [
          { text: t("dealerPlans.topUp"), onPress: () => router.push("/wallet") },
          { text: t("common.cancel") },
        ],
        "error"
      );
      return;
    }

    showAlert(
      t("dealerPlans.renewSubscription"),
      `${t("dealerPlans.renewPlanPrefix")} "${plan.name}" ${t("dealerPlans.onDuration")} ${plan.durationDays} ${t("dealerPlans.daysLabel")} ${t("dealerPlans.forPrice")} ${formatPrice(plan.price, plan.currency)}${t("dealerPlans.walletDebitSuffix")}`,
      [
        {
          text: t("dealerPlans.renew"),
          onPress: async () => {
            setActivating(true);
            try {
              await apiRequest("POST", API.dealer.renew);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await refreshUser();
              queryClient.invalidateQueries({ queryKey: [API.dealer.myFeatures] });
              queryClient.invalidateQueries({ queryKey: [API.auth.listingLimits] });
              showAlert(t("dealerPlans.subscriptionRenewed"), `${t("dealerPlans.renewPlanPrefix")} "${plan.name}" ${t("dealerPlans.planRenewedSuffix")}`, undefined, "success");
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : t("dealerPlans.renewError");
              showAlert(t("common.error"), message, undefined, "error");
            } finally {
              setActivating(false);
            }
          },
        },
        { text: t("common.cancel") },
      ]
    );
  };

  const handleToggleAutoRenew = async (value: boolean) => {
    setTogglingAutoRenew(true);
    try {
      await apiRequest("PUT", API.dealer.autoRenew, { autoRenew: value });
      queryClient.invalidateQueries({ queryKey: [API.dealer.myFeatures] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("common.error");
      showAlert(t("common.error"), message, undefined, "error");
    } finally {
      setTogglingAutoRenew(false);
    }
  };

  const renderHeader = () => (
    <ScreenHeader title={t("dealerPlans.headerTitle")} backgroundColor={isDark ? colors.surface : colors.background} />
  );

  if (plansQuery.isLoading || (isDealer && featuresQuery.isLoading)) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!isDealer && !isApproved) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconBg, { backgroundColor: colors.textTertiary + "15" }]}>
            <Ionicons name={I.lock} size={32} color={colors.textTertiary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t("dealerPlans.plansUnavailable")}</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {t("dealerPlans.plansUnavailableDesc")}
          </Text>
        </View>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      {renderHeader()}

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {hasActiveSubscription && (
          <View style={[styles.currentPlanCard, {
            backgroundColor: `${colors.priceGood}${isDark ? "14" : "0F"}`,
            borderColor: `${colors.priceGood}${isDark ? "33" : "26"}`,
          }]}>
            <View style={styles.currentPlanHeader}>
              <View style={[styles.currentPlanIconBg, { backgroundColor: `${colors.priceGood}20` }]}>
                <Ionicons name={I.verified} size={22} color={colors.priceGood} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.currentPlanTitle, { color: colors.text }]}>
                  {t("dealerPlans.currentTariff")} {dealerFeatures?.planName}
                </Text>
                {remainingDays !== null && (
                  <Text style={[styles.currentPlanDays, {
                    color: remainingDays <= 14 ? colors.error : colors.textSecondary,
                  }]}>
                    {remainingDays === 0 ? t("dealerPlans.expiresToday") : `${t("dealerPlans.remaining")} ${remainingDays} ${t("dealerPlans.daysLabel")}`}
                  </Text>
                )}
              </View>
            </View>

            <View style={[styles.autoRenewRow, {
              backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
            }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.autoRenewLabel, { color: colors.text }]}>{t("dealerPlans.autoRenew")}</Text>
                <Text style={[styles.autoRenewHint, { color: colors.textTertiary }]}>
                  {t("dealerPlans.autoRenewDesc")}
                </Text>
              </View>
              <Switch
                value={dealerFeatures?.autoRenew ?? false}
                onValueChange={handleToggleAutoRenew}
                disabled={togglingAutoRenew}
                trackColor={{ false: colors.trackInactive, true: colors.trackActive + "80" }}
                thumbColor={dealerFeatures?.autoRenew ? colors.thumbColor : colors.trackInactive}
              />
            </View>
          </View>
        )}

        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            {isDealer ? t("dealerPlans.managePlan") : t("dealerPlans.dealerPlanTitle")}
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            {isDealer
              ? t("dealerPlans.managePlanSubtitle")
              : t("dealerPlans.dealerPlanSubtitle")
            }
          </Text>
        </View>

        <View style={[styles.planCard, {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
          borderWidth: 1,
        }]}>
          <View style={styles.planHeader}>
            <View style={[styles.planIconBg, { backgroundColor: isDark ? colors.surface : colors.surfaceSecondary }]}>
              <Ionicons name={I.storefront} size={22} color={colors.primary} />
            </View>
            <View style={styles.planHeaderInfo}>
              <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={[styles.priceAmount, { color: colors.text }]}>
              {formatPrice(plan.price, plan.currency)}
            </Text>
            <Text style={[styles.pricePeriod, { color: colors.textTertiary }]}>/{plan.durationDays} {t("dealerPlans.daysLabel")}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]} />

          <View style={styles.featuresContainer}>
            <View style={styles.featureRow}>
              <View style={[styles.featureIconBg, { backgroundColor: isDark ? colors.surface : colors.surfaceSecondary }]}>
                <Ionicons name={I.car} size={14} color={colors.primary} />
              </View>
              <Text style={[styles.featureLabel, { color: colors.text }]}>
                {t("dealerPlans.featureListingsCount").replace("{count}", String(plan.maxListings))}
              </Text>
            </View>
            <View style={styles.featureRow}>
              <View style={[styles.featureIconBg, { backgroundColor: isDark ? colors.surface : colors.surfaceSecondary }]}>
                <Ionicons name={I.images} size={14} color={colors.primary} />
              </View>
              <Text style={[styles.featureLabel, { color: colors.text }]}>
                {t("dealerPlans.featurePhotosCount").replace("{count}", String(plan.maxPhotos))}
              </Text>
            </View>
            {plan.freePromotionsMonthly !== 0 && (
              <View style={styles.featureRow}>
                <View style={[styles.featureIconBg, { backgroundColor: isDark ? colors.surface : colors.surfaceSecondary }]}>
                  <Ionicons name={I.promote} size={14} color={colors.primary} />
                </View>
                <Text style={[styles.featureLabel, { color: colors.text }]}>
                  {plan.freePromotionsMonthly === -1
                    ? t("dealerPlans.featureUnlimitedPromotions")
                    : t("dealerPlans.featureMonthlyPromotions")
                        .replace("{count}", String(plan.freePromotionsMonthly))
                        .replace("{days}", String(plan.maxPromoDays))
                  }
                </Text>
              </View>
            )}
            {plan.features.map((featureCode, idx) => {
              if (featureCode === "unlimited_promotions" || featureCode === "monthly_promotions") return null;
              const feat = FEATURE_LABEL_KEYS[featureCode];
              if (!feat) return null;
              return (
                <View key={idx} style={styles.featureRow}>
                  <View style={[styles.featureIconBg, { backgroundColor: isDark ? colors.surface : colors.surfaceSecondary }]}>
                    <Ionicons name={feat.icon as any} size={14} color={colors.primary} />
                  </View>
                  <Text style={[styles.featureLabel, { color: colors.text }]}>{t(feat.labelKey)}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }]}>
          <Ionicons name={I.info} size={18} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {isDealer
              ? t("dealerPlans.infoDealer")
              : `${t("dealerPlans.infoUser")} ${plan.durationDays} ${t("dealerPlans.infoUserDays")}`
            }
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, {
        backgroundColor: isDark ? colors.background : colors.surface,
        paddingBottom: Math.max(insets.bottom, 16),
        borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
      }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            if (hasActiveSubscription) {
              handleRenew();
            } else {
              handleActivate();
            }
          }}
          disabled={activating}
          style={({ pressed }) => [
            styles.activateButton,
            {
              backgroundColor: colors.buttonPrimary,
              opacity: activating ? 0.7 : (pressed ? 0.9 : 1),
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          {activating ? (
            <ActivityIndicator size="small" color={colors.buttonPrimaryText} />
          ) : (
            <>
              <Ionicons name={hasActiveSubscription ? "refresh" : "flash"} size={20} color={colors.buttonPrimaryText} />
              <Text style={[styles.activateButtonText, { color: colors.buttonPrimaryText }]}>
                {hasActiveSubscription
                  ? `${t("dealerPlans.renewForLabel")} ${plan.durationDays} ${t("dealerPlans.daysLabel")}`
                  : t("dealerPlans.activateAndPay")
                }
              </Text>
            </>
          )}
        </Pressable>
      </View>
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
  headerTitleText: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  content: { padding: 16, gap: CARD_GAP },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 12 },
  emptyIconBg: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  emptySubtitle: { fontSize: 14, lineHeight: 20, textAlign: "center" },

  currentPlanCard: {
    borderRadius: 16, padding: CARD_PADDING, gap: 12, borderWidth: 1,
  },
  currentPlanHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  currentPlanIconBg: {
    width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center",
  },
  currentPlanTitle: { fontSize: 15, fontWeight: "700" },
  currentPlanDays: { fontSize: 13, marginTop: 2 },
  autoRenewRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, borderRadius: 12,
  },
  autoRenewLabel: { fontSize: 14, fontWeight: "600" },
  autoRenewHint: { fontSize: 11, marginTop: 2 },

  heroSection: { gap: 4, marginBottom: 2 },
  heroTitle: { fontSize: 22, fontWeight: "700", letterSpacing: -0.3 },
  heroSubtitle: { fontSize: 14, lineHeight: 20 },

  planCard: {
    borderRadius: 18, padding: CARD_PADDING, gap: 14, position: "relative", overflow: "hidden",
  },

  planHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  planIconBg: {
    width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center",
  },
  planHeaderInfo: { flex: 1, gap: 1 },
  planName: { fontSize: 19, fontWeight: "700" },

  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  priceAmount: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  pricePeriod: { fontSize: 14, fontWeight: "500" },

  divider: { height: 1, borderRadius: 0.5 },

  featuresContainer: { gap: 10 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureIconBg: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  featureLabel: { fontSize: 14 },

  infoCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    padding: 14, borderRadius: 12, borderWidth: 1,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },

  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: 16, paddingTop: 12, borderTopWidth: 1,
  },
  activateButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 52, borderRadius: CARD_RADIUS,
  },
  activateButtonText: { fontSize: 16, fontWeight: "700" },
});

import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { formatPrice } from "@/lib/formatters";
import { StatusBar } from "expo-status-bar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { AppIcons as I } from "@/constants/icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/constants/colors";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/query-client";
import { Shimmer } from "@/components/SkeletonCard";
import { EmptyState } from "@/components/EmptyState";
import { useTranslation } from "@/lib/i18n";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SCREEN_PADDING_H, HEADER_CONTENT_PADDING_H, CARD_RADIUS, WEB_TOP_INSET } from "@/constants/layout";
import { getPromotionTheme } from "@/constants/promotions";
import { API } from "@/lib/api-endpoints";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FEATURE_LABEL_KEYS: Record<string, string> = {
  priority_search: "promote.featurePrioritySearch",
  priority_placement: "promote.featurePriorityPlacement",
  max_visibility: "promote.featureMaxVisibility",
  boost_views: "promote.featureBoostViews",
  similar_priority: "promote.featureSimilarPriority",
  featured_carousel: "promote.featureFeaturedCarousel",
  stories_placement: "promote.featureStoriesPlacement",
  top_placement: "promote.featureTopPlacement",
};

interface PricingTier {
  days: number;
  price: number;
}

interface PromotionPackage {
  id: number;
  code: string;
  name: string;
  description: string | null;
  priceAmd: number;
  durationDays: number | null;
  features: string[];
  pricing: PricingTier[];
  sortOrder: number;
  active: boolean;
  icon: string;
  color: string;
}

interface ActivePromotion {
  id: number;
  listingId: number;
  packageCode: string;
  active: boolean;
  startedAt: string;
  expiresAt: string | null;
}

function SkeletonPackageCard() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);

  return (
    <View style={[styles.packageCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, borderWidth: 1 }]}>
      <View style={styles.packageRowContent}>
        <View style={[styles.packageIconWrap, { backgroundColor: colors.surface }]}>
          <Shimmer width={22} height={22} borderRadius={4} />
        </View>
        <View style={styles.packageInfo}>
          <Shimmer width="70%" height={16} borderRadius={4} />
          <Shimmer width="50%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.packageRight}>
          <Shimmer width={60} height={14} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

export default function PromoteScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const { t } = useTranslation();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();
  const scrollRef = useRef<ScrollView>(null);
  const cardRefs = useRef<Record<string, View | null>>({});

  const [expandedPackage, setExpandedPackage] = useState<string | null>(null);
  const [pricingIndexes, setPricingIndexes] = useState<Record<string, number>>({});

  const packagesQuery = useQuery<{ packages: PromotionPackage[] }>({
    queryKey: [API.promotionPackages],
    enabled: !!listingId,
  });

  const existingQuery = useQuery<{ promotions: ActivePromotion[] }>({
    queryKey: [API.promotions.forListing(listingId)],
    enabled: !!listingId,
  });

  const walletQuery = useQuery<{ balance: number }>({
    queryKey: [API.wallet.balance],
    enabled: isAuthenticated,
  });

  const dealerQuotaQuery = useQuery<{
    hasQuota: boolean;
    source?: "dealer" | "pro_seller";
    unlimited?: boolean;
    monthlyLimit?: number;
    usedThisMonth?: number;
    remaining?: number;
    packageRestriction?: string;
    maxDays?: number;
  }>({
    queryKey: [API.promotions.dealerQuota],
    enabled: isAuthenticated,
  });

  const walletBalance = walletQuery.data?.balance ?? 0;
  const dealerQuota = dealerQuotaQuery.data;
  const hasFreePromoBase = dealerQuota?.hasQuota && (dealerQuota.unlimited || (dealerQuota.remaining ?? 0) > 0);
  const isProSellerQuota = dealerQuota?.source === "pro_seller";
  const canUseFreeForPackage = useCallback((pkgCode: string) => {
    if (!hasFreePromoBase) return false;
    if (isProSellerQuota && dealerQuota?.packageRestriction && pkgCode !== dealerQuota.packageRestriction) return false;
    return true;
  }, [hasFreePromoBase, isProSellerQuota, dealerQuota?.packageRestriction]);

  const purchaseMutation = useMutation({
    mutationFn: async (data: { listingId: number; packageCode: string; durationDays: number; paymentMethod: string }) => {
      return apiRequest("POST", API.promotions.purchase, data);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: [API.promotions.forListing(listingId)] });
      queryClient.invalidateQueries({ queryKey: [API.wallet.balance] });
      queryClient.invalidateQueries({ queryKey: [API.promotions.my] });
      queryClient.invalidateQueries({ queryKey: [API.promotions.dealerQuota] });
      queryClient.invalidateQueries({ queryKey: [API.listings.list] });
      queryClient.invalidateQueries({ queryKey: [API.catalog.sections] });
      queryClient.invalidateQueries({ queryKey: [API.stories] });
      showAlert(t("promote.doneTitle"), t("promote.promotionActivatedMsg"), [
        { text: "OK", onPress: () => router.back() },
      ], "success");
    },
    onError: (err: Error) => {
      let msg = err?.message || t("promote.purchaseError");
      if (msg === "ALREADY_ACTIVE_PROMOTION" || msg.includes("ALREADY_ACTIVE")) {
        msg = t("promote.alreadyActiveError");
      }
      showAlert(t("common.error"), msg, undefined, "error");
    },
  });

  const packages = packagesQuery.data?.packages || [];
  const activePromos = existingQuery.data?.promotions?.filter(
    (p: ActivePromotion) => p.active === true
  ) || [];

  const isLoading = packagesQuery.isLoading;

  const togglePackage = useCallback((code: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const willExpand = expandedPackage !== code;
    setExpandedPackage(prev => prev === code ? null : code);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (willExpand) {
      setTimeout(() => {
        const ref = cardRefs.current[code];
        if (ref && scrollRef.current) {
          ref.measureLayout(
            scrollRef.current as any,
            (_x: number, y: number) => {
              scrollRef.current?.scrollTo({ y: Math.max(0, y - 20), animated: true });
            },
            () => {}
          );
        }
      }, 350);
    }
  }, [expandedPackage]);

  const selectPricingIdx = useCallback((pkgCode: string, idx: number) => {
    setPricingIndexes(prev => ({ ...prev, [pkgCode]: idx }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handlePurchase = useCallback((pkg: PromotionPackage) => {
    if (!listingId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const pricingOptions = pkg.pricing?.length
      ? pkg.pricing
      : [{ days: pkg.durationDays || 7, price: pkg.priceAmd }];
    const idx = pricingIndexes[pkg.code] || 0;
    const safeIdx = Math.min(idx, Math.max(pricingOptions.length - 1, 0));
    const tier = pricingOptions[safeIdx];
    const totalPrice = tier?.price || 0;
    const selectedDays = tier?.days || 0;
    const balance = walletQuery.data?.balance || 0;

    const freeMax = dealerQuota?.maxDays ?? 0;
    const isFreeDuration = canUseFreeForPackage(pkg.code) && selectedDays <= freeMax;

    if (isFreeDuration) {
      const planSuffix = isProSellerQuota ? t("promote.includedInProSuffix") : t("promote.includedInDealerSuffix");
      const quotaText = dealerQuota?.unlimited
        ? t("promote.unlimitedFreePromo")
        : `${t("promote.remainingFree")} ${dealerQuota?.remaining}/${dealerQuota?.monthlyLimit} ${t("promote.inThisMonth")}`;
      showAlert(
        t("promote.freePromoTitle"),
        `${t(`promote.packageName_${pkg.code}`) !== `promote.packageName_${pkg.code}` ? t(`promote.packageName_${pkg.code}`) : pkg.name} ${t("promote.onDays")} ${selectedDays} ${t("promote.daysUnit")} ${planSuffix}\n${quotaText}`,
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("promote.activate"),
            onPress: () => {
              purchaseMutation.mutate({
                listingId: parseInt(listingId),
                packageCode: pkg.code,
                durationDays: selectedDays,
                paymentMethod: "wallet",
              });
            },
          },
        ]
      );
      return;
    }

    if (balance < totalPrice) {
      showAlert(
        t("promote.insufficientFundsTitle"),
        `${t("promote.forPurchaseNeed")} ${formatPrice(totalPrice, "AMD")}. ${t("promote.onBalanceLabel")} ${formatPrice(balance, "AMD")}. ${t("promote.topUpWalletSuffix")}`,
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("promote.topUpBalance"), onPress: () => router.push("/wallet") },
        ]
      );
      return;
    }

    showAlert(
      t("promote.confirmPurchase"),
      `${t(`promote.packageName_${pkg.code}`) !== `promote.packageName_${pkg.code}` ? t(`promote.packageName_${pkg.code}`) : pkg.name} ${t("promote.onDays")} ${selectedDays} ${t("promote.daysUnit")} — ${formatPrice(totalPrice, "AMD")}`,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("promote.buy"),
          onPress: () => {
            purchaseMutation.mutate({
              listingId: parseInt(listingId),
              packageCode: pkg.code,
              durationDays: selectedDays,
              paymentMethod: "wallet",
            });
          },
        },
      ]
    );
  }, [listingId, pricingIndexes, walletQuery.data, purchaseMutation, showAlert, canUseFreeForPackage, isProSellerQuota, dealerQuota, t]);

  const renderPackageCard = useCallback((pkg: PromotionPackage) => {
    const isExpanded = expandedPackage === pkg.code;
    const hasFreePromo = canUseFreeForPackage(pkg.code);
    const visibleFeatures = (pkg.features || []).filter(f => FEATURE_LABEL_KEYS[f]);

    const theme = getPromotionTheme(pkg.code);
    const cardTextColor = colors.text;
    const cardSecondaryText = colors.textSecondary;
    const minPrice = pkg.pricing?.length ? Math.min(...pkg.pricing.map(p => p.price)) : pkg.priceAmd;
    const isAlreadyActive = activePromos.some(a => a.packageCode === pkg.code);
    const activePromo = activePromos.find(a => a.packageCode === pkg.code);
    const localName = t(`promote.packageName_${pkg.code}`) !== `promote.packageName_${pkg.code}` ? t(`promote.packageName_${pkg.code}`) : pkg.name;
    const localDesc = t(`promote.packageDesc_${pkg.code}`) !== `promote.packageDesc_${pkg.code}` ? t(`promote.packageDesc_${pkg.code}`) : pkg.description;

    const pricingOptions = pkg.pricing?.length
      ? pkg.pricing
      : [{ days: pkg.durationDays || 7, price: pkg.priceAmd }];
    const freeMaxDaysForBadge = hasFreePromo && dealerQuota?.maxDays ? dealerQuota.maxDays : 0;
    const hasAnyFreeTier = hasFreePromo && (dealerQuota?.unlimited || pricingOptions.some(t => t.days <= freeMaxDaysForBadge));
    const pricingIdx = pricingIndexes[pkg.code] || 0;
    const safeIdx = Math.min(pricingIdx, Math.max(pricingOptions.length - 1, 0));
    const selectedTier = pricingOptions[safeIdx];
    const totalPrice = selectedTier?.price || 0;
    const selectedDays = selectedTier?.days || 0;
    const pricePerDay = selectedDays > 0 ? Math.round(totalPrice / selectedDays) : totalPrice;
    const freeMaxDays = hasFreePromo && dealerQuota?.maxDays ? dealerQuota.maxDays : 0;
    const isFreeEligibleDuration = hasFreePromo && selectedDays <= freeMaxDays;

    const headerContent = (
      <Pressable
        onPress={() => togglePackage(pkg.code)}
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
      >
        <View style={styles.packageRowContent}>
          <View style={[styles.packageIconWrap, { backgroundColor: isDark ? colors.surface : "#FFFFFF" }]}>
            <Ionicons name={(theme.icon + "-outline") as any} size={22} color={colors.primary} />
          </View>
          <View style={styles.packageInfo}>
            <View style={styles.packageNameRow}>
              <Text style={[styles.packageName, { color: cardTextColor }]}>{localName}</Text>
              {isAlreadyActive && (
                <View style={[styles.activePill, { backgroundColor: colors.success + "18" }]}>
                  <Text style={[styles.activePillText, { color: colors.success }]}>{t("promote.activeBadge")}</Text>
                </View>
              )}
            </View>
            {!isExpanded && localDesc ? (
              <Text style={[styles.packageDesc, { color: cardSecondaryText }]} numberOfLines={1}>{localDesc}</Text>
            ) : null}
          </View>
          <View style={styles.packageRight}>
            {!isExpanded && (
              hasAnyFreeTier ? (
                <View style={[styles.freePlanBadge, { backgroundColor: colors.primary + "12" }]}>
                  <Ionicons name={I.verified} size={14} color={colors.textSecondary} />
                  <Text style={[styles.freePlanBadgeText, { color: colors.textSecondary }]}>
                    {t("promote.inYourPlan")}
                    {!dealerQuota?.unlimited && dealerQuota?.remaining != null ? ` · ${dealerQuota.remaining}/${dealerQuota.monthlyLimit}` : ""}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.packagePrice, { color: colors.primary }]}>
                  {t("promote.fromPrice")} {minPrice.toLocaleString()}
                </Text>
              )
            )}
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={cardSecondaryText}
            />
          </View>
        </View>
      </Pressable>
    );

    const expandedContent = isExpanded ? (
      <View style={[styles.expandedContent, { borderTopColor: colors.border }]}>
        {localDesc ? (
          <Text style={[styles.expandedDesc, { color: cardSecondaryText }]}>{localDesc}</Text>
        ) : null}

        {visibleFeatures.length > 0 && (
          <View style={styles.featuresSection}>
            <Text style={[styles.expandedSectionLabel, { color: cardSecondaryText }]}>{t("promote.includedInPackage")}</Text>
            <View style={styles.featuresGrid}>
              {visibleFeatures.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Ionicons
                    name="checkmark-circle" 
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={[styles.featureText, { color: cardTextColor }]}>{t(FEATURE_LABEL_KEYS[f])}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {pricingOptions.length > 1 && (
          <View style={styles.durationSection}>
            <Text style={[styles.expandedSectionLabel, { color: cardSecondaryText }]}>{t("promote.durationLabel")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.durationScroll}>
              {pricingOptions.map((tier, idx) => {
                const isActive = safeIdx === idx;
                const dayPrice = tier.days > 0 ? Math.round(tier.price / tier.days) : tier.price;
                const bestValue = idx === pricingOptions.length - 1;
                const tierIsFree = hasFreePromo && tier.days <= freeMaxDays;
                return (
                  <Pressable
                    key={tier.days}
                    onPress={() => selectPricingIdx(pkg.code, idx)}
                    style={[
                      styles.durationChip,
                      {
                        backgroundColor: isActive
                          ? (isDark ? colors.surface : "#FFFFFF")
                          : (isDark ? colors.surface : "#FFFFFF"),
                        borderColor: isActive ? colors.primary : colors.border,
                        borderWidth: isActive ? 1.5 : 1,
                      },
                    ]}
                  >
                    {tierIsFree ? (
                      <View style={[styles.bestValueTag, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.bestValueText, { color: colors.textInverse }]}>{t("promote.freeLabel")}</Text>
                      </View>
                    ) : bestValue ? (
                      <View style={[styles.bestValueTag, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.bestValueText, { color: colors.textInverse }]}>{t("promote.bestValue")}</Text>
                      </View>
                    ) : null}
                    <Text style={[styles.durationDays, { color: isActive ? colors.primary : cardTextColor }]}>
                      {tier.days} {t("promote.dayShort")}
                    </Text>
                    {tierIsFree ? (
                      <Text style={[styles.durationPrice, { color: colors.textSecondary, textDecorationLine: "line-through" as const }]}>
                        {formatPrice(tier.price, "AMD")}
                      </Text>
                    ) : (
                      <Text style={[styles.durationPrice, { color: isActive ? colors.primary : cardSecondaryText }]}>
                        {formatPrice(tier.price, "AMD")}
                      </Text>
                    )}
                    <Text style={[styles.durationPerDay, { color: cardSecondaryText }]}>
                      {tierIsFree ? t("promote.includedInPlan") : `${dayPrice.toLocaleString()}${t("promote.perDay")}`}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {isFreeEligibleDuration ? (
          <View style={[styles.summaryInline, { backgroundColor: isDark ? colors.surface : colors.background }]}>
            <View style={styles.summaryMainRow}>
              <View>
                <Text style={[styles.summaryTotalPrice, { color: colors.primary }]}>
                  {t("promote.freeLabel")}
                </Text>
                <Text style={[styles.summarySubtext, { color: cardSecondaryText }]}>
                  {selectedDays} {t("promote.daysUnit")} · {isProSellerQuota ? t("promote.includedInProSuffix") : t("promote.includedInDealerSuffix")}
                </Text>
              </View>
              <View style={[styles.dealerPlanBadge, { backgroundColor: colors.surfacePressed }]}>
                <Ionicons name={I.shield} size={14} color={cardTextColor} />
                <Text style={[styles.dealerPlanBadgeText, { color: cardTextColor }]}>
                  {dealerQuota?.unlimited ? t("promote.unlimited") : `${dealerQuota?.remaining}/${dealerQuota?.monthlyLimit}`}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.summaryInline, { backgroundColor: isDark ? colors.surface : colors.background }]}>
            <View style={styles.summaryMainRow}>
              <View>
                <Text style={[styles.summaryTotalPrice, { color: cardTextColor }]}>
                  {formatPrice(totalPrice, "AMD")}
                </Text>
                <Text style={[styles.summarySubtext, { color: cardSecondaryText }]}>
                  {selectedDays} {t("promote.daysUnit")} · {formatPrice(pricePerDay, "AMD")}{t("promote.perDay")}
                </Text>
              </View>
            </View>

            {hasFreePromo && freeMaxDays > 0 && (
              <View style={[styles.freeHint, { backgroundColor: colors.primary + "12" }]}>
                <Ionicons name={I.info} size={14} color={colors.textSecondary} />
                <Text style={[styles.freeHintText, { color: colors.textSecondary }]}>
                  {`${t("promote.freeUpToDaysPrefix")} ${freeMaxDays} ${t("promote.freeUpToDaysSuffix")}`}
                </Text>
              </View>
            )}

            {walletBalance < totalPrice && (
              <Pressable
                onPress={() => router.push("/wallet")}
                style={({ pressed }) => [
                  styles.topupLink,
                  { backgroundColor: colors.surfacePressed, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Ionicons name={I.add} size={16} color={colors.primary} />
                <Text style={[styles.topupLinkText, { color: colors.primary }]}>{t("promote.topUpWallet")}</Text>
              </Pressable>
            )}
          </View>
        )}

        {isAlreadyActive ? (
          <View
            style={[
              styles.purchaseBtn,
              { backgroundColor: colors.success + "18", opacity: 0.7 },
            ]}
          >
            <Ionicons name={I.verified} size={18} color={colors.success} />
            <Text style={[styles.purchaseBtnText, { color: colors.success }]}>
              {t("promote.activeBadge")}
              {activePromo?.expiresAt ? ` — ${new Date(activePromo.expiresAt).toLocaleDateString()}` : ""}
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={() => handlePurchase(pkg)}
            disabled={purchaseMutation.isPending}
            style={({ pressed }) => [
              styles.purchaseBtn,
              {
                backgroundColor: colors.buttonPrimary,
                opacity: (pressed || purchaseMutation.isPending) ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            {purchaseMutation.isPending ? (
              <ActivityIndicator color={colors.buttonPrimaryText} size="small" />
            ) : (
              <>
                <Ionicons name={theme.icon as any} size={18} color={colors.buttonPrimaryText} />
                <Text style={[styles.purchaseBtnText, { color: colors.buttonPrimaryText }]}>
                  {isFreeEligibleDuration ? t("promote.activateFree") : `${t("promote.activateFor")} ${formatPrice(totalPrice, "AMD")}`}
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    ) : null;

    return (
      <View
        key={pkg.code}
        ref={(ref) => { cardRefs.current[pkg.code] = ref; }}
        style={styles.cardWrapper}
      >
        <View
          style={[
            styles.packageCard,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: isExpanded ? colors.primary : colors.border,
              borderWidth: isExpanded ? 1.5 : 1,
            },
          ]}
        >
          {headerContent}
          {expandedContent}
        </View>
      </View>
    );
  }, [expandedPackage, pricingIndexes, colors, isDark, activePromos, walletBalance, purchaseMutation.isPending, togglePackage, selectPricingIdx, handlePurchase, canUseFreeForPackage, isProSellerQuota, dealerQuota, t]);

  if (!listingId) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ScreenHeader title={t("promote.title")} borderBottom />
        <View style={styles.loadingWrap}>
          <Ionicons name={I.alert} size={48} color={colors.textTertiary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{t("promote.loadError")}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScreenHeader title={t("promote.title")} borderBottom />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.packagesList}>
            <SkeletonPackageCard />
            <SkeletonPackageCard />
          </View>
        ) : packagesQuery.isError ? (
          <EmptyState
            image={require("@/assets/images/empty-notifications.png")}
            title={t("promote.loadError")}
            subtitle={t("promote.loadErrorSubtitle")}
          />
        ) : packages.length === 0 ? (
          <EmptyState
            image={require("@/assets/images/empty-gift.png")}
            title={t("promote.noPackages")}
            subtitle={t("promote.noPackagesSubtitle")}
          />
        ) : (
          <>
            <View style={[styles.walletRow, { backgroundColor: colors.surfaceSecondary }]}>
              <View style={styles.walletLeft}>
                <Ionicons name={I.wallet} size={18} color={colors.textSecondary} />
                <Text style={[styles.walletLabel, { color: colors.textSecondary }]}>{t("promote.walletBalance")}</Text>
              </View>
              <Text style={[styles.walletAmount, { color: colors.text }]}>
                {formatPrice(walletBalance, "AMD")}
              </Text>
              {activePromos.length > 0 && (
                <>
                  <View style={{ width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: 6 }} />
                  <Ionicons name={I.promote} size={16} color={colors.textSecondary} />
                  <Text style={[styles.activeBannerText, { color: colors.textSecondary }]}>
                    {activePromos.length > 0 ? `${activePromos.length}/${packages.length}` : ""}
                  </Text>
                </>
              )}
            </View>

            {hasFreePromoBase && (
              <View style={[styles.dealerQuotaBanner, { backgroundColor: isDark ? colors.surface : colors.surfaceSecondary }]}>
                <View style={[styles.quotaIconWrap, { backgroundColor: colors.primary + "14" }]}>
                  <Ionicons name={isProSellerQuota ? "star" : "shield-checkmark"} size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dealerQuotaTitle, { color: colors.text }]}>
                    {t("promote.freePromotions")}
                  </Text>
                  <Text style={[styles.dealerQuotaText, { color: colors.textSecondary }]}>
                    {isProSellerQuota
                      ? `${t("promote.quotaPackageLabel")} ${t("promote.packageName_boost")} · ${t("promote.quotaMaxDaysLabel")} ${dealerQuota?.maxDays ?? 0} ${t("promote.dayShort")}`
                      : (dealerQuota?.unlimited
                        ? `${t("promote.quotaPackageLabel")} ${t("promote.quotaAllPackages")} · ${t("promote.unlimitedDesc")}`
                        : `${t("promote.quotaPackageLabel")} ${t("promote.quotaAllPackages")} · ${t("promote.quotaMaxDaysLabel")} ${dealerQuota?.maxDays ?? 0} ${t("promote.dayShort")}`)}
                  </Text>
                </View>
                <View style={[styles.quotaCountBadge, { backgroundColor: colors.primary + "14" }]}>
                  <Text style={[styles.quotaCountText, { color: colors.primary }]}>
                    {dealerQuota?.unlimited ? "∞" : `${dealerQuota?.remaining}/${dealerQuota?.monthlyLimit}`}
                  </Text>
                </View>
              </View>
            )}

            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("promote.choosePlan")}</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              {t("promote.choosePlanSubtitle")}
            </Text>

            <View style={styles.packagesList}>
              {packages.map(renderPackageCard)}
            </View>
          </>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: HEADER_CONTENT_PADDING_H,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    letterSpacing: -0.2,
  },
  scrollContent: {
    padding: SCREEN_PADDING_H,
    gap: 8,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  walletRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  walletLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  walletLabel: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  walletAmount: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  activeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  activeBannerText: {
    fontSize: 13,
    fontWeight: "600" as const,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    letterSpacing: -0.2,
    marginTop: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: -2,
  },
  packagesList: {
    gap: 10,
    marginTop: 4,
  },
  cardWrapper: {},
  packageCard: {
    borderRadius: 16,
    padding: 14,
    overflow: "hidden",
  },
  packageRowContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  packageIconWrap: {
    width: 44,
    height: 44,
    borderRadius: CARD_RADIUS,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  packageInfo: {
    flex: 1,
    gap: 2,
  },
  packageNameRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  packageName: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  packageRight: {
    alignItems: "flex-end" as const,
    gap: 4,
  },
  packagePrice: {
    fontSize: 13,
    fontWeight: "700" as const,
  },
  packageDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  expandedContent: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  expandedDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  expandedSectionLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  featuresSection: {},
  featuresGrid: {
    gap: 7,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    flex: 1,
  },
  durationSection: {},
  durationScroll: {
    gap: 8,
  },
  durationChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 90,
    position: "relative" as const,
  },
  bestValueTag: {
    alignSelf: "center" as const,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  bestValueText: {
    fontSize: 8,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
  },
  durationDays: {
    fontSize: 15,
    fontWeight: "700" as const,
  },
  durationPrice: {
    fontSize: 12,
    fontWeight: "600" as const,
    marginTop: 2,
  },
  durationPerDay: {
    fontSize: 10,
    marginTop: 1,
  },
  summaryInline: {
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  summaryMainRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  summaryTotalPrice: {
    fontSize: 20,
    fontWeight: "800" as const,
  },
  summarySubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  balanceInfo: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  balanceText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  freeHint: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  freeHintText: {
    fontSize: 12,
    fontWeight: "600" as const,
    flex: 1,
  },
  topupLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  topupLinkText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  purchaseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: CARD_RADIUS,
  },
  purchaseBtnText: {
    fontSize: 15,
    fontWeight: "700" as const,
  },
  freePlanBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freePlanBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
  },
  dealerQuotaBanner: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    padding: 14,
    borderRadius: 12,
  },
  quotaIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  dealerQuotaTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
  },
  dealerQuotaText: {
    fontSize: 12,
    marginTop: 2,
  },
  quotaCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  quotaCountText: {
    fontSize: 16,
    fontWeight: "800" as const,
  },
  dealerPlanBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dealerPlanBadgeText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
});

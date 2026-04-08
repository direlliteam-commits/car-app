import React, { useCallback } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { AppIcons as I } from "@/constants/icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/constants/colors";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/query-client";
import { getListingTitle, formatPrice } from "@/lib/formatters";
import { useTranslation } from "@/lib/i18n";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SCREEN_PADDING_H, HEADER_CONTENT_PADDING_H, CARD_RADIUS, WEB_TOP_INSET } from "@/constants/layout";
import { API } from "@/lib/api-endpoints";

interface BumpBenefit {
  icon: string;
  titleKey?: string;
  descKey?: string;
  title?: string;
  desc?: string;
  text?: string;
}

interface BumpInfo {
  inCooldown: boolean;
  canFreeBump: boolean;
  cooldownEndsAt: string | null;
  nextFreeDate: string | null;
  daysUntilFree: number;
  priceAmd: number;
  freeIntervalDays: number;
  lastBumpedAt: string;
  listing: {
    brand: string;
    model: string;
    year: number;
    generation?: string;
    version?: string | null;
    bodyType: string;
  };
  benefits: BumpBenefit[];
}

function formatTimeLeftRaw(targetDateStr: string): { type: "now" } | { type: "days"; days: number; hours: number } | { type: "hours"; hours: number; minutes: number } | { type: "minutes"; minutes: number } {
  const target = new Date(targetDateStr).getTime();
  const diff = target - Date.now();
  if (diff <= 0) return { type: "now" };
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return { type: "days", days, hours: hours % 24 };
  }
  if (hours > 0) return { type: "hours", hours, minutes };
  return { type: "minutes", minutes };
}

export default function BumpScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();
  const { t } = useTranslation();

  const formatTimeLeft = (targetDateStr: string): string => {
    const result = formatTimeLeftRaw(targetDateStr);
    if (result.type === "now") return t("bump.now");
    if (result.type === "days") return `${result.days} ${t("bump.days")} ${result.hours} ${t("bump.hours")}`;
    if (result.type === "hours") return `${result.hours} ${t("bump.hours")} ${result.minutes} ${t("bump.minutes")}`;
    return `${result.minutes} ${t("bump.minutes")}`;
  };

  const infoQuery = useQuery<BumpInfo>({
    queryKey: [API.listings.bumpInfo(listingId)],
    enabled: !!listingId && isAuthenticated,
  });

  const walletQuery = useQuery<{ balance: number }>({
    queryKey: [API.wallet.balance],
    enabled: isAuthenticated,
  });

  const bumpMutation = useMutation({
    mutationFn: async (paid: boolean) => {
      return apiRequest("POST", API.listings.bump(listingId), { paid });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: [API.listings.bumpInfo(listingId)] });
      queryClient.invalidateQueries({ queryKey: [API.listings.my] });
      queryClient.invalidateQueries({ queryKey: [API.wallet.balance] });
      queryClient.invalidateQueries({ queryKey: [API.listings.list] });
      showAlert(t("bump.successTitle"), t("bump.successMsg"), [
        { text: "OK", onPress: () => router.back() },
      ], "success");
    },
    onError: (err: Error) => {
      showAlert(t("bump.errorTitle"), err?.message || t("bump.errorMsg"), undefined, "error");
    },
  });

  const info = infoQuery.data;
  const walletBalance = walletQuery.data?.balance ?? 0;
  const isPaid = info ? !info.canFreeBump && !info.inCooldown : false;
  const isFree = info?.canFreeBump && !info.inCooldown;

  const handleBump = useCallback(() => {
    if (!info) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isFree) {
      showAlert(
        t("bump.confirmFreeTitle"),
        t("bump.confirmFreeMsg"),
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("bump.confirmUpdate"), onPress: () => bumpMutation.mutate(false) },
        ]
      );
      return;
    }

    if (isPaid) {
      if (walletBalance < info.priceAmd) {
        showAlert(
          t("bump.insufficientFunds"),
          `${t("bump.insufficientMsg1")} ${formatPrice(info.priceAmd, "AMD")}. ${t("bump.insufficientMsg2")} ${formatPrice(walletBalance, "AMD")}.`,
          [
            { text: t("common.cancel"), style: "cancel" },
            { text: t("bump.topUp"), onPress: () => router.push("/wallet") },
          ]
        );
        return;
      }

      showAlert(
        t("bump.paidTitle"),
        `${t("bump.paidConfirmMsg")} ${formatPrice(info.priceAmd, "AMD")}?`,
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("bump.confirmUpdate"), onPress: () => bumpMutation.mutate(true) },
        ]
      );
    }
  }, [info, isFree, isPaid, walletBalance, bumpMutation, showAlert, t]);

  const isLoading = infoQuery.isLoading;
  const listingTitle = info?.listing ? getListingTitle({
    ...info.listing,
    version: info.listing.version ?? undefined,
  }) : "";

  const getBenefitTitle = (b: BumpBenefit) => b.titleKey ? t(b.titleKey) : (b.title || "");
  const getBenefitDesc = (b: BumpBenefit) => b.descKey ? t(b.descKey) : (b.desc || b.text || "");

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScreenHeader title={t("bump.headerTitle")} borderBottom />

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      ) : !info ? (
        <View style={styles.loadingWrap}>
          <Ionicons name={I.alert} size={48} color={colors.textTertiary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {t("bump.loadError")}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.listingCard, { backgroundColor: isDark ? colors.surface : colors.surface, borderColor: colors.border }]}>
            <View style={[styles.listingIconWrap, { backgroundColor: colors.surfacePressed }]}>
              <Ionicons name={I.refresh} size={22} color={colors.text} />
            </View>
            <View style={styles.listingInfo}>
              <Text style={[styles.listingTitle, { color: colors.text }]} numberOfLines={1}>{listingTitle}</Text>
              {info.inCooldown ? (
                <View style={styles.statusRow}>
                  <Ionicons name={I.time} size={14} color={colors.accentOrange} />
                  <Text style={[styles.statusText, { color: colors.accentOrange }]}>
                    {t("bump.availableIn")} {formatTimeLeft(info.cooldownEndsAt!)}
                  </Text>
                </View>
              ) : isFree ? (
                <View style={styles.statusRow}>
                  <Ionicons name={I.verified} size={14} color={colors.success} />
                  <Text style={[styles.statusText, { color: colors.success }]}>{t("bump.freeTag")}</Text>
                </View>
              ) : (
                <Text style={[styles.listingPrice, { color: colors.textSecondary }]}>
                  {t("bump.costLabel")} {formatPrice(info.priceAmd, "AMD")}
                </Text>
              )}
            </View>
          </View>

          {info.inCooldown && (
            <View style={[styles.infoCard, { backgroundColor: colors.accentOrange + "12" }]}>
              <Ionicons name={I.hourglass} size={16} color={colors.accentOrange} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {t("bump.cooldownMsg")}{" "}
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {formatTimeLeft(info.cooldownEndsAt!)}
                </Text>.
              </Text>
            </View>
          )}

          {!info.inCooldown && !isFree && info.nextFreeDate && (
            <View style={[styles.infoCard, { backgroundColor: colors.accentBlue + "12" }]}>
              <Ionicons name={I.time} size={16} color={colors.accentBlue} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {t("bump.freeAvailableIn")}{" "}
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {info.daysUntilFree} {info.daysUntilFree === 1 ? (t("bump.dayFrom1") || t("bump.day1")) : info.daysUntilFree < 5 ? (t("bump.dayFrom2to4") || t("bump.day2to4")) : (t("bump.dayFrom5plus") || t("bump.day5plus"))}
                </Text>
                {". "}{t("bump.freeInterval")}{" "}
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {info.freeIntervalDays} {info.freeIntervalDays === 1 ? t("bump.day1") : info.freeIntervalDays < 5 ? t("bump.day2to4") : t("bump.day5plus")}
                </Text>
                {t("bump.freeIntervalSuffix") ? ` ${t("bump.freeIntervalSuffix")}` : "."}
              </Text>
            </View>
          )}

          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
            {t("bump.benefitsLabel")}
          </Text>

          <View style={[styles.benefitsCard, { backgroundColor: isDark ? colors.surface : colors.background, borderColor: colors.border }]}>
            {info.benefits.map((b, i) => (
              <View key={i} style={[styles.benefitRow, i < info.benefits.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                <View style={[styles.benefitIcon, { backgroundColor: colors.surfacePressed }]}>
                  <Ionicons name={b.icon as any} size={18} color={colors.text} />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={[styles.benefitTitle, { color: colors.text }]}>{getBenefitTitle(b)}</Text>
                  <Text style={[styles.benefitDesc, { color: colors.textSecondary }]}>{getBenefitDesc(b)}</Text>
                </View>
              </View>
            ))}
          </View>

          {!info.inCooldown && isPaid && (
            <View style={[styles.summaryCard, { backgroundColor: isDark ? colors.surface : colors.background, borderColor: colors.border }]}>
              <View style={styles.summaryRow}>
                <View>
                  <Text style={[styles.summaryPrice, { color: colors.text }]}>
                    {formatPrice(info.priceAmd, "AMD")}
                  </Text>
                </View>
                <View style={styles.balanceRow}>
                  <Ionicons name={I.wallet} size={14} color={walletBalance >= info.priceAmd ? colors.textSecondary : colors.error} />
                  <Text style={[styles.balanceText, { color: walletBalance >= info.priceAmd ? colors.textSecondary : colors.error }]}>
                    {formatPrice(walletBalance, "AMD")}
                  </Text>
                </View>
              </View>
              {walletBalance < info.priceAmd && (
                <Pressable
                  onPress={() => router.push("/wallet")}
                  style={({ pressed }) => [
                    styles.topUpLink,
                    { backgroundColor: colors.accentBlue + (pressed ? "20" : "10") },
                  ]}
                >
                  <Ionicons name={I.add} size={16} color={colors.accentBlue} />
                  <Text style={[styles.topUpText, { color: colors.accentBlue }]}>{t("bump.topUp")}</Text>
                </Pressable>
              )}
            </View>
          )}

          {!info.inCooldown && (
            <Pressable
              onPress={handleBump}
              disabled={bumpMutation.isPending}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: colors.buttonPrimary,
                  opacity: (pressed || bumpMutation.isPending) ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
            >
              {bumpMutation.isPending ? (
                <ActivityIndicator color={colors.buttonPrimaryText} size="small" />
              ) : (
                <>
                  <Ionicons name={I.refresh} size={18} color={colors.buttonPrimaryText} />
                  <Text style={[styles.actionBtnText, { color: colors.buttonPrimaryText }]}>
                    {isFree
                      ? t("bump.btnFree")
                      : `${t("bump.btnPaid")} ${formatPrice(info.priceAmd, "AMD")}`}
                  </Text>
                </>
              )}
            </Pressable>
          )}
        </ScrollView>
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
    justifyContent: "space-between",
    paddingHorizontal: HEADER_CONTENT_PADDING_H,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.2,
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
  scrollContent: {
    padding: SCREEN_PADDING_H,
    gap: 12,
  },
  listingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
  },
  listingIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  listingInfo: {
    flex: 1,
    gap: 3,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  listingPrice: {
    fontSize: 13,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  benefitsCard: {
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    overflow: "hidden",
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  benefitIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitContent: {
    flex: 1,
    gap: 1,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  benefitDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  summaryCard: {
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryPrice: {
    fontSize: 18,
    fontWeight: "700",
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  balanceText: {
    fontSize: 13,
    fontWeight: "500",
  },
  topUpLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  topUpText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: CARD_RADIUS,
    marginTop: 4,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
});

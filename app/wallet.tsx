import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useAlert } from "@/contexts/AlertContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { WalletSkeleton } from "@/components/SkeletonCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { AppIcons as I } from "@/constants/icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useColors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/EmptyState";
import { apiRequest } from "@/lib/query-client";
import { formatDateWithTime, formatPrice } from "@/lib/formatters";
import { useTranslation } from "@/lib/i18n";
import { ScreenHeader } from "@/components/ScreenHeader";
import { CARD_GAP, CARD_PADDING, CARD_RADIUS, SCREEN_PADDING_H, HEADER_CONTENT_PADDING_H, HEADER_FONT_SIZE, HEADER_FONT_WEIGHT, HEADER_LETTER_SPACING, WEB_TOP_INSET } from "@/constants/layout";
import { API } from "@/lib/api-endpoints";

interface Transaction {
  id: number;
  type: string;
  amountAmd: number;
  description: string | null;
  listingId: number | null;
  status: string;
  createdAt: string;
}

function getTypeConfig(colors: ReturnType<typeof useColors>): Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; sign: string }> {
  return {
    wallet_topup: { icon: "arrow-down-circle", color: colors.statusActive, sign: "+" },
    promotion_purchase: { icon: "flash", color: colors.accentBlue, sign: "-" },
    dealer_subscription: { icon: "storefront", color: "#8B5CF6", sign: "-" },
    refund: { icon: "arrow-undo", color: colors.statusActive, sign: "+" },
    payment: { icon: "card", color: colors.accentOrange, sign: "-" },
  };
}

const TOPUP_PRESETS = [1000, 3000, 5000, 10000];

function TransactionItem({
  tx,
  colors,
  isDark,
  isLast,
}: {
  tx: Transaction;
  colors: ReturnType<typeof useColors>;
  isDark: boolean;
  isLast: boolean;
}) {
  const { t } = useTranslation();
  const TYPE_CONFIG = getTypeConfig(colors);
  const config = TYPE_CONFIG[tx.type] || TYPE_CONFIG.payment;
  const isIncome = tx.type === "wallet_topup" || tx.type === "refund";

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      wallet_topup: t("wallet.topUpType"),
      promotion_purchase: t("wallet.promotion"),
      dealer_subscription: t("wallet.dealerSubscription"),
      refund: t("wallet.refund"),
      payment: t("wallet.payment"),
    };
    return labels[type] || t("wallet.payment");
  };

  const getLocalizedDescription = (desc: string | null): string | null => {
    if (!desc) return null;
    if (desc === "wallet_topup:idram" || desc.includes("Idram")) return t("wallet.topUpViaIdram");
    if (desc === "wallet_topup:telcell" || desc.includes("Telcell")) return t("wallet.topUpViaTelcell");
    return desc;
  };

  const localizedDesc = getLocalizedDescription(tx.description);

  return (
    <Pressable
      onPress={() => {
        if (tx.listingId) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/car/${tx.listingId}`);
        }
      }}
      style={({ pressed }) => [
        styles.txRow,
        { opacity: pressed && tx.listingId ? 0.7 : 1 },
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <View style={[styles.txIconWrap, { backgroundColor: config.color + "15" }]}>
        <Ionicons name={config.icon} size={20} color={config.color} />
      </View>
      <View style={styles.txInfo}>
        <Text style={[styles.txLabel, { color: colors.text }]} numberOfLines={1}>
          {getTypeLabel(tx.type)}
        </Text>
        {localizedDesc && (
          <Text style={[styles.txDesc, { color: colors.textSecondary }]} numberOfLines={1}>
            {localizedDesc}
          </Text>
        )}
      </View>
      <View style={styles.txRight}>
        <Text
          style={[
            styles.txAmount,
            { color: isIncome ? colors.statusActive : colors.text },
          ]}
        >
          {config.sign}{tx.amountAmd.toLocaleString()} ֏
        </Text>
        <Text style={[styles.txTime, { color: colors.textTertiary }]}>{formatDateWithTime(tx.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

export default function WalletScreen() {
  const { t } = useTranslation();
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const { showAlert } = useAlert();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { isAuthenticated, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupMethod, setTopupMethod] = useState<"idram" | "telcell">("idram");

  const { data: walletData, isLoading: walletLoading } = useQuery<{ balance: number }>({
    queryKey: [API.wallet.balance],
    enabled: isAuthenticated,
  });

  const { data: txData, isLoading: txLoading, refetch } = useQuery<{ transactions: Transaction[]; total: number }>({
    queryKey: [API.transactions, { limit: 50 }],
    queryFn: async () => {
      const res = await apiRequest("GET", `${API.transactions}?limit=50`);
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const balance = walletData?.balance ?? 0;
  const transactions = txData?.transactions ?? [];

  const topupMutation = useMutation({
    mutationFn: async (params: { amount: number; paymentMethod: string }) => {
      return apiRequest("POST", API.wallet.topup, params);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: [API.wallet.balance] });
      queryClient.invalidateQueries({ queryKey: [API.transactions] });
      refreshUser();
      setShowTopup(false);
      setTopupAmount("");
    },
    onError: (error: Error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert(t("common.error"), error.message || t("wallet.topUpError"), undefined, "error");
    },
  });

  const handleTopup = useCallback(() => {
    const amt = parseInt(topupAmount);
    if (!amt || amt < 100) {
      showAlert(t("common.error"), t("wallet.minAmountError"), undefined, "error");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    topupMutation.mutate({ amount: amt, paymentMethod: topupMethod });
  }, [topupAmount, topupMethod, topupMutation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [API.wallet.balance] }),
        refetch(),
      ]);
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  }, [refetch, queryClient]);

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ScreenHeader title={t("wallet.title")} backgroundColor={isDark ? colors.surface : colors.background} />
        <View style={styles.center}>
          <EmptyState
            image={require("@/assets/images/empty-login.png")}
            title={t("wallet.loginRequired")}
            subtitle={t("wallet.loginForWallet")}
            actionLabel={t("common.login")}
            onAction={() => router.push("/auth")}
          />
        </View>
      </View>
    );
  }

  const isLoading = walletLoading || txLoading;

  const incomeTotal = transactions
    .filter(tx => tx.type === "wallet_topup" || tx.type === "refund")
    .reduce((sum, tx) => sum + tx.amountAmd, 0);
  const expenseTotal = transactions
    .filter(tx => tx.type !== "wallet_topup" && tx.type !== "refund")
    .reduce((sum, tx) => sum + tx.amountAmd, 0);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}
      behavior="padding"
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScreenHeader
        title={t("wallet.title")}
        backgroundColor={isDark ? colors.surface : colors.background}
        rightActions={[{ icon: I.receipt, onPress: () => router.push("/transactions") }]}
      />

      {isLoading ? (
        <WalletSkeleton />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.listContent,
            transactions.length === 0 && styles.emptyList,
            { paddingBottom: insets.bottom + 20 },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentBlue} />
          }
          ListHeaderComponent={
            <>
              <LinearGradient
                colors={isDark ? [colors.surface, colors.surfaceSecondary, colors.surfaceTertiary] : [colors.primary, colors.primaryLight, "#48484A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.balanceCard}
              >
                <Text style={styles.balanceLabel}>{t("wallet.availableBalance")}</Text>
                <Text style={styles.balanceValue}>
                  {balance.toLocaleString()}
                  <Text style={styles.balanceCurrency}> ֏</Text>
                </Text>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <View style={[styles.statDot, { backgroundColor: colors.statusActive }]} />
                    <Text style={styles.statLabel}>{t("wallet.income")}</Text>
                    <Text style={styles.statValue}>{incomeTotal.toLocaleString()} ֏</Text>
                  </View>
                  <View style={[styles.statDivider]} />
                  <View style={styles.statItem}>
                    <View style={[styles.statDot, { backgroundColor: colors.accentOrange }]} />
                    <Text style={styles.statLabel}>{t("wallet.expenses")}</Text>
                    <Text style={styles.statValue}>{expenseTotal.toLocaleString()} ֏</Text>
                  </View>
                </View>

                <View style={styles.balanceActions}>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowTopup(!showTopup);
                    }}
                    style={({ pressed }) => [
                      styles.balanceBtn,
                      { backgroundColor: pressed ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.15)" },
                    ]}
                  >
                    <Ionicons name={showTopup ? "close" : "add-circle-outline"} size={18} color="#FFFFFF" />
                    <Text style={styles.balanceBtnText}>{showTopup ? t("common.cancel") : t("wallet.topUp")}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push("/transactions");
                    }}
                    style={({ pressed }) => [
                      styles.balanceBtn,
                      { backgroundColor: pressed ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.15)" },
                    ]}
                  >
                    <Ionicons name={I.time} size={18} color="#FFFFFF" />
                    <Text style={styles.balanceBtnText}>{t("wallet.history")}</Text>
                  </Pressable>
                </View>
              </LinearGradient>

              {showTopup && (
                <View style={[styles.topupSection, { backgroundColor: isDark ? colors.surface : colors.background, borderColor: colors.border }]}>
                  <View style={[styles.testModeBanner, { backgroundColor: isDark ? "rgba(255,159,10,0.12)" : "#FEF3C7", borderColor: isDark ? "rgba(255,159,10,0.3)" : "#F59E0B" }]}>
                    <Ionicons name="warning" size={16} color={isDark ? "#FF9F0A" : "#D97706"} />
                    <Text style={[styles.testModeText, { color: isDark ? "#FFD60A" : "#92400E" }]}>
                      {t("wallet.testModeWarning")}
                    </Text>
                  </View>

                  <Text style={[styles.topupTitle, { color: colors.text }]}>{t("wallet.topUpAmount")}</Text>

                  <View style={[styles.topupInputWrap, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                    <TextInput
                      style={[styles.topupInput, { color: colors.text }]}
                      value={topupAmount}
                      onChangeText={(val) => setTopupAmount(val.replace(/[^0-9]/g, ""))}
                      placeholder="0"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="number-pad"
                      returnKeyType="done"
                    />
                    <Text style={[styles.topupInputSuffix, { color: colors.textTertiary }]}>֏</Text>
                  </View>

                  <View style={styles.presetRow}>
                    {TOPUP_PRESETS.map((amount) => {
                      const isActive = topupAmount === String(amount);
                      return (
                        <Pressable
                          key={amount}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setTopupAmount(String(amount));
                          }}
                          style={[
                            styles.presetChip,
                            {
                              backgroundColor: isActive ? colors.buttonPrimary : colors.inputBackground,
                            },
                          ]}
                        >
                          <Text style={[styles.presetText, { color: isActive ? colors.buttonPrimaryText : colors.text }]}>
                            {amount.toLocaleString()} ֏
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={[styles.topupMethodTitle, { color: colors.textSecondary }]}>{t("wallet.paymentMethod")}</Text>

                  <View style={styles.methodRow}>
                    {(["idram", "telcell"] as const).map((m) => {
                      const isActive = topupMethod === m;
                      return (
                        <Pressable
                          key={m}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setTopupMethod(m);
                          }}
                          style={[
                            styles.methodChip,
                            {
                              backgroundColor: isActive ? colors.buttonPrimary : colors.inputBackground,
                              borderColor: isActive ? colors.buttonPrimary : colors.border,
                            },
                          ]}
                        >
                          <Ionicons
                            name={m === "idram" ? "phone-portrait" : "card"}
                            size={16}
                            color={isActive ? colors.buttonPrimaryText : colors.textSecondary}
                          />
                          <Text style={[styles.methodLabel, { color: isActive ? colors.buttonPrimaryText : colors.text }]}>
                            {m === "idram" ? "Idram" : "Telcell"}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Pressable
                    onPress={handleTopup}
                    disabled={topupMutation.isPending || !topupAmount}
                    style={({ pressed }) => [
                      styles.topupBtn,
                      {
                        backgroundColor: topupAmount
                          ? colors.buttonPrimary
                          : colors.border,
                        opacity: pressed && topupAmount ? 0.85 : topupMutation.isPending ? 0.7 : 1,
                      },
                    ]}
                  >
                    {topupMutation.isPending ? (
                      <ActivityIndicator size="small" color={colors.buttonPrimaryText} />
                    ) : (
                      <Text style={[styles.topupBtnText, { color: topupAmount ? colors.buttonPrimaryText : colors.textTertiary }]}>
                        {topupAmount ? `${t("wallet.topUpButton")} ${formatPrice(parseInt(topupAmount || "0"), "AMD")}` : t("wallet.enterAmount")}
                      </Text>
                    )}
                  </Pressable>
                </View>
              )}

              {transactions.length > 0 && (
                <View style={styles.txHeader}>
                  <Text style={[styles.txSectionTitle, { color: colors.text }]}>{t("wallet.recentOperations")}</Text>
                  {transactions.length > 5 && (
                    <Pressable onPress={() => router.push("/transactions")} hitSlop={8}>
                      <Text style={[styles.txSeeAll, { color: colors.linkColor }]}>{t("wallet.seeAll")}</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {transactions.length > 0 && (
                <View style={[styles.txCard, { backgroundColor: isDark ? colors.surface : colors.background, borderColor: colors.border }]}>
                  {transactions.slice(0, 10).map((tx, idx) => (
                    <TransactionItem
                      key={tx.id}
                      tx={tx}
                      colors={colors}
                      isDark={isDark}
                      isLast={idx === Math.min(transactions.length, 10) - 1}
                    />
                  ))}
                </View>
              )}
            </>
          }
          renderItem={() => null}
          ListEmptyComponent={
            <EmptyState
              image={require("@/assets/images/empty-wallet.png")}
              title={t("wallet.noOperations")}
              subtitle={t("wallet.topUpForPromotion")}
            />
          }
        />
      )}
    </KeyboardAvoidingView>
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
  },
  headerTitle: {
    fontSize: HEADER_FONT_SIZE,
    fontWeight: HEADER_FONT_WEIGHT,
    letterSpacing: HEADER_LETTER_SPACING,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SCREEN_PADDING_H,
  },
  listContent: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingTop: 4,
  },
  emptyList: {
    flex: 1,
  },
  balanceCard: {
    borderRadius: CARD_RADIUS,
    padding: CARD_PADDING + 4,
    marginBottom: CARD_GAP,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.3,
  },
  balanceValue: {
    fontSize: 38,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1.5,
    marginTop: 4,
  },
  balanceCurrency: {
    fontSize: 18,
    fontWeight: "500",
    color: "rgba(255,255,255,0.5)",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(255,255,255,0.5)",
  },
  statValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
    width: "100%",
    paddingLeft: 12,
    marginTop: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginHorizontal: 12,
  },
  balanceActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  balanceBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  balanceBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  topupSection: {
    borderRadius: CARD_RADIUS,
    padding: 16,
    marginBottom: CARD_GAP,
    borderWidth: 1,
    gap: 12,
  },
  topupTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  topupInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 8,
    height: 48,
    borderWidth: 1,
  },
  topupInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    height: "100%",
  },
  topupInputSuffix: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  presetRow: {
    flexDirection: "row",
    gap: 8,
  },
  presetChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
  },
  presetText: {
    fontSize: 13,
    fontWeight: "600",
  },
  topupMethodTitle: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  methodRow: {
    flexDirection: "row",
    gap: 8,
  },
  methodChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  methodLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  topupBtn: {
    height: 48,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  topupBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
  txHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 4,
  },
  txSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  txSeeAll: {
    fontSize: 14,
    fontWeight: "500",
  },
  txCard: {
    borderRadius: CARD_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: CARD_PADDING,
    gap: 12,
  },
  txIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  txInfo: {
    flex: 1,
    gap: 2,
  },
  txLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  txDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  txRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: "700",
  },
  txTime: {
    fontSize: 11,
  },
  testModeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  testModeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
});

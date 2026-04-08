import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  RefreshControl,
} from "react-native";

import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { TransactionsSkeleton } from "@/components/SkeletonCard";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { Ionicons } from "@expo/vector-icons";
import { AppIcons as I } from "@/constants/icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/EmptyState";
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

interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
}

type FilterType = "all" | "income" | "expense";

function getDateGroup(dateStr: string, t: (key: string) => string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(todayDate.getTime() - 86400000);
  const txDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (txDate.getTime() === todayDate.getTime()) return t("time.today");
  if (txDate.getTime() === yesterday.getTime()) return t("time.yesterday");

  const monthKeys = ["time.month1", "time.month2", "time.month3", "time.month4", "time.month5", "time.month6", "time.month7", "time.month8", "time.month9", "time.month10", "time.month11", "time.month12"];
  const monthName = t(monthKeys[date.getMonth()]);
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getDate()} ${monthName}`;
  }
  return `${date.getDate()} ${monthName} ${date.getFullYear()}`;
}

function getTimeOnly(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface DateGroup {
  title: string;
  transactions: Transaction[];
}

export default function TransactionsScreen() {
  const { t } = useTranslation();
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  const TYPE_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; sign: string }> = useMemo(() => ({
    wallet_topup: { icon: "arrow-down-circle", color: colors.statusActive, sign: "+" },
    promotion_purchase: { icon: "flash", color: colors.accentBlue, sign: "-" },
    dealer_subscription: { icon: "storefront", color: "#8B5CF6", sign: "-" },
    refund: { icon: "arrow-undo", color: colors.statusActive, sign: "+" },
    payment: { icon: "card", color: colors.accentOrange, sign: "-" },
  }), [colors]);

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

  const { data, isLoading, refetch } = useQuery<TransactionsResponse>({
    queryKey: [API.transactions, { limit: 100 }],
    queryFn: async () => {
      const res = await apiRequest("GET", `${API.transactions}?limit=100`);
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const allTransactions = data?.transactions ?? [];

  const filteredTransactions = useMemo(() => {
    if (filter === "all") return allTransactions;
    if (filter === "income") return allTransactions.filter(tx => tx.type === "wallet_topup" || tx.type === "refund");
    return allTransactions.filter(tx => tx.type !== "wallet_topup" && tx.type !== "refund");
  }, [allTransactions, filter]);

  const dateGroups = useMemo<DateGroup[]>(() => {
    const groups: Record<string, Transaction[]> = {};
    const order: string[] = [];
    for (const tx of filteredTransactions) {
      const key = getDateGroup(tx.createdAt, t);
      if (!groups[key]) {
        groups[key] = [];
        order.push(key);
      }
      groups[key].push(tx);
    }
    return order.map(title => ({ title, transactions: groups[title] }));
  }, [filteredTransactions, t]);

  const incomeTotal = allTransactions
    .filter(tx => tx.type === "wallet_topup" || tx.type === "refund")
    .reduce((sum, tx) => sum + tx.amountAmd, 0);
  const expenseTotal = allTransactions
    .filter(tx => tx.type !== "wallet_topup" && tx.type !== "refund")
    .reduce((sum, tx) => sum + tx.amountAmd, 0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  }, [refetch]);

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all", label: t("common.all") },
    { key: "income", label: t("wallet.income") },
    { key: "expense", label: t("wallet.expenses") },
  ];

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ScreenHeader title={t("wallet.transactionHistory")} backgroundColor={isDark ? colors.surface : colors.background} />
        <View style={styles.centerContent}>
          <EmptyState
            image={require("@/assets/images/empty-login.png")}
            title={t("wallet.loginRequired")}
            subtitle={t("wallet.loginForHistory")}
            actionLabel={t("common.login")}
            onAction={() => router.push("/auth")}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScreenHeader title={t("wallet.transactionHistory")} backgroundColor={isDark ? colors.surface : colors.background} />

      {isLoading ? (
        <TransactionsSkeleton />
      ) : (
        <FlatList
          data={dateGroups}
          keyExtractor={(item) => item.title}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            dateGroups.length === 0 && styles.emptyList,
            { paddingBottom: insets.bottom + 20 },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentBlue} />
          }
          ListHeaderComponent={
            <View style={[styles.summaryCard, { backgroundColor: isDark ? colors.surface : colors.background }]}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryHalf}>
                  <View style={[styles.summaryDot, { backgroundColor: colors.statusActive }]} />
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t("wallet.income")}</Text>
                  <Text style={[styles.summaryValue, { color: colors.statusActive }]}>+{incomeTotal.toLocaleString()} ֏</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                <View style={styles.summaryHalf}>
                  <View style={[styles.summaryDot, { backgroundColor: colors.accentOrange }]} />
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t("wallet.expenses")}</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>-{expenseTotal.toLocaleString()} ֏</Text>
                </View>
              </View>
              <View style={[styles.filterRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                {FILTERS.map((f) => {
                  const isActive = filter === f.key;
                  return (
                    <Pressable
                      key={f.key}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setFilter(f.key);
                      }}
                      style={[
                        styles.filterChip,
                        { backgroundColor: isActive ? colors.buttonPrimary : isDark ? colors.surfaceSecondary : colors.surfaceSecondary },
                      ]}
                    >
                      <Text style={[styles.filterText, { color: isActive ? colors.buttonPrimaryText : colors.textSecondary }]}>
                        {f.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          }
          renderItem={({ item: group }) => (
            <View style={styles.dateSection}>
              <Text style={[styles.dateSectionTitle, { color: colors.textTertiary }]}>{group.title}</Text>
              <View style={[styles.txCard, { backgroundColor: isDark ? colors.surface : colors.background, borderColor: colors.border }]}>
                {group.transactions.map((tx, idx) => {
                  const config = TYPE_CONFIG[tx.type] || TYPE_CONFIG.payment;
                  const isIncome = tx.type === "wallet_topup" || tx.type === "refund";
                  const isLast = idx === group.transactions.length - 1;

                  return (
                    <Pressable
                      key={tx.id}
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
                        <Ionicons name={config.icon} size={18} color={config.color} />
                      </View>
                      <View style={styles.txInfo}>
                        <Text style={[styles.txLabel, { color: colors.text }]} numberOfLines={1}>
                          {getTypeLabel(tx.type)}
                        </Text>
                        {tx.description && (
                          <Text style={[styles.txDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                            {(tx.description === "wallet_topup:idram" || tx.description.includes("Idram")) ? t("wallet.topUpViaIdram") : (tx.description === "wallet_topup:telcell" || tx.description.includes("Telcell")) ? t("wallet.topUpViaTelcell") : tx.description}
                          </Text>
                        )}
                      </View>
                      <View style={styles.txRight}>
                        <Text style={[styles.txAmount, { color: isIncome ? colors.statusActive : colors.text }]}>
                          {config.sign}{tx.amountAmd.toLocaleString()} ֏
                        </Text>
                        <Text style={[styles.txTime, { color: colors.textTertiary }]}>{getTimeOnly(tx.createdAt)}</Text>
                      </View>
                      {tx.listingId && (
                        <Ionicons name={I.forward} size={14} color={colors.textTertiary} style={{ marginLeft: 2 }} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              image={require("@/assets/images/empty-transactions.png")}
              title={filter === "all" ? t("wallet.noTransactions") : filter === "income" ? t("wallet.noIncome") : t("wallet.noExpenses")}
              subtitle={filter === "all" ? t("wallet.historyWillAppear") : t("wallet.noFilteredTransactions")}
            />
          }
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
    justifyContent: "space-between",
    paddingHorizontal: HEADER_CONTENT_PADDING_H,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: HEADER_FONT_SIZE,
    fontWeight: HEADER_FONT_WEIGHT,
    letterSpacing: HEADER_LETTER_SPACING,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -40,
    paddingHorizontal: 32,
  },
  listContent: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingTop: 4,
  },
  emptyList: {
    flex: 1,
  },
  summaryCard: {
    borderRadius: CARD_RADIUS,
    marginBottom: CARD_GAP,
    overflow: "hidden",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: CARD_PADDING,
  },
  summaryHalf: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    height: 36,
    marginHorizontal: 8,
  },
  summaryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: CARD_PADDING,
    paddingVertical: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
  },
  dateSection: {
    marginBottom: 16,
  },
  dateSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.2,
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
    gap: 10,
  },
  txIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
});

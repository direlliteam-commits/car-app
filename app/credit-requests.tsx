import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from "react-native";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/constants/colors";
import { EmptyState } from "@/components/EmptyState";
import { useAlert } from "@/contexts/AlertContext";
import { CARD_RADIUS, SCREEN_PADDING_H } from "@/constants/layout";
import { API } from "@/lib/api-endpoints";

interface CreditApp {
  id: number;
  listingId: number;
  fullName: string;
  email: string | null;
  phone: string | null;
  downPaymentPercent: number;
  months: number;
  loanAmount: number;
  monthlyPayment: number;
  status: string;
  createdAt: string;
  brand: string;
  model: string;
  year: number;
}

type FilterType = "all" | "pending" | "contacted" | "approved" | "rejected";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: IoniconsName }> = {
  pending: { label: "Ожидает", color: "#F59E0B", icon: "time-outline" },
  contacted: { label: "На связи", color: "#3B82F6", icon: "call-outline" },
  approved: { label: "Одобрена", color: "#10B981", icon: "checkmark-circle-outline" },
  rejected: { label: "Отклонена", color: "#EF4444", icon: "close-circle-outline" },
};

export default function CreditRequestsScreen() {
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useColors(colorScheme);
  const { showAlert } = useAlert();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType>("all");

  const { data, isLoading, refetch } = useQuery<{ applications: CreditApp[] }>({
    queryKey: [API.credit.applications, filter !== "all" ? `?status=${filter}` : ""],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", API.credit.getApplication(id), { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API.credit.applications] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const handleStatusChange = useCallback((id: number, currentStatus: string) => {
    const options = Object.entries(STATUS_CONFIG)
      .filter(([key]) => key !== currentStatus)
      .map(([key, val]) => ({
        text: val.label,
        onPress: () => updateMutation.mutate({ id, status: key }),
      }));

    showAlert("Изменить статус", "Выберите новый статус заявки", [
      ...options,
      { text: "Отмена", style: "cancel" },
    ], "info");
  }, [updateMutation]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatMoney = (amount: number) => {
    return amount.toLocaleString("ru-RU") + " ֏";
  };

  const renderItem = useCallback(({ item }: { item: CreditApp }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    return (
      <View style={[styles.card, { backgroundColor: isDark ? colors.surface : colors.background }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.carName, { color: colors.text }]}>
              {item.brand} {item.model} {item.year}
            </Text>
            <Text style={[styles.applicantName, { color: colors.textSecondary }]}>
              {item.fullName}
            </Text>
          </View>
          <Pressable
            onPress={() => handleStatusChange(item.id, item.status)}
            style={[styles.statusBadge, { backgroundColor: cfg.color + "20" }]}
          >
            <Ionicons name={cfg.icon} size={14} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </Pressable>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Сумма кредита</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{formatMoney(item.loanAmount)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Ежемесячно</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{formatMoney(item.monthlyPayment)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Первый взнос</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{item.downPaymentPercent}%</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Срок</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{item.months} мес.</Text>
          </View>
        </View>

        {(item.phone || item.email) && (
          <View style={[styles.contactRow, { borderTopColor: colors.border }]}>
            {item.phone && (
              <View style={styles.contactItem}>
                <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.contactText, { color: colors.text }]}>{item.phone}</Text>
              </View>
            )}
            {item.email && (
              <View style={styles.contactItem}>
                <Ionicons name="mail-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.contactText, { color: colors.text }]}>{item.email}</Text>
              </View>
            )}
          </View>
        )}

        <Text style={[styles.dateText, { color: colors.textSecondary }]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
    );
  }, [isDark, colors, handleStatusChange]);

  const applications = data?.applications || [];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Screen options={{ title: "Заявки на кредит", headerBackTitle: "Назад" }} />

      <View style={styles.filtersRow}>
        {(["all", "pending", "contacted", "approved", "rejected"] as FilterType[]).map((f) => {
          const active = filter === f;
          const label = f === "all" ? "Все" : STATUS_CONFIG[f].label;
          return (
            <Pressable
              key={f}
              onPress={() => { setFilter(f); Haptics.selectionAsync(); }}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active
                    ? (isDark ? "#FFFFFF" : "#000000")
                    : (isDark ? "#252528" : "#FFFFFF"),
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: active
                      ? (isDark ? "#000000" : "#FFFFFF")
                      : colors.textSecondary,
                  },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={applications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="document-text-outline"
              title="Нет заявок"
              message="Заявки на кредит по вашим объявлениям будут отображаться здесь"
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersRow: {
    flexDirection: "row",
    paddingHorizontal: SCREEN_PADDING_H,
    paddingVertical: 12,
    gap: 8,
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    borderRadius: CARD_RADIUS,
    padding: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  carName: {
    fontSize: 16,
    fontWeight: "700",
  },
  applicantName: {
    fontSize: 14,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  detailItem: {
    width: "45%",
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 2,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contactText: {
    fontSize: 13,
  },
  dateText: {
    fontSize: 11,
    marginTop: 8,
    textAlign: "right",
  },
});

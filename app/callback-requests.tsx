import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Linking,
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

interface CallbackReq {
  id: number;
  listingId: number;
  name: string;
  phone: string;
  status: string;
  createdAt: string;
  brand: string;
  model: string;
  year: number;
}

type FilterType = "all" | "pending" | "completed" | "cancelled";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: IoniconsName }> = {
  pending: { label: "Ожидает", color: "#F59E0B", icon: "time-outline" },
  completed: { label: "Выполнено", color: "#10B981", icon: "checkmark-circle-outline" },
  cancelled: { label: "Отменён", color: "#EF4444", icon: "close-circle-outline" },
};

export default function CallbackRequestsScreen() {
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useColors(colorScheme);
  const { showAlert } = useAlert();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType>("all");

  const { data, isLoading, refetch } = useQuery<{ requests: CallbackReq[] }>({
    queryKey: [API.callback.requests, filter !== "all" ? `?status=${filter}` : ""],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", API.callback.getById(id), { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API.callback.requests] });
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

    showAlert("Изменить статус", "Выберите новый статус", [
      ...options,
      { text: "Отмена", style: "cancel" },
    ], "info");
  }, [updateMutation]);

  const handleCall = useCallback((phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${phone}`).catch(() => {});
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  const renderItem = useCallback(({ item }: { item: CallbackReq }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    return (
      <View style={[styles.card, { backgroundColor: isDark ? colors.surface : colors.background }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.carName, { color: colors.text }]}>
              {item.brand} {item.model} {item.year}
            </Text>
            <Text style={[styles.applicantName, { color: colors.textSecondary }]}>
              {item.name}
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

        <View style={styles.phoneRow}>
          <Pressable onPress={() => handleCall(item.phone)} style={[styles.callBtn, { backgroundColor: colors.successLight }]}>
            <Ionicons name="call" size={16} color={colors.success} />
            <Text style={[styles.phoneText, { color: colors.success }]}>{item.phone}</Text>
          </Pressable>
        </View>

        <Text style={[styles.dateText, { color: colors.textSecondary }]}>
          {formatDate(item.createdAt)} в {formatTime(item.createdAt)}
        </Text>
      </View>
    );
  }, [isDark, colors, handleStatusChange, handleCall]);

  const requests = data?.requests || [];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Screen options={{ title: "Обратные звонки", headerBackTitle: "Назад" }} />

      <View style={styles.filtersRow}>
        {(["all", "pending", "completed", "cancelled"] as FilterType[]).map((f) => {
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
        data={requests}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="call-outline"
              title="Нет заявок"
              message="Запросы на обратный звонок по вашим объявлениям будут отображаться здесь"
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
    fontWeight: "600" as const,
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
    fontWeight: "700" as const,
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
    fontWeight: "600" as const,
  },
  phoneRow: {
    marginBottom: 8,
  },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  phoneText: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  dateText: {
    fontSize: 11,
    textAlign: "right",
  },
});

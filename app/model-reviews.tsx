import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppIcons as I } from "@/constants/icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { useColors } from "@/constants/colors";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/lib/i18n";
import { formatRelativeTime } from "@/lib/formatters";
import { API } from "@/lib/api-endpoints";

export default function ModelReviewsScreen() {
  const { brand, model, generation } = useLocalSearchParams<{ brand: string; model: string; generation?: string }>();
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const ratingQuery = useQuery<{ avgRating: number; reviewsCount: number }>({
    queryKey: [API.modelRating, brand, model, generation],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (brand) params.append("brand", brand);
      if (model) params.append("model", model);
      if (generation) params.append("generation", generation);
      const resp = await apiRequest("GET", `${API.modelRating}?${params}`);
      return resp.json();
    },
    enabled: !!brand && !!model,
  });

  const reviewsQuery = useQuery<any[]>({
    queryKey: [API.modelReviews, brand, model, generation],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (brand) params.append("brand", brand);
      if (model) params.append("model", model);
      if (generation) params.append("generation", generation);
      const resp = await apiRequest("GET", `${API.modelReviews}?${params}`);
      return resp.json();
    },
    enabled: !!brand && !!model,
  });

  const rating = ratingQuery.data;
  const reviews = reviewsQuery.data || [];

  const title = `${brand || ""} ${model || ""}`.trim();

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= Math.round(rating) ? "star" : "star-outline"}
            size={16}
            color="#F59E0B"
          />
        ))}
      </View>
    );
  };

  const renderReview = ({ item }: { item: any }) => (
    <View style={[styles.reviewCard, { backgroundColor: isDark ? colors.surface : colors.background }]}>
      <View style={styles.reviewHeader}>
        <View style={[styles.avatarCircle, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {(item.userName || item.username || "?").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.reviewHeaderInfo}>
          <Text style={[styles.reviewerName, { color: colors.text }]}>
            {item.userName || item.username || item.phone || t("common.user")}
          </Text>
          <Text style={[styles.reviewDate, { color: colors.textTertiary }]}>
            {item.createdAt ? formatRelativeTime(item.createdAt) : ""}
          </Text>
        </View>
        {renderStars(item.rating)}
      </View>
      {item.comment ? (
        <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>
          {item.comment}
        </Text>
      ) : null}
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: title,
          headerStyle: { backgroundColor: isDark ? colors.surface : colors.background },
          headerTintColor: colors.text,
        }}
      />
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
        {rating && rating.reviewsCount > 0 && (
          <View style={[styles.ratingHeader, { backgroundColor: isDark ? colors.surface : colors.background }]}>
            <Text style={[styles.ratingBig, { color: colors.text }]}>
              {rating.avgRating.toFixed(1)}
            </Text>
            <View style={styles.ratingMeta}>
              {renderStars(rating.avgRating)}
              <Text style={[styles.ratingCountText, { color: colors.textSecondary }]}>
                {rating.reviewsCount} {t("carDetail.modelRating").toLowerCase()}
              </Text>
            </View>
          </View>
        )}

        {reviews.length === 0 && !reviewsQuery.isLoading ? (
          <View style={styles.emptyState}>
            <Ionicons name={I.chatBubble} size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t("carDetail.noReviews")}
            </Text>
          </View>
        ) : (
          <FlatList
            data={reviews}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderReview}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  ratingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
    marginBottom: 8,
  },
  ratingBig: {
    fontSize: 48,
    fontWeight: "700",
  },
  ratingMeta: {
    gap: 4,
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
  },
  ratingCountText: {
    fontSize: 14,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
  },
  reviewCard: {
    borderRadius: 12,
    padding: 16,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "600",
  },
  reviewHeaderInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: "600",
  },
  reviewDate: {
    fontSize: 12,
    marginTop: 1,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
  },
});

import React, { useCallback, useState } from "react";
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
import { StatusBar } from "expo-status-bar";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import * as Haptics from "expo-haptics";
import { useColors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/EmptyState";
import { resolveMediaUri } from "@/lib/media";
import { useTranslation } from "@/lib/i18n";
import { ScreenHeader } from "@/components/ScreenHeader";
import type { Review } from "@/components/seller/types";
import { SCREEN_PADDING_H, HEADER_CONTENT_PADDING_H, CARD_RADIUS, CARD_PADDING, HEADER_FONT_SIZE, HEADER_FONT_WEIGHT, HEADER_LETTER_SPACING } from "@/constants/layout";
import { API } from "@/lib/api-endpoints";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function ReviewItem({ review, colors, isDark }: { review: Review; colors: ReturnType<typeof useColors>; isDark: boolean }) {
  const { t } = useTranslation();
  const reviewerName = review.reviewer?.name || review.reviewer?.username || t("myReviews.anonymous");

  return (
    <View style={[styles.reviewCard, { backgroundColor: isDark ? colors.surface : colors.background, borderColor: colors.border }]}>
      <View style={styles.reviewHeader}>
        {review.reviewer?.avatarUrl ? (
          <ExpoImage
            source={{ uri: resolveMediaUri(review.reviewer.avatarUrl)! }}
            style={styles.avatar}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.textTertiary + "20" }]}>
            <Text style={[styles.avatarLetter, { color: colors.text }]}>
              {reviewerName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.reviewerInfo}>
          <Text style={[styles.reviewerName, { color: colors.text }]} numberOfLines={1}>
            {reviewerName}
          </Text>
          <Text style={[styles.reviewDate, { color: colors.textTertiary }]}>
            {formatDate(review.createdAt)}
          </Text>
        </View>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Ionicons key={s} name={s <= review.rating ? "star" : "star-outline"} size={14} color={colors.starColor} />
          ))}
        </View>
      </View>
      {review.comment && (
        <Text style={[styles.comment, { color: colors.text }]}>{review.comment}</Text>
      )}
    </View>
  );
}

export default function MyReviewsScreen() {
  const { t } = useTranslation();
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const reviewsQuery = useQuery<Review[]>({
    queryKey: [API.users.reviews(user?.id ?? "")],
    enabled: isAuthenticated && !!user?.id,
  });

  const reviews = reviewsQuery.data ?? [];
  const userRating = user?.rating || 0;
  const userReviewsCount = user?.reviewsCount || 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reviewsQuery.refetch();
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  }, [reviewsQuery]);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScreenHeader title={t("myReviews.title")} backgroundColor={isDark ? colors.surface : colors.background} />

      {userReviewsCount > 0 && (
        <View style={[styles.summaryCard, { backgroundColor: isDark ? colors.surface : colors.background, borderColor: colors.border }]}>
          <View style={styles.summaryRatingRow}>
            <Text style={[styles.summaryRatingValue, { color: colors.text }]}>{userRating.toFixed(1)}</Text>
            <View style={styles.summaryStars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons key={s} name={s <= Math.round(userRating) ? "star" : "star-outline"} size={16} color={colors.starColor} />
              ))}
            </View>
          </View>
          <Text style={[styles.summaryCount, { color: colors.textSecondary }]}>
            {userReviewsCount} {t("myReviews.reviewsCount")}
          </Text>
        </View>
      )}

      <FlatList
        data={reviews}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          reviews.length === 0 && styles.emptyList,
          { paddingBottom: insets.bottom + 20 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentBlue} />
        }
        renderItem={({ item }) => (
          <ReviewItem review={item} colors={colors} isDark={isDark} />
        )}
        ListEmptyComponent={
          <EmptyState
            image={require("@/assets/images/reviews-3d.png")}
            title={t("myReviews.empty")}
            subtitle={t("myReviews.emptySubtitle")}
          />
        }
      />
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
  summaryCard: {
    marginHorizontal: SCREEN_PADDING_H,
    marginBottom: 12,
    borderRadius: CARD_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    padding: CARD_PADDING,
    alignItems: "center",
    gap: 6,
  },
  summaryRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  summaryRatingValue: {
    fontSize: 28,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
  },
  summaryStars: {
    flexDirection: "row",
    gap: 2,
  },
  summaryCount: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  listContent: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingTop: 4,
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
  },
  reviewCard: {
    borderRadius: CARD_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    padding: CARD_PADDING,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  reviewerInfo: {
    flex: 1,
    gap: 2,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  reviewDate: {
    fontSize: 11,
  },
  starsRow: {
    flexDirection: "row",
    gap: 1,
  },
  comment: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
});

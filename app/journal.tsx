import React, { useCallback, useState, useRef, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Platform,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/EmptyState";
import { resolveMediaUri } from "@/lib/media";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FilterPicker } from "@/components/filters/FilterPicker";
import { useTranslation } from "@/lib/i18n";
import { ScreenHeader } from "@/components/ScreenHeader";
import {
  CARD_RADIUS,
  HEADER_CONTENT_PADDING_H,
  HEADER_FONT_SIZE,
  HEADER_FONT_WEIGHT,
  HEADER_LETTER_SPACING,
  SCREEN_PADDING_H,
  WEB_TOP_INSET,
} from "@/constants/layout";
import { VehicleCascadePicker } from "@/components/filters/VehicleCascadePicker";
import type { CascadeField } from "@/components/filters/VehicleCascadePicker";
import { VehicleCascadeProvider } from "@/contexts/VehicleCascadeContext";
import { useBrands, useFilteredBrands, useModels, useGenerations } from "@/hooks/useCarHierarchy";
import type { BrandCategory } from "@/hooks/useCarHierarchy";
import { API } from "@/lib/api-endpoints";

const DEFAULT_AVATAR = require("@/assets/images/default-avatar.png");

function SkeletonBlock({ width, height, borderRadius = 8, style }: { width: number | string; height: number; borderRadius?: number; style?: any }) {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  return (
    <View style={[{ width: width as any, height, borderRadius, backgroundColor: isDark ? colors.surface : colors.border + "40" }, style]} />
  );
}

function SkeletonCard() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  return (
    <View style={{ backgroundColor: isDark ? colors.surface : colors.background, borderRadius: CARD_RADIUS, overflow: "hidden", marginBottom: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 10 }}>
        <SkeletonBlock width={40} height={40} borderRadius={20} />
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonBlock width="60%" height={14} />
          <SkeletonBlock width="40%" height={10} />
        </View>
      </View>
      <SkeletonBlock width="100%" height={200} borderRadius={0} />
      <View style={{ padding: 16, gap: 8 }}>
        <SkeletonBlock width="80%" height={16} />
        <SkeletonBlock width="100%" height={12} />
        <SkeletonBlock width="70%" height={12} />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-around", paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}>
        <SkeletonBlock width={60} height={14} />
        <SkeletonBlock width={40} height={14} />
        <SkeletonBlock width={40} height={14} />
      </View>
    </View>
  );
}

const CATEGORY_KEYS = [
  "general", "reviews", "post", "article", "advice", "tuning",
] as const;

const CATEGORY_LABEL_MAP: Record<string, string> = {
  general: "catMain",
  reviews: "catReviews",
  post: "catPosts",
  article: "catArticles",
  advice: "catAdvice",
  tuning: "catTuning",
};

const CATEGORY_HASH_MAP: Record<string, string> = {
  reviews: "hashReviews",
  post: "hashPost",
  article: "hashArticle",
  advice: "hashAdvice",
  tuning: "hashTuning",
};

interface RecentLiker {
  avatar: string | null;
}

interface FeedPost {
  id: number;
  dealerId: string;
  title: string;
  content: string;
  images: string[] | null;
  brand: string | null;
  model: string | null;
  generation: string | null;
  category: string | null;
  rating: number | null;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  createdAt: string;
  dealerName: string | null;
  dealerDisplayName: string | null;
  dealerLogo: string | null;
  dealerAvatar: string | null;
  dealerCity: string | null;
  recentLikers: RecentLiker[];
}

function StarRating({ rating, size = 16, starColor }: { rating: number; size?: number; starColor?: string }) {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const sc = starColor || colors.starColor;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const name = i <= Math.floor(rating)
      ? "star"
      : i === Math.ceil(rating) && rating % 1 >= 0.3
        ? "star-half"
        : "star-outline";
    stars.push(
      <Ionicons key={i} name={name} size={size} color={sc} />
    );
  }
  return <View style={{ flexDirection: "row", gap: 1 }}>{stars}</View>;
}

export default function JournalFeedScreen() {
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useColors(colorScheme);
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [activeCategory, setActiveCategory] = useState("general");
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [menuAuthorName, setMenuAuthorName] = useState("");

  const [filterBrand, setFilterBrand] = useState<string | null>(null);
  const [filterModel, setFilterModel] = useState<string | null>(null);
  const [filterGeneration, setFilterGeneration] = useState<string | null>(null);
  const [showVehicleFilter, setShowVehicleFilter] = useState(false);

  const [pickerField, setPickerField] = useState<CascadeField>("brand");
  const [pickerBrandId, setPickerBrandId] = useState<number | null>(null);
  const [pickerModelId, setPickerModelId] = useState<number | null>(null);
  const [brandSearch, setBrandSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [brandCategory, setBrandCategory] = useState<BrandCategory>("all");

  const {
    brands: apiBrands, popularBrands, chineseBrands, foreignBrands, russianBrands,
    loading: brandsLoading,
  } = useBrands();
  const categoryBrandsMap: Partial<Record<BrandCategory, typeof apiBrands>> = {
    all: apiBrands,
    popular: popularBrands,
    chinese: chineseBrands,
    foreign: foreignBrands,
    russian: russianBrands,
  };
  const filteredBrands = useFilteredBrands(categoryBrandsMap[brandCategory] || apiBrands, brandSearch);
  const { models: apiModels, loading: modelsLoading } = useModels(pickerBrandId);
  const filteredModels = useMemo(() => {
    if (!modelSearch.trim()) return apiModels;
    const q = modelSearch.toLowerCase().trim();
    return apiModels.filter((m) => m.name.toLowerCase().includes(q));
  }, [apiModels, modelSearch]);
  const { generations: pickerGenerations, loading: generationsLoading } = useGenerations(pickerModelId);

  const searchParams = useLocalSearchParams<{ brand?: string; model?: string; generation?: string; category?: string }>();
  const paramsAppliedRef = useRef(false);

  useEffect(() => {
    if (paramsAppliedRef.current) return;
    if (searchParams.brand) {
      setFilterBrand(searchParams.brand);
      if (searchParams.model) setFilterModel(searchParams.model);
      if (searchParams.generation) setFilterGeneration(searchParams.generation);
    }
    if (searchParams.category && (CATEGORY_KEYS as readonly string[]).includes(searchParams.category)) {
      setActiveCategory(searchParams.category);
    }
    paramsAppliedRef.current = true;
  }, [searchParams.brand, searchParams.model, searchParams.generation, searchParams.category]);

  const timeAgo = useCallback((dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("journal.justNow");
    if (mins < 60) return `${mins} ${t("journal.minAgo")}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ${t("journal.hoursAgo")}`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return t("journal.yesterday");
    if (days < 30) return `${days} ${t("journal.daysAgo")}`;
    const months = Math.floor(days / 30);
    return `${months} ${t("journal.monthsAgo")}`;
  }, [t]);

  const createOptions = useMemo(() => [
    {
      key: "post",
      icon: "create-outline" as const,
      title: t("journal.post"),
      description: t("journal.postDesc"),
    },
    {
      key: "reviews",
      icon: "star-half-outline" as const,
      title: t("journal.review"),
      description: t("journal.reviewDesc"),
    },
    {
      key: "article",
      icon: "newspaper-outline" as const,
      title: t("journal.article"),
      description: t("journal.articleDesc"),
    },
  ], [t]);

  const feedQueryKey = useMemo(() => {
    const params = new URLSearchParams();
    if (activeCategory !== "general") params.set("category", activeCategory);
    if (filterBrand) params.set("brand", filterBrand);
    if (filterModel) params.set("model", filterModel);
    if (filterGeneration) params.set("generation", filterGeneration);
    const qs = params.toString();
    return [`${API.journal.feed}${qs ? `?${qs}` : ""}`];
  }, [activeCategory, filterBrand, filterModel, filterGeneration]);

  const { data, isLoading, refetch } = useQuery<{ posts: FeedPost[]; likedPostIds: number[] }>({
    queryKey: feedQueryKey,
  });

  const posts = data?.posts || [];
  const likedPostIds = new Set(data?.likedPostIds || []);

  const likeMutation = useMutation({
    mutationFn: async (postId: number) => {
      return apiRequest("POST", API.journal.like(postId));
    },
    onSuccess: (_data, postId) => {
      queryClient.invalidateQueries({ queryKey: [API.journal.feed], exact: false });
      queryClient.invalidateQueries({ queryKey: [API.journal.postDetail(postId)] });
    },
  });

  const handleLike = useCallback((postId: number) => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    likeMutation.mutate(postId);
  }, [isAuthenticated, likeMutation]);

  const handleCategoryPress = useCallback((key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategory(key);
  }, []);

  const handleFabPress = useCallback(() => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowCreateSheet(true);
  }, [isAuthenticated]);

  const handleCreateOption = useCallback((key: string) => {
    setShowCreateSheet(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/journal/create", params: { category: key } });
  }, []);

  const handleOpenVehicleFilter = useCallback(() => {
    setPickerField("brand");
    setPickerBrandId(null);
    setPickerModelId(null);
    setBrandSearch("");
    setModelSearch("");
    setBrandCategory("all");
    setShowVehicleFilter(true);
  }, []);

  const handleClearFilter = useCallback(() => {
    setFilterBrand(null);
    setFilterModel(null);
    setFilterGeneration(null);
  }, []);

  const filterLabel = useMemo(() => {
    if (!filterBrand) return t("journal.brandModel");
    let label = filterBrand;
    if (filterModel) label += ` ${filterModel}`;
    if (filterGeneration) label += ` (${filterGeneration})`;
    return label;
  }, [filterBrand, filterModel, filterGeneration, t]);

  const hasFilter = !!filterBrand;

  const selectedBrandName = useMemo(() => {
    if (!pickerBrandId) return undefined;
    return apiBrands.find((b) => b.id === pickerBrandId)?.name;
  }, [pickerBrandId, apiBrands]);

  const selectedModelName = useMemo(() => {
    if (!pickerModelId) return undefined;
    return apiModels.find((m) => m.id === pickerModelId)?.name;
  }, [pickerModelId, apiModels]);

  const handlePickerBack = useCallback(() => {
    if (pickerField === "generation") {
      setPickerField("model");
      setPickerModelId(null);
    } else if (pickerField === "model") {
      setPickerField("brand");
      setPickerBrandId(null);
    } else {
      setShowVehicleFilter(false);
    }
  }, [pickerField]);

  const handlePickerClose = useCallback(() => {
    setShowVehicleFilter(false);
  }, []);

  const journalCascadeValue = useMemo(() => ({
    cascadeField: pickerField,
    filteredBrands, filteredModels,
    cascadeGenerations: pickerGenerations,
    brandSearch, setBrandSearch, modelSearch, setModelSearch,
    brandCategory, setBrandCategory,
    brandsLoading, modelsLoading, generationsLoading,
    configurationsLoading: false as const, modificationsLoading: false as const,
    onSelectBrand: (brand: { id: number; name: string }) => {
      setPickerBrandId(brand.id);
      setFilterBrand(brand.name);
      setFilterModel(null);
      setFilterGeneration(null);
      setPickerField("model");
    },
    onSelectModel: (model: { id: number; name: string }) => {
      setPickerModelId(model.id);
      setFilterModel(model.name);
      setFilterGeneration(null);
      setPickerField("generation");
    },
    onSelectGeneration: (gen: { id: number; name: string; yearFrom?: number | null; yearTo?: number | null }) => {
      setFilterGeneration(gen.name);
      setShowVehicleFilter(false);
    },
    onSkipBrand: () => { setShowVehicleFilter(false); },
    onSkipGeneration: () => { setShowVehicleFilter(false); },
    onBack: handlePickerBack,
    colors, isDark,
    selectedBrandName, selectedModelName,
  }), [
    pickerField, filteredBrands, filteredModels, pickerGenerations,
    brandSearch, modelSearch, brandCategory,
    brandsLoading, modelsLoading, generationsLoading,
    handlePickerBack, colors, isDark, selectedBrandName, selectedModelName,
  ]);

  const renderPost = useCallback(({ item }: { item: FeedPost }) => {
    const hasImages = Array.isArray(item.images) && item.images.length > 0;
    const liked = likedPostIds.has(item.id);
    const logoUri = item.dealerLogo ? resolveMediaUri(item.dealerLogo) : item.dealerAvatar ? resolveMediaUri(item.dealerAvatar) : null;
    const dealerDisplayName = item.dealerName || item.dealerDisplayName || t("journal.author");
    const carLabel = item.brand && item.model ? `${item.brand} ${item.model}` : item.brand || null;
    const hashKey = item.category ? CATEGORY_HASH_MAP[item.category] : null;
    const hashtag = hashKey ? t(`journal.${hashKey}`) : null;

    return (
      <Pressable
        onPress={() => router.push(`/journal/${item.id}`)}
        style={({ pressed }) => [styles.feedCard, { backgroundColor: isDark ? colors.surface : colors.background, opacity: pressed ? 0.97 : 1 }]}
      >
        <View style={styles.cardHeader}>
          <Pressable
            onPress={(e) => { e.stopPropagation(); if (item.dealerId === user?.id) { router.push("/(tabs)/profile"); } else { router.push({ pathname: `/seller/[id]` as const, params: { id: item.dealerId, tab: "journal" } }); } }}
            style={styles.authorRow}
          >
            <Image
              source={logoUri ? { uri: logoUri } : DEFAULT_AVATAR}
              style={styles.authorAvatar}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.authorName, { color: colors.text }]} numberOfLines={1}>{dealerDisplayName}</Text>
              {carLabel && (
                <Text style={[styles.carLabel, { color: colors.textSecondary }]} numberOfLines={1}>{carLabel}</Text>
              )}
            </View>
          </Pressable>
          <Pressable
            hitSlop={10}
            style={styles.menuBtn}
            onPress={(e) => {
              e.stopPropagation();
              setMenuAuthorName(dealerDisplayName);
              setShowPostMenu(true);
            }}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={colors.textTertiary} />
          </Pressable>
        </View>

        {hasImages && (() => {
          const imgs = item.images!;
          const count = imgs.length;
          if (count === 1) {
            return (
              <Image
                source={{ uri: resolveMediaUri(imgs[0])! }}
                style={styles.postImage}
                contentFit="cover"
                transition={200}
              />
            );
          }
          if (count === 2) {
            return (
              <View style={styles.photoGrid2}>
                <Image source={{ uri: resolveMediaUri(imgs[0])! }} style={styles.photoGrid2Left} contentFit="cover" transition={200} />
                <Image source={{ uri: resolveMediaUri(imgs[1])! }} style={styles.photoGrid2Right} contentFit="cover" transition={200} />
              </View>
            );
          }
          if (count === 3) {
            return (
              <View style={styles.photoGrid3}>
                <Image source={{ uri: resolveMediaUri(imgs[0])! }} style={styles.photoGrid3Left} contentFit="cover" transition={200} />
                <View style={styles.photoGrid3Right}>
                  <Image source={{ uri: resolveMediaUri(imgs[1])! }} style={styles.photoGrid3Small} contentFit="cover" transition={200} />
                  <Image source={{ uri: resolveMediaUri(imgs[2])! }} style={styles.photoGrid3Small} contentFit="cover" transition={200} />
                </View>
              </View>
            );
          }
          return (
            <View style={styles.photoGrid3}>
              <Image source={{ uri: resolveMediaUri(imgs[0])! }} style={styles.photoGrid3Left} contentFit="cover" transition={200} />
              <View style={styles.photoGrid3Right}>
                <Image source={{ uri: resolveMediaUri(imgs[1])! }} style={styles.photoGrid3Small} contentFit="cover" transition={200} />
                <View style={styles.photoGrid3Small}>
                  <Image source={{ uri: resolveMediaUri(imgs[2])! }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                  <View style={styles.photoOverlay}>
                    <Text style={[styles.photoOverlayText, { color: colors.textInverse }]}>{t("journal.morePhotos").replace("{count}", String(count - 3))}</Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })()}

        <View style={styles.cardBody}>
          {item.rating != null && item.rating > 0 && (
            <View style={styles.ratingRow}>
              <Text style={[styles.ratingNumber, { color: colors.text }]}>{item.rating.toFixed(1)}</Text>
              <StarRating rating={item.rating} />
            </View>
          )}

          <Text style={[styles.postTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
          <Text style={[styles.postExcerpt, { color: colors.textSecondary }]} numberOfLines={3}>{item.content}</Text>

          {hashtag && (
            <Text style={[styles.hashtag, { color: colors.accentBlue }]}>{hashtag}</Text>
          )}
        </View>

        <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
          <View style={styles.statsLeft}>
            {item.recentLikers && item.recentLikers.length > 0 && (
              <View style={styles.reactionAvatars}>
                {item.recentLikers.map((liker, idx) => {
                  const avatarUri = liker.avatar ? resolveMediaUri(liker.avatar) : null;
                  return (
                    <Image
                      key={idx}
                      source={avatarUri ? { uri: avatarUri } : DEFAULT_AVATAR}
                      style={[styles.reactionAvatar, { marginLeft: idx > 0 ? -6 : 0, borderColor: isDark ? colors.surface : colors.background }]}
                    />
                  );
                })}
              </View>
            )}
            <View style={styles.statItem}>
              <Ionicons name="happy-outline" size={14} color={colors.textTertiary} />
              <Text style={[styles.statText, { color: colors.textTertiary }]}>{item.likesCount} {t("journal.reacted")}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={14} color={colors.textTertiary} />
              <Text style={[styles.statText, { color: colors.textTertiary }]}>{item.viewsCount}</Text>
            </View>
          </View>
          <Text style={[styles.statText, { color: colors.textTertiary }]}>{timeAgo(item.createdAt)}</Text>
        </View>

        <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
          <Pressable onPress={() => handleLike(item.id)} style={styles.actionBtn}>
            <Ionicons name={liked ? "thumbs-up" : "thumbs-up-outline"} size={18} color={liked ? colors.primary : colors.textSecondary} />
            <Text style={[styles.actionText, { color: liked ? colors.primary : colors.textSecondary }]}>{t("journal.like")}</Text>
          </Pressable>
          <Pressable onPress={() => router.push(`/journal/${item.id}`)} style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={17} color={colors.textSecondary} />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>{item.commentsCount}</Text>
          </Pressable>
          <Pressable style={styles.actionBtn}>
            <Ionicons name="share-social-outline" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>
      </Pressable>
    );
  }, [colors, likedPostIds, handleLike, t, timeAgo]);

  const listHeader = (
    <View style={[styles.headerBlock, { backgroundColor: isDark ? colors.surface : colors.background }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
        style={styles.categoriesScroll}
      >
        {CATEGORY_KEYS.map((key) => {
          const isActive = activeCategory === key;
          const labelKey = CATEGORY_LABEL_MAP[key];
          return (
            <Pressable
              key={key}
              onPress={() => handleCategoryPress(key)}
              style={[
                styles.categoryChip,
                isActive && { borderBottomColor: colors.text, borderBottomWidth: 2 },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: isActive ? colors.text : colors.textTertiary },
                  isActive && { fontWeight: "700" as const },
                ]}
              >
                {t(`journal.${labelKey}`)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.filterRow}>
        <Pressable
          onPress={handleOpenVehicleFilter}
          style={[
            styles.filterChip,
            {
              backgroundColor: hasFilter ? colors.primary + "18" : colors.surface,
              borderColor: hasFilter ? colors.primary : colors.border,
            },
          ]}
        >
          <Ionicons name="options-outline" size={18} color={hasFilter ? colors.primary : colors.text} />
          <Text
            style={[styles.filterText, { color: hasFilter ? colors.primary : colors.text }]}
            numberOfLines={1}
          >
            {filterLabel}
          </Text>
          {hasFilter && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleClearFilter();
              }}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={16} color={colors.primary} />
            </Pressable>
          )}
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title={t("journal.title")}
        backgroundColor={isDark ? colors.surface : colors.background}
        rightElement={
          <View style={styles.headerRightIcons}>
            <Pressable hitSlop={10} style={styles.headerIcon} onPress={() => router.push("/notifications")}>
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
            </Pressable>
            <Pressable hitSlop={10} style={styles.headerIcon} onPress={() => router.push("/(tabs)/profile")}>
              <Image
                source={user?.avatarUrl ? { uri: resolveMediaUri(user.avatarUrl)! } : DEFAULT_AVATAR}
                style={styles.headerAvatar}
              />
            </Pressable>
          </View>
        }
      />

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, posts.length === 0 && { flexGrow: 1 }]}
        refreshControl={<RefreshControl refreshing={isLoading && posts.length > 0} onRefresh={refetch} />}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingHorizontal: 0 }}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : (
            <EmptyState
              icon="document-text"
              title={t("journal.noEntries")}
              subtitle={t("journal.entriesWillAppear")}
            />
          )
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={4}
        windowSize={5}
      />

      {isAuthenticated && (
        <Pressable
          onPress={handleFabPress}
          style={[styles.fab, { bottom: Platform.OS === "web" ? 34 + 20 : Math.max(insets.bottom, 16) + 10, backgroundColor: colors.proBadgeText, shadowColor: "#000000" }]}
        >
          <Ionicons name="create-outline" size={20} color={colors.proBadgeBg} />
          <Text style={[styles.fabText, { color: colors.proBadgeBg }]}>{t("journal.write")}</Text>
        </Pressable>
      )}

      <FilterPicker
        visible={showCreateSheet}
        onClose={() => setShowCreateSheet(false)}
        title={t("journal.whatToWrite")}
      >
        <View style={styles.createOptions}>
          {createOptions.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => handleCreateOption(opt.key)}
              style={({ pressed }) => [
                styles.createOptionRow,
                { backgroundColor: pressed ? colors.surface : "transparent" },
              ]}
            >
              <View style={[styles.createOptionIcon, { backgroundColor: colors.primary + "18" }]}>
                <Ionicons name={opt.icon} size={24} color={colors.primary} />
              </View>
              <View style={styles.createOptionText}>
                <Text style={[styles.createOptionTitle, { color: colors.text }]}>{opt.title}</Text>
                <Text style={[styles.createOptionDesc, { color: colors.textSecondary }]}>{opt.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </Pressable>
          ))}
        </View>
      </FilterPicker>

      <FilterPicker
        visible={showPostMenu}
        onClose={() => setShowPostMenu(false)}
        title={menuAuthorName}
      >
        <View style={styles.createOptions}>
          <Pressable
            onPress={() => { setShowPostMenu(false); }}
            style={({ pressed }) => [
              styles.createOptionRow,
              { backgroundColor: pressed ? colors.surface : "transparent" },
            ]}
          >
            <View style={[styles.createOptionIcon, { backgroundColor: colors.textSecondary + "18" }]}>
              <Ionicons name="eye-off-outline" size={24} color={colors.textSecondary} />
            </View>
            <View style={styles.createOptionText}>
              <Text style={[styles.createOptionTitle, { color: colors.text }]}>{t("journal.hidePost")}</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => { setShowPostMenu(false); }}
            style={({ pressed }) => [
              styles.createOptionRow,
              { backgroundColor: pressed ? colors.surface : "transparent" },
            ]}
          >
            <View style={[styles.createOptionIcon, { backgroundColor: colors.error + "18" }]}>
              <Ionicons name="ban-outline" size={24} color={colors.error} />
            </View>
            <View style={styles.createOptionText}>
              <Text style={[styles.createOptionTitle, { color: colors.error }]}>{t("journal.blockAuthor")}</Text>
            </View>
          </Pressable>
        </View>
      </FilterPicker>

      <VehicleCascadeProvider value={journalCascadeValue}>
        <VehicleCascadePicker
          visible={showVehicleFilter}
          onClose={handlePickerClose}
        />
      </VehicleCascadeProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: HEADER_CONTENT_PADDING_H,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: HEADER_FONT_SIZE,
    fontWeight: HEADER_FONT_WEIGHT,
    letterSpacing: HEADER_LETTER_SPACING,
    flex: 1,
    marginLeft: 8,
  },
  headerRightIcons: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
  },
  headerIcon: {
    padding: 2,
  },
  headerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  headerBlock: {
    borderBottomLeftRadius: CARD_RADIUS,
    borderBottomRightRadius: CARD_RADIUS,
    overflow: "hidden",
    marginBottom: 8,
    paddingTop: 4,
  },
  categoriesScroll: {
    flexGrow: 0,
  },
  categoriesContainer: {
    paddingHorizontal: SCREEN_PADDING_H,
    gap: 0,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  filterRow: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: "row" as const,
  },
  filterChip: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 280,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500" as const,
    flexShrink: 1,
  },
  list: {
    paddingBottom: 80,
  },
  feedCard: {
    marginHorizontal: 0,
    marginBottom: 8,
    borderRadius: CARD_RADIUS,
    overflow: "hidden" as const,
  },
  cardHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: SCREEN_PADDING_H,
    paddingVertical: 12,
    gap: 8,
  },
  authorRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    flex: 1,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorName: {
    fontSize: 15,
    fontWeight: "700" as const,
  },
  carLabel: {
    fontSize: 13,
    marginTop: 1,
  },
  menuBtn: {
    padding: 4,
  },
  postImage: {
    width: "100%" as const,
    height: 220,
  },
  photoGrid2: {
    flexDirection: "row" as const,
    height: 180,
    gap: 2,
  },
  photoGrid2Left: {
    flex: 1,
    height: "100%" as const,
  },
  photoGrid2Right: {
    flex: 1,
    height: "100%" as const,
  },
  photoGrid3: {
    flexDirection: "row" as const,
    height: 200,
    gap: 2,
  },
  photoGrid3Left: {
    flex: 2,
    height: "100%" as const,
  },
  photoGrid3Right: {
    flex: 1,
    gap: 2,
  },
  photoGrid3Small: {
    flex: 1,
    overflow: "hidden" as const,
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  photoOverlayText: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  cardBody: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingVertical: 12,
    gap: 6,
  },
  ratingRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginBottom: 2,
  },
  ratingNumber: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  postTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    lineHeight: 22,
  },
  postExcerpt: {
    fontSize: 14,
    lineHeight: 20,
  },
  hashtag: {
    fontSize: 13,
    fontWeight: "600" as const,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: SCREEN_PADDING_H,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statsLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 16,
  },
  reactionAvatars: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginRight: 6,
  },
  reactionAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  statItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-around" as const,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  fab: {
    position: "absolute" as const,
    right: 16,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 28,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 15,
    fontWeight: "700" as const,
  },
  createOptions: {
    paddingVertical: 8,
  },
  createOptionRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  createOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  createOptionText: {
    flex: 1,
  },
  createOptionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  createOptionDesc: {
    fontSize: 13,
    marginTop: 2,
  },
});

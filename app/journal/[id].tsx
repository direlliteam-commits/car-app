import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { API } from "@/lib/api-endpoints";
import { Ionicons } from "@expo/vector-icons";
import { ReviewWizard } from "@/components/ReviewWizard";
import type { ReviewEditData } from "@/components/ReviewWizard";
import * as Haptics from "expo-haptics";
import { useColors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import {
  CARD_RADIUS,
  SCREEN_PADDING_H,
  HEADER_CONTENT_PADDING_H,
  HEADER_FONT_SIZE,
  HEADER_FONT_WEIGHT,
  HEADER_LETTER_SPACING,
  WEB_TOP_INSET,
} from "@/constants/layout";
import { resolveMediaUri } from "@/lib/media";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "@/lib/i18n";
import { ScreenHeader } from "@/components/ScreenHeader";

const DEFAULT_AVATAR = require("@/assets/images/default-avatar.png");

interface ReviewDetails {
  bodyType?: string | null;
  modification?: string | null;
  ownershipPeriod?: string | null;
  pros?: string[];
  cons?: string[];
  ratings?: Record<string, number>;
}

interface PostDetail {
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
  reviewDetails: ReviewDetails | null;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  createdAt: string;
  dealerName: string | null;
  dealerDisplayName: string | null;
  dealerLogo: string | null;
  dealerAvatar: string | null;
  dealerCity: string | null;
}

interface Comment {
  id: number;
  text: string;
  createdAt: string;
  userId: string;
  userName: string | null;
  userAvatar: string | null;
  username: string | null;
}

const LOCALE_MAP: Record<string, string> = { ru: "ru-RU", hy: "hy-AM", en: "en-US" };

function formatDate(dateStr: string, lang: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(LOCALE_MAP[lang] || "ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function formatCommentDate(dateStr: string, lang: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(LOCALE_MAP[lang] || "ru-RU", { day: "numeric", month: "short" });
}

export default function JournalPostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useColors(colorScheme);
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { t, language } = useTranslation();
  const [commentText, setCommentText] = useState("");
  const [showEditWizard, setShowEditWizard] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const postQuery = useQuery<{ post: PostDetail; liked: boolean }>({
    queryKey: [API.journal.postDetail(id!)],
    enabled: !!id,
  });

  const commentsQuery = useQuery<Comment[]>({
    queryKey: [API.journal.comments(id!)],
    enabled: !!id,
  });

  useEffect(() => {
    if (id) {
      apiRequest("POST", API.journal.view(id)).catch(() => {});
    }
  }, [id]);

  const post = postQuery.data?.post;
  const liked = postQuery.data?.liked ?? false;
  const comments = commentsQuery.data ?? [];

  const likeMutation = useMutation({
    mutationFn: async () => apiRequest("POST", API.journal.like(id!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API.journal.postDetail(id!)] });
      queryClient.invalidateQueries({ queryKey: [API.journal.feed], exact: false });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (text: string) => apiRequest("POST", API.journal.comments(id!), { text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API.journal.comments(id!)] });
      queryClient.invalidateQueries({ queryKey: [API.journal.postDetail(id!)] });
      queryClient.invalidateQueries({ queryKey: [API.journal.feed], exact: false });
      setCommentText("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const handleLike = useCallback(() => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    likeMutation.mutate();
  }, [isAuthenticated, likeMutation]);

  const handleComment = useCallback(() => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText.trim());
  }, [isAuthenticated, commentText, commentMutation]);

  const isOwner = user?.id && post?.dealerId && String(user.id) === String(post.dealerId);
  const isReview = post?.category === "reviews";

  const reviewEditData = useMemo<ReviewEditData | undefined>(() => {
    if (!post || !isReview) return undefined;
    const rd = post.reviewDetails;
    return {
      postId: post.id,
      brand: post.brand || "",
      model: post.model || "",
      generation: post.generation || "",
      bodyType: rd?.bodyType || "",
      modification: rd?.modification || "",
      ownershipPeriod: rd?.ownershipPeriod || "",
      pros: rd?.pros || [],
      cons: rd?.cons || [],
      ratings: rd?.ratings || { appearance: 0, safety: 0, comfort: 0, reliability: 0, driving: 0 },
      title: post.title,
      content: post.content,
      images: Array.isArray(post.images) ? post.images : [],
      rating: post.rating || 0,
    };
  }, [post, isReview]);

  if (!post && postQuery.isLoading) {
    const shimColor = isDark ? colors.surface : colors.border + "40";
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title="..." backgroundColor={isDark ? colors.surface : colors.background} />
        <View style={[styles.card, { backgroundColor: isDark ? colors.surface : colors.background, marginTop: 8 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: shimColor }} />
            <View style={{ flex: 1, gap: 6 }}>
              <View style={{ width: "50%", height: 14, borderRadius: 6, backgroundColor: shimColor }} />
              <View style={{ width: "35%", height: 10, borderRadius: 6, backgroundColor: shimColor }} />
            </View>
          </View>
          <View style={{ width: "100%", height: 200, borderRadius: 14, backgroundColor: shimColor, marginBottom: 16 }} />
          <View style={{ width: "85%", height: 18, borderRadius: 6, backgroundColor: shimColor, marginBottom: 10 }} />
          <View style={{ width: "100%", height: 12, borderRadius: 6, backgroundColor: shimColor, marginBottom: 6 }} />
          <View style={{ width: "100%", height: 12, borderRadius: 6, backgroundColor: shimColor, marginBottom: 6 }} />
          <View style={{ width: "60%", height: 12, borderRadius: 6, backgroundColor: shimColor }} />
        </View>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface, alignItems: "center", justifyContent: "center" }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={{ color: colors.textSecondary }}>{t("journal.entryNotFound")}</Text>
      </View>
    );
  }

  const logoUri = post.dealerLogo ? resolveMediaUri(post.dealerLogo) : post.dealerAvatar ? resolveMediaUri(post.dealerAvatar) : null;
  const images = Array.isArray(post.images) ? post.images : [];

  return (
    <>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack.Screen options={{ headerShown: false }} />

        <ScreenHeader
          title={t("journal.title")}
          backgroundColor={isDark ? colors.surface : colors.background}
          rightActions={isOwner ? [{
            icon: "create-outline",
            onPress: () => {
              if (isReview) {
                setShowEditWizard(true);
              } else {
                router.push(`/journal/create?postId=${post.id}`);
              }
            },
          }] : undefined}
        />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={postQuery.isRefetching} onRefresh={() => { postQuery.refetch(); commentsQuery.refetch(); }} />}
        >
          <View style={[styles.card, { backgroundColor: isDark ? colors.surface : colors.background, paddingBottom: 0 }]}>
            <Pressable
              onPress={() => router.push({ pathname: `/seller/[id]` as const, params: { id: post.dealerId, tab: "journal" } })}
              style={styles.authorRow}
            >
              <Image source={logoUri ? { uri: logoUri } : DEFAULT_AVATAR} style={styles.authorAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.authorName, { color: colors.text }]}>{post.dealerName || post.dealerDisplayName || t("journal.author")}</Text>
                {post.brand ? (
                  <Text style={[styles.dateText, { color: colors.textSecondary }]}>{post.brand}{post.model ? ` ${post.model}` : ""}{post.generation ? ` (${post.generation})` : ""}</Text>
                ) : (
                  <Text style={[styles.dateText, { color: colors.textTertiary }]}>{formatDate(post.createdAt, language)}</Text>
                )}
              </View>
            </Pressable>
          </View>

          {images.length > 0 && (() => {
            const screenW = Dimensions.get("window").width;
            const hPad = 10;
            const imgGap = 1;
            const imgW = screenW - hPad * 2 - imgGap;
            const imgH = imgW * 0.65;
            const snapInterval = imgW + imgGap;
            return (
              <View style={[styles.galleryOuter, { backgroundColor: isDark ? colors.surface : colors.background }]}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  pagingEnabled={false}
                  snapToInterval={snapInterval}
                  snapToAlignment="start"
                  decelerationRate={0.9}
                  contentContainerStyle={{ paddingHorizontal: hPad, gap: imgGap }}
                  onMomentumScrollEnd={(e) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / snapInterval);
                    setActiveImageIndex(idx);
                  }}
                >
                  {images.map((img, i) => {
                    const uri = resolveMediaUri(img);
                    return (
                      <View key={i} style={{
                        width: imgW,
                        height: imgH,
                        overflow: "hidden",
                        ...(i === 0 ? { borderTopLeftRadius: 14, borderBottomLeftRadius: 14 } : {}),
                        ...(i === images.length - 1 ? { borderTopRightRadius: 14, borderBottomRightRadius: 14 } : {}),
                      }}>
                        {uri ? (
                          <Image source={{ uri }} style={{ width: imgW, height: imgH }} contentFit="cover" transition={200} />
                        ) : null}
                      </View>
                    );
                  })}
                </ScrollView>
                {images.length > 1 && (
                  <View style={styles.imageCounter}>
                    <Text style={styles.imageCounterText}>{activeImageIndex + 1} / {images.length}</Text>
                  </View>
                )}
              </View>
            );
          })()}

          <View style={[styles.card, { backgroundColor: isDark ? colors.surface : colors.background, marginTop: 0, paddingTop: images.length > 0 ? 14 : 16 }]}>
            <Text style={[styles.title, { color: colors.text }]}>{post.title}</Text>
            <Text style={[styles.content, { color: colors.text }]}>{post.content}</Text>

            {post.category && (() => {
              const CATEGORY_HASH_MAP: Record<string, string> = {
                reviews: "hashReviews",
                post: "hashPost",
                article: "hashArticle",
                advice: "hashAdvice",
                tuning: "hashTuning",
              };
              const hashKey = CATEGORY_HASH_MAP[post.category];
              const hashtag = hashKey ? t(`journal.${hashKey}`) : null;
              return hashtag ? <Text style={{ color: colors.accentBlue, fontSize: 14, fontWeight: "500" as const, marginBottom: 4 }}>{hashtag}</Text> : null;
            })()}

            {post.reviewDetails && (() => {
              const rd = post.reviewDetails;
              const RATING_LABEL_MAP: Record<string, string> = {
                appearance: t("journal.ratingAppearance"),
                safety: t("journal.ratingSafety"),
                comfort: t("journal.ratingComfort"),
                reliability: t("journal.ratingReliability"),
                driving: t("journal.ratingDriving"),
              };
              const categoryRatings = rd.ratings ? Object.values(rd.ratings).filter((v: number) => v > 0) : [];
              const overallRating = categoryRatings.length > 0
                ? Math.round((categoryRatings.reduce((a: number, b: number) => a + b, 0) / categoryRatings.length) * 10) / 10
                : (post.rating || 0);
              return (
                <View style={[styles.reviewDetailsBlock, { borderTopColor: colors.border }]}>
                  <View style={styles.rdHeaderRow}>
                    <Text style={[styles.reviewDetailsTitle, { color: colors.text, flex: 1, marginRight: 8 }]}>{t("journal.authorReview")}</Text>
                    <View style={styles.rdOverallRating}>
                      <Ionicons name="star" size={20} color={colors.starColor} />
                      <Text style={[styles.rdOverallValue, { color: colors.text }]}>{overallRating.toFixed(1)}</Text>
                    </View>
                  </View>

                  {rd.ratings && Object.keys(rd.ratings).length > 0 && (
                    <View style={styles.rdRatingsSection}>
                      {Object.entries(rd.ratings).map(([key, val]) => (
                        <View key={key} style={styles.rdRatingRow}>
                          <Text style={[styles.rdRatingLabel, { color: colors.text }]}>{RATING_LABEL_MAP[key] || key}</Text>
                          <View style={styles.rdStars}>
                            {[1, 2, 3, 4, 5].map(s => (
                              <Ionicons key={s} name={s <= val ? "star" : "star-outline"} size={18} color={s <= val ? colors.starColor : colors.textTertiary} />
                            ))}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {rd.pros && rd.pros.length > 0 && (
                    <View style={styles.rdTextSection}>
                      <Text style={[styles.rdTextLabel, { color: colors.text }]}>{t("journal.reviewPros")}</Text>
                      <Text style={[styles.rdCommaText, { color: colors.textSecondary }]}>
                        {rd.pros.map((p) => p.startsWith("tag") ? t(`journal.${p}`) : p).join(", ")}
                      </Text>
                    </View>
                  )}

                  {rd.cons && rd.cons.length > 0 && (
                    <View style={styles.rdTextSection}>
                      <Text style={[styles.rdTextLabel, { color: colors.text }]}>{t("journal.reviewCons")}</Text>
                      <Text style={[styles.rdCommaText, { color: colors.textSecondary }]}>
                        {rd.cons.map((c) => c.startsWith("tag") ? t(`journal.${c}`) : c).join(", ")}
                      </Text>
                    </View>
                  )}

                  {rd.ownershipPeriod && (
                    <View style={styles.rdOwnershipRow}>
                      <Ionicons name="calendar-outline" size={16} color={colors.text} />
                      <Text style={[styles.rdOwnershipText, { color: colors.text }]}>
                        {t("journal.ownershipPeriod")} {rd.ownershipPeriod?.startsWith("wiz") ? t(`journal.${rd.ownershipPeriod}`) : rd.ownershipPeriod}
                      </Text>
                    </View>
                  )}

                </View>
              );
            })()}

            <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
              <Pressable onPress={handleLike} style={styles.statBtn}>
                <Ionicons name={liked ? "heart" : "heart-outline"} size={22} color={liked ? colors.error : colors.textTertiary} />
                <Text style={[styles.statCount, { color: colors.textTertiary }]}>{post.likesCount}</Text>
              </Pressable>
              <View style={styles.statBtn}>
                <Ionicons name="chatbubble-outline" size={20} color={colors.textTertiary} />
                <Text style={[styles.statCount, { color: colors.textTertiary }]}>{post.commentsCount}</Text>
              </View>
              <View style={styles.statBtn}>
                <Ionicons name="eye-outline" size={20} color={colors.textTertiary} />
                <Text style={[styles.statCount, { color: colors.textTertiary }]}>{post.viewsCount}</Text>
              </View>
            </View>
          </View>

          {comments.length > 0 && (
            <View style={[styles.commentsSection, { backgroundColor: isDark ? colors.surface : colors.background }]}>
              <Text style={[styles.commentsTitle, { color: colors.text }]}>{t("journal.comments")} ({comments.length})</Text>
              {comments.map((c) => {
                const cAvatar = c.userAvatar ? resolveMediaUri(c.userAvatar) : null;
                return (
                  <View key={c.id} style={[styles.commentItem, { borderTopColor: colors.border }]}>
                    <Image source={cAvatar ? { uri: cAvatar } : DEFAULT_AVATAR} style={styles.commentAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.commentName, { color: colors.text }]}>{c.userName || c.username || t("journal.user")}</Text>
                      <Text style={[styles.commentText, { color: colors.text }]}>{c.text}</Text>
                      <Text style={[styles.commentDate, { color: colors.textTertiary }]}>
                        {formatCommentDate(c.createdAt, language)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        <View style={[styles.commentInputBar, { backgroundColor: isDark ? colors.surface : colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom || 8 }]}>
          <TextInput
            style={[styles.commentInput, { backgroundColor: isDark ? colors.surface : colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder={t("journal.writeComment")}
            placeholderTextColor={colors.textTertiary}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <Pressable
            onPress={handleComment}
            disabled={!commentText.trim() || commentMutation.isPending}
            style={({ pressed }) => [styles.sendBtn, { opacity: !commentText.trim() ? 0.3 : pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="send" size={22} color={colors.text} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
    {showEditWizard && reviewEditData && (
      <View style={StyleSheet.absoluteFill}>
        <ReviewWizard
          visible={showEditWizard}
          editData={reviewEditData}
          onClose={() => {
            setShowEditWizard(false);
            postQuery.refetch();
          }}
        />
      </View>
    )}
    </>
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
    marginLeft: 4,
  },
  card: {
    padding: 16,
    marginTop: 8,
  },
  galleryOuter: {
    position: "relative" as const,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  authorName: {
    fontSize: 15,
    fontWeight: "700" as const,
  },
  dateText: {
    fontSize: 12,
    marginTop: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
    lineHeight: 26,
    marginBottom: 8,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  imageCounter: {
    position: "absolute" as const,
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imageCounterText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600" as const,
  },
  statsRow: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    gap: 24,
  },
  statBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statCount: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  commentsSection: {
    padding: 16,
    marginTop: 8,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    marginBottom: 12,
  },
  commentItem: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentName: {
    fontSize: 13,
    fontWeight: "700" as const,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  commentDate: {
    fontSize: 11,
    marginTop: 4,
  },
  reviewDetailsTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
  },
  reviewDetailsBlock: {
    paddingTop: 16,
    marginTop: 12,
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rdHeaderRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  rdOverallRating: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  rdOverallValue: {
    fontSize: 17,
    fontWeight: "700" as const,
  },
  rdRatingsSection: {
    gap: 14,
  },
  rdRatingRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  rdRatingLabel: {
    fontSize: 15,
    flex: 1,
    fontWeight: "500" as const,
  },
  rdStars: {
    flexDirection: "row" as const,
    gap: 2,
  },
  rdTextSection: {
    gap: 6,
  },
  rdTextLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  rdCommaText: {
    fontSize: 15,
    lineHeight: 22,
  },
  rdOwnershipRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  rdOwnershipText: {
    fontSize: 14,
  },
  rdCategoryTag: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  commentInputBar: {
    flexDirection: "row" as const,
    alignItems: "flex-end" as const,
    paddingHorizontal: SCREEN_PADDING_H,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
    ...(Platform.OS === "web" ? { position: "sticky" as const, bottom: 0, zIndex: 10 } as const : {}),
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    padding: 8,
    marginBottom: 2,
  },
});

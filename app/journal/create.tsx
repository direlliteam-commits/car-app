import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, apiUploadRequest } from "@/lib/query-client";
import { API } from "@/lib/api-endpoints";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useColors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import {
  SCREEN_PADDING_H,
  CARD_RADIUS_SMALL,
  HEADER_CONTENT_PADDING_H,
  HEADER_FONT_SIZE,
  HEADER_FONT_WEIGHT,
  HEADER_LETTER_SPACING,
  WEB_TOP_INSET,
} from "@/constants/layout";
import { resolveMediaUri } from "@/lib/media";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ReviewWizard } from "@/components/ReviewWizard";
import { useTranslation } from "@/lib/i18n";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAlert } from "@/contexts/AlertContext";
import { VehicleCascadePicker } from "@/components/filters/VehicleCascadePicker";
import type { CascadeField } from "@/components/filters/VehicleCascadePicker";
import { VehicleCascadeProvider } from "@/contexts/VehicleCascadeContext";
import { useBrands, useFilteredBrands, useModels, useGenerations } from "@/hooks/useCarHierarchy";
import type { BrandCategory } from "@/hooks/useCarHierarchy";

const MAX_IMAGES = 5;
const MAX_IMAGES_ARTICLE = 10;

interface ReviewDetails {
  bodyType?: string | null;
  modification?: string | null;
  ownershipPeriod?: string | null;
  pros?: string[];
  cons?: string[];
  ratings?: Record<string, number>;
}

interface ExistingPost {
  id: number;
  title: string;
  content: string;
  images: string[] | null;
  brand: string | null;
  model: string | null;
  generation: string | null;
  category: string | null;
  rating: number | null;
  reviewDetails: ReviewDetails | null;
  status: string;
}

const CATEGORY_KEYS = [
  "general", "post", "article", "advice", "tuning",
] as const;

const CATEGORY_I18N_MAP: Record<string, string> = {
  general: "catGeneral",
  reviews: "catReviews",
  post: "catPosts",
  article: "catArticles",
  advice: "catAdvice",
  tuning: "catTuning",
};

export default function JournalCreateScreen() {
  const { postId, category: routeCategory } = useLocalSearchParams<{ postId?: string; category?: string }>();
  const isEditing = !!postId;
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useColors(colorScheme);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showAlert } = useAlert();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [generation, setGeneration] = useState("");
  const [category, setCategory] = useState(routeCategory || "general");
  const [rating, setRating] = useState(0);
  const [savedReviewDetails, setSavedReviewDetails] = useState<ReviewDetails | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
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

  const isReview = category === "reviews";
  const isArticle = category === "article";
  const [showReviewWizard, setShowReviewWizard] = useState(isReview && !isEditing);

  const maxImages = isArticle ? MAX_IMAGES_ARTICLE : MAX_IMAGES;

  const existingQuery = useQuery<{ post: ExistingPost }>({
    queryKey: [API.journal.postDetail(postId!)],
    enabled: isEditing,
  });

  useEffect(() => {
    if (isEditing && existingQuery.data?.post) {
      const p = existingQuery.data.post;
      setTitle(p.title);
      setContent(p.content);
      if (Array.isArray(p.images)) {
        setImageUris(p.images);
      }
      if (p.brand) setBrand(p.brand);
      if (p.model) setModel(p.model);
      if (p.generation) setGeneration(p.generation);
      if (p.category) setCategory(p.category);
      if (p.rating) setRating(p.rating);
      if (p.reviewDetails) setSavedReviewDetails(p.reviewDetails);
    }
  }, [isEditing, existingQuery.data]);

  const openVehiclePicker = useCallback(() => {
    setPickerField("brand");
    setPickerBrandId(null);
    setPickerModelId(null);
    setBrandSearch("");
    setModelSearch("");
    setBrandCategory("all");
    setShowVehiclePicker(true);
  }, []);

  const vehicleLabel = useMemo(() => {
    if (!brand) return "";
    let label = brand;
    if (model) label += ` ${model}`;
    if (generation) label += ` (${generation})`;
    return label;
  }, [brand, model, generation]);

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
      setShowVehiclePicker(false);
    }
  }, [pickerField]);

  const createCascadeValue = useMemo(() => ({
    cascadeField: pickerField,
    filteredBrands, filteredModels,
    cascadeGenerations: pickerGenerations,
    brandSearch, setBrandSearch, modelSearch, setModelSearch,
    brandCategory, setBrandCategory,
    brandsLoading, modelsLoading, generationsLoading,
    configurationsLoading: false as const, modificationsLoading: false as const,
    onSelectBrand: (b: { id: number; name: string }) => {
      setPickerBrandId(b.id);
      setBrand(b.name);
      setModel("");
      setGeneration("");
      setPickerField("model");
    },
    onSelectModel: (m: { id: number; name: string }) => {
      setPickerModelId(m.id);
      setModel(m.name);
      setGeneration("");
      setPickerField("generation");
    },
    onSelectGeneration: (gen: { id: number; name: string; yearFrom?: number | null; yearTo?: number | null }) => {
      setGeneration(gen.name);
      setShowVehiclePicker(false);
    },
    onSkipBrand: () => { setShowVehiclePicker(false); },
    onSkipGeneration: () => { setShowVehiclePicker(false); },
    onBack: handlePickerBack,
    colors, isDark,
    selectedBrandName, selectedModelName,
  }), [
    pickerField, filteredBrands, filteredModels, pickerGenerations,
    brandSearch, modelSearch, brandCategory,
    brandsLoading, modelsLoading, generationsLoading,
    handlePickerBack, colors, isDark, selectedBrandName, selectedModelName,
  ]);

  const pickImages = useCallback(async () => {
    if (imageUris.length >= maxImages) {
      showAlert(t("journal.imageLimit"), t("journal.maxImages").replace("{count}", String(maxImages)), undefined, "warning");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: maxImages - imageUris.length,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (const asset of result.assets) {
        const uri = asset.uri;
        const name = uri.split("/").pop() || `image_${Date.now()}.jpg`;
        const type = asset.mimeType || "image/jpeg";
        formData.append("images", { uri, name, type } as unknown as Blob);
      }

      const res = await apiUploadRequest("POST", API.upload, formData);

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const urls: string[] = data.urls || [];
      setImageUris((prev) => [...prev, ...urls].slice(0, maxImages));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      showAlert(t("journal.errorTitle"), t("journal.uploadError"), undefined, "error");
    } finally {
      setUploading(false);
    }
  }, [imageUris.length, maxImages]);

  const removeImage = useCallback((idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setImageUris((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      showAlert(t("journal.errorTitle"), t("journal.enterTitle"), undefined, "error");
      return;
    }
    if (!content.trim()) {
      showAlert(t("journal.errorTitle"), t("journal.enterContent"), undefined, "error");
      return;
    }
    if (isReview && imageUris.length === 0) {
      showAlert(t("journal.errorTitle"), t("journal.addPhotoRequired"), undefined, "error");
      return;
    }
    if (isReview && !brand) {
      showAlert(t("journal.errorTitle"), t("journal.selectBrandForReview"), undefined, "error");
      return;
    }
    if (isReview && !model) {
      showAlert(t("journal.errorTitle"), t("journal.selectModelForReview"), undefined, "error");
      return;
    }
    if (isReview && rating === 0) {
      showAlert(t("journal.errorTitle"), t("journal.setRating"), undefined, "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        content: content.trim(),
        images: imageUris,
        brand: brand.trim() || null,
        model: model.trim() || null,
        generation: generation.trim() || null,
        category,
        rating: rating > 0 ? rating : null,
        ...(savedReviewDetails ? { reviewDetails: savedReviewDetails } : {}),
      };

      if (isEditing) {
        await apiRequest("PUT", API.journal.update(postId), payload);
      } else {
        await apiRequest("POST", API.journal.create, payload);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: [API.journal.feed], exact: false });
      if (isReview) {
        queryClient.invalidateQueries({ queryKey: [API.modelReviews] });
      }
      if (isEditing && postId) {
        queryClient.invalidateQueries({ queryKey: [API.journal.postDetail(postId!)] });
      }
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: [API.journal.userPosts(user.id)] });
      }
      router.back();
    } catch {
      showAlert(t("journal.errorTitle"), t("journal.saveError"), undefined, "error");
    } finally {
      setSubmitting(false);
    }
  }, [title, content, imageUris, brand, model, generation, category, rating, savedReviewDetails, isEditing, postId, user?.id, queryClient, isReview]);

  if (showReviewWizard) {
    return (
      <ReviewWizard
        visible={true}
        onClose={() => {
          setShowReviewWizard(false);
          router.back();
        }}
      />
    );
  }

  const headerTitle = isEditing
    ? t("journal.editEntry")
    : category === "reviews"
      ? t("journal.newReview")
      : category === "article"
        ? t("journal.newArticle")
        : category === "post"
          ? t("journal.newPost")
          : t("journal.newEntry");

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader title={headerTitle} backgroundColor={isDark ? colors.surface : colors.background} />

      <ScrollView contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 80 }]}>
        <View style={[styles.section, { backgroundColor: isDark ? colors.surface : colors.background }]}>
          <TextInput
            style={[styles.titleInput, { color: colors.text }]}
            placeholder={isReview ? t("journal.reviewTitlePlaceholder") : isArticle ? t("journal.articleTitlePlaceholder") : t("journal.titlePlaceholder")}
            placeholderTextColor={colors.textTertiary}
            value={title}
            onChangeText={setTitle}
            maxLength={200}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TextInput
            style={[styles.contentInput, { color: colors.text, minHeight: isArticle ? 250 : 150 }]}
            placeholder={isReview ? t("journal.reviewContentPlaceholder") : isArticle ? t("journal.articleContentPlaceholder") : t("journal.contentPlaceholder")}
            placeholderTextColor={colors.textTertiary}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            maxLength={isArticle ? 15000 : 5000}
          />
          <Text style={[styles.charCounter, { color: colors.textTertiary }]}>
            {content.length} / {isArticle ? "15 000" : "5 000"}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: isDark ? colors.surface : colors.background }]}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>
            {t("journal.car")} {isReview ? "" : t("journal.optional")}
          </Text>
          <Pressable
            onPress={openVehiclePicker}
            style={[
              styles.vehiclePickerBtn,
              {
                borderColor: vehicleLabel ? colors.primary : colors.border,
                backgroundColor: vehicleLabel ? colors.primary + "0D" : "transparent",
              },
            ]}
          >
            <Ionicons
              name="car-sport-outline"
              size={20}
              color={vehicleLabel ? colors.primary : colors.textTertiary}
            />
            <Text
              style={[
                styles.vehiclePickerText,
                { color: vehicleLabel ? colors.text : colors.textTertiary },
              ]}
              numberOfLines={1}
            >
              {vehicleLabel || t("journal.selectBrandAndModel")}
            </Text>
            {vehicleLabel ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  setBrand("");
                  setModel("");
                  setGeneration("");
                }}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
              </Pressable>
            ) : (
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            )}
          </Pressable>
        </View>

        {(isReview || rating > 0) && (
          <View style={[styles.section, { backgroundColor: isDark ? colors.surface : colors.background }]}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>
              {t("journal.rating")} {isReview ? "" : t("journal.optional")}
            </Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setRating(rating === star ? 0 : star);
                  }}
                >
                  <Ionicons name={star <= rating ? "star" : "star-outline"} size={32} color={colors.starColor} />
                </Pressable>
              ))}
              {rating > 0 && (
                <Pressable onPress={() => setRating(0)} style={{ marginLeft: 8 }}>
                  <Ionicons name="close-circle-outline" size={20} color={colors.textTertiary} />
                </Pressable>
              )}
            </View>
          </View>
        )}

        {!isReview && (
          <View style={[styles.section, { backgroundColor: isDark ? colors.surface : colors.background }]}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>{t("journal.category")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imagesRow}>
              {CATEGORY_KEYS.map((key) => {
                const iconMap: Record<string, string> = {
                  general: "grid-outline",
                  post: "create-outline",
                  article: "newspaper-outline",
                  advice: "help-circle-outline",
                  tuning: "build-outline",
                };
                const isActive = category === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCategory(key); }}
                    style={[
                      styles.catChip,
                      { borderColor: isActive ? colors.primary : colors.border },
                      isActive && { backgroundColor: colors.primary + "18" },
                    ]}
                  >
                    <Ionicons name={iconMap[key] as any} size={14} color={isActive ? colors.primary : colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={[styles.catChipText, { color: isActive ? colors.primary : colors.textSecondary }]}>{t(`journal.${CATEGORY_I18N_MAP[key]}`)}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: isDark ? colors.surface : colors.background }]}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>{t("journal.photos")} ({imageUris.length}/{maxImages})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imagesRow}>
            {imageUris.map((uri, idx) => {
              const resolved = resolveMediaUri(uri);
              return (
                <View key={idx} style={styles.imageWrap}>
                  <Image source={{ uri: resolved }} style={styles.imagePreview} contentFit="cover" />
                  <Pressable onPress={() => removeImage(idx)} style={styles.removeBtn}>
                    <Ionicons name="close-circle" size={22} color={colors.textInverse} />
                  </Pressable>
                </View>
              );
            })}
            {imageUris.length < maxImages && (
              <Pressable
                onPress={pickImages}
                disabled={uploading}
                style={[styles.addImageBtn, { backgroundColor: isDark ? colors.surface : colors.background, borderColor: colors.border }]}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={colors.textTertiary} />
                ) : (
                  <Ionicons name="camera-outline" size={28} color={colors.textTertiary} />
                )}
                <Text style={[styles.addImageText, { color: colors.textTertiary }]}>{t("journal.addPhoto")}</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: isDark ? colors.surface : colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom || 16 }]}>
        <Pressable
          onPress={handleSubmit}
          disabled={submitting || !title.trim() || !content.trim()}
          style={({ pressed }) => [
            styles.publishButton,
            {
              backgroundColor: submitting || !title.trim() || !content.trim() ? colors.surface : colors.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Text style={[styles.publishButtonText, { color: submitting || !title.trim() || !content.trim() ? colors.textTertiary : colors.textInverse }]}>
              {isEditing ? t("journal.save") : t("journal.publish")}
            </Text>
          )}
        </Pressable>
      </View>

      <VehicleCascadeProvider value={createCascadeValue}>
        <VehicleCascadePicker
          visible={showVehiclePicker}
          onClose={() => setShowVehiclePicker(false)}
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
    marginLeft: 4,
  },
  form: {
    gap: 8,
  },
  section: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingVertical: 16,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: "700" as const,
    minHeight: 44,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  contentInput: {
    fontSize: 15,
    lineHeight: 22,
  },
  charCounter: {
    fontSize: 12,
    marginTop: 6,
    textAlign: "right" as const,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 12,
  },
  imagesRow: {
    gap: 10,
    flexDirection: "row",
  },
  imageWrap: {
    width: 100,
    height: 100,
    borderRadius: CARD_RADIUS_SMALL,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  addImageBtn: {
    width: 100,
    height: 100,
    borderRadius: CARD_RADIUS_SMALL,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addImageText: {
    fontSize: 11,
    fontWeight: "500" as const,
  },
  bottomBar: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  publishButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  catChip: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  vehiclePickerBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    borderWidth: 1,
    borderRadius: CARD_RADIUS_SMALL,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  vehiclePickerText: {
    fontSize: 15,
    flex: 1,
  },
  starRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
});

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useAlert } from "@/contexts/AlertContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { AppIcons as I } from "@/constants/icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useColors } from "@/constants/colors";
import { useTranslation } from "@/lib/i18n";
import { ScreenHeader } from "@/components/ScreenHeader";
import { translateWorkingHours } from "@/lib/location-labels";
import { apiRequest } from "@/lib/query-client";
import { getAvatarUri, resolveMediaUri, uploadImage } from "@/lib/media";
import { WorkingHoursModal, RegionCityPickerSheet } from "@/components/forms";
import { getRegionCityLabel } from "@/lib/location-labels";
import { useQuery } from "@tanstack/react-query";
import { CARD_RADIUS, HEADER_CONTENT_PADDING_H, WEB_TOP_INSET } from "@/constants/layout";
import { useProfileForm } from "@/hooks/useProfileForm";
import { API } from "@/lib/api-endpoints";

export default function ProEditScreen() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { t, language } = useTranslation();

  const profileForm = useProfileForm();
  const {
    name, setName, phone, setPhone, city, setCity,
    saving, errors, scrollRef, fieldOffsets,
    clearError, hasErrors, getErrorCountText, handleSave,
    user, refreshUser,
  } = profileForm;

  const { data: proStatus, isLoading: proLoading } = useQuery<{ isProSeller: boolean; subscription: { daysRemaining: number } | null; gracePeriod?: { active: boolean; subscriptionEnd: string; graceDaysLeft: number } }>({
    queryKey: [API.proSeller.status],
    enabled: !!user && user.role !== "dealer",
  });
  const subscriptionDaysLeft = proStatus?.subscription?.daysRemaining ?? null;
  const proGracePeriod = proStatus?.gracePeriod ?? null;

  const [hasRedirected, setHasRedirected] = React.useState(false);

  React.useEffect(() => {
    if (hasRedirected) return;
    if (!user) {
      setHasRedirected(true);
      router.replace("/(tabs)");
    } else if (user.role === "dealer") {
      setHasRedirected(true);
      router.replace("/dealer-edit");
    } else if (!proLoading && !proStatus?.isProSeller) {
      setHasRedirected(true);
      router.replace("/edit-profile");
    }
  }, [user, user?.role, proLoading, proStatus?.isProSeller, hasRedirected]);

  const detailColors = React.useMemo(() => {
    if (!isDark) return { ...colors, surface: colors.surface, surfaceElevated: colors.background };
    return { ...colors, surface: colors.background, surfaceElevated: colors.surface };
  }, [isDark, colors]);

  const [about, setAbout] = useState(user?.about || "");
  const [workingHours, setWorkingHours] = useState(user?.workingHours || "");
  const [callbackEnabled, setCallbackEnabled] = useState(user?.callbackEnabled ?? false);

  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingCover, setDeletingCover] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const [showWorkingHours, setShowWorkingHours] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

  const defaultAvatarSource = require("@/assets/images/default-avatar.png");
  const defaultBannerSource = require("@/assets/images/default-banner.png");
  const hasAvatar = !!user?.avatarUrl;
  const hasCover = !!user?.companyCoverUrl;

  if (!user || proLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  const hasChanges =
    name !== (user?.name || "") ||
    phone !== (user?.phone || "") ||
    city !== (user?.city || "") ||
    about !== (user?.about || "") ||
    workingHours !== (user?.workingHours || "") ||
    callbackEnabled !== (user?.callbackEnabled ?? false);

  const handlePickCover = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showAlert(t("editProfile.accessDenied"), t("editProfile.galleryAccessMsg"), undefined, "error");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], allowsEditing: true, aspect: [3, 1], quality: 0.85,
      });
      if (result.canceled || !result.assets?.[0]) return;
      setUploadingCover(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await uploadImage(result.assets[0].uri, API.auth.dealerImage("cover"), "image", "cover.jpg");
      if (!res.ok) throw new Error("Upload failed");
      await refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      showAlert(t("common.error"), t("editProfile.photoUploadError"), undefined, "error");
    } finally {
      setUploadingCover(false);
    }
  };

  const handlePickAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showAlert(t("editProfile.accessDenied"), t("editProfile.galleryAccessMsg"), undefined, "error");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;
      setUploadingAvatar(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await uploadImage(result.assets[0].uri, API.auth.avatar, "avatar", "avatar.jpg");
      if (!res.ok) throw new Error("Upload failed");
      await refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      showAlert(t("common.error"), t("editProfile.photoUploadError"), undefined, "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteCover = async () => {
    if (uploadingCover) return;
    try {
      setDeletingCover(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await apiRequest("PUT", API.auth.profile, { companyCoverUrl: null });
      await refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("[ProEdit] deleteCover error:", error);
      showAlert(t("common.error"), t("editProfile.saveError"), undefined, "error");
    } finally {
      setDeletingCover(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (uploadingAvatar) return;
    try {
      setDeletingAvatar(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await apiRequest("PUT", API.auth.profile, { avatarUrl: null });
      await refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("[ProEdit] deleteAvatar error:", error);
      showAlert(t("common.error"), t("editProfile.saveError"), undefined, "error");
    } finally {
      setDeletingAvatar(false);
    }
  };

  const onSave = async () => {
    await handleSave({
      name: name.trim(),
      phone: phone.trim() || null,
      city: city.trim() || null,
      about: about.trim() || null,
      workingHours: workingHours.trim() || null,
      callbackEnabled,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: detailColors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScreenHeader title={t("editProfile.proSellerProfile")} backgroundColor={detailColors.surfaceElevated} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        >
          {(() => {
            if (proGracePeriod?.active) {
              return (
                <Pressable
                  onPress={() => router.push("/pro-seller")}
                  style={[styles.subWarningBanner, {
                    backgroundColor: isDark ? "rgba(249,115,22,0.15)" : "#FFF7ED",
                    borderColor: isDark ? "rgba(249,115,22,0.3)" : "#FDBA74",
                  }]}
                >
                  <View style={styles.subWarningRow}>
                    <Ionicons name={I.warning} size={18} color="#F97316" />
                    <Text style={[styles.subWarningText, { color: isDark ? "#FDBA74" : "#9A3412" }]} numberOfLines={2}>
                      {t("profile.gracePeriodWarning").replace("{days}", String(proGracePeriod.graceDaysLeft))}
                    </Text>
                    <Ionicons name={I.forward} size={16} color={isDark ? "#9CA3AF" : "#6B7280"} />
                  </View>
                </Pressable>
              );
            }
            if (subscriptionDaysLeft !== null && subscriptionDaysLeft > 0 && subscriptionDaysLeft <= 7) {
              return (
                <Pressable
                  onPress={() => router.push("/pro-seller")}
                  style={[styles.subWarningBanner, {
                    backgroundColor: isDark ? "rgba(245,158,11,0.15)" : "#FFFBEB",
                    borderColor: isDark ? "rgba(245,158,11,0.3)" : "#FDE68A",
                  }]}
                >
                  <View style={styles.subWarningRow}>
                    <Ionicons name={I.time} size={18} color="#F59E0B" />
                    <Text style={[styles.subWarningText, { color: isDark ? "#FCD34D" : "#92400E" }]} numberOfLines={2}>
                      {`${t("profile.daysRemaining").replace("{days}", String(subscriptionDaysLeft))} — ${t("profile.frozenListingsAction")}`}
                    </Text>
                    <Ionicons name={I.forward} size={16} color={isDark ? "#9CA3AF" : "#6B7280"} />
                  </View>
                </Pressable>
              );
            }
            return null;
          })()}
          <View style={[styles.card, { backgroundColor: detailColors.surfaceElevated, borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
            <View style={styles.coverWrapper}>
              <Pressable
                onPress={handlePickCover}
                disabled={uploadingCover || deletingCover}
                style={[styles.coverUploadArea, { borderColor: hasCover ? "transparent" : colors.border, borderWidth: hasCover ? 0 : 1 }]}
              >
                <Image
                  source={hasCover ? { uri: resolveMediaUri(user.companyCoverUrl!) } : defaultBannerSource}
                  style={styles.coverImage}
                  resizeMode="cover"
                />
                {(uploadingCover || deletingCover) && (
                  <View style={styles.imageOverlay}><ActivityIndicator size="small" color="#fff" /></View>
                )}
                <View style={[styles.imageEditBadge, { backgroundColor: isDark ? colors.border : colors.surfaceSecondary }]}>
                  <Ionicons name={I.camera} size={12} color={colors.text} />
                </View>
              </Pressable>
              {hasCover && (
                <Pressable
                  onPress={handleDeleteCover}
                  disabled={deletingCover}
                  hitSlop={8}
                  style={[styles.deleteImageBadge, { backgroundColor: "rgba(0,0,0,0.55)" }]}
                >
                  <Ionicons name={I.delete} size={12} color="#fff" />
                </Pressable>
              )}
            </View>

            <View style={styles.avatarRow}>
              <View>
                <Pressable onPress={handlePickAvatar} disabled={uploadingAvatar || deletingAvatar}>
                  <View style={[styles.avatarCircle, { backgroundColor: colors.surfaceSecondary, borderColor: hasAvatar ? "transparent" : colors.border, borderWidth: hasAvatar ? 0 : 1 }]}>
                    <View style={styles.avatarImageWrap}>
                      <Image
                        source={hasAvatar ? { uri: getAvatarUri(user.avatarUrl!)! } : defaultAvatarSource}
                        style={styles.avatarImage}
                      />
                      {(uploadingAvatar || deletingAvatar) && (
                        <View style={[styles.imageOverlay, { borderRadius: 35 }]}>
                          <ActivityIndicator size="small" color="#fff" />
                        </View>
                      )}
                    </View>
                    <View style={[styles.avatarEditBadge, { backgroundColor: isDark ? colors.border : colors.surfaceSecondary, borderColor: detailColors.surfaceElevated }]}>
                      <Ionicons name={I.camera} size={10} color={colors.text} />
                    </View>
                  </View>
                </Pressable>
                {hasAvatar && (
                  <Pressable
                    onPress={handleDeleteAvatar}
                    disabled={deletingAvatar}
                    hitSlop={6}
                    style={[styles.deleteAvatarBadge, { backgroundColor: "rgba(0,0,0,0.55)" }]}
                  >
                    <Ionicons name={I.delete} size={10} color="#fff" />
                  </Pressable>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.avatarHintTitle, { color: colors.text }]}>{t("editProfile.changePhoto")}</Text>
                <Text style={[styles.avatarHintSub, { color: colors.textTertiary }]}>500×500</Text>
              </View>
            </View>

            <View style={styles.gridWrap}>
              <View style={[styles.gridCell, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                onLayout={(e) => { fieldOffsets.current.name = e.nativeEvent.layout.y; }}>
                <View style={styles.iconWrap}>
                  <Ionicons name={I.person} size={22} color={errors.name ? colors.error : colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.gridCellValue, { color: colors.text, padding: 0 }]}
                    value={name}
                    onChangeText={(val) => { setName(val); clearError("name"); }}
                    placeholder={t("editProfile.namePlaceholder")}
                    placeholderTextColor={colors.textTertiary}
                    maxLength={50}
                  />
                  <Text style={[styles.gridCellLabel, { color: errors.name ? colors.error : colors.textTertiary }]}>{errors.name || t("editProfile.name")}</Text>
                </View>
              </View>

              <View style={[styles.gridCell, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                onLayout={(e) => { fieldOffsets.current.phone = e.nativeEvent.layout.y; }}>
                <View style={styles.iconWrap}>
                  <Ionicons name={I.call} size={22} color={errors.phone ? colors.error : colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.gridCellValue, { color: colors.text, padding: 0 }]}
                    value={phone}
                    onChangeText={(val) => { setPhone(val); clearError("phone"); }}
                    placeholder={t("editProfile.phonePlaceholder")}
                    placeholderTextColor={colors.textTertiary}
                    maxLength={13}
                    keyboardType="phone-pad"
                  />
                  <Text style={[styles.gridCellLabel, { color: errors.phone ? colors.error : colors.textTertiary }]}>{errors.phone || t("editProfile.phone")}</Text>
                </View>
              </View>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowCityPicker(true);
                }}
                style={[styles.gridCell, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
              >
                <View style={styles.iconWrap}>
                  <Ionicons name={I.location} size={22} color={colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.gridCellValue, { color: city ? colors.text : colors.textTertiary }]} numberOfLines={1}>
                    {city ? getRegionCityLabel(city, language) : t("editProfile.selectCity")}
                  </Text>
                  <Text style={[styles.gridCellLabel, { color: colors.textTertiary }]}>
                    {t("editProfile.cityLabel")}
                  </Text>
                </View>
                <Ionicons name={I.forward} size={16} color={colors.textTertiary} />
              </Pressable>

              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowWorkingHours(true); }}
                style={styles.gridCell}
              >
                <View style={styles.iconWrap}>
                  <Ionicons name={I.time} size={22} color={colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.gridCellValue, { color: workingHours ? colors.text : colors.textTertiary }]} numberOfLines={1}>
                    {workingHours ? translateWorkingHours(workingHours, language) : t("editProfile.workingHoursLabel")}
                  </Text>
                  <Text style={[styles.gridCellLabel, { color: colors.textTertiary }]}>{t("editProfile.workingHoursLabel")}</Text>
                </View>
                <Ionicons name={I.forward} size={16} color={colors.textTertiary} />
              </Pressable>

            </View>
          </View>

          <View style={[styles.card, { backgroundColor: detailColors.surfaceElevated }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("sellerExtra.aboutUs")}</Text>
            <TextInput
              style={[styles.aboutInput, { color: colors.text }]}
              value={about}
              onChangeText={setAbout}
              placeholder={t("editProfile.aboutPlaceholder")}
              placeholderTextColor={colors.textTertiary}
              maxLength={2000}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={{ fontSize: 12, color: colors.textTertiary, textAlign: "right", marginTop: 4 }}>{about.length}/2000</Text>
          </View>

          {hasErrors && (
            <View style={[styles.errorSummary, { backgroundColor: colors.error + "12" }]}>
              <Ionicons name={I.alert} size={16} color={colors.error} />
              <Text style={[styles.errorSummaryText, { color: colors.error }]}>
                {getErrorCountText(Object.keys(errors).length)}
              </Text>
            </View>
          )}

          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSave(); }}
            disabled={!hasChanges || saving}
            style={({ pressed }) => [
              styles.saveButton,
              {
                backgroundColor: hasChanges ? colors.text : (isDark ? colors.border : colors.surfaceSecondary),
                opacity: pressed ? 0.8 : 1,
                marginHorizontal: 14,
              },
            ]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[styles.saveButtonText, { color: hasChanges ? colors.background : colors.textTertiary }]}>
                {t("editProfile.saveButton")}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/dealer-apply"); }}
            style={({ pressed }) => [
              styles.upgradeDealerButton,
              {
                backgroundColor: isDark ? colors.surface : colors.surfaceSecondary,
                borderColor: colors.border,
                opacity: pressed ? 0.8 : 1,
                marginHorizontal: 14,
              },
            ]}
          >
            <Ionicons name={I.storefront} size={20} color={colors.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.upgradeDealerTitle, { color: colors.text }]}>{t("profile.upgradeToDealer")}</Text>
              <Text style={[styles.upgradeDealerSub, { color: colors.textSecondary }]}>{t("profile.upgradeToDealerSub")}</Text>
            </View>
            <Ionicons name={I.forward} size={16} color={colors.textTertiary} />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <WorkingHoursModal
        visible={showWorkingHours}
        onClose={() => setShowWorkingHours(false)}
        value={workingHours}
        callbackEnabled={callbackEnabled}
        showCallbackOption
        onSave={(val, _callsOnly, callback) => {
          setWorkingHours(val);
          if (callback !== undefined) setCallbackEnabled(callback);
          setShowWorkingHours(false);
        }}
        colors={colors}
        isDark={isDark}
        insets={insets}
      />

      <RegionCityPickerSheet
        visible={showCityPicker}
        onClose={() => setShowCityPicker(false)}
        currentCityId={city}
        onSelect={(cityId) => { setCity(cityId); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: HEADER_CONTENT_PADDING_H,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: "600", letterSpacing: -0.2 },
  content: { paddingHorizontal: 0, gap: 6 },
  card: {
    marginHorizontal: 0,
    borderRadius: 20,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  gridWrap: {
    flexDirection: "column" as const,
  },
  iconWrap: {
    width: 24,
    alignItems: "center" as const,
  },
  gridCell: {
    width: "100%" as any,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    paddingVertical: 12,
  },
  gridCellValue: {
    fontSize: 15,
    fontWeight: "700" as const,
    letterSpacing: -0.2,
  },
  gridCellLabel: {
    fontSize: 12,
    marginTop: 1,
  },
  coverWrapper: {
    position: "relative" as const,
  },
  coverUploadArea: { height: 160, borderRadius: CARD_RADIUS, overflow: "hidden" as const, borderStyle: "dashed" as const },
  coverImage: { width: "100%" as const, height: "100%" as const },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center" as const, justifyContent: "center" as const, borderRadius: CARD_RADIUS,
  },
  imageEditBadge: {
    position: "absolute" as const, bottom: 8, right: 8,
    width: 26, height: 26, borderRadius: 13, alignItems: "center" as const, justifyContent: "center" as const,
  },
  deleteImageBadge: {
    position: "absolute" as const, top: 8, right: 8,
    width: 26, height: 26, borderRadius: 13, alignItems: "center" as const, justifyContent: "center" as const,
  },
  deleteAvatarBadge: {
    position: "absolute" as const, top: -2, right: -2,
    width: 20, height: 20, borderRadius: 10, alignItems: "center" as const, justifyContent: "center" as const,
  },
  avatarRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 14, marginBottom: 8 },
  avatarCircle: {
    width: 70, height: 70, borderRadius: 35, alignItems: "center" as const, justifyContent: "center" as const,
    borderStyle: "dashed" as const,
  },
  avatarImageWrap: { width: 70, height: 70, borderRadius: 35, overflow: "hidden" as const },
  avatarImage: { width: 70, height: 70, borderRadius: 35 },
  avatarEditBadge: {
    position: "absolute" as const, bottom: -2, right: -2,
    width: 22, height: 22, borderRadius: 11, alignItems: "center" as const, justifyContent: "center" as const, borderWidth: 2,
  },
  avatarHintTitle: { fontSize: 15, fontWeight: "600" as const },
  avatarHintSub: { fontSize: 12 },
  aboutInput: { fontSize: 16, minHeight: 80, padding: 0, lineHeight: 22 },
  errorSummary: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginHorizontal: 14 },
  errorSummaryText: { fontSize: 13, fontWeight: "500", flex: 1 },
  saveButton: { paddingVertical: 15, borderRadius: CARD_RADIUS, alignItems: "center", justifyContent: "center", marginTop: 8 },
  saveButtonText: { fontSize: 16, fontWeight: "600" as const },
  upgradeDealerButton: {
    flexDirection: "row" as const, alignItems: "center" as const, gap: 12,
    padding: 14, borderRadius: CARD_RADIUS, borderWidth: 1, marginTop: 12,
  },
  upgradeDealerTitle: { fontSize: 15, fontWeight: "600" as const },
  upgradeDealerSub: { fontSize: 12, marginTop: 1 },
  subWarningBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  subWarningRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  subWarningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500" as const,
    lineHeight: 18,
  },
});

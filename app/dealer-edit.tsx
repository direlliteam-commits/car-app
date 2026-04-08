import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { AppIcons as I } from "@/constants/icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/constants/colors";
import { useTranslation } from "@/lib/i18n";
import { ScreenHeader } from "@/components/ScreenHeader";
import { CARD_GAP, CARD_PADDING } from "@/constants/layout";
import { useDealerEditForm } from "@/hooks/useDealerEditForm";
import { hexToRgba } from "@/components/dealer/SimpleSlider";
import { DealerEditMediaSection, ShowroomPhotosSection } from "@/components/dealer/DealerEditMediaSection";
import { DealerEditProfileSection } from "@/components/dealer/DealerEditProfileSection";
import { DealerEditBranchForm } from "@/components/dealer/DealerEditBranchForm";
import { DealerEditPickerModals } from "@/components/dealer/DealerEditPickerModals";

export default function DealerEditScreen() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const detailColors = useMemo(() => {
    if (!isDark) return { ...colors, surface: colors.surface, surfaceElevated: colors.background };
    return { ...colors, surface: colors.background, surfaceElevated: colors.surface };
  }, [isDark, colors]);

  const form = useDealerEditForm();

  const trkActive = colors.primary;
  const trkInactive = colors.trackInactive;
  const trkThumb = colors.thumbColor;

  return (
    <View style={[styles.container, { backgroundColor: detailColors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScreenHeader title={t("editProfile.dealerProfile")} backgroundColor={detailColors.surfaceElevated} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={form.scrollRef}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        >
          {(() => {
            if (form.dealerGracePeriod) {
              return (
                <Pressable
                  onPress={() => router.push("/dealer-plans")}
                  style={[styles.subWarningBanner, {
                    backgroundColor: isDark ? "rgba(249,115,22,0.15)" : "#FFF7ED",
                    borderColor: isDark ? "rgba(249,115,22,0.3)" : "#FDBA74",
                  }]}
                >
                  <View style={styles.subWarningRow}>
                    <Ionicons name={I.warning} size={18} color="#F97316" />
                    <Text style={[styles.subWarningText, { color: isDark ? "#FDBA74" : "#9A3412" }]} numberOfLines={2}>
                      {t("profile.gracePeriodWarning").replace("{days}", String(form.dealerGracePeriod.graceDaysLeft))}
                    </Text>
                    <Ionicons name={I.forward} size={16} color={isDark ? "#9CA3AF" : "#6B7280"} />
                  </View>
                </Pressable>
              );
            }
            if (form.subscriptionDaysLeft !== null && form.subscriptionDaysLeft > 0 && form.subscriptionDaysLeft <= 7) {
              return (
                <Pressable
                  onPress={() => router.push("/dealer-plans")}
                  style={[styles.subWarningBanner, {
                    backgroundColor: isDark ? "rgba(245,158,11,0.15)" : "#FFFBEB",
                    borderColor: isDark ? "rgba(245,158,11,0.3)" : "#FDE68A",
                  }]}
                >
                  <View style={styles.subWarningRow}>
                    <Ionicons name={I.time} size={18} color="#F59E0B" />
                    <Text style={[styles.subWarningText, { color: isDark ? "#FCD34D" : "#92400E" }]} numberOfLines={2}>
                      {`${t("profile.daysRemaining").replace("{days}", String(form.subscriptionDaysLeft))} — ${t("profile.frozenListingsAction")}`}
                    </Text>
                    <Ionicons name={I.forward} size={16} color={isDark ? "#9CA3AF" : "#6B7280"} />
                  </View>
                </Pressable>
              );
            }
            return null;
          })()}

          <View style={[styles.card, { backgroundColor: detailColors.surfaceElevated, borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
            <DealerEditMediaSection
              colors={colors}
              isDark={isDark}
              detailColors={detailColors}
              user={form.user}
              hasLogo={form.hasLogo}
              hasCover={form.hasCover}
              uploadingLogo={form.uploadingLogo}
              uploadingCover={form.uploadingCover}
              deletingLogo={form.deletingLogo}
              deletingCover={form.deletingCover}
              uploadingShowroom={form.uploadingShowroom}
              showroomPhotos={form.showroomPhotos}
              onPickDealerImage={form.handlePickDealerImage}
              onDeleteCover={form.handleDeleteCover}
              onDeleteLogo={form.handleDeleteLogo}
              onAddShowroomPhotos={form.handleAddShowroomPhotos}
              onDeleteShowroomPhoto={form.handleDeleteShowroomPhoto}
            />

            <DealerEditProfileSection
              colors={colors}
              errors={form.errors}
              companyName={form.companyName}
              setCompanyName={form.setCompanyName}
              companyDescription={form.companyDescription}
              setCompanyDescription={form.setCompanyDescription}
              website={form.website}
              setWebsite={form.setWebsite}
              clearError={form.clearError}
              fieldOffsets={form.fieldOffsets}
            />
          </View>

          <ShowroomPhotosSection
            colors={colors}
            detailColors={detailColors}
            showroomPhotos={form.showroomPhotos}
            uploadingShowroom={form.uploadingShowroom}
            onAddShowroomPhotos={form.handleAddShowroomPhotos}
            onDeleteShowroomPhoto={form.handleDeleteShowroomPhoto}
          />

          <DealerEditBranchForm
            colors={colors}
            isDark={isDark}
            detailColors={detailColors}
            branches={form.branches}
            setBranches={form.setBranches}
            activeBranchIdx={form.activeBranchIdx}
            setActiveBranchIdx={form.setActiveBranchIdx}
            setBranchWorkingHoursIdx={form.setBranchWorkingHoursIdx}
            setShowSpecPicker={form.setShowSpecPicker}
            setShowWarrantyPicker={form.setShowWarrantyPicker}
            setShowBankPicker={form.setShowBankPicker}
            setShowCreditTermsPicker={form.setShowCreditTermsPicker}
            setShowTradeInMaxAgePicker={form.setShowTradeInMaxAgePicker}
            setShowTradeInBonusPicker={form.setShowTradeInBonusPicker}
            uploadingBranchPhoto={form.uploadingBranchPhoto}
            allBanks={form.allBanks}
            getBankName={form.getBankName}
            getCreditTermsSummary={form.getCreditTermsSummary}
            handleAddBranchPhotos={form.handleAddBranchPhotos}
            handleDeleteBranchPhoto={form.handleDeleteBranchPhoto}
            trkActive={trkActive}
            trkInactive={trkInactive}
            trkThumb={trkThumb}
            makeDefaultBranch={form.makeDefaultBranch}
          />

          {form.hasErrors && (
            <View style={[styles.errorSummary, { backgroundColor: hexToRgba(colors.error, 0.07) }]}>
              <Ionicons name={I.alert} size={16} color={colors.error} />
              <Text style={[styles.errorSummaryText, { color: colors.error }]}>
                {form.getErrorCountText(Object.keys(form.errors).length)}
              </Text>
            </View>
          )}

          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); form.onSave(); }}
            disabled={!form.hasChanges || form.saving}
            style={({ pressed }) => [
              styles.saveButton,
              {
                backgroundColor: form.hasChanges ? colors.primary : (isDark ? colors.border : colors.surfaceSecondary),
                opacity: pressed ? 0.85 : 1,
                marginHorizontal: 14,
              },
            ]}
          >
            {form.saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[styles.saveButtonText, { color: form.hasChanges ? "#fff" : colors.textTertiary }]}>
                {t("editProfile.saveButton")}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <DealerEditPickerModals
        colors={colors}
        isDark={isDark}
        insets={insets}
        form={form}
        trkActive={trkActive}
        trkInactive={trkInactive}
        trkThumb={trkThumb}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 0, gap: CARD_GAP },
  card: {
    marginHorizontal: 0,
    borderRadius: 20,
    padding: CARD_PADDING,
    gap: CARD_GAP,
  },
  errorSummary: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  errorSummaryText: { fontSize: 13, fontWeight: "500", flex: 1 },
  saveButton: { paddingVertical: 15, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 8 },
  saveButtonText: { fontSize: 16, fontWeight: "600" },
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

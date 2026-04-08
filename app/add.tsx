import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Image,
} from "react-native";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Icon } from "@/components/Icon";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/constants/colors";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCars } from "@/contexts/CarsContext";
import type { VehicleType } from "@/types/car";
import { useCarForm, initialFormData } from "@/hooks/useCarForm";
import { CarFormScreen } from "@/components/CarFormScreen";
import { ListingPreview } from "@/components/ListingPreview";
import { loadDrafts, loadServerDrafts, saveDraft, removeDraft, syncDraftToServer } from "@/lib/drafts";
import { useTranslation } from "@/lib/i18n";
import { WEB_TOP_INSET } from "@/constants/layout";

export default function AddCarScreen() {
  const { vehicleType: vehicleTypeParam, draftId: draftIdParam } = useLocalSearchParams<{ vehicleType?: string; draftId?: string }>();
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useColors(colorScheme);
  const insets = useSafeAreaInsets();
  const { addCar } = useCars();
  const { showAlert } = useAlert();
  const { isAuthenticated, user: authUser } = useAuth();
  const { t } = useTranslation();

  const isDealer = authUser?.role === "dealer";
  const hasName = isDealer ? !!(authUser?.companyName || authUser?.name) : !!authUser?.name;
  const profileIncomplete = isAuthenticated && authUser && (!hasName || !authUser.phone || !authUser.city);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth");
      return;
    }
  }, [isAuthenticated]);

  const validTypes: VehicleType[] = ["passenger", "truck", "special", "moto"];
  const selectedVehicleType: VehicleType = validTypes.includes(vehicleTypeParam as VehicleType)
    ? (vehicleTypeParam as VehicleType)
    : "passenger";

  const form = useCarForm({ initialData: { vehicleType: selectedVehicleType } });
  const {
    formData, setFormData, isLoading, setIsLoading,
    showPreview, setShowPreview,
    webTopInset, user,
    updateField,
    hasUnsavedChanges, goBack,
    validateForm, prepareImageUrls, buildSubmitPayload, uploadVideo,
  } = form;

  const autoOpenCascade = !draftIdParam;
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftIdParam || null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formDataRef = useRef(formData);
  const draftIdRef = useRef(currentDraftId);
  const submittedRef = useRef(false);
  formDataRef.current = formData;
  draftIdRef.current = currentDraftId;

  useEffect(() => {
    if (draftIdParam) {
      (async () => {
        const localDrafts = await loadDrafts();
        let draft = localDrafts.find((d) => d.id === draftIdParam);
        if (!draft && draftIdParam.startsWith("server_")) {
          const serverDrafts = await loadServerDrafts();
          draft = serverDrafts.find((d) => d.id === draftIdParam);
          if (draft) {
            await saveDraft(draft.id, draft.data, draft.serverId);
          }
        }
        if (draft) {
          setFormData((prev) => ({ ...prev, ...draft!.data }));
          setCurrentDraftId(draftIdParam);
        }
        setDraftLoaded(true);
      })();
    } else {
      setDraftLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (user && draftLoaded) {
      const isDealer = user.role === "dealer";
      const branches = user.dealerBranches || [];
      setFormData((prev) => {
        const next = {
          ...prev,
          sellerName: prev.sellerName || user.name || user.username || "",
          sellerPhone: prev.sellerPhone || user.phone || "",
          location: prev.location || user.city || "Yerevan",
          sellerType: isDealer ? "dealer" as const : prev.sellerType,
          branchId: prev.branchId || (isDealer && branches.length > 0 ? branches[0].id : null),
        };
        if (isDealer && branches.length > 0 && !prev.branchId) {
          const branch = branches[0];
          if (branch.creditProgramEnabled) {
            next.creditAvailable = true;
            if (branch.creditInterestRate > 0) next.creditInterestRateFrom = branch.creditInterestRate;
            if (branch.creditMaxTerm > 0) next.creditMaxMonths = branch.creditMaxTerm;
            if (branch.creditMinDownPayment > 0) next.creditMinDownPaymentPercent = branch.creditMinDownPayment;
            if (branch.partnerBankIds && branch.partnerBankIds.length > 0) next.creditPartnerBankIds = branch.partnerBankIds;
          }
          if (branch.tradeInEnabled) {
            next.tradeInAvailable = true;
            if (branch.tradeInMaxAge > 0) next.tradeInMaxAge = branch.tradeInMaxAge;
            if (branch.tradeInBonus > 0) next.tradeInBonus = branch.tradeInBonus;
          }
          if (branch.warrantyEnabled && branch.warrantyMonths > 0) {
            const years = Math.round(branch.warrantyMonths / 12);
            if (years > 0) next.warranty = String(years);
          }
        }
        return next;
      });
    }
  }, [user, draftLoaded]);

  useEffect(() => {
    if (!draftLoaded || submittedRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const hasContent = formData.brand || formData.model || formData.price || formData.mileage || formData.images.length > 0;
    if (hasContent) {
      setSaveStatus("saving");
    }
    saveTimerRef.current = setTimeout(async () => {
      if (submittedRef.current) return;
      if (hasContent) {
        const id = currentDraftId || (Date.now().toString() + Math.random().toString(36).substr(2, 6));
        if (!currentDraftId) setCurrentDraftId(id);
        await saveDraft(id, formData);
        if (isAuthenticated) {
          syncDraftToServer(id, formData).catch(() => {});
        }
        setSaveStatus("saved");
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2500);
      } else {
        setSaveStatus("idle");
      }
    }, 2000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [formData, draftLoaded]);

  useEffect(() => {
    return () => {
      if (submittedRef.current) return;
      const fd = formDataRef.current;
      const id = draftIdRef.current;
      const hasContent = fd.brand || fd.model || fd.price || fd.mileage || fd.images.length > 0;
      if (hasContent) {
        const draftId = id || (Date.now().toString() + Math.random().toString(36).substr(2, 6));
        saveDraft(draftId, fd);
      }
    };
  }, []);

  const [submitStage, setSubmitStage] = useState("");
  const [submitProgress, setSubmitProgress] = useState(0);

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setSubmitStage(t("addListing.stagePhotos") || "Загрузка фото...");
    setSubmitProgress(0);

    try {
      const hasNewVideo = formData.videoUri && !formData.videoUri.startsWith("http");
      const hasExistingVideo = formData.videoUri && formData.videoUri.startsWith("http");

      const imageUrls = await prepareImageUrls((uploaded, total) => {
        setSubmitProgress(Math.round((uploaded / total) * 100));
      });

      let videoUrl: string | null = hasExistingVideo ? formData.videoUri! : null;
      if (hasNewVideo) {
        setSubmitStage(t("addListing.stageVideo") || "Загрузка видео...");
        setSubmitProgress(0);
        videoUrl = await uploadVideo(formData.videoUri!, (pct) => {
          if (pct < 100) {
            setSubmitProgress(pct);
          } else {
            setSubmitStage(t("addListing.stageVideoProcessing") || "Обработка видео...");
            setSubmitProgress(0);
          }
        });
      }

      setSubmitStage(t("addListing.stageSaving") || "Сохранение...");
      setSubmitProgress(0);

      const payload = buildSubmitPayload(imageUrls);
      if (videoUrl) payload.videoUrl = videoUrl;

      await addCar(payload as Omit<import("@/types/listing").Car, "id" | "createdAt">);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      submittedRef.current = true;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      if (currentDraftId) {
        await removeDraft(currentDraftId);
      }
      showAlert(t("addListing.successTitle"), t("addListing.successMsg"), [
        {
          text: "OK",
          onPress: () => {
            setFormData(initialFormData);
            router.push("/");
          },
        },
      ], "success");
    } catch (error: any) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const errDetails = error?.details;
      console.error("[AddCar] Submit error:", errMsg, errDetails);
      showAlert(t("addListing.errorTitle"), errMsg || t("addListing.errorMsg"), undefined, "error");
    } finally {
      setIsLoading(false);
      setSubmitStage("");
      setSubmitProgress(0);
    }
  };

  if (profileIncomplete) {
    const missing: string[] = [];
    if (!hasName) missing.push(t("addListing.nameField"));
    if (!authUser?.phone) missing.push(t("addListing.phoneField"));
    if (!authUser?.city) missing.push(t("addListing.cityField"));
    return (
      <View style={[styles.blockScreen, { backgroundColor: isDark ? colors.background : colors.surface }]}>
        <View style={[styles.blockHeader, { paddingTop: insets.top + WEB_TOP_INSET + 8 }]}>
          <Pressable
            onPress={() => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)"); }}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            hitSlop={12}
          >
            <Icon name="chevron-back" size={28} color={colors.text} />
          </Pressable>
          <Text style={[styles.blockHeaderTitle, { color: colors.text }]}>{t("addListing.headerTitle")}</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.blockContent}>
          <Image source={require("@/assets/images/pen-3d.png")} style={{ width: 120, height: 120, marginBottom: 8 }} resizeMode="contain" />
          <Text style={[styles.blockTitle, { color: colors.text }]}>{t("addListing.fillProfile")}</Text>
          <Text style={[styles.blockText, { color: colors.textSecondary }]}>
            {`${t("addListing.fillProfileMsg")} ${missing.join(", ")}`}
          </Text>
          <Pressable
            onPress={() => router.push("/edit-profile")}
            style={({ pressed }) => [styles.blockButton, { backgroundColor: isDark ? "#FFFFFF" : "#1C1C1E", opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={[styles.blockButtonText, { color: isDark ? "#000000" : "#FFFFFF" }]}>{t("addListing.fillAction")}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <CarFormScreen
      mode="create"
      headerTitle={t("addListing.headerTitle")}
      submitLabel={t("addListing.previewButton")}
      submitLoadingLabel={t("addListing.submitLoading")}
      onSubmit={() => { if (validateForm()) setShowPreview(true); }}
      isSubmitting={false}
      submitStage={submitStage}
      submitProgress={submitProgress}
      form={form}
      saveStatus={saveStatus}
      autoOpenCascade={autoOpenCascade}
    >
      <ListingPreview
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        formData={formData}
        user={user}
        onSubmit={handleSubmit}
        submitLabel={t("addListing.submitLabel")}
        isSubmitting={isLoading}
        submitStage={submitStage}
        submitProgress={submitProgress}
      />
    </CarFormScreen>
  );
}

const styles = StyleSheet.create({
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  headerIconBtnPressed: {
    backgroundColor: "rgba(128,128,128,0.12)",
  },
  blockScreen: {
    flex: 1,
  },
  blockHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  blockHeaderTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
  },
  blockContent: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 32,
    gap: 12,
    marginTop: -60,
  },
  blockIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 8,
  },
  blockTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    textAlign: "center" as const,
    letterSpacing: -0.3,
  },
  blockText: {
    fontSize: 15,
    textAlign: "center" as const,
    lineHeight: 22,
  },
  blockButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  blockButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
});

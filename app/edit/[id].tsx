import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Icon } from "@/components/Icon";
import * as Haptics from "expo-haptics";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/constants/colors";
import { HEADER_CONTENT_PADDING_H } from "@/constants/layout";
import { useAlert } from "@/contexts/AlertContext";
import type { BodyType, FuelType, Transmission, DriveType, Condition, SteeringWheel, OwnersCount, AccidentHistory, ImportCountry, Equipment, SellerType, Availability, ApiListing, VehicleType } from "@/types/car";
import { apiRequest } from "@/lib/query-client";
import { useCarForm } from "@/hooks/useCarForm";
import { CarFormScreen } from "@/components/CarFormScreen";
import { ListingPreview } from "@/components/ListingPreview";
import { useTranslation } from "@/lib/i18n";
import { API } from "@/lib/api-endpoints";

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useColors(colorScheme);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();
  const { t } = useTranslation();

  const { data: listing, isLoading: listingLoading, isFetching } = useQuery<ApiListing>({
    queryKey: [API.listings.list, id, "detail"],
    queryFn: async () => {
      const resp = await apiRequest("GET", API.listings.getById(id));
      return resp.json();
    },
    enabled: !!id,
    staleTime: 0,
  });

  const [dataPopulated, setDataPopulated] = useState(false);

  const form = useCarForm();
  const {
    formData, setFormData, isLoading, setIsLoading,
    showPreview, setShowPreview,
    webTopInset, isAuthenticated, user,
    goBack,
    validateForm, buildSubmitPayload, prepareImageUrls, uploadVideo,
  } = form;

  useEffect(() => {
    if (listing && !isFetching && listing.status === "moderation") {
      goBack();
      return;
    }
    if (listing && !dataPopulated) {
      setFormData({
        vehicleType: (listing.vehicleType as VehicleType) || "passenger",
        brand: listing.brand || "",
        model: listing.model || "",
        year: listing.year || new Date().getFullYear(),
        price: listing.originalPrice && listing.originalPrice > 0 ? String(listing.originalPrice) : (listing.price ? String(listing.price) : ""),
        originalPrice: "",
        creditDiscount: listing.creditDiscount ? String(listing.creditDiscount) : "",
        tradeInDiscount: listing.tradeInDiscount ? String(listing.tradeInDiscount) : "",
        insuranceDiscount: listing.insuranceDiscount ? String(listing.insuranceDiscount) : "",
        mileage: listing.mileage ? String(listing.mileage) : "",
        bodyType: (listing.bodyType as BodyType) || undefined,
        fuelType: (listing.fuelType as FuelType) || undefined,
        transmission: (listing.transmission as Transmission) || undefined,
        driveType: (listing.driveType as DriveType) || undefined,
        engineVolume: listing.engineVolume ? String(listing.engineVolume) : "",
        horsepower: listing.horsepower ? String(listing.horsepower) : "",
        color: listing.color || "",
        currency: (listing.currency as "USD" | "AMD" | "EUR" | "RUB") || "USD",
        images: listing.images || [],
        videoUri: listing.videoUrl || null,
        description: listing.description || "",
        location: listing.location || "Yerevan",
        sellerName: listing.sellerName || "",
        sellerPhone: listing.sellerPhone || "",
        condition: (listing.condition as Condition) || undefined,
        steeringWheel: (listing.steeringWheel as SteeringWheel) || "left",
        hasGasEquipment: listing.hasGasEquipment ?? false,
        exchangePossible: listing.exchangePossible ?? false,
        installmentPossible: listing.installmentPossible ?? false,
        installmentDetails: listing.installmentDetails || "",
        exchangeDetails: listing.exchangeDetails || "",
        creditAvailable: listing.creditAvailable ?? false,
        tradeInAvailable: listing.tradeInAvailable ?? false,
        tradeInMaxAge: listing.tradeInMaxAge ?? 0,
        tradeInBonus: listing.tradeInBonus ?? 0,
        creditMinDownPaymentPercent: listing.creditMinDownPaymentPercent ?? 20,
        creditInterestRateFrom: listing.creditInterestRateFrom ?? 12,
        creditMaxMonths: listing.creditMaxMonths ?? 60,
        creditPartnerBankIds: (listing.creditPartnerBankIds as number[]) || [],
        ownersCount: (listing.ownersCount as OwnersCount) || 1,
        equipment: (listing.equipment as Equipment[]) || [],
        importCountry: listing.importCountry as ImportCountry | undefined,
        accidentHistory: (listing.accidentHistory as AccidentHistory) || "none",
        bodyDamages: (listing.bodyDamages as Record<string, string>) || {},
        warranty: listing.warranty || "",
        generation: listing.generation || "",
        version: listing.version || "",
        modificationId: listing.modificationId,
        configurationId: listing.configurationId,
        sellerType: (listing.sellerType as SellerType) || "private",
        availability: listing.availability as Availability | undefined,
        vin: listing.vin || "",
        noLegalIssues: listing.noLegalIssues ?? false,
        customsCleared: listing.customsCleared ?? true,
        payloadCapacity: listing.payloadCapacity ? String(listing.payloadCapacity) : "",
        axleCount: listing.axleCount ?? undefined,
        cabinType: listing.cabinType ?? undefined,
        wheelConfiguration: listing.wheelConfiguration ?? undefined,
        grossWeight: listing.grossWeight ? String(listing.grossWeight) : "",
        seatingCapacity: listing.seatingCapacity ? String(listing.seatingCapacity) : "",
        coolingType: listing.coolingType ?? undefined,
        cylinderCount: listing.cylinderCount ?? undefined,
        operatingHours: listing.operatingHours ? String(listing.operatingHours) : "",
        chassisType: listing.chassisType ?? undefined,
        operatingWeight: listing.operatingWeight ? String(listing.operatingWeight) : "",
        bucketVolume: listing.bucketVolume ? String(listing.bucketVolume) : "",
        diggingDepth: listing.diggingDepth ? String(listing.diggingDepth) : "",
        boomLength: listing.boomLength ? String(listing.boomLength) : "",
        bladeWidth: listing.bladeWidth ? String(listing.bladeWidth) : "",
        tractionClass: listing.tractionClass ?? "",
        liftingCapacity: listing.liftingCapacity ? String(listing.liftingCapacity) : "",
        liftingHeight: listing.liftingHeight ? String(listing.liftingHeight) : "",
        drumVolume: listing.drumVolume ? String(listing.drumVolume) : "",
        rollerWidth: listing.rollerWidth ? String(listing.rollerWidth) : "",
        cuttingWidth: listing.cuttingWidth ? String(listing.cuttingWidth) : "",
        hasPTO: listing.hasPTO ?? false,
        drillingDepth: listing.drillingDepth ? String(listing.drillingDepth) : "",
        pavingWidth: listing.pavingWidth ? String(listing.pavingWidth) : "",
        platformCapacity: listing.platformCapacity ? String(listing.platformCapacity) : "",
        suspensionType: listing.suspensionType ?? undefined,
        euroClass: listing.euroClass ?? undefined,
        seatHeight: listing.seatHeight ? String(listing.seatHeight) : "",
        dryWeight: listing.dryWeight ? String(listing.dryWeight) : "",
        fuelTankCapacity: listing.fuelTankCapacity ? String(listing.fuelTankCapacity) : "",
        branchId: listing.branchId || null,
      });
      setDataPopulated(true);
    }
  }, [listing, dataPopulated]);

  const [submitStage, setSubmitStage] = useState("");
  const [submitProgress, setSubmitProgress] = useState(0);

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    setSubmitStage(t("addListing.stagePhotos") || "Загрузка фото...");
    setSubmitProgress(0);

    try {
      const hasNewVideo = formData.videoUri && !formData.videoUri.startsWith("http") && !formData.videoUri.startsWith("/");
      const hasExistingVideo = formData.videoUri;

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
      if (videoUrl) {
        payload.videoUrl = videoUrl;
      } else if (!formData.videoUri) {
        (payload as { videoUrl: string | null | undefined }).videoUrl = null;
      }

      await apiRequest("PUT", API.listings.getById(id), payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: [API.listings.list] });
      queryClient.invalidateQueries({ queryKey: [API.listings.my] });
      queryClient.invalidateQueries({ queryKey: [API.listings.list, id, "detail"] });
      queryClient.invalidateQueries({ queryKey: [API.listings.priceHistory(id)] });
      queryClient.invalidateQueries({ queryKey: [API.listings.list, id, "similar"] });
      queryClient.invalidateQueries({ queryKey: [API.favorites.list] });
      queryClient.invalidateQueries({ queryKey: [API.listings.byIds] });
      showAlert(t("editListing.successTitle"), t("editListing.successMsg"), [
        { text: "OK", onPress: goBack },
      ], "success");
    } catch (error: any) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("[EditCar] Submit error:", errMsg, error?.details);
      showAlert(t("editListing.errorTitle"), errMsg || t("editListing.errorMsg"), undefined, "error");
    } finally {
      setIsLoading(false);
      setSubmitStage("");
      setSubmitProgress(0);
    }
  };

  if (listingLoading || !dataPopulated) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              paddingTop: insets.top + webTopInset + 8,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); goBack(); }} hitSlop={12} style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconBtnPressed]}>
              <Icon name="chevron-back" size={24} color={colors.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{t("editListing.headerTitle")}</Text>
            <View style={styles.headerIconBtn} />
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <CarFormScreen
      mode="edit"
      headerTitle={t("editListing.headerTitle")}
      submitLabel={t("addListing.previewButton")}
      submitLoadingLabel={t("editListing.submitLoading")}
      onSubmit={() => { if (validateForm()) setShowPreview(true); }}
      isSubmitting={false}
      submitStage={submitStage}
      submitProgress={submitProgress}
      form={form}
    >
      <ListingPreview
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        formData={formData}
        user={user}
        onSubmit={handleSubmit}
        submitLabel={t("editListing.submitLabel")}
        isSubmitting={isLoading}
        submitStage={submitStage}
        submitProgress={submitProgress}
      />
    </CarFormScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: HEADER_CONTENT_PADDING_H,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    flex: 1,
    textAlign: "center" as const,
  },
});

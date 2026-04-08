import { useCallback } from "react";
import { Share, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { apiRequest } from "@/lib/query-client";
import { useAlert } from "@/contexts/AlertContext";
import { useTranslation } from "@/lib/i18n";
import {
  formatPrice,
  getListingTitle,
  getListingShortTitle,
} from "@/lib/formatters";
import { Car } from "@/types/listing";
import { UseMutationResult } from "@tanstack/react-query";
import { API } from "@/lib/api-endpoints";

interface PriceAlertData { listingId: number; targetPrice: number }
interface PriceAlertRecord { id: number; active: boolean; targetPrice: number }

interface UseCarDetailActionsParams {
  car: Car | undefined;
  id: string | undefined;
  seller: { id?: string | number; phone?: string } | undefined;
  isAuthenticated: boolean;
  isFavorite: boolean;
  inComparison: boolean;
  existingAlert: PriceAlertRecord | undefined;
  hasAlert: boolean;
  alertTriggered: boolean;
  alertPrice: string;
  deleteCar: (id: string) => Promise<void>;
  updateListingStatus: (id: string, status: import("@/types/car").ListingStatus) => Promise<void>;
  toggleFavorite: (id: string) => void;
  toggleComparison: (id: string) => Promise<boolean>;
  priceAlertMutation: UseMutationResult<Response, Error, PriceAlertData>;
  deleteAlertMutation: UseMutationResult<Response, Error, number>;
  setShowPriceAlert: (v: boolean) => void;
  setAlertPrice: (v: string) => void;
  setShowReportModal: (v: boolean) => void;
  setShowStickyHeader: (v: boolean) => void;
  setShowActionsMenu: (v: boolean) => void;
  setGalleryMessageLoading: (v: boolean) => void;
}

export function useCarDetailActions({
  car,
  id,
  alertPrice,
  seller,
  isAuthenticated,
  isFavorite,
  inComparison,
  existingAlert,
  hasAlert,
  alertTriggered,
  deleteCar,
  updateListingStatus,
  toggleFavorite,
  toggleComparison,
  priceAlertMutation,
  deleteAlertMutation,
  setShowPriceAlert,
  setAlertPrice,
  setShowReportModal,
  setShowStickyHeader,
  setShowActionsMenu,
  setGalleryMessageLoading,
}: UseCarDetailActionsParams) {
  const { showAlert } = useAlert();
  const { t } = useTranslation();

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!car) return;
    try {
      const deepLink = `armauto://car/${car.id}`;
      const webUrl = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/car/${car.id}` : "";
      const shareUrl = webUrl || deepLink;
      await Share.share({
        message: `${getListingTitle(car)} — ${formatPrice(car.price, car.currency)}\n${car.mileage ? car.mileage.toLocaleString() + " " + t("carDetail.km") : ""}\n${shareUrl}`,
        title: getListingShortTitle(car),
        url: shareUrl,
      });
    } catch (e) { console.warn('Share failed:', e); }
  }, [car]);

  const handleDeleteListing = useCallback(() => {
    if (!car) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    showAlert(t("myListings.deleteListingTitle"), t("myListings.deleteListingMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"), style: "destructive",
        onPress: async () => {
          await deleteCar(car.id);
          if (router.canGoBack()) router.back(); else router.replace("/(tabs)");
        },
      },
    ], "warning");
  }, [car, deleteCar, showAlert, t]);

  const handleActivateListing = useCallback(async () => {
    if (!car) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await updateListingStatus(car.id, "active");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      showAlert(t("common.error"), t("myListings.updateStatusError"), undefined, "error");
    }
  }, [car, updateListingStatus, showAlert, t]);

  const handleFavorite = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (car) toggleFavorite(car.id);
  }, [car, toggleFavorite]);

  const handleCompare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!car) return;
    const added = await toggleComparison(car.id);
    if (!added && !inComparison) {
      showAlert(t("carDetail.comparisonLimit"), t("carDetail.comparisonLimitMessage"), [{ text: "OK" }]);
    }
  }, [car, toggleComparison, inComparison]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const threshold = 50;
    setShowStickyHeader(y > threshold);
  }, []);

  const handleMenuPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowActionsMenu(true);
  }, []);

  const handleGalleryMessage = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!car || !id) return;
    if (!isAuthenticated) {
      showAlert(t("carDetail.authRequired"), t("carDetail.loginToMessage"), [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("common.login"), onPress: () => router.push("/auth") },
      ]);
      return;
    }
    if (!seller?.id) {
      showAlert(t("common.error"), t("carDetail.sellerNotFound"), undefined, "error");
      return;
    }
    setGalleryMessageLoading(true);
    try {
      const res = await apiRequest("POST", API.conversations.list, {
        sellerId: seller.id,
        listingId: Number(id),
      });
      const conversation = await res.json();
      router.push(`/chat/${conversation.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("carDetail.chatStartError");
      if (message.includes("\u0441\u0430\u043C\u043E\u043C\u0443 \u0441\u0435\u0431\u0435")) {
        showAlert(t("common.error"), t("carDetail.cannotMessageSelf"), undefined, "error");
      } else {
        showAlert(t("common.error"), message, undefined, "error");
      }
    } finally {
      setGalleryMessageLoading(false);
    }
  }, [car, id, isAuthenticated, seller]);

  const handlePriceAlertOpen = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!car) return;
    if (hasAlert && existingAlert) {
      showAlert(
        alertTriggered ? t("carDetail.priceDropped") : t("carDetail.priceAlert"),
        alertTriggered
          ? `${t("carDetail.priceDropped")} ${formatPrice(car.price, car.currency)}! ${t("carDetail.priceReachedTarget")}: ${formatPrice(existingAlert.targetPrice, car.currency)}`
          : `${t("carDetail.priceAlertDescription")} ${formatPrice(existingAlert.targetPrice, car.currency)}`,
        [
          {
            text: t("common.edit"),
            onPress: () => {
              setAlertPrice(existingAlert.targetPrice.toString());
              setShowPriceAlert(true);
            },
          },
          {
            text: t("common.delete"),
            style: "destructive",
            onPress: () => {
              deleteAlertMutation.mutate(existingAlert.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ]
      );
    } else {
      setAlertPrice(Math.round(car.price * 0.9).toString());
      setShowPriceAlert(true);
    }
  }, [car, hasAlert, alertTriggered, existingAlert, deleteAlertMutation, showAlert, t]);

  const handleSetPriceAlert = useCallback(() => {
    if (!car) return;
    const price = parseInt(alertPrice);
    if (!price || price <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    priceAlertMutation.mutate({ listingId: Number(car.id), targetPrice: price });
    setShowPriceAlert(false);
  }, [car, alertPrice, priceAlertMutation]);

  const handleReportOpen = useCallback(() => {
    if (!isAuthenticated) {
      showAlert(t("carDetail.authRequiredTitle"), t("carDetail.loginToReport"));
      return;
    }
    setShowReportModal(true);
  }, [isAuthenticated, showAlert, t]);

  return {
    handleShare,
    handleDeleteListing,
    handleActivateListing,
    handleFavorite,
    handleCompare,
    handleScroll,
    handleMenuPress,
    handleGalleryMessage,
    handlePriceAlertOpen,
    handleSetPriceAlert,
    handleReportOpen,
  };
}

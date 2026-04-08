import { useState, useMemo, useCallback, useRef } from "react";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useAlert } from "@/contexts/AlertContext";
import { useTranslation } from "@/lib/i18n";
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { API } from "@/lib/api-endpoints";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/constants/colors";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { useCars } from "@/contexts/CarsContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice } from "@/lib/formatters";
import type { Car } from "@/types/car";
import type { ListingStatus } from "@shared/schema";

export function useMyListings() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const { showAlert } = useAlert();
  const { t } = useTranslation();
  const isDark = colorScheme === "dark";
  const { isAuthenticated, user: authUser } = useAuth();
  const { myListingCars, deleteCar, updateListingStatus } = useCars();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<ListingStatus>(
    params.tab && ["active", "moderation", "rejected", "sold", "archived", "frozen"].includes(params.tab)
      ? (params.tab as ListingStatus)
      : "active"
  );
  const [refreshing, setRefreshing] = useState(false);

  const totalViews = useMemo(() => myListingCars.reduce((sum, c) => sum + (c.views ?? 0), 0), [myListingCars]);
  const totalFavs = useMemo(() => myListingCars.reduce((sum, c) => sum + (c.favoritesCount ?? 0), 0), [myListingCars]);

  const { data: listingLimits } = useQuery<{ maxListings: number; currentCount: number; remaining: number; extraSlots: number; extraSlotPriceAmd: number; isProSeller: boolean }>({
    queryKey: [API.auth.listingLimits],
    enabled: isAuthenticated,
  });

  const walletQuery = useQuery<{ balance: number }>({
    queryKey: [API.wallet.balance],
    enabled: isAuthenticated,
  });

  const { data: bumpSettings } = useQuery<{ priceAmd: number; freeIntervalDays: number }>({
    queryKey: [API.bumpSettings],
    enabled: isAuthenticated,
  });
  const bumpIntervalDays = bumpSettings?.freeIntervalDays ?? 30;

  const purchaseSlotMutation = useMutation({
    mutationFn: () => apiRequest("POST", API.auth.purchaseListingSlot),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: [API.auth.listingLimits] });
      queryClient.invalidateQueries({ queryKey: [API.wallet.balance] });
      showAlert(t("myListings.slotPurchasedTitle"), t("myListings.slotPurchasedMsg"), undefined, "success");
    },
    onError: (err: any) => {
      if (err.code === "INSUFFICIENT_FUNDS" || err.message?.includes("INSUFFICIENT_FUNDS")) {
        showAlert(t("common.error"), t("myListings.insufficientFundsForSlot"), [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("myListings.topUpWallet"), onPress: () => router.push("/wallet") },
        ], "error");
      } else {
        showAlert(t("common.error"), t("myListings.slotPurchaseError"), undefined, "error");
      }
    },
  });

  const handleBuySlot = useCallback(() => {
    if (!listingLimits) return;
    const price = listingLimits.extraSlotPriceAmd;
    showAlert(
      t("myListings.buySlotTitle"),
      `${t("myListings.buySlotMsg")} ${formatPrice(price, "AMD")}`,
      [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("myListings.buySlotConfirm"), onPress: () => purchaseSlotMutation.mutate() },
      ]
    );
  }, [listingLimits, showAlert, t, purchaseSlotMutation]);

  const STATUS_TABS = useMemo(() => [
    { key: "active" as ListingStatus, label: t("myListings.tabActive") },
    { key: "moderation" as ListingStatus, label: t("myListings.tabModeration") },
    { key: "frozen" as ListingStatus, label: t("myListings.tabFrozen") },
    { key: "rejected" as ListingStatus, label: t("myListings.tabRejected") },
    { key: "sold" as ListingStatus, label: t("myListings.tabSold") },
    { key: "archived" as ListingStatus, label: t("myListings.tabArchived") },
  ], [t]);

  const filteredListings = useMemo(
    () => myListingCars.filter((car) => (car.status ?? "active") === activeTab),
    [myListingCars, activeTab],
  );

  const tabCounts: Record<string, number> = useMemo(() => ({
    active: myListingCars.filter((c) => (c.status ?? "active") === "active").length,
    moderation: myListingCars.filter((c) => c.status === "moderation").length,
    frozen: myListingCars.filter((c) => c.status === "frozen").length,
    rejected: myListingCars.filter((c) => c.status === "rejected").length,
    sold: myListingCars.filter((c) => c.status === "sold").length,
    archived: myListingCars.filter((c) => c.status === "archived").length,
  }), [myListingCars]);

  const tabLayouts = useRef<Record<string, { x: number; width: number }>>({});
  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);
  const indicatorStyle = useAnimatedStyle(() => ({
    left: indicatorX.value,
    width: indicatorW.value,
  }));
  const animateIndicator = useCallback((key: string) => {
    const layout = tabLayouts.current[key];
    if (layout) {
      indicatorX.value = withTiming(layout.x, { duration: 250 });
      indicatorW.value = withTiming(layout.width, { duration: 250 });
    }
  }, []);

  const handleCarPress = useCallback((carId: string) => {
    router.push(`/car/${carId}`);
  }, []);

  const handleStatusChange = useCallback((car: Car, newStatus: ListingStatus) => {
    const labels: Partial<Record<ListingStatus, string>> = {
      active: t("myListings.statusChangeActivate"),
      moderation: t("myListings.statusChangeModeration"),
      rejected: t("myListings.statusChangeReject"),
      sold: t("myListings.statusChangeSold"),
      archived: t("myListings.statusChangeArchive"),
    };
    const messages: Partial<Record<ListingStatus, string>> = {
      active: t("myListings.statusMsgActive"),
      moderation: t("myListings.statusMsgModeration"),
      rejected: t("myListings.statusMsgRejected"),
      sold: t("myListings.statusMsgSold"),
      archived: t("myListings.statusMsgArchived"),
    };

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showAlert(
      labels[newStatus] ?? "",
      messages[newStatus] ?? "",
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: labels[newStatus] ?? "",
          onPress: async () => {
            try {
              await updateListingStatus(car.id, newStatus);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
              showAlert(t("common.error"), t("myListings.updateStatusError"), undefined, "error");
            }
          },
        },
      ],
    );
  }, [updateListingStatus, t]);

  const handleDeleteCar = useCallback((carId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    showAlert(
      t("myListings.deleteListingTitle"),
      t("myListings.deleteListingMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => deleteCar(carId),
        },
      ],
    );
  }, [deleteCar, t]);

  const handleBumpCar = useCallback((carId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/bump", params: { listingId: String(carId) } });
  }, []);

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: [API.listings.my], refetchType: "all" });
    }, [queryClient]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: [API.listings.my] });
    setRefreshing(false);
  }, [queryClient]);

  const handleEditCar = useCallback((carId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/edit/${carId}`);
  }, []);

  return {
    colors,
    isDark,
    isAuthenticated,
    authUser,
    t,
    activeTab,
    setActiveTab,
    refreshing,
    totalViews,
    totalFavs,
    listingLimits,
    purchaseSlotMutation,
    handleBuySlot,
    STATUS_TABS,
    filteredListings,
    tabCounts,
    tabLayouts,
    indicatorStyle,
    animateIndicator,
    handleCarPress,
    handleStatusChange,
    handleDeleteCar,
    handleBumpCar,
    handleRefresh,
    handleEditCar,
    bumpIntervalDays,
  };
}

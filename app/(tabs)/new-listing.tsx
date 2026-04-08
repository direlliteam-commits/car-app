import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  Platform,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { useColors } from "@/constants/colors";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCars } from "@/contexts/CarsContext";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { EmptyState } from "@/components/EmptyState";
import { loadDrafts, loadServerDrafts, removeDraft, migrateLegacyDraft, type DraftEntry } from "@/lib/drafts";
import { formatPrice } from "@/lib/formatters";
import { useTranslation } from "@/lib/i18n";
import { WEB_TOP_INSET } from "@/constants/layout";
import { ScreenHeader } from "@/components/ScreenHeader";
import { getAvatarUri } from "@/lib/media";
import type { VehicleType, Car } from "@/types/car";
import type { ListingStatus } from "@shared/schema";
import { InlineListingCard } from "@/components/add/NewListingFormSections";
import { SummaryHeader, VehicleTypePicker, LoadingSkeleton } from "@/components/add/NewListingBottomBar";
import { API } from "@/lib/api-endpoints";

type BumpSettings = { priceAmd: number; freeIntervalDays: number; benefits: any[] };

export default function NewListingScreen() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { showAlert } = useAlert();
  const { myListingCars, deleteCar, updateListingStatus, isLoading: isListingsLoading } = useCars();
  const queryClient = useQueryClient();
  const webTopInset = WEB_TOP_INSET;

  const screenBg = isDark ? colors.background : colors.surface;
  const cardBg = isDark ? colors.surface : colors.background;

  const { data: listingLimits } = useQuery<{ maxListings: number; currentCount: number; remaining: number; extraSlotPriceAmd?: number }>({
    queryKey: [API.auth.listingLimits],
    enabled: isAuthenticated,
  });

  const { data: walletData } = useQuery<{ balance: number }>({
    queryKey: [API.wallet.balance],
    enabled: isAuthenticated,
  });
  const walletBalance = walletData?.balance ?? 0;

  const VEHICLE_OPTIONS = useMemo(() => ([
    { value: "passenger" as VehicleType, label: t("myListings.vehiclePassenger"), description: t("myListings.vehiclePassengerDesc") },
    { value: "truck" as VehicleType, label: t("myListings.vehicleTruck"), description: t("myListings.vehicleTruckDesc") },
    { value: "special" as VehicleType, label: t("myListings.vehicleSpecial"), description: t("myListings.vehicleSpecialDesc") },
    { value: "moto" as VehicleType, label: t("myListings.vehicleMoto"), description: t("myListings.vehicleMotoDesc") },
  ]), [t]);

  const VEHICLE_TYPE_LABELS: Record<string, string> = useMemo(() => ({
    passenger: t("myListings.vehicleTypePassenger"),
    truck: t("myListings.vehicleTypeTruck"),
    special: t("myListings.vehicleTypeSpecial"),
    moto: t("myListings.vehicleTypeMoto"),
  }), [t]);

  const { data: bumpSettings } = useQuery<BumpSettings>({
    queryKey: [API.bumpSettings],
    staleTime: 5 * 60 * 1000,
  });
  const bs: BumpSettings = bumpSettings ?? { priceAmd: 350, freeIntervalDays: 30, benefits: [] };

  const [drafts, setDrafts] = useState<DraftEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      migrateLegacyDraft().then(async () => {
        const localDrafts = await loadDrafts();
        const serverDrafts = await loadServerDrafts();
        const localServerIds = new Set(localDrafts.filter(d => d.serverId).map(d => d.serverId));
        const merged = [...localDrafts];
        for (const sd of serverDrafts) {
          if (!localServerIds.has(sd.serverId)) {
            merged.push(sd);
          }
        }
        merged.sort((a, b) => b.updatedAt - a.updatedAt);
        setDrafts(merged);
      });
      queryClient.invalidateQueries({ queryKey: [API.listings.my] });
    }, [])
  );

  useEffect(() => {
    if (drafts.length === 0 || myListingCars.length === 0) return;
    const toRemove: string[] = [];
    drafts.forEach((draft) => {
      if (!draft.serverId) return;
      const matched = myListingCars.some((car) => car.id === String(draft.serverId) && car.status !== "draft");
      if (matched) toRemove.push(draft.id);
    });
    if (toRemove.length > 0) {
      toRemove.forEach((id) => removeDraft(id));
      setDrafts((prev) => prev.filter((d) => !toRemove.includes(d.id)));
    }
  }, [drafts.length, myListingCars.length]);

  const limitReached = !!(listingLimits && listingLimits.remaining <= 0);

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
        showAlert(t("myListings.insufficientFundsForSlot"), undefined, [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("myListings.topUpWallet"), onPress: () => router.push("/wallet") },
        ], "warning");
      } else {
        showAlert(t("common.error"), t("myListings.slotPurchaseError"), undefined, "error");
      }
    },
  });

  const handleBuySlot = useCallback(() => {
    if (!listingLimits) return;
    const price = listingLimits.extraSlotPriceAmd ?? 0;
    showAlert(
      t("myListings.buySlotTitle"),
      `${t("myListings.buySlotMsg")} ${formatPrice(price, "AMD")}`,
      [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("myListings.buySlotConfirm"), onPress: () => purchaseSlotMutation.mutate() },
      ]
    );
  }, [listingLimits, showAlert, t, purchaseSlotMutation]);

  const handleAddListing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!user) { router.push("/auth"); return; }
    if (limitReached) return;
    setPickerVisible(true);
  };

  const handleSelectType = (type: VehicleType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPickerVisible(false);
    router.push({ pathname: "/add", params: { vehicleType: type } });
  };

  const handleOpenDraft = (draft: DraftEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!user) { router.push("/auth"); return; }
    const vt = draft.data.vehicleType || "passenger";
    router.push({ pathname: "/add", params: { vehicleType: vt, draftId: draft.id } });
  };

  const handleDeleteDraft = (draft: DraftEntry) => {
    showAlert(t("myListings.deleteDraftTitle"), t("myListings.deleteDraftMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"), style: "destructive",
        onPress: async () => {
          await removeDraft(draft.id);
          setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ], "warning");
  };

  const handleCarPress = useCallback((carId: string) => { router.push(`/car/${carId}`); }, []);
  const handleEditCar = useCallback((carId: string) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/edit/${carId}`); }, []);

  const handleStatusChange = useCallback((car: Car, newStatus: ListingStatus) => {
    const labels: Record<ListingStatus, string> = { active: t("myListings.statusChangeActivate"), moderation: t("myListings.statusChangeModeration"), rejected: t("myListings.statusChangeReject"), sold: t("myListings.statusChangeSold"), archived: t("myListings.statusChangeArchive"), draft: t("myListings.statusChangeDraft"), frozen: t("myListings.statusChangeFrozen"), deleted: t("myListings.statusChangeDeleted") };
    const messages: Record<ListingStatus, string> = { active: t("myListings.statusMsgActive"), moderation: t("myListings.statusMsgModeration"), rejected: t("myListings.statusMsgRejected"), sold: t("myListings.statusMsgSold"), archived: t("myListings.statusMsgArchived"), draft: t("myListings.statusMsgDraft"), frozen: t("myListings.statusMsgFrozen"), deleted: t("myListings.statusMsgDeleted") };
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showAlert(labels[newStatus], messages[newStatus], [
      { text: t("common.cancel"), style: "cancel" },
      { text: labels[newStatus], onPress: async () => {
        try { await updateListingStatus(car.id, newStatus); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
        catch { showAlert(t("common.error"), t("myListings.updateStatusError"), undefined, "error"); }
      }},
    ], "confirm");
  }, [updateListingStatus]);

  const handleDeleteCar = useCallback((carId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    showAlert(t("myListings.deleteListingTitle"), t("myListings.deleteListingMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: () => deleteCar(carId) },
    ], "warning");
  }, [deleteCar]);

  const handleBumpCar = useCallback((carId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/bump", params: { listingId: String(carId) } });
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [API.listings.my] }),
      (async () => {
        const localDrafts = await loadDrafts();
        const serverDrafts = await loadServerDrafts();
        const localServerIds = new Set(localDrafts.filter(d => d.serverId).map(d => d.serverId));
        const merged = [...localDrafts];
        for (const sd of serverDrafts) {
          if (!localServerIds.has(sd.serverId)) {
            merged.push(sd);
          }
        }
        merged.sort((a, b) => b.updatedAt - a.updatedAt);
        setDrafts(merged);
      })(),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const bottomPadding = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const avatarUri = useMemo(() => {
    if (!user) return null;
    const isD = user.role === "dealer";
    const raw = isD ? (user.companyLogoUrl || user.avatarUrl) : user.avatarUrl;
    return raw ? getAvatarUri(raw) : null;
  }, [user]);
  const displayName = useMemo(() => {
    if (!user) return "";
    return user.role === "dealer" ? (user.companyName || user.name || user.username || "") : (user.name || user.username || "");
  }, [user]);

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: screenBg }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ScreenHeader title={t("myListings.placeTitle")} hideBack backgroundColor={cardBg} />
        <View style={styles.center}>
          <EmptyState
            image={require("@/assets/images/empty-login.png")}
            title={t("myListings.loginRequired")}
            subtitle={t("myListings.loginRequiredSubtitle")}
            actionLabel={t("myListings.loginAction")}
            onAction={() => router.push("/auth")}
          />
        </View>
      </View>
    );
  }

  if (isListingsLoading) {
    return (
      <View style={[styles.container, { backgroundColor: screenBg }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={{ paddingTop: insets.top + webTopInset, backgroundColor: cardBg }} />
        <LoadingSkeleton colors={colors} isDark={isDark} cardBg={cardBg} />
      </View>
    );
  }

  const visibleListingCars = myListingCars.filter((c) => c.status !== "sold" && c.status !== "deleted");

  if (visibleListingCars.length === 0 && drafts.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: screenBg }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={{ paddingTop: insets.top + webTopInset, backgroundColor: cardBg }} />
        <EmptyState
          image={require("@/assets/images/empty-add-car.png")}
          title={t("myListings.noListingsYet")}
          subtitle={t("myListings.noListingsYetSubtitle")}
          actionLabel={t("myListings.submitListing")}
          onAction={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPickerVisible(true); }}
        />
        <VehicleTypePicker
          visible={pickerVisible}
          onClose={() => setPickerVisible(false)}
          options={VEHICLE_OPTIONS}
          onSelect={handleSelectType}
          colors={colors}
          isDark={isDark}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScreenHeader title={t("myListings.placeTitle")} hideBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.textSecondary} />}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding + 64 }]}
      >
        <SummaryHeader
          colors={colors}
          isDark={isDark}
          cardBg={cardBg}
          avatarUri={avatarUri}
          displayName={displayName}
          userPhone={user?.phone ?? undefined}
          walletBalance={walletBalance}
          limitReached={limitReached}
          listingLimits={listingLimits}
          drafts={drafts}
          vehicleTypeLabels={VEHICLE_TYPE_LABELS}
          purchaseSlotPending={purchaseSlotMutation.isPending}
          handleBuySlot={handleBuySlot}
          handleAddListing={handleAddListing}
          handleOpenDraft={handleOpenDraft}
          handleDeleteDraft={handleDeleteDraft}
        />

        {visibleListingCars
          .sort((a, b) => {
            const ORDER: Record<string, number> = { rejected: 0, moderation: 1, frozen: 2, active: 3, archived: 4 };
            return (ORDER[a.status ?? "active"] ?? 3) - (ORDER[b.status ?? "active"] ?? 3);
          })
          .map((item) => (
          <InlineListingCard
            key={item.id}
            car={item}
            colors={colors}
            isDark={isDark}
            onPress={() => handleCarPress(item.id)}
            onEdit={() => handleEditCar(item.id)}
            onPromote={() => router.push({ pathname: "/promote", params: { listingId: String(item.id) } })}
            onStatusChange={(st) => handleStatusChange(item, st)}
            onDelete={() => handleDeleteCar(item.id)}
            onBump={() => handleBumpCar(item.id)}
            bumpIntervalDays={bs.freeIntervalDays}
          />
        ))}
      </ScrollView>

      <VehicleTypePicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        options={VEHICLE_OPTIONS}
        onSelect={handleSelectType}
        colors={colors}
        isDark={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: -40, paddingHorizontal: 32 },
  listContent: { paddingHorizontal: 0, paddingTop: 0 },
});

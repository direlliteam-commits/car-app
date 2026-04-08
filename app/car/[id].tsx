import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";
import { useColors } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { WEB_TOP_INSET } from "@/constants/layout";
import { CarDetailSkeleton } from "@/components/SkeletonCard";
import { PriceAlertModal } from "@/components/car-detail/PriceAlertModal";
import { ReportModal } from "@/components/car-detail/ReportModal";
import { FooterCTA } from "@/components/car-detail/FooterCTA";
import { SpecsDetailModal } from "@/components/car-detail/SpecsDetailModal";
import { PriceAnalysisModal } from "@/components/car-detail/PriceAnalysisModal";
import { StickyDetailHeader } from "@/components/car-detail/StickyDetailHeader";
import { ActionsMenu } from "@/components/car-detail/ActionsMenu";
import { CarDetailContent } from "@/components/car-detail/CarDetailContent";
import { useCarDetail } from "@/hooks/useCarDetail";
import { useCarDetailActions } from "@/hooks/useCarDetailActions";
import { useTranslation } from "@/lib/i18n";
import { CarDetailProvider } from "@/contexts/CarDetailContext";

export default function CarDetailScreen() {
  const { t, language } = useTranslation();
  const insets = useSafeAreaInsets();
  const detail = useCarDetail();
  const {
    id,
    isDark,
    colors,
    detailColors,
    displayCurrency,
    car,
    seller,
    listingDetailQuery,
    specsQuery,
    marketPriceQuery,
    marketPriceInfo,
    similarQuery,
    priceAlertMutation,
    deleteAlertMutation,
    existingAlert,
    hasAlert,
    alertTriggered,
    fieldVis,
    equipmentCount,
    isOwnListing,
    listingStatus,
    isActive,
    isInactive,
    isFavorite,
    inComparison,
    isAuthenticated,
    effectiveTradeInBonus,
    effectiveTradeInMaxAge,
    descriptionTruncated,
    descriptionNeedsExpand,
    exchangeRates,
    activeImageIndex, setActiveImageIndex,
    selectedModIndex, setSelectedModIndex,
    showAllMods, setShowAllMods,
    showPriceAlert, setShowPriceAlert,
    alertPrice, setAlertPrice,
    showReportModal, setShowReportModal,
    expandDescription, setExpandDescription,
    expandedDeals, setExpandedDeals,
    showSpecsDetail, setShowSpecsDetail,
    showActionsMenu, setShowActionsMenu,
    showStickyHeader, setShowStickyHeader,
    showAltPrices, setShowAltPrices,
    showPriceAnalysis, setShowPriceAnalysis,
    galleryMessageLoading, setGalleryMessageLoading,
    setDescriptionNeedsExpand,
    scrollRef,
    creditCardY,
    contentWrapY,
    deleteCar,
    updateListingStatus,
    toggleFavorite,
    toggleComparison,
  } = detail;

  const actions = useCarDetailActions({
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
  });

  const carDetailValue = useMemo(() => ({
    id, car, seller, colors, detailColors, isDark, displayCurrency, language,
    fieldVis, equipmentCount, isOwnListing, isActive, isInactive, listingStatus,
    isFavorite, hasAlert, alertTriggered, existingAlert, marketPriceInfo,
    marketPriceQuery, similarQuery, specsQuery, exchangeRates,
    effectiveTradeInBonus, effectiveTradeInMaxAge, descriptionTruncated,
    descriptionNeedsExpand, showAltPrices, expandDescription, expandedDeals,
    activeImageIndex, selectedModIndex, showAllMods, galleryMessageLoading,
    scrollRef, creditCardY, contentWrapY,
    setActiveImageIndex, setSelectedModIndex, setShowAllMods, setShowAltPrices,
    setExpandDescription, setExpandedDeals, setDescriptionNeedsExpand,
    setShowPriceAnalysis,
    onScroll: actions.handleScroll,
    onFavorite: actions.handleFavorite,
    onMenuPress: actions.handleMenuPress,
    onGalleryMessage: actions.handleGalleryMessage,
    onPriceAlertOpen: actions.handlePriceAlertOpen,
  }), [
    id, car, seller, colors, detailColors, isDark, displayCurrency, language,
    fieldVis, equipmentCount, isOwnListing, isActive, isInactive, listingStatus,
    isFavorite, hasAlert, alertTriggered, existingAlert, marketPriceInfo,
    marketPriceQuery, similarQuery, specsQuery, exchangeRates,
    effectiveTradeInBonus, effectiveTradeInMaxAge, descriptionTruncated,
    descriptionNeedsExpand, showAltPrices, expandDescription, expandedDeals,
    activeImageIndex, selectedModIndex, showAllMods, galleryMessageLoading,
    scrollRef, creditCardY, contentWrapY,
    setActiveImageIndex, setSelectedModIndex, setShowAllMods, setShowAltPrices,
    setExpandDescription, setExpandedDeals, setDescriptionNeedsExpand,
    setShowPriceAnalysis,
    actions.handleScroll, actions.handleFavorite, actions.handleMenuPress,
    actions.handleGalleryMessage, actions.handlePriceAlertOpen,
  ]);

  if (!car) {
    if (listingDetailQuery.isLoading) {
      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <CarDetailSkeleton />
        </View>
      );
    }
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.errorContainer, { paddingTop: insets.top + WEB_TOP_INSET }]}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.errorText, { color: colors.text }]}>{t("carDetail.listingNotFound")}</Text>
          <Pressable
            onPress={() => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)"); }}
            style={({ pressed }) => [styles.retryButton, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.retryButtonText}>{t("carDetail.goBack")}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: detailColors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <CarDetailProvider value={carDetailValue}>
        <CarDetailContent />
      </CarDetailProvider>

      <StickyDetailHeader
        car={car}
        showStickyHeader={showStickyHeader}
        isFavorite={isFavorite}
        hasAlert={hasAlert}
        onBack={() => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)"); }}
        onFavorite={isOwnListing ? undefined : actions.handleFavorite}
        onPriceAlert={isOwnListing ? undefined : actions.handlePriceAlertOpen}
        onMenuPress={actions.handleMenuPress}
        colors={detailColors}
        insets={insets}
        listingStatus={listingStatus}
      />

      <ActionsMenu
        visible={showActionsMenu}
        onDismiss={() => setShowActionsMenu(false)}
        onShare={actions.handleShare}
        onFavorite={isOwnListing ? undefined : actions.handleFavorite}
        onCompare={actions.handleCompare}
        onPriceAlert={isOwnListing ? undefined : actions.handlePriceAlertOpen}
        onReport={isOwnListing ? undefined : actions.handleReportOpen}
        onDelete={isOwnListing ? actions.handleDeleteListing : undefined}
        onActivate={isOwnListing ? actions.handleActivateListing : undefined}
        isFavorite={isFavorite}
        inComparison={inComparison}
        hasAlert={hasAlert}
        colors={detailColors}
        insets={insets}
        listingStatus={listingStatus}
        isOwner={isOwnListing}
      />

      <FooterCTA
        car={car}
        isAuthenticated={isAuthenticated}
        colors={detailColors}
        insets={insets}
        sellerId={seller?.id != null ? String(seller.id) : undefined}
        listingId={id}
        isOwnListing={isOwnListing}
        listingStatus={listingStatus}
        branchInfo={seller?.branchInfo as React.ComponentProps<typeof FooterCTA>["branchInfo"]}
      />

      <PriceAlertModal
        visible={showPriceAlert}
        onClose={() => setShowPriceAlert(false)}
        onConfirm={actions.handleSetPriceAlert}
        alertPrice={alertPrice}
        onAlertPriceChange={setAlertPrice}
        currentPrice={car.price}
        currency={car.currency}
      />

      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        listingId={car.id}
        colors={detailColors}
      />

      <SpecsDetailModal
        visible={showSpecsDetail}
        onClose={() => setShowSpecsDetail(false)}
        car={car}
      />

      {marketPriceInfo && marketPriceQuery.data && !marketPriceQuery.data.insufficient && (
        <PriceAnalysisModal
          visible={showPriceAnalysis}
          onClose={() => setShowPriceAnalysis(false)}
          price={car.price}
          currency={car.currency}
          marketData={marketPriceQuery.data}
          badgeLabel={marketPriceInfo.label}
          evalColor={marketPriceInfo.evalColor}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  errorText: {
    fontSize: 15,
    fontWeight: "500" as const,
    textAlign: "center" as const,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 4,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#fff",
  },
});

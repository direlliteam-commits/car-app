import React from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from "react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { EmptyState } from "@/components/EmptyState";
import { CARD_GAP } from "@/constants/layout";
import { useMyListings } from "@/hooks/useMyListings";
import { CompactListingCard } from "@/components/listings/MyListingCard";
import { MyListingsHeader } from "@/components/listings/MyListingsFilters";

export default function MyListingsScreen() {
  const insets = useSafeAreaInsets();
  const {
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
  } = useMyListings();

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ScreenHeader title={t("myListings.title")} backgroundColor={isDark ? colors.surface : colors.background} />
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

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScreenHeader title={t("myListings.title")} backgroundColor={isDark ? colors.surface : colors.background} />

      <FlatList
        data={filteredListings}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accentBlue}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          filteredListings.length === 0 && styles.emptyList,
          { paddingBottom: insets.bottom + 20 },
        ]}
        
        ListHeaderComponent={
          <MyListingsHeader
            colors={colors}
            isDark={isDark}
            tabCounts={tabCounts}
            totalViews={totalViews}
            totalFavs={totalFavs}
            listingLimits={listingLimits}
            purchaseSlotMutation={purchaseSlotMutation}
            handleBuySlot={handleBuySlot}
            STATUS_TABS={STATUS_TABS}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tabLayouts={tabLayouts}
            indicatorStyle={indicatorStyle}
            animateIndicator={animateIndicator}
            filteredListings={filteredListings}
            authUser={authUser}
            t={t}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: CARD_GAP }} />}
        renderItem={({ item, index }) => (
          <CompactListingCard
            car={item}
            colors={colors}
            isDark={isDark}
            isFirst={index === 0}
            onPress={() => handleCarPress(item.id)}
            onEdit={() => handleEditCar(item.id)}
            onPromote={() => router.push({ pathname: "/promote", params: { listingId: String(item.id) } })}
            onStatusChange={(s) => handleStatusChange(item, s)}
            onDelete={() => handleDeleteCar(item.id)}
            onBump={() => handleBumpCar(item.id)}
            bumpIntervalDays={bumpIntervalDays}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            image={require("@/assets/images/empty-listings.png")}
            title={t(`myListings.empty${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}Title`)}
            subtitle={t(`myListings.empty${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}Subtitle`)}
            actionLabel={activeTab === "active" ? t("myListings.createListing") : undefined}
            onAction={activeTab === "active" ? () => router.push("/add") : undefined}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -40,
    paddingHorizontal: 32,
  },
  listContent: { paddingHorizontal: 0, paddingTop: 0 },
  emptyList: { flexGrow: 1 },
});

import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Platform,
  RefreshControl,
  Pressable,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { AppIcons as I } from "@/constants/icons";
import * as Haptics from "expo-haptics";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import { EmptyState } from "@/components/EmptyState";
import { CatalogSkeleton } from "@/components/SkeletonCard";
import { SortModal } from "@/components/SortModal";
import { StoryViewer } from "@/components/Stories";
import { ScreenHeader } from "@/components/ScreenHeader";
import { getAvatarUri, resolveMediaUri } from "@/lib/media";
import { useHomeData, DisplayRow } from "@/hooks/useHomeData";
import { HomeHeroSection } from "@/components/home/HomeHeroSection";
import {
  HomeGridRow,
  HomeCellRenderer,
  HomeListFooter,
  HomeComparisonBar,
} from "@/components/home/HomeListingsSection";

export default function CatalogScreen() {
  const data = useHomeData();
  const {
    colors, isDark, t,
    setFilters, setSearchQuery, activeFiltersCount,
    recentlyViewedCars, viewedCarIds,
    toggleFavorite,
    comparisonList, comparisonCars, clearComparison,
    user, isAuthenticated,
    brandLogoMap,
    storiesManager,
    recommendations,
    catalogSections, isSectionsLoading,
    catalogSort, sortModal,
    catalogCars, totalCount, hasMore, isLoadingMore, isLoading, isFetching,
    loadMore, refreshing, onRefresh,
    promotedItems, displayData,
    handleCarPress, handleFilterPress, handleScroll,
    getResultsWord, currentSortLabel,
    tabBarBottom, screenBg, headerBg,
    chipsScrollStart, setChipsScrollStart, chipsScrollEnd, setChipsScrollEnd,
    filterBlockEndY, toolbarEndY, whiteZoneOffsetY,
    listRef,
  } = data;

  const renderItem = useCallback(({ item, index }: { item: DisplayRow; index: number }) => {
    return (
      <HomeGridRow
        item={item}
        index={index}
        totalCount={displayData.length}
        handleCarPress={handleCarPress}
        toggleFavorite={toggleFavorite}
        viewedCarIds={viewedCarIds}
        promotedItems={promotedItems}
        isDark={isDark}
        colors={colors}
        t={t}
        setFilters={setFilters}
        setSearchQuery={setSearchQuery}
      />
    );
  }, [displayData.length, handleCarPress, toggleFavorite, viewedCarIds, promotedItems, isDark, colors, t, setFilters, setSearchQuery]);

  const CellRenderer = useCallback((props: any) => {
    const { children, index, style, ...rest } = props;
    return (
      <HomeCellRenderer
        index={index}
        style={style}
        isDark={isDark}
        colors={colors}
        totalItems={displayData.length}
        {...rest}
      >
        {children}
      </HomeCellRenderer>
    );
  }, [isDark, colors, displayData.length]);

  const listFooter = useMemo(() => (
    <HomeListFooter
      isLoadingMore={isLoadingMore}
      hasMore={hasMore}
      catalogCarsCount={catalogCars.length}
      totalCount={totalCount}
      colors={colors}
      t={t}
    />
  ), [isLoadingMore, hasMore, catalogCars.length, totalCount, colors, t]);

  const headerElement = (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(isAuthenticated ? "/profile" : "/auth"); }}
      style={({ pressed }) => [styles.headerProfileRow, { opacity: pressed ? 0.6 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={t("catalog.accessProfile")}
    >
      {user?.role === "dealer" && user?.companyLogoUrl ? (
        <ExpoImage source={{ uri: resolveMediaUri(user.companyLogoUrl)! }} style={styles.headerAvatar} contentFit="cover" />
      ) : user?.avatarUrl ? (
        <ExpoImage source={{ uri: getAvatarUri(user.avatarUrl)! }} style={styles.headerAvatar} contentFit="cover" />
      ) : (
        <ExpoImage source={require("@/assets/images/default-avatar.png")} style={styles.headerAvatar} contentFit="cover" />
      )}
      <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>
        {user?.role === "dealer" && user?.companyName ? user.companyName : user?.name || user?.username || ""}
      </Text>
    </Pressable>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: screenBg }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ScreenHeader
          hideBack
          backgroundColor={headerBg}
          titleElement={headerElement}
          rightActions={[{ icon: I.search as any, onPress: handleFilterPress }]}
        />
        <ScrollView showsVerticalScrollIndicator={false}>
          <CatalogSkeleton viewMode="grid" />
        </ScrollView>
      </View>
    );
  }

  const headerContent = (
    <HomeHeroSection
      colors={colors}
      isDark={isDark}
      t={t}
      setFilters={setFilters}
      setSearchQuery={setSearchQuery}
      totalCount={totalCount}
      getResultsWord={getResultsWord}
      chipsScroll={{ start: chipsScrollStart, setStart: setChipsScrollStart, end: chipsScrollEnd, setEnd: setChipsScrollEnd }}
      catalog={{ isSectionsLoading, sections: catalogSections, promotedItems, recentlyViewedCars, recommendations, brandLogoMap }}
      layoutRefs={{ filterBlockEndY, whiteZoneOffsetY, toolbarEndY }}
      sort={{ modal: sortModal, label: currentSortLabel }}
      storiesData={{ items: storiesManager.stories, isLoading: storiesManager.isLoading, viewedIds: storiesManager.viewedIds, openStory: storiesManager.openStory }}
    />
  );

  const emptyComponent = (
    <EmptyState image={require("@/assets/images/empty-catalog.png")} title={t("catalog.noListings")} subtitle={t("catalog.noListingsSubtitle")} />
  );

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScreenHeader
        hideBack
        backgroundColor={headerBg}
        titleElement={headerElement}
        rightActions={[{ icon: I.search as any, onPress: handleFilterPress, badge: activeFiltersCount }]}
      />

      <FlatList
        ref={listRef}
        data={displayData}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        CellRendererComponent={CellRenderer}
        extraData={viewedCarIds}
        style={{ backgroundColor: "transparent" }}
        contentContainerStyle={[
          styles.gridContent,
          { paddingBottom: tabBarBottom + 16 },
          catalogCars.length === 0 && styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={64}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={headerContent}
        ListEmptyComponent={isFetching ? null : emptyComponent}
        ListFooterComponent={listFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews={true}
        initialNumToRender={6}
        updateCellsBatchingPeriod={50}
      />

      <HomeComparisonBar
        comparisonList={comparisonList}
        comparisonCars={comparisonCars}
        clearComparison={clearComparison}
        isDark={isDark}
        colors={colors}
        t={t}
        tabBarBottom={tabBarBottom}
      />

      <SortModal
        visible={sortModal.visible}
        currentSort={catalogSort}
        onSelect={sortModal.handleSelect}
        onClose={sortModal.close}
        progress={sortModal.progress}
      />

      <StoryViewer
        stories={storiesManager.stories}
        initialIndex={storiesManager.viewerIndex}
        visible={storiesManager.viewerVisible}
        onClose={storiesManager.closeViewer}
        onViewed={storiesManager.handleViewed}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerProfileRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 10,
  },
  headerName: {
    fontSize: 15,
    fontWeight: "600" as const,
    maxWidth: 160,
  },
  gridContent: {
  },
  emptyList: {
    flex: 1,
  },
});

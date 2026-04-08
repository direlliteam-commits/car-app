import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  RefreshControl,
  Pressable,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { CarCard } from "@/components/CarCard";
import { EmptyState } from "@/components/EmptyState";
import { FilterPillsBar } from "@/components/filters/FilterPillsBar";
import { SkeletonList, SkeletonGrid } from "@/components/SkeletonCard";
import { useSearchState } from "@/hooks/useSearchState";
import type { DisplayRow } from "@/hooks/useSearchState";
import { ListRowItem, GridRowItem } from "@/components/search/SearchResultItems";
import { SearchHeader } from "@/components/search/SearchHeader";
import { SearchToolbar } from "@/components/search/SearchToolbar";
import { SearchPickerModals } from "@/components/search/SearchPickerModals";
import { CARD_GAP, SCREEN_PADDING_H } from "@/constants/layout";

export default function SearchResultsScreen() {
  const state = useSearchState();
  const {
    colors, isDark, insets, t,
    filteredCars, filters, setFilters, sortOption, totalCount, loadMore, hasMore, isLoadingMore,
    isLoading, isFetching, refreshing, viewMode,
    activePicker, setActivePicker, pillDraftOverrides, setPillDraftOverrides,
    pillResultCount, pillIsLoading, pillApplySubLabel, searchApplySubLabel,
    tabBarBottom, webTopInset,
    conditionTabs, activeConditionTab, tabIndicatorStyle, onTabsLayout,
    vehicleSelections, nonVehicleNonConditionPills, hideMileagePill, priceRange,
    handleBack, handleEditFilters, updateFilter, openPicker, handleRemoveFilter,
    openModelPickerForReviews, openBrandPicker, openBodyTypePicker,
    handleRemoveBodyType, handleVehicleCardPress, handleRemoveVehicle, handleConditionTab,
    sortModal, toggleViewMode, onRefresh, getCountWord,
    sectionDataCars, isSectionMode, isSectionLoading,
    displayData, viewedCarIds,
    handleCarPressRef, toggleFavoriteRef, viewedCarIdsRef,
    mappedPromotedItems, specialOffersCardWidth,
    handleListScroll, handleResetFilters, sectionTitle,
    listRef, pillsSticky, pillsOffsetRef,
    isNonPassengerType, bodyTypeOptionsForVehicle,
    pickerField, setPickerField, pickerBrandId, setPickerBrandId,
    pickerModelId, setPickerModelId, brandSearch, setBrandSearch,
    modelSearch, setModelSearch, brandCategory, setBrandCategory,
    editingVehicleIndex, setEditingVehicleIndex,
    cascadeInitialStep, cascadeFilterParams,
    filteredBrandsData, filteredModels, pickerGenerations,
    brandsLoading, modelsLoading, generationsLoading,
    closeCascade, reviewsPickerModeRef, expandedRegions, setExpandedRegions,
  } = state;

  const renderSpecialOffersContent = useCallback(() => {
    if (mappedPromotedItems.length === 0) return null;
    return (
      <View style={[searchStyles.specialOffersBlock, { backgroundColor: isDark ? colors.background : colors.surface }]}>
        <View style={searchStyles.specialOffersHeader}>
          <Text style={[searchStyles.specialOffersTitle, { color: colors.text }]}>{t("shared.specialOffers")}</Text>
          <Pressable onPress={() => { setFilters({ promotedOnly: true }); }} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Text style={{ fontSize: 14, color: colors.primary }}>{t("shared.seeAll")} &gt;</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8, gap: CARD_GAP }}>
          {mappedPromotedItems.map((mapped: any) => (
            <View key={mapped.id} style={{ width: specialOffersCardWidth }}>
              <CarCard car={mapped} onPress={() => handleCarPressRef.current(mapped.id)} onFavoritePress={() => toggleFavoriteRef.current(mapped.id)} variant="grid" isViewed={false} />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }, [mappedPromotedItems, colors, isDark, specialOffersCardWidth]);

  const CellRenderer = useCallback((props: any) => {
    const { children, index, style, ...rest } = props;
    if (viewMode === "list") return <View style={style} {...rest}>{children}</View>;
    const isFirst = index === 0;
    const isLast = index === displayData.length - 1;
    const cardBg = isDark ? colors.surface : colors.background;
    return (
      <View
        style={[
          style,
          { backgroundColor: cardBg },
          isFirst && { borderTopLeftRadius: 20, borderTopRightRadius: 20 },
          isLast && { borderBottomLeftRadius: 20, borderBottomRightRadius: 20, overflow: "hidden" },
        ]}
        {...rest}
      >
        {children}
      </View>
    );
  }, [isDark, viewMode, colors.surface, colors.background, displayData.length]);

  const renderItem = useCallback(({ item, index }: { item: DisplayRow; index: number }) => {
    const viewed = viewedCarIdsRef.current;
    if (item.type === "special-offers") {
      return (
        <View style={{ paddingTop: 0, paddingBottom: 32 }}>
          {renderSpecialOffersContent()}
        </View>
      );
    }
    if (item.type === "list") {
      return (
        <ListRowItem car={item.car} onPress={handleCarPressRef} onFavoritePress={toggleFavoriteRef} isViewed={viewed.has(item.car.id)} />
      );
    }
    const isFirstRow = index === 0;
    return (
      <View style={[
        { paddingHorizontal: 4, paddingBottom: 18 },
        isFirstRow && { paddingTop: 12 },
        index === displayData.length - 1 && { paddingBottom: 12 },
      ]}>
        <GridRowItem cars={item.cars} onPress={handleCarPressRef} onFavoritePress={toggleFavoriteRef} viewedIds={viewed} />
      </View>
    );
  }, [viewedCarIds, renderSpecialOffersContent, isDark, colors, displayData]);

  const listFooter = useMemo(() => {
    if (isLoadingMore) {
      return (
        <View style={styles.loadingFooter}>
          {viewMode === "grid" ? <SkeletonGrid count={2} /> : <SkeletonList count={2} />}
        </View>
      );
    }
    if (!hasMore && filteredCars.length > 0) {
      return (
        <View style={[styles.loadingFooter, { alignItems: "center" }]}>
          <Text style={[styles.loadingFooterText, { color: colors.textTertiary }]}>
            {t("catalog.shown")} {filteredCars.length} {t("catalog.of")} {totalCount}
          </Text>
        </View>
      );
    }
    return null;
  }, [isLoadingMore, hasMore, filteredCars.length, totalCount, colors.textTertiary, viewMode]);

  const headerContent = (
    <SearchHeader
      colors={colors}
      isDark={isDark}
      conditionTabs={conditionTabs}
      activeConditionTab={activeConditionTab}
      onConditionTab={handleConditionTab}
      onTabsLayout={onTabsLayout}
      tabIndicatorStyle={tabIndicatorStyle}
      vehicleSelections={vehicleSelections}
      filters={filters}
      nonVehicleNonConditionPills={nonVehicleNonConditionPills}
      hideMileagePill={hideMileagePill}
      onOpenBrandPicker={openBrandPicker}
      onOpenBodyTypePicker={openBodyTypePicker}
      onVehicleCardPress={handleVehicleCardPress}
      onRemoveVehicle={handleRemoveVehicle}
      onRemoveBodyType={handleRemoveBodyType}
      onEditFilters={handleEditFilters}
      onOpenPicker={openPicker}
      onRemoveFilter={handleRemoveFilter}
      onPillsLayout={(e) => { pillsOffsetRef.current = e.nativeEvent.layout.y + e.nativeEvent.layout.height; }}
      onOpenModelPickerForReviews={openModelPickerForReviews}
    />
  );

  const emptyComponent = (
    <View style={styles.emptyCenter}>
      <EmptyState
        image={require("@/assets/images/empty-searches.png")}
        title={t("catalog.noResults")}
        subtitle={t("catalog.noResultsSubtitleWithReset")}
        actionLabel={t("catalog.clearFilters")}
        onAction={handleResetFilters}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <SearchToolbar
        colors={colors}
        isDark={isDark}
        insetTop={insets.top}
        webTopInset={webTopInset}
        isSectionMode={isSectionMode}
        sectionTitle={sectionTitle}
        sectionCount={sectionDataCars?.length ?? 0}
        totalCount={totalCount}
        priceRange={priceRange}
        getCountWord={getCountWord}
        viewMode={viewMode}
        sortOption={sortOption}
        onBack={handleBack}
        onSortOpen={sortModal.open}
        onToggleViewMode={toggleViewMode}
        t={t}
      />

      <FlatList
        ref={listRef}
        data={isSectionMode ? ((isSectionLoading) ? [] : displayData) : ((isLoading || isFetching) ? [] : displayData)}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        CellRendererComponent={CellRenderer}
        extraData={viewedCarIds}
        style={{ backgroundColor: "transparent" }}
        contentContainerStyle={[
          viewMode === "list" ? styles.listContent : styles.gridContent,
          { paddingBottom: tabBarBottom + 16 },
          (isSectionMode ? (sectionDataCars?.length === 0) : (filteredCars.length === 0 || isLoading || isFetching)) && styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={headerContent}
        ListEmptyComponent={
          isSectionMode
            ? (isSectionLoading ? (
                <View style={styles.loadingFooter}>
                  {viewMode === "grid" ? <SkeletonGrid count={6} /> : <SkeletonList count={4} />}
                </View>
              ) : emptyComponent)
            : ((isLoading || isFetching) ? (
                <View style={styles.loadingFooter}>
                  {viewMode === "grid" ? <SkeletonGrid count={6} /> : <SkeletonList count={4} />}
                </View>
              ) : emptyComponent)
        }
        ListFooterComponent={isSectionMode ? null : listFooter}
        onEndReached={isSectionMode ? undefined : loadMore}
        onEndReachedThreshold={0.5}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews={true}
        initialNumToRender={6}
        updateCellsBatchingPeriod={80}
        onScroll={handleListScroll}
        scrollEventThrottle={100}
      />

      {pillsSticky && (
        <View style={[styles.stickyPills, { bottom: tabBarBottom }]}>
          <FilterPillsBar
            pills={nonVehicleNonConditionPills}
            filters={{...filters}}
            variant="sticky"
            colors={colors}
            isDark={isDark}
            hideMileage={hideMileagePill}
            onEditFilters={handleEditFilters}
            onOpenPicker={openPicker}
            onRemoveFilter={handleRemoveFilter}
          />
        </View>
      )}

      <SearchPickerModals
        colors={colors}
        isDark={isDark}
        filterState={{ filters, setFilters, updateFilter, expandedRegions, setExpandedRegions }}
        activePicker={activePicker}
        setActivePicker={setActivePicker}
        pillState={{ pillDraftOverrides, setPillDraftOverrides, pillResultCount, pillIsLoading, pillApplySubLabel, searchApplySubLabel }}
        filteredCars={filteredCars}
        isFetching={isFetching}
        isNonPassengerType={isNonPassengerType}
        bodyTypeOptionsForVehicle={bodyTypeOptionsForVehicle}
        sort={{ modal: sortModal, option: sortOption }}
        cascade={{
          pickerField, setPickerField, pickerBrandId, setPickerBrandId, pickerModelId, setPickerModelId,
          brandSearch, setBrandSearch, modelSearch, setModelSearch, brandCategory, setBrandCategory,
          editingVehicleIndex, setEditingVehicleIndex, cascadeInitialStep, cascadeFilterParams,
          filteredBrandsData, filteredModels, pickerGenerations,
          brandsLoading, modelsLoading, generationsLoading,
          closeCascade, reviewsPickerModeRef, vehicleSelections,
        }}
        t={t}
      />
    </View>
  );
}

const searchStyles = StyleSheet.create({
  specialOffersBlock: {
    paddingVertical: 16,
    borderRadius: 16,
    overflow: "hidden" as const,
  },
  specialOffersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SCREEN_PADDING_H,
    marginBottom: 12,
  },
  specialOffersTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stickyPills: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 10,
  },
  listContent: {
  },
  gridContent: {
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyCenter: {
    paddingTop: 40,
    alignItems: "center",
  },
  loadingFooter: {
    paddingTop: 8,
  },
  loadingFooterText: {
    fontSize: 13,
  },
});

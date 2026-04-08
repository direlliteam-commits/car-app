import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { LayoutChangeEvent, Dimensions } from "react-native";
import { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useCars } from "@/contexts/CarsContext";
import { API } from "@/lib/api-endpoints";
import { useRecentlyViewed } from "@/contexts/RecentlyViewedContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useAuth } from "@/contexts/AuthContext";
import { CarFilters } from "@/types/car";
import { getActiveFilterPills, removeFilterByKey, convertForDisplay } from "@/lib/formatters";
import { SearchSuggestion } from "@/components/SearchBar";
import { getListingShortTitle } from "@/lib/formatters";
import { useTranslation } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { mapListingToCar } from "@/contexts/CarsContext";
import { useSortModal } from "@/components/SortModal";
import { WEB_TOP_INSET, WEB_BOTTOM_INSET, TAB_BAR_HEIGHT } from "@/constants/layout";
import { useColors } from "@/constants/colors";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSearchPickers } from "@/hooks/useSearchPickers";

export type ViewMode = "list" | "grid";

export type DisplayRow =
  | { key: string; type: "list"; car: ReturnType<typeof useCars>["filteredCars"][0] }
  | { key: string; type: "grid"; cars: ReturnType<typeof useCars>["filteredCars"] }
  | { key: string; type: "special-offers" };

export function useSearchState() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const {
    filteredCars, filters, setFilters, clearFilters, searchQuery, setSearchQuery,
    sortOption, setSortOption, totalCount, loadMore, hasMore, isLoadingMore,
    isLoading, isFetching, hasActiveFilters, activeFiltersCount, refreshListings,
  } = useCars();
  const { recentlyViewed } = useRecentlyViewed();
  const { toggleFavorite } = useFavorites();
  const { t, language } = useTranslation();
  const { user } = useAuth();

  const catalogSectionsQuery = useQuery<{ sections: any }>({
    queryKey: [API.catalog.sections],
  });
  const recommendationsQuery = useQuery<{ listings: any[] }>({
    queryKey: [API.recommendations],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
  const catalogSections = catalogSectionsQuery.data?.sections;
  const topItems = catalogSections?.top || [];
  const carouselItems = catalogSections?.carousel || [];
  const allPromotedItems = topItems.length > 0 ? topItems : carouselItems;

  const promotedItems = useMemo(() => {
    if (!allPromotedItems.length) return [];
    const f = filters as any;
    const hasBrand = f.brand && f.brand.length > 0;
    const hasBodyType = filters.bodyTypes && filters.bodyTypes.length > 0;
    const hasVehicleType = filters.vehicleType;
    if (!hasBrand && !hasBodyType && !hasVehicleType) return allPromotedItems;
    return allPromotedItems.filter((item: any) => {
      if (hasBrand && !f.brand!.includes(item.brand)) return false;
      if (hasBodyType && !filters.bodyTypes!.includes(item.bodyType)) return false;
      if (hasVehicleType && item.vehicleType !== filters.vehicleType) return false;
      return true;
    });
  }, [allPromotedItems, (filters as any).brand, filters.bodyTypes, filters.vehicleType]);

  const pickers = useSearchPickers({
    filters,
    setFilters,
    searchQuery,
    totalCount,
    isFetching,
    t,
  });

  const conditionTabs = useMemo(() => [
    { key: "all", label: t("common.all") },
    { key: "new", label: t("catalog.new") },
    { key: "used", label: t("catalog.used") },
  ], [t]);

  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const listRef = useRef<any>(null);
  const hasInitialized = useRef(false);
  const [pillsSticky, setPillsSticky] = useState(false);
  const pillsStickyRef = useRef(false);
  const pillsOffsetRef = useRef(0);

  const nonVehicleNonConditionPills = useMemo(() => {
    const filterPills = getActiveFilterPills(filters);
    return filterPills.filter(p => {
      if (p.key.startsWith("vehicle_") || p.key === "conditions") return false;
      if (pickers.isNonPassengerType && (p.key === "body" || p.key === "bodyTypes")) return false;
      return true;
    });
  }, [filters, pickers.isNonPassengerType]);

  const searchSuggestions = useMemo<SearchSuggestion[]>(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 1) return [];
    const q = searchQuery.toLowerCase().trim();
    const brandMatches = pickers.allBrands
      .filter((b) => b.name.toLowerCase().includes(q) || (b.cyrillicName && b.cyrillicName.toLowerCase().includes(q)))
      .slice(0, 5)
      .map((b) => ({ id: `brand-${b.id}`, label: b.name, subtitle: b.country || undefined, brandId: b.id, brandName: b.name }));
    const uniqueModels = new Map<string, { brand: string; model: string }>();
    filteredCars.forEach((car) => {
      const key = `${car.brand}-${car.model}`;
      if (!uniqueModels.has(key)) {
        const combined = getListingShortTitle({ brand: car.brand, model: car.model }).toLowerCase();
        if (combined.includes(q) || car.model.toLowerCase().includes(q)) {
          uniqueModels.set(key, { brand: car.brand, model: car.model });
        }
      }
    });
    const modelMatches = Array.from(uniqueModels.values())
      .slice(0, 5)
      .map((m) => ({ id: `model-${m.brand}-${m.model}`, label: getListingShortTitle({ brand: m.brand, model: m.model }), subtitle: undefined as string | undefined }));
    const seen = new Set<string>();
    const combined: SearchSuggestion[] = [];
    for (const item of [...brandMatches, ...modelMatches]) {
      if (!seen.has(item.label.toLowerCase())) {
        seen.add(item.label.toLowerCase());
        combined.push(item);
      }
    }
    return combined.slice(0, 8);
  }, [searchQuery, pickers.allBrands, filteredCars]);

  const handleSuggestionPress = useCallback((suggestion: SearchSuggestion) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (suggestion.brandId && suggestion.brandName) {
      setSearchQuery("");
      setFilters({ ...filters, vehicleSelections: [{ brand: suggestion.brandName, brandId: suggestion.brandId }] });
    } else {
      setSearchQuery(suggestion.label);
    }
  }, [filters, setFilters, setSearchQuery]);

  const webTopInset = WEB_TOP_INSET;
  const tabBarBottom = insets.bottom + TAB_BAR_HEIGHT + WEB_BOTTOM_INSET;
  const filterPills = getActiveFilterPills(filters);

  const activeConditionTab = useMemo(() => {
    const conditions = filters.conditions as string[] | undefined;
    if (!conditions || conditions.length === 0) return "all";
    if (conditions.length === 1 && conditions[0] === "new") return "new";
    if (conditions.length === 1 && conditions[0] === "used") return "used";
    return "all";
  }, [filters.conditions]);

  const activeTabIndex = activeConditionTab === "all" ? 0 : activeConditionTab === "new" ? 1 : 2;
  const tabContainerWidth = useSharedValue(0);
  const tabSlideX = useSharedValue(0);
  const tabCount = conditionTabs.length;
  const tabPadding = 2;
  const tabContainerWidthRef = useRef(0);

  const onTabsLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    tabContainerWidth.value = w;
    tabContainerWidthRef.current = w;
    const tabW = (w - tabPadding * 2) / tabCount;
    tabSlideX.value = tabPadding + activeTabIndex * tabW;
  }, [activeTabIndex]);

  useEffect(() => {
    const w = tabContainerWidthRef.current;
    if (w > 0) {
      const tabW = (w - tabPadding * 2) / tabCount;
      tabSlideX.value = withTiming(tabPadding + activeTabIndex * tabW, { duration: 250, easing: Easing.out(Easing.cubic) });
    }
  }, [activeTabIndex]);

  const tabIndicatorStyle = useAnimatedStyle(() => {
    const tabW = tabContainerWidth.value > 0 ? (tabContainerWidth.value - tabPadding * 2) / tabCount : 0;
    return { width: tabW, transform: [{ translateX: tabSlideX.value }] };
  });

  const priceRange = useMemo(() => {
    if (filteredCars.length === 0) return null;
    let minCar = filteredCars[0];
    let maxCar = filteredCars[0];
    let minVal = convertForDisplay(minCar.price, minCar.currency).price;
    let maxVal = minVal;
    for (const car of filteredCars) {
      const val = convertForDisplay(car.price, car.currency).price;
      if (val < minVal) { minVal = val; minCar = car; }
      if (val > maxVal) { maxVal = val; maxCar = car; }
    }
    return { minPrice: minCar.price, minCurrency: minCar.currency, maxPrice: maxCar.price, maxCurrency: maxCar.currency };
  }, [filteredCars]);

  const safeGoBack = useCallback(() => {
    if (router.canGoBack()) { router.back(); } else { router.replace("/(tabs)"); }
  }, []);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearFilters();
    setSearchQuery("");
    safeGoBack();
  }, [clearFilters, setSearchQuery, safeGoBack]);

  const handleEditFilters = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/filters");
  }, []);

  const updateFilter = useCallback((updates: Partial<CarFilters>) => {
    setFilters((prev: CarFilters) => ({ ...prev, ...updates }));
  }, [setFilters]);

  const handleRemoveFilter = useCallback((key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilters((prev: CarFilters) => removeFilterByKey(prev, key));
  }, [setFilters]);

  const handleConditionTab = useCallback((tab: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilters((prev: CarFilters) => {
      if (tab === "all") {
        const updated = { ...prev };
        delete updated.conditions;
        return updated;
      }
      return { ...prev, conditions: [tab as "new" | "used"] };
    });
  }, [setFilters]);

  useEffect(() => {
    if (!hasInitialized.current) { hasInitialized.current = true; }
  }, []);

  const handleCarPress = useCallback((carId: string) => {
    router.push(`/car/${carId}`);
  }, []);

  const sortModal = useSortModal(setSortOption);

  const toggleViewMode = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewMode((prev) => (prev === "list" ? "grid" : "list"));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refreshListings(); } catch (e) { console.error(e); } finally { setRefreshing(false); }
  }, [refreshListings]);

  const getCountWord = useCallback((count: number) => {
    if (count === 0) return t("catalog.offer5");
    if (count === 1) return t("catalog.offer1");
    if (count >= 2 && count <= 4) return t("catalog.offer2");
    if (count >= 5 && count <= 20) return t("catalog.offer5");
    const lastDigit = count % 10;
    if (lastDigit === 1) return t("catalog.offer1");
    if (lastDigit >= 2 && lastDigit <= 4) return t("catalog.offer2");
    return t("catalog.offer5");
  }, [t]);

  const SPECIAL_OFFERS_INTERVAL = 12;

  const promotedAsCars = useMemo(() => {
    if (!filters.promotedOnly) return null;
    return allPromotedItems.map((car: any) => {
      try { return mapListingToCar(car); } catch { return null; }
    }).filter(Boolean) as typeof filteredCars;
  }, [filters.promotedOnly, allPromotedItems]);

  const topAsCars = useMemo(() => {
    if (!filters.topOnly) return null;
    return topItems.map((car: any) => {
      try { return mapListingToCar(car); } catch { return null; }
    }).filter(Boolean) as typeof filteredCars;
  }, [filters.topOnly, topItems]);

  const recommendationsAsCars = useMemo(() => {
    if (!filters.recommendationsOnly) return null;
    const recs = recommendationsQuery.data?.listings || [];
    return recs.map((car: any) => {
      try { return mapListingToCar(car); } catch { return null; }
    }).filter(Boolean) as typeof filteredCars;
  }, [filters.recommendationsOnly, recommendationsQuery.data]);

  const sectionDataCars = promotedAsCars || topAsCars || recommendationsAsCars;
  const isSectionMode = !!(filters.promotedOnly || filters.topOnly || filters.recommendationsOnly);
  const isSectionLoading = isSectionMode && (
    filters.recommendationsOnly ? recommendationsQuery.isLoading : catalogSectionsQuery.isLoading
  );

  const sortedCars = useMemo(() => {
    if (sectionDataCars) return sectionDataCars;
    const promoted: typeof filteredCars = [];
    const regular: typeof filteredCars = [];
    for (const car of filteredCars) {
      if (car.promotion && car.promotion.features && car.promotion.features.length > 0) {
        promoted.push(car);
      } else {
        regular.push(car);
      }
    }
    return [...promoted, ...regular];
  }, [filteredCars, sectionDataCars]);

  const displayData = useMemo<DisplayRow[]>(() => {
    if (viewMode === "list") {
      const rows: DisplayRow[] = [];
      sortedCars.forEach((car, i) => {
        rows.push({ key: car.id, type: "list" as const, car });
        if (!isSectionMode && promotedItems.length > 0 && (i + 1) % SPECIAL_OFFERS_INTERVAL === 0 && i + 1 < sortedCars.length) {
          rows.push({ key: `special-${i}`, type: "special-offers" as const });
        }
      });
      return rows;
    }
    const rows: DisplayRow[] = [];
    let carIndex = 0;
    let i = 0;
    while (i < sortedCars.length) {
      const car = sortedCars[i];
      if (car.promotion?.features?.includes("top_card_style") || car.promotion?.features?.includes("turbo_card_style")) {
        rows.push({ key: String(car.id), type: "list" as const, car });
        i++;
        carIndex++;
      } else {
        const pair = [car];
        if (i + 1 < sortedCars.length && !sortedCars[i + 1].promotion?.features?.includes("top_card_style") && !sortedCars[i + 1].promotion?.features?.includes("turbo_card_style")) {
          pair.push(sortedCars[i + 1]);
        }
        rows.push({ key: `row-${pair[0].id}`, type: "grid" as const, cars: pair });
        i += pair.length;
        carIndex += pair.length;
      }
      if (!isSectionMode && promotedItems.length > 0 && carIndex % SPECIAL_OFFERS_INTERVAL === 0 && carIndex < sortedCars.length) {
        rows.push({ key: `special-${carIndex}`, type: "special-offers" as const });
      }
    }
    return rows;
  }, [sortedCars, viewMode, promotedItems, isSectionMode]);

  const viewedCarIds = useMemo(() => new Set(recentlyViewed), [recentlyViewed]);

  const handleCarPressRef = useRef(handleCarPress);
  handleCarPressRef.current = handleCarPress;
  const toggleFavoriteRef = useRef(toggleFavorite);
  toggleFavoriteRef.current = toggleFavorite;
  const viewedCarIdsRef = useRef(viewedCarIds);
  viewedCarIdsRef.current = viewedCarIds;

  const mappedPromotedItems = useMemo(() => {
    return promotedItems.map((car: any) => {
      try { return mapListingToCar(car); } catch { return null; }
    }).filter(Boolean);
  }, [promotedItems]);

  const specialOffersCardWidth = useMemo(() => {
    const screenW = Dimensions.get("window").width;
    return (screenW - 24 - 8) / 1.85;
  }, []);

  const handleListScroll = useCallback((e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const shouldStick = pillsOffsetRef.current > 0 && y > pillsOffsetRef.current;
    if (shouldStick !== pillsStickyRef.current) {
      pillsStickyRef.current = shouldStick;
      setPillsSticky(shouldStick);
    }
  }, []);

  const handleResetFilters = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearFilters();
  }, [clearFilters]);

  const sectionTitle = useMemo(() => {
    if (filters.promotedOnly) return t("shared.specialOffers");
    if (filters.topOnly) return t("shared.topListings");
    return t("shared.recommendedForYou");
  }, [filters.promotedOnly, filters.topOnly, t]);

  const searchApplySubLabel = useMemo(() => pickers.getApplySubLabel(filteredCars.length), [pickers.getApplySubLabel, filteredCars.length]);
  const pillApplySubLabel = useMemo(() => pickers.getApplySubLabel(pickers.pillResultCount), [pickers.getApplySubLabel, pickers.pillResultCount]);

  return {
    colors, isDark, insets, t, language, user,
    filteredCars, filters, setFilters, clearFilters, searchQuery, setSearchQuery,
    sortOption, setSortOption, totalCount, loadMore, hasMore, isLoadingMore,
    isLoading, isFetching, hasActiveFilters, activeFiltersCount, refreshListings,
    recentlyViewed, toggleFavorite,
    catalogSectionsQuery, recommendationsQuery,
    promotedItems, allPromotedItems, topItems,
    conditionTabs, refreshing, viewMode,
    listRef, pillsSticky, pillsOffsetRef,
    searchSuggestions, handleSuggestionPress,
    webTopInset, tabBarBottom, filterPills,
    activeConditionTab, tabIndicatorStyle, onTabsLayout,
    nonVehicleNonConditionPills, priceRange,
    handleBack, handleEditFilters, updateFilter, handleRemoveFilter,
    handleConditionTab, handleCarPress, sortModal, toggleViewMode, onRefresh, getCountWord,
    sectionDataCars, isSectionMode, isSectionLoading,
    sortedCars, displayData, viewedCarIds,
    handleCarPressRef, toggleFavoriteRef, viewedCarIdsRef,
    mappedPromotedItems, specialOffersCardWidth,
    handleListScroll, handleResetFilters, sectionTitle,
    searchApplySubLabel, pillApplySubLabel,
    ...pickers,
  };
}

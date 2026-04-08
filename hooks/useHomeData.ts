import { useState, useMemo, useCallback, useRef } from "react";
import { FlatList, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { router } from "expo-router";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useScrollToTop } from "@react-navigation/native";
import { useColors } from "@/constants/colors";
import { API } from "@/lib/api-endpoints";
import { useCars, buildQueryString, mapListingToCar } from "@/contexts/CarsContext";
import { useRecentlyViewed } from "@/contexts/RecentlyViewedContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useComparison } from "@/contexts/ComparisonContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBrands } from "@/hooks/useCarHierarchy";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { useStoriesManager } from "@/components/Stories";
import { useSortModal } from "@/components/SortModal";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { SORT_OPTIONS, SortOption, ApiListing } from "@/types/car";
import { TAB_BAR_HEIGHT, WEB_BOTTOM_INSET } from "@/constants/layout";
import { CatalogSectionsData } from "@/components/CatalogSections";

export interface RecommendedCar {
  id: number;
  brand: string;
  model: string;
  year: number;
  price: number;
  currency: string;
  mileage: number;
  location: string;
  images: string[];
  transmission: string;
  fuelType: string;
  engineVolume: number;
  bodyType: string;
}

export type ViewMode = "list" | "grid";

export type DisplayRow =
  | { key: string; type: "grid"; cars: ReturnType<typeof mapListingToCar>[] }
  | { key: string; type: "special-offers" };

interface CatalogListingsResponse {
  listings: ApiListing[];
  total: number;
}

export const SCROLL_THRESHOLD = 60;
export const ANIM_CONFIG = { duration: 200 };
export const SPECIAL_OFFERS_INTERVAL = 12;

export const QUICK_BRANDS = [
  { brand: "BMW", label: "BMW" },
  { brand: "Mercedes-Benz", label: "Mercedes" },
  { brand: "Toyota", label: "Toyota" },
  { brand: "Lexus", label: "Lexus" },
  { brand: "Audi", label: "Audi" },
  { brand: "Hyundai", label: "Hyundai" },
  { brand: "Kia", label: "Kia" },
  { brand: "Volkswagen", label: "VW" },
  { brand: "Honda", label: "Honda" },
  { brand: "Nissan", label: "Nissan" },
];

export function useHomeData() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { filters, setFilters, setSearchQuery, activeFiltersCount } = useCars();
  const { recentlyViewed, recentlyViewedCars } = useRecentlyViewed();
  const { toggleFavorite } = useFavorites();
  const { comparisonList, comparisonCars, clearComparison } = useComparison();
  const { user, isAuthenticated } = useAuth();
  const { brands: allBrands } = useBrands("passenger");

  const brandLogoMap = useMemo(() => {
    const map = new Map<string, string>();
    const baseUrl = getApiUrl().replace(/\/$/, "");
    for (const b of allBrands) {
      if (b.logoUrl) {
        const url = b.logoUrl.startsWith("http") ? b.logoUrl : `${baseUrl}${b.logoUrl}`;
        map.set(b.name, url);
      }
    }
    return map;
  }, [allBrands]);

  const queryClient = useQueryClient();
  const storiesManager = useStoriesManager();

  const { data: recommendationsData } = useQuery<{ listings: RecommendedCar[] }>({
    queryKey: [API.recommendations],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
  const recommendations = recommendationsData?.listings || [];

  const { data: sectionsData, isLoading: isSectionsLoading } = useQuery<{ sections: CatalogSectionsData; featuredDealers?: any[] }>({
    queryKey: [API.catalog.sections],
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
  const catalogSections = sectionsData?.sections || null;

  const [catalogSort, setCatalogSort] = useState<SortOption>("date_desc");

  const catalogQuery = useInfiniteQuery<CatalogListingsResponse>({
    queryKey: [API.listings.catalog, catalogSort],
    queryFn: async ({ pageParam = 0 }) => {
      const qs = buildQueryString({}, "", catalogSort, pageParam as number);
      const res = await apiRequest("GET", `${API.listings.list}?${qs}`);
      return res.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + (p.listings?.length ?? 0), 0);
      return loaded < (lastPage.total ?? 0) ? allPages.length : undefined;
    },
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  const catalogCars = useMemo(() => {
    if (!catalogQuery.data) return [];
    const all = catalogQuery.data.pages.flatMap((page) => page.listings.map(mapListingToCar));
    const seen = new Set<string>();
    return all.filter((car) => {
      if (seen.has(car.id)) return false;
      seen.add(car.id);
      return true;
    });
  }, [catalogQuery.data]);

  const totalCount = catalogQuery.data?.pages[0]?.total ?? 0;
  const hasMore = catalogQuery.hasNextPage ?? false;
  const isLoadingMore = catalogQuery.isFetchingNextPage;
  const isLoading = catalogQuery.isLoading;
  const isFetching = catalogQuery.isFetching && !catalogQuery.isLoading;

  const loadMore = useCallback(() => {
    if (catalogQuery.hasNextPage && !catalogQuery.isFetchingNextPage) {
      catalogQuery.fetchNextPage();
    }
  }, [catalogQuery.hasNextPage, catalogQuery.isFetchingNextPage]);

  const refreshCatalog = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [API.listings.catalog] }),
      queryClient.invalidateQueries({ queryKey: [API.catalog.sections] }),
    ]);
  }, [queryClient]);

  const [refreshing, setRefreshing] = useState(false);
  const sortModal = useSortModal(setCatalogSort);
  const viewMode: ViewMode = "grid";
  const [chipsScrollStart, setChipsScrollStart] = useState(true);
  const [chipsScrollEnd, setChipsScrollEnd] = useState(false);
  const listRef = useRef<FlatList>(null);
  useScrollToTop(listRef);

  const isCollapsed = useSharedValue(0);
  const filterBlockPassed = useSharedValue(0);
  const toolbarPassed = useSharedValue(0);
  const filterBlockEndY = useRef(0);
  const toolbarEndY = useRef(0);
  const whiteZoneOffsetY = useRef(0);
  const lastScrollY = useRef(0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refreshCatalog(); } catch (e) { console.error(e); } finally { setRefreshing(false); }
  }, [refreshCatalog]);

  const handleCarPress = useCallback((carId: string) => {
    router.push(`/car/${carId}`);
  }, []);
  const handleFilterPress = () => router.push("/filters");
  const handleSortSelect = (option: SortOption) => {
    sortModal.handleSelect(option);
  };

  const viewedCarIds = useMemo(() => new Set(recentlyViewed), [recentlyViewed]);
  const currentSortLabel = SORT_OPTIONS.find((s) => s.value === catalogSort)?.label || t("catalog.defaultSort");
  const tabBarBottom = insets.bottom + TAB_BAR_HEIGHT + WEB_BOTTOM_INSET;
  const screenBg = isDark ? colors.background : colors.surface;
  const headerBg = isDark ? colors.surface : colors.background;

  const getResultsWord = useCallback((count: number) => {
    if (count === 0) return t("catalog.listing5");
    if (count === 1) return t("catalog.listing1");
    if (count >= 2 && count <= 4) return t("catalog.listing2");
    if (count >= 5 && count <= 20) return t("catalog.listing5");
    const lastDigit = count % 10;
    if (lastDigit === 1) return t("catalog.listing1");
    if (lastDigit >= 2 && lastDigit <= 4) return t("catalog.listing2");
    return t("catalog.listing5");
  }, [t]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const shouldCollapse = y > SCROLL_THRESHOLD;
    const wasCollapsed = lastScrollY.current > SCROLL_THRESHOLD;
    if (shouldCollapse !== wasCollapsed) {
      isCollapsed.value = withTiming(shouldCollapse ? 1 : 0, ANIM_CONFIG);
    }
    const filterPassed = filterBlockEndY.current > 0 && y > filterBlockEndY.current;
    const wasFilterPassed = filterBlockPassed.value > 0.5;
    if (filterPassed !== wasFilterPassed) {
      filterBlockPassed.value = withTiming(filterPassed ? 1 : 0, ANIM_CONFIG);
    }
    const tbPassed = toolbarEndY.current > 0 && y > toolbarEndY.current;
    const wasTbPassed = toolbarPassed.value > 0.5;
    if (tbPassed !== wasTbPassed) {
      toolbarPassed.value = withTiming(tbPassed ? 1 : 0, ANIM_CONFIG);
    }
    lastScrollY.current = y;
  }, [isCollapsed, filterBlockPassed, toolbarPassed]);

  const topItems = catalogSections?.top || [];
  const carouselItems = catalogSections?.carousel || [];
  const promotedItems = topItems.length > 0 ? topItems : carouselItems;

  const displayData = useMemo<DisplayRow[]>(() => {
    const rows: DisplayRow[] = [];
    let carIndex = 0;
    for (let i = 0; i < catalogCars.length; i += 2) {
      const pair = [catalogCars[i]];
      if (i + 1 < catalogCars.length) {
        pair.push(catalogCars[i + 1]);
      }
      rows.push({ key: `row-${pair[0].id}`, type: "grid" as const, cars: pair });
      carIndex += pair.length;
      if (promotedItems.length > 0 && carIndex % SPECIAL_OFFERS_INTERVAL === 0 && carIndex < catalogCars.length) {
        rows.push({ key: `special-${carIndex}`, type: "special-offers" as const });
      }
    }
    return rows;
  }, [catalogCars, promotedItems]);

  return {
    colors, isDark, colorScheme, insets, t,
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
    handleCarPress, handleFilterPress, handleSortSelect, handleScroll,
    getResultsWord, currentSortLabel,
    viewMode, tabBarBottom, screenBg, headerBg,
    chipsScrollStart, setChipsScrollStart, chipsScrollEnd, setChipsScrollEnd,
    filterBlockEndY, toolbarEndY, whiteZoneOffsetY,
    listRef,
  };
}

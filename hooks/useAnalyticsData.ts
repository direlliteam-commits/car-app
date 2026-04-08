import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/api-endpoints";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/AuthContext";
import { useBrands, useModels, useGenerations, useFilteredBrands } from "@/hooks/useCarHierarchy";
import type { BrandCategory } from "@/hooks/useCarHierarchy";
import type { CascadeField } from "@/components/filters/VehicleCascadePicker";
import { useAutoSkipEmptyStep } from "@/hooks/useAutoSkipEmptyStep";

export interface MarketStats {
  totalListings: number;
  totalUsers: number;
  avgPrice: number;
}

export interface PriceData {
  avg: number;
  count: number;
  min: number;
  max: number;
}

export interface YearPrice {
  year: number;
  avgPrice: number;
  count: number;
}

export interface TopBrand {
  brand: string;
  count: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
}

export interface TopModel {
  brand: string;
  model: string;
  count: number;
  avgPrice: number;
}

export interface PriceRange {
  label: string;
  count: number;
}

export interface SellerStats {
  totalViews: number;
  totalFavorites: number;
  activeListings: number;
  soldListings: number;
}

export interface ListingStat {
  id: number;
  brand: string;
  model: string;
  year: number;
  price: number;
  currency: string;
  status: string;
  views: number;
  favoritesCount: number;
  createdAt: string;
  image: string | null;
}

export interface ProListingStat extends ListingStat {
  conversionRate: number;
  marketAvgPrice: number;
  priceDiffPercent: number;
}

export interface ViewsTrendDay {
  date: string;
  views: number;
}

export interface ProAnalytics {
  listings: ProListingStat[];
  viewsTrend: ViewsTrendDay[];
}

export interface DealerAnalytics {
  totalListings: number;
  totalViews: number;
  totalFavorites: number;
  avgViewsPerListing: number;
  conversionRate: number;
  topListings: Array<{
    id: number;
    brand: string;
    model: string;
    year: number;
    price: number;
    views: number;
    favoritesCount: number;
    images: string[] | null;
  }>;
  viewsTrend: ViewsTrendDay[];
  plan: {
    code: string;
    name: string;
    maxListings: number;
    expiresAt: string;
  };
}

export type UserTier = "regular" | "pro" | "dealer";

export function useAnalyticsData() {
  const { isAuthenticated, user } = useAuth();

  const [activeTab, setActiveTab] = useState<"my" | "market">(isAuthenticated ? "my" : "market");

  const { brands: apiBrands, popularBrands, loading: brandsLoading } = useBrands();
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedBrandName, setSelectedBrandName] = useState<string>("");
  const [selectedModelName, setSelectedModelName] = useState<string>("");
  const [selectedGenerationName, setSelectedGenerationName] = useState<string>("");
  const [selectedCondition, setSelectedCondition] = useState<string | undefined>(undefined);

  const [showCascadePicker, setShowCascadePicker] = useState(false);
  const [pickerField, setPickerField] = useState<CascadeField>("brand");
  const [pickerBrandId, setPickerBrandId] = useState<number | null>(null);
  const [pickerModelId, setPickerModelId] = useState<number | null>(null);
  const [brandSearch, setBrandSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [brandCategory, setBrandCategory] = useState<BrandCategory>("all");

  const { models } = useModels(selectedBrandId);
  const { models: pickerModels, loading: modelsLoading } = useModels(pickerBrandId);
  const { generations: pickerGenerations, loading: generationsLoading } = useGenerations(pickerModelId);

  const filteredBrands = useFilteredBrands(apiBrands, brandSearch);
  const filteredModels = useMemo(() => {
    if (!modelSearch.trim()) return pickerModels;
    const q = modelSearch.toLowerCase().trim();
    return pickerModels.filter(m => m.name.toLowerCase().includes(q));
  }, [pickerModels, modelSearch]);

  const closeCascadePicker = useCallback(() => {
    setShowCascadePicker(false);
    setPickerField("brand");
    setPickerBrandId(null);
    setPickerModelId(null);
    setBrandSearch("");
    setModelSearch("");
    setBrandCategory("all");
  }, []);

  useAutoSkipEmptyStep(
    modelsLoading, pickerModels.length,
    pickerField === "model", pickerBrandId !== null, closeCascadePicker,
  );
  useAutoSkipEmptyStep(
    generationsLoading, pickerGenerations.length,
    pickerField === "generation", pickerModelId !== null, closeCascadePicker,
  );

  const proStatusQuery = useQuery<{ isProSeller: boolean }>({
    queryKey: [API.proSeller.status],
    enabled: isAuthenticated && user?.role !== "dealer",
    staleTime: 5 * 60 * 1000,
  });

  const isDealer = user?.role === "dealer";
  const isPro = proStatusQuery.data?.isProSeller ?? false;
  const userTier: UserTier = isDealer ? "dealer" : isPro ? "pro" : "regular";
  const hasPremiumAccess = userTier === "pro" || userTier === "dealer";

  const marketStatsQuery = useQuery<MarketStats>({
    queryKey: [API.analytics.market],
    staleTime: 5 * 60 * 1000,
  });
  const { data: marketStats, isLoading: isLoadingStats } = marketStatsQuery;

  const priceQueryUrl = useMemo(() => {
    const params = new URLSearchParams({ brand: selectedBrandName });
    if (selectedModelName) params.set("model", selectedModelName);
    if (selectedGenerationName) params.set("generation", selectedGenerationName);
    if (selectedCondition) params.set("condition", selectedCondition);
    return `${API.analytics.price}?${params.toString()}`;
  }, [selectedBrandName, selectedModelName, selectedGenerationName, selectedCondition]);

  const { data: priceData, isLoading: isLoadingPriceData } = useQuery<PriceData>({
    queryKey: [priceQueryUrl],
    enabled: !!selectedBrandName && hasPremiumAccess,
    staleTime: 5 * 60 * 1000,
  });

  const yearPriceQueryUrl = useMemo(() => {
    const params = new URLSearchParams({ brand: selectedBrandName, model: selectedModelName });
    if (selectedGenerationName) params.set("generation", selectedGenerationName);
    if (selectedCondition) params.set("condition", selectedCondition);
    return `${API.analytics.priceByYear}?${params.toString()}`;
  }, [selectedBrandName, selectedModelName, selectedGenerationName, selectedCondition]);

  const { data: yearPricesData, isLoading: isLoadingYearPrices } = useQuery<YearPrice[]>({
    queryKey: [yearPriceQueryUrl],
    enabled: !!selectedBrandName && !!selectedModelName && hasPremiumAccess,
    staleTime: 5 * 60 * 1000,
  });

  const topBrandsQuery = useQuery<TopBrand[]>({
    queryKey: [API.analytics.topBrands],
    staleTime: 5 * 60 * 1000,
  });
  const { data: topBrands } = topBrandsQuery;

  const topModelsQueryUrl = API.analytics.topModels(selectedBrandName);
  const topModelsQuery = useQuery<TopModel[]>({
    queryKey: [topModelsQueryUrl],
    enabled: !!selectedBrandName && hasPremiumAccess,
    staleTime: 5 * 60 * 1000,
  });
  const { data: topModels } = topModelsQuery;

  const priceDistributionQuery = useQuery<PriceRange[]>({
    queryKey: [API.analytics.priceDistribution],
    staleTime: 5 * 60 * 1000,
  });
  const { data: priceDistribution } = priceDistributionQuery;

  const maxDistributionCount = useMemo(() => {
    if (!priceDistribution || priceDistribution.length === 0) return 0;
    return Math.max(...priceDistribution.map((p) => p.count));
  }, [priceDistribution]);

  const yearPrices = yearPricesData ?? [];
  const isLoadingPrice = isLoadingPriceData || isLoadingYearPrices;

  const maxYearPrice = useMemo(() => {
    if (yearPrices.length === 0) return 0;
    return Math.max(...yearPrices.map((y) => y.avgPrice));
  }, [yearPrices]);

  const handleClearSelection = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedBrandId(null);
    setSelectedBrandName("");
    setSelectedModelName("");
    setSelectedGenerationName("");
  }, []);

  const openCascadePicker = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!selectedBrandName) {
      setPickerField("brand");
      setPickerBrandId(null);
      setPickerModelId(null);
    } else if (!selectedModelName) {
      setPickerField("model");
      setPickerBrandId(selectedBrandId);
      setPickerModelId(null);
    } else {
      setPickerField("model");
      setPickerBrandId(selectedBrandId);
      setPickerModelId(null);
    }
    setShowCascadePicker(true);
  }, [selectedBrandName, selectedModelName, selectedBrandId]);

  const sellerStatsQuery = useQuery<SellerStats>({
    queryKey: [API.seller.stats],
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });
  const { data: sellerStats, isLoading: isLoadingSeller } = sellerStatsQuery;

  const listingStatsQuery = useQuery<{ listings: ListingStat[] }>({
    queryKey: [API.seller.listingStats],
    enabled: isAuthenticated && userTier === "regular",
    staleTime: 2 * 60 * 1000,
  });
  const { data: listingStatsData, isLoading: isLoadingListingStats } = listingStatsQuery;

  const proAnalyticsQuery = useQuery<ProAnalytics>({
    queryKey: [API.analytics.pro],
    enabled: isAuthenticated && (userTier === "pro" || userTier === "dealer"),
    staleTime: 2 * 60 * 1000,
  });
  const { data: proAnalytics, isLoading: isLoadingProAnalytics } = proAnalyticsQuery;

  const dealerAnalyticsQuery = useQuery<DealerAnalytics>({
    queryKey: [API.analytics.dealer],
    enabled: isAuthenticated && userTier === "dealer",
    staleTime: 2 * 60 * 1000,
  });
  const { data: dealerAnalytics, isLoading: isLoadingDealerAnalytics } = dealerAnalyticsQuery;

  const listingStats = userTier === "regular"
    ? (listingStatsData?.listings ?? [])
    : (proAnalytics?.listings ?? []);

  const topListing = useMemo(() => {
    if (listingStats.length === 0) return null;
    return listingStats.reduce((best, cur) => cur.views > best.views ? cur : best);
  }, [listingStats]);

  const viewsTrend = userTier === "dealer"
    ? (dealerAnalytics?.viewsTrend ?? [])
    : (proAnalytics?.viewsTrend ?? []);

  const maxTrendViews = useMemo(() => {
    if (viewsTrend.length === 0) return 0;
    return Math.max(...viewsTrend.map(d => d.views));
  }, [viewsTrend]);

  const isLoadingMyTab = isLoadingSeller || (userTier === "regular" ? isLoadingListingStats : isLoadingProAnalytics) || (userTier === "dealer" && isLoadingDealerAnalytics);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const queries: Promise<any>[] = [
      marketStatsQuery.refetch(),
      sellerStatsQuery.refetch(),
      topBrandsQuery.refetch(),
      priceDistributionQuery.refetch(),
    ];
    if (userTier === "regular") queries.push(listingStatsQuery.refetch());
    if (userTier === "pro" || userTier === "dealer") queries.push(proAnalyticsQuery.refetch());
    if (userTier === "dealer") queries.push(dealerAnalyticsQuery.refetch());
    await Promise.all(queries);
    setRefreshing(false);
  }, [userTier]);

  const onSelectBrand = useCallback((brand: { id: number; name: string }) => {
    setBrandSearch("");
    setBrandCategory("all");
    setSelectedBrandId(brand.id);
    setSelectedBrandName(brand.name);
    setSelectedModelName("");
    setSelectedGenerationName("");
    setPickerBrandId(brand.id);
    setPickerField("model");
  }, []);

  const onSelectModel = useCallback((model: { id: number; name: string }) => {
    setModelSearch("");
    setSelectedModelName(model.name);
    setPickerModelId(model.id);
    setPickerField("generation");
  }, []);

  const onSelectGeneration = useCallback((gen: { name: string }) => {
    setSelectedGenerationName(gen.name);
    closeCascadePicker();
  }, [closeCascadePicker]);

  const onSkipGeneration = useCallback(() => {
    closeCascadePicker();
  }, [closeCascadePicker]);

  const onPickerBack = useCallback(() => {
    if (pickerField === "generation") {
      setPickerModelId(null);
      setPickerField("model");
    } else if (pickerField === "model") {
      setPickerBrandId(null);
      setPickerField("brand");
      setModelSearch("");
    }
  }, [pickerField]);

  return {
    isAuthenticated,
    user,
    activeTab,
    setActiveTab,
    userTier,
    hasPremiumAccess,
    isDealer,
    isPro,

    marketStats,
    isLoadingStats,
    sellerStats,
    isLoadingSeller,
    listingStats,
    topListing,
    dealerAnalytics,
    isLoadingDealerAnalytics,
    viewsTrend,
    maxTrendViews,
    isLoadingMyTab,

    priceData,
    isLoadingPrice,
    yearPrices,
    maxYearPrice,
    topBrands,
    topModels,
    priceDistribution,
    maxDistributionCount,

    selectedBrandId,
    selectedBrandName,
    selectedModelName,
    selectedGenerationName,
    selectedCondition,
    setSelectedCondition,

    showCascadePicker,
    pickerField,
    filteredBrands,
    filteredModels,
    pickerGenerations,
    brandSearch,
    setBrandSearch,
    modelSearch,
    setModelSearch,
    brandCategory,
    setBrandCategory,
    brandsLoading,
    modelsLoading,
    generationsLoading,

    handleClearSelection,
    openCascadePicker,
    closeCascadePicker,
    onSelectBrand,
    onSelectModel,
    onSelectGeneration,
    onSkipGeneration,
    onPickerBack,

    refreshing,
    onRefresh,
  };
}

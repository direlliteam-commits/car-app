import React, { useState, useEffect, useRef } from "react";
import { ScrollView } from "react-native";
import { useAppColorScheme, useTheme } from "@/contexts/ThemeContext";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { API } from "@/lib/api-endpoints";
import { useColors, ColorScheme } from "@/constants/colors";
import { useCars, mapListingToCar } from "@/contexts/CarsContext";
import { useRecentlyViewed } from "@/contexts/RecentlyViewedContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useComparison } from "@/contexts/ComparisonContext";
import { useAuth } from "@/contexts/AuthContext";
import { SpecsLookupResult } from "@/components/car-detail/TechnicalSpecs";
import { EQUIPMENT_CATEGORIES, ApiListing } from "@/types/car";
import { getFieldVisibility } from "@/lib/vehicle-field-visibility";
import { getEquipmentCategory, formatPrice } from "@/lib/formatters";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { useTranslation } from "@/lib/i18n";

export function useCarDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useAppColorScheme();
  const { displayCurrency } = useTheme();
  const isDark = colorScheme === "dark";
  const colors = useColors(colorScheme);
  const { getCarById, deleteCar, updateListingStatus } = useCars();
  const { addToRecentlyViewed } = useRecentlyViewed();
  const { toggleFavorite, favorites } = useFavorites();
  const { toggleComparison, isInComparison } = useComparison();
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();

  const qc = useQueryClient();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedModIndex, setSelectedModIndex] = useState(0);
  const [showAllMods, setShowAllMods] = useState(false);
  const [showPriceAlert, setShowPriceAlert] = useState(false);
  const [alertPrice, setAlertPrice] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [expandDescription, setExpandDescription] = useState(false);
  const [expandedDeals, setExpandedDeals] = useState<Set<string>>(new Set());
  const [showSpecsDetail, setShowSpecsDetail] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [showAltPrices, setShowAltPrices] = useState(false);
  const [showPriceAnalysis, setShowPriceAnalysis] = useState(false);
  const [galleryMessageLoading, setGalleryMessageLoading] = useState(false);
  const [descriptionNeedsExpand, setDescriptionNeedsExpand] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const creditCardY = useRef(0);
  const contentWrapY = useRef(0);
  const { data: exchangeRates } = useExchangeRates();

  const detailColors = React.useMemo(() => {
    if (!isDark) return {
      ...colors,
      surfaceElevated: colors.background,
    };
    return {
      ...colors,
      surface: colors.background,
      surfaceElevated: colors.surface,
    };
  }, [isDark, colors]);

  const localCar = getCarById(id || "");
  const isFavorite = favorites.includes(id || "");
  const inComparison = isInComparison(id || "");

  const listingDetailQuery = useQuery<ApiListing | null>({
    queryKey: [API.listings.list, id, "detail"],
    queryFn: async () => {
      try {
        const resp = await apiRequest("GET", API.listings.getById(id));
        return resp.json();
      } catch {
        return null;
      }
    },
    enabled: !!id,
  });

  const detailCar = listingDetailQuery.data ? mapListingToCar(listingDetailQuery.data) : undefined;
  const car = localCar
    ? { ...localCar, ...(detailCar ? { creditBanks: detailCar.creditBanks, estimatedMonthlyFrom: detailCar.estimatedMonthlyFrom, vin: detailCar.vin, vinStatus: detailCar.vinStatus, installmentDetails: detailCar.installmentDetails, exchangeDetails: detailCar.exchangeDetails, videoUrl: detailCar.videoUrl, ...(detailCar.equipment && detailCar.equipment.length > 0 && (!localCar.equipment || localCar.equipment.length === 0) ? { equipment: detailCar.equipment } : {}), ...(detailCar.trimName ? { trimName: detailCar.trimName } : {}) } : {}) }
    : detailCar;

  const specsQuery = useQuery<SpecsLookupResult>({
    queryKey: [API.specs.lookup, car?.brand, car?.model, car?.generation, car?.year],
    queryFn: async () => {
      if (!car) return { found: false };
      const params = new URLSearchParams({ brand: car.brand, model: car.model });
      if (car.generation) params.append("generation", car.generation);
      if (car.year) params.append("year", String(car.year));
      const resp = await apiRequest("GET", `${API.specs.lookup}?${params}`);
      return resp.json();
    },
    enabled: !!car,
  });

  const priceAlertQuery = useQuery({
    queryKey: [API.priceAlerts.list, "listing", id],
    queryFn: async () => {
      try {
        const resp = await apiRequest("GET", API.priceAlerts.forListing(id));
        return resp.json();
      } catch {
        return null;
      }
    },
    enabled: !!id && isAuthenticated,
  });

  const marketPriceQuery = useQuery<{
    insufficient?: boolean;
    avg: number;
    adjustedAvg: number;
    count: number;
    min: number;
    max: number;
    avgMileage: number;
    confidence: "high" | "medium" | "low";
    factors: Array<{
      type: string;
      count?: number;
      sufficient?: boolean;
      value?: string | number | boolean;
      avg?: number;
      comparison?: string;
      applied?: boolean;
      fuelType?: string;
    }>;
    narrowMatch: boolean;
  }>({
    queryKey: [API.analytics.priceEvaluation, car?.brand, car?.model, car?.year, car?.id, car?.currency],
    queryFn: async () => {
      if (!car) return { insufficient: true, count: 0, avg: 0, adjustedAvg: 0, min: 0, max: 0, avgMileage: 0, confidence: "low" as const, factors: [], narrowMatch: false };
      const params = new URLSearchParams({ brand: car.brand, model: car.model });
      if (car.year) params.append("year", String(car.year));
      if (car.mileage != null) params.append("mileage", String(car.mileage));
      if (car.accidentHistory) params.append("accidentHistory", car.accidentHistory);
      if (car.engineVolume) params.append("engineVolume", String(car.engineVolume));
      if (car.fuelType) params.append("fuelType", car.fuelType);
      if (car.transmission) params.append("transmission", car.transmission);
      if (car.driveType) params.append("driveType", car.driveType);
      if (car.bodyType) params.append("bodyType", car.bodyType);
      if (car.generation) params.append("generation", car.generation);
      params.append("listingId", String(car.id));
      if (car.currency) params.append("currency", car.currency);
      const resp = await apiRequest("GET", `${API.analytics.priceEvaluation}?${params}`);
      return resp.json();
    },
    enabled: !!car,
    staleTime: 5 * 60 * 1000,
  });

  const marketPriceInfo = React.useMemo(() => {
    if (!car) return null;
    const data = marketPriceQuery.data;
    if (!data || data.insufficient) return null;
    if (data.confidence === "low") return null;
    const compareAvg = data.adjustedAvg || data.avg;
    if (!compareAvg || compareAvg <= 0) return null;
    const ratio = car.price / compareAvg;
    const cnt = data.count || 0;
    const threshold = cnt >= 10 ? 0.95 : cnt >= 5 ? 0.90 : 0.85;
    if (ratio > threshold) return null;
    return { label: t("shared.goodOffer"), color: colors.priceGreat, bgColor: isDark ? "rgba(46,125,50,0.2)" : colors.successLight, icon: "trending-down" as const, evalColor: colors.priceGood };
  }, [car, marketPriceQuery.data, t, isDark]);

  const similarQuery = useQuery<{ listings: ApiListing[] }>({
    queryKey: [API.listings.list, id, "similar"],
    queryFn: async () => {
      const resp = await apiRequest("GET", API.listings.similar(id));
      return resp.json();
    },
    enabled: !!id,
  });

  const priceAlertMutation = useMutation({
    mutationFn: async (data: { listingId: number; targetPrice: number }) => {
      return apiRequest("POST", API.priceAlerts.list, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [API.priceAlerts.list, "listing", id] });
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      return apiRequest("DELETE", API.priceAlerts.delete(alertId));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [API.priceAlerts.list, "listing", id] });
    },
  });

  useEffect(() => {
    if (id) addToRecentlyViewed(id);
  }, [id, addToRecentlyViewed]);

  const seller = listingDetailQuery.data?.seller;
  const isOwnListing = !!(user?.id && seller?.id && String(user.id) === String(seller.id));
  const listingStatus = car?.status || "active";
  const isActive = listingStatus === "active";
  const isInactive = !isActive;

  const carBranch = React.useMemo(() => {
    if (!car?.branchId || !seller?.dealerBranches) return null;
    return seller.dealerBranches.find((b: { id: number }) => String(b.id) === car.branchId) || null;
  }, [car?.branchId, seller?.dealerBranches]);

  const effectiveTradeInBonus = car?.tradeInBonus ?? carBranch?.tradeInBonus ?? null;
  const effectiveTradeInMaxAge = car?.tradeInMaxAge ?? carBranch?.tradeInMaxAge ?? null;

  const existingAlert = priceAlertQuery.data;
  const hasAlert = !!existingAlert && existingAlert.active;
  const alertTriggered = car ? (hasAlert && existingAlert && car.price <= existingAlert.targetPrice) : false;

  const fieldVis = car ? getFieldVisibility(car.vehicleType, car.bodyType) : null;
  const equipmentList = car?.equipment || [];
  const equipmentCount = equipmentList.length;
  const equipmentCategoryCount = EQUIPMENT_CATEGORIES.filter(
    (cat) => {
      return equipmentList.some(eq => getEquipmentCategory(eq) === cat.id);
    }
  ).length;

  const descriptionTruncated = descriptionNeedsExpand && !expandDescription;

  return {
    id,
    colorScheme,
    displayCurrency,
    isDark,
    colors,
    detailColors,
    car,
    seller,
    localCar,
    isFavorite,
    inComparison,
    isAuthenticated,
    user,
    listingDetailQuery,
    specsQuery,
    priceAlertQuery,
    marketPriceQuery,
    marketPriceInfo,
    similarQuery,
    priceAlertMutation,
    deleteAlertMutation,
    existingAlert,
    hasAlert,
    alertTriggered,
    fieldVis,
    equipmentList,
    equipmentCount,
    equipmentCategoryCount,
    isOwnListing,
    listingStatus,
    isActive,
    isInactive,
    carBranch,
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
  };
}
